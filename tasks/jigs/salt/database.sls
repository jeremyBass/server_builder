# set up data first
###########################################################
{%- set nginx = pillar['nginx'] -%}
{%- set php = pillar['php'] -%}
{%- set memcached = pillar['memcached'] -%}
{%- set database = pillar['database'] -%}
{% set vars = {'isLocal': False} %}
{% if vars.update({'ip': salt['cmd.run']('(ifconfig eth1 2>/dev/null || ifconfig eth0 2>/dev/null) | grep "inet " | awk \'{gsub("addr:","",$2);  print $2 }\'') }) %} {% endif %}
{% if vars.update({'isLocal': salt['cmd.run']('test -n "$SERVER_TYPE" && echo $SERVER_TYPE || echo "false"') }) %} {% endif %}
{% set cpu_count = salt['grains.get']('num_cpus', '') %}

/var/log/mysql:
  file.directory:
    - user: mysql
    - group: mysql
    - dir_mode: 775
    - file_mode: 664
    - recurse:
        - user
        - group
        - mode


# A repository specifically setup for MySQL 5.6.
mysql56-community-repo:
  pkgrepo.managed:
    - humanname: MySQL 5.6 Community Server
    - baseurl: http://repo.mysql.com/yum/mysql-5.6-community/el/5/$basearch/
    - gpgcheck: 0
    - require_in:
      - pkg: mysql


mysql:
  pkg.installed:
    - pkgs:
      - mysql
      - mysql-community-libs
      - mysql-community-server
      - mysql-connector-python
      - MySQL-python

# Set MySQL to run in levels 2345.
mysqld-init:
  cmd.run:
    - name: chkconfig --level 2345 mysqld on
    - cwd: /
    - require:
      - pkg: mysql

mysqld:
  cmd.run:
    - name: sudo service mysqld restart
    - cwd: /
    - require:
      - pkg: mysql
  service.running:
    - name: mysqld

#set_localhost_root_password:
#  mysql_user.present:
#    - name: root
#    - host: localhost
#    - password: {{ pillar['mysql']['pwd'] }}
#    - connection_pass: ""
#    - require:
#      - service: mysqld

libevent-dev:
  cmd.run:
    - name: 'wget "https://github.com/libevent/libevent/releases/download/release-2.0.22-stable/libevent-2.0.22-stable.tar.gz" && tar -xzvf libevent-2.0.22-stable.tar.gz && cd libevent-2.0.22-stable && ./configure && make && sudo make install'
    - cwd: /src

set_mysql_config_editor:
  cmd.run:
    - name: 'touch .mylogin.cnf && printf "[local]\nuser = {{ database['user'] }}\npassword = {{ database['pass'] }}\nhost = {{ database['host'] }}" >> .mylogin.cnf'
    - cwd: /

##install sample data
innodb_memcached:
  cmd.run:
    - unless: [ $(mysql --login-path=local -e 'show plugins;' 2>&1 | grep -cFf <( echo 'libmemcached.so' )) -eq 1 ]
    - name: 'mysql --login-path=local -e "CREATE DATABASE test;" && mysql --login-path=local -e "source /usr/share/mysql/innodb_memcached_config.sql" && mysql --login-path=local -e "install plugin daemon_memcached soname \"libmemcached.so\""'
    - cwd: /


/etc/my.cnf:
  file.managed:
    - source: salt://config/mysql/my.cnf
    - user: root
    - group: root
    - mode: 664
    - template: jinja
    - context:
      php: {{ php }}
      memcached: {{ memcached }}
#    - require:
#      - pkg: mysql


mysqld-innodb_memcached-restart:
  cmd.run:
    - name: sudo service mysqld restart
    - cwd: /
    - require:
      - pkg: mysql
  service.running:
    - name: mysqld

# Replicate the functionality of mysql_secure_installation.
mysql-secure-installation:
  mysql_user.absent:
    - name: ""
    - require:
      - service: mysqld
  mysql_database.absent:
    - name: test
    - require:
      - service: mysqld

remove_mysql_config_editor:
  cmd.run:
    - name: 'mysql_config_editor remove --login-path=local'
    - cwd: /

