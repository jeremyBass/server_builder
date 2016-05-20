{% set vars = {'isLocal': False} %}
{%- set nginx = pillar['nginx'] -%}
{% if vars.update({'ip': salt['cmd.run']('(ifconfig eth1 2>/dev/null || ifconfig eth0 2>/dev/null) | grep "inet " | awk \'{gsub("addr:","",$2);  print $2 }\'') }) %} {% endif %}
{% if vars.update({'isLocal': salt['cmd.run']('test -n "$SERVER_TYPE" && echo $SERVER_TYPE || echo "false"') }) %} {% endif %}

{% if 'web' in grains.get('roles') %}
###########################################################
###########################################################
# folder and users for web services
###########################################################
group-{{ nginx['user'] }}:
  group.present:
    - name: {{ nginx['user'] }}
    - gid: 510

user-{{ nginx['user'] }}:
  user.present:
    - name: {{ nginx['user'] }}
    - uid: 510
    - gid: 510
    - groups:
      - {{ nginx['user'] }}
    - require:
      - group: {{ nginx['user'] }}

user-www-deploy:
  user.present:
    - name: deployment-admin
    - groups:
      - {{ nginx['user'] }}
    - require:
      - group: {{ nginx['user'] }}
{% endif %}





{% if 'database' in grains.get('roles') %}
group-mysql:
  group.present:
    - name: mysql

user-mysql:
  user.present:
    - name: mysql
    - groups:
      - mysql
    - require_in:
      - pkg: mysql
{% endif %}

{% if 'webcaching' in grains.get('roles') %}
group-memcached:
  group.present:
    - name: memcached

user-memcached:
  user.present:
    - name: memcached
    - groups:
      - memcached
    - require_in:
      - pkg: memcached

{% endif %}
