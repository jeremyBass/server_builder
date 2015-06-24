{% set vars = {'isLocal': False} %}
{% if vars.update({'ip': salt['cmd.run']('ifconfig eth1 2> /dev/null || ifconfig eth0 2> /dev/null | grep "inet " | awk \'{gsub("addr:","",$2);  print $2 }\'') }) %} {% endif %}
{% if vars.update({'isLocal': salt['cmd.run']('test -n "$SERVER_TYPE" && echo $SERVER_TYPE || echo "false"') }) %} {% endif %}

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

/etc/my.cnf:
  file.managed:
    - source: salt://config/mysql/my.cnf
    - user: root
    - group: root
    - mode: 664
#    - require:
#      - pkg: mysql

mysqld:
  cmd.run:
    - name: sudo service mysqld restart
    - cwd: /
    - require:
      - pkg: mysql
  service.running:
    - name: mysqld
    - watch:
      - file: /etc/my.cnf
    - require:
      - file: /etc/my.cnf

#set_localhost_root_password:
#  mysql_user.present:
#    - name: root
#    - host: localhost
#    - password: {{ pillar['mysql']['pwd'] }}
#    - connection_pass: ""
#    - require:
#      - service: mysqld


# Replicate the functionality of mysql_secure_installation.
mysql-secure-installation:
  mysql_database.absent:
    - name: test
    - require:
      - service: mysqld
  mysql_user.absent:
    - name: ""
    - require:
      - service: mysqld






