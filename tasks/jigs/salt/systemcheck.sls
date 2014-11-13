{% set vars = {'isLocal': False} %}
{% if vars.update({'ip': salt['cmd.run']('ifconfig eth1 | grep "inet " | awk \'{gsub("addr:","",$2);  print $2 }\'') }) %} {% endif %}
{% if vars.update({'isLocal': salt['cmd.run']('test -n "$SERVER_TYPE" && echo $SERVER_TYPE || echo "false"') }) %} {% endif %}

#simple test check
check:
  cmd.run:
    - name: echo "local check positive"
    - cwd: /

#simple test check
ip_check:
  cmd.run:
    - name: echo "{{ vars.ip }}"
    - cwd: /