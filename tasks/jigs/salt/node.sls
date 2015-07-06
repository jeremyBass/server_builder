# set up data first
###########################################################
{% set vars = {'isLocal': False} %}
{% if vars.update({'ip': salt['cmd.run']('(ifconfig eth1 2>/dev/null || ifconfig eth0 2>/dev/null) | grep "inet " | awk \'{gsub("addr:","",$2);  print $2 }\'') }) %} {% endif %}
{% if vars.update({'isLocal': salt['cmd.run']('test -n "$SERVER_TYPE" && echo $SERVER_TYPE || echo "false"') }) %} {% endif %}



# install Node.Js
npm:
  pkg.installed:
    - name: npm

# bypass self signing certs issues for npm
update-npm:
  cmd.run:
    - name: npm config set ca=""
  require:
    - pkg: npm

grunt:
  cmd.run:
    - name: npm install -g grunt-cli
    - require:
      - pkg: npm
      - cmd: update-npm