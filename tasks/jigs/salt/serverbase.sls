# set up data first
###########################################################
{%- set nginx = pillar['nginx'] -%}
{% set vars = {'isLocal': False} %}
{% if vars.update({'ip': salt['cmd.run']('(ifconfig eth1 2>/dev/null || ifconfig eth0 2>/dev/null) | grep "inet " | awk \'{gsub("addr:","",$2);  print $2 }\'') }) %} {% endif %}
{% if vars.update({'isLocal': salt['cmd.run']('test -n "$SERVER_TYPE" && echo $SERVER_TYPE || echo "false"') }) %} {% endif %}


###########################################################
###########################################################
# Server Variables
###########################################################
# example custom
# Set incron to run in levels 2345.
#set-SERVER_IP:
#  cmd.run:
#    - name: echo 'export SERVER_IP="10.255.255.2"' >> /etc/profile
#    - cwd: /
#    - user: root

/etc/profile.d/system_vars.sh:
  file.managed:
    - source: salt://config/profile/profile.d/system_vars.sh
    - user: root
    - group: root
    - mode: 600
    - template: jinja
    - context:
      isLocal: {{ vars.isLocal }}
      ip: {{ vars.ip }}
      saltenv: {{ saltenv }}



###########################################################
###########################################################
# Server Utilities
###########################################################
curl:
  pkg.installed:
    - name: curl

dos2unix:
  pkg.installed:
    - name: dos2unix

git:
  pkg.latest:
    - name: git

patch:
  pkg.installed:
    - name: patch

unzip:
  pkg.installed:
    - name: unzip

wget:
  pkg.installed:
    - name: wget

incron:
  pkg.installed:
    - name: incron

# Set incron to run in levels 2345.
incrond-reboot-auto:
  cmd.run:
    - name: chkconfig --level 2345 incrond on
    - cwd: /
    - user: root
    - require:
      - pkg: incron


###########################################################
###########################################################
# Add editors
###########################################################
/etc/incron.allow:
  file.managed:
    - source: salt://config/incron/incron.allow
    - makedirs: true
    - user: root
    - group: root
    - template: jinja
    - context:
      isLocal: {{ vars.isLocal }}
      saltenv: {{ saltenv }}
      nginx: {{ nginx }}

###########################################################
###########################################################
# general updates to items
###########################################################
# Ensure that bash is at the latest version.
bash:
  pkg.latest:
    - name: bash



###########################################################
###########################################################
# Add editors
###########################################################
nano:
  pkg.installed:
    - name: nano


###########################################################
###########################################################
# performance and tunning
###########################################################
#monit:
#  pkg.installed:
#    - name: monit
#    #make configs and com back to apply them



###########################################################
###########################################################
# glassceiling
###########################################################
# set up a glass ceiling to stay below.  Once broken restart nginx and php-fpm services
crash-prevention-update:
  cmd.run:
    - name: gitploy up -e README.md glassceiling 90 "/1"
    - cwd: /
    - user: root
    - onlyif: gitploy ls 2>&1 | grep -qi "glassceiling"

crash-prevention:
  cmd.run:
    - name: gitploy -e README.md glassceiling https://github.com/jeremyBass/glass-ceiling && sh glassceiling.sh 90 "/1"
    - cwd: /
    - user: root
    - unless: gitploy ls 2>&1 | grep -qi "glassceiling"
