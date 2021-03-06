{% set vars = {'isLocal': False} %}
{% if vars.update({'ip': salt['cmd.run']('(ifconfig eth1 2>/dev/null || ifconfig eth0 2>/dev/null) | grep "inet " | awk \'{gsub("addr:","",$2);  print $2 }\'') }) %} {% endif %}
{% if vars.update({'isLocal': salt['cmd.run']('test -n "$SERVER_TYPE" && echo $SERVER_TYPE || echo "false"') }) %} {% endif %}

base:
  '*':
{% if vars.isLocal %}
    - systemcheck
{% endif %}
    - os.centos
    - users
{% if 'serverbase' in grains.get('roles') %}
    - serverbase
{% endif %}
{% if 'email' in grains.get('roles') %}
    - email
{% endif %}
{% if 'database' in grains.get('roles') %}
    - database
{% endif %}
{% if 'ssl' in grains.get('roles') %}
    - ssl
{% endif %}
{% if 'webcaching' in grains.get('roles') %}
    - caching
{% endif %}
{% if 'web' in grains.get('roles') %}
    - web
{% endif %}
    - node
{% if 'java' in grains.get('roles') %}
    - java
{% endif %}
{% if vars.isLocal %}
    - env.development
{% else %}
    - env.production
{%- endif %}
{% if 'security' in grains.get('roles') %}
    - security
{% endif %}
    - cron
    - finalize.restart
