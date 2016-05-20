# set up data first
###########################################################
{%- set nginx = pillar['nginx'] -%}
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




memcached:
  pkg.installed:
    - name: memcached
  service.running:
    - require:
      - pkg: memcached
    - required_in:
      - sls: finalize.restart

# Set memcached to run in levels 2345.
memcached-init:
  cmd.run:
    - name: chkconfig --level 2345 memcached on
    - cwd: /
    - require:
      - pkg: memcached

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
