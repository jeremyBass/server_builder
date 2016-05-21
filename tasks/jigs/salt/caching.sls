# set up data first
###########################################################
{%- set nginx = pillar['nginx'] -%}
{%- set memcached = pillar['memcached'] -%}
{%- set php = pillar['php'] -%}
{% set vars = {'isLocal': False} %}
{% if vars.update({'ip': salt['cmd.run']('(ifconfig eth1 2>/dev/null || ifconfig eth0 2>/dev/null) | grep "inet " | awk \'{gsub("addr:","",$2);  print $2 }\'') }) %} {% endif %}
{% if vars.update({'isLocal': salt['cmd.run']('test -n "$SERVER_TYPE" && echo $SERVER_TYPE || echo "false"') }) %} {% endif %}
{% set cpu_count = salt['grains.get']('num_cpus', '') %}

#php-opcache:
#  pkg.latest:
#    - pkgs:
#      - php-opcache

#/etc/php.d/opcache.ini:
#  file.managed:
#    - source: salt://config/php-fpm/10-opcache.ini
#    - user: root
#    - group: root
#    - mode: 644
#    - require:
#      - pkg: php-fpm

{% if 'web' in grains.get('roles') %}
# Set memcached to run in levels 2345.
memcached-init:
  cmd.run:
    - name: yum -y groupinstall "Development Tools"
    - cwd: /
    - require:
      - pkg: memcached
{% endif %}

memcached:
  pkg.latest:
    - pkgs:
      - memcached
{% if 'web' in grains.get('roles') %}
      - php-devel
      - zlib-devel
      - libmemcached-devel
      - php-pear
      - php-pecl-memcached
{% endif %}
  service.running:
    - require:
      - pkg: memcached
    - required_in:
      - sls: finalize.restart

/etc/sysconfig/memcached:
  file.managed:
    - source: salt://config/memcached/memcached
    - user: root
    - group: root
    - mode: 644
    - require:
      - pkg: memcached
    - template: jinja
    - context:
      isLocal: {{ vars.isLocal }}
      saltenv: {{ saltenv }}
      memcached: {{ memcached }}

# Set memcached to run in levels 2345.
memcached-init:
  cmd.run:
    - name: chkconfig --levels 235 memcached on
    - cwd: /
    - require:
      - pkg: memcached


{% if 'web' in grains.get('roles') %}
# Set memcached to run in levels 2345.
pecl-install-memcached-1.0.0:
  cmd.run:
    - name: pecl install -f memcache
    - cwd: /
    - require:
      - pkg: memcached
{% endif %}


{% if 'redis' in grains.get('roles') %}
###############################################
# install redis
###############################################
# look to http://redis.io/topics/quickstart
{% if vars.isLocal %}
redis-install:
  cmd.run:
    - name: |
       wget http://download.redis.io/redis-stable.tar.gz \
       tar xvzf redis-stable.tar.gz \
       cd redis-stable \
       make \
       make install
    - user: root
    - cwd: /
{% else %}
# see http://redis.io/topics/quickstart#installing-redis-more-properly to alter here
redis-install:
  cmd.run:
    - name: |
       wget http://download.redis.io/redis-stable.tar.gz \
       tar xvzf redis-stable.tar.gz \
       cd redis-stable \
       make \
       make install
    - user: root
    - cwd: /
{% endif %}
{% endif %}
