# set up data first
###########################################################
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
# Update base packages that are standard for these servers
###########################################################
glibc:
  pkg.latest:
    - name: glibc

bash:
  pkg.latest:
    - name: bash

wget:
  pkg.latest:
    - name: wget

curl:
  pkg.latest:
    - name: curl

yum:
  pkg.latest:
    - name: yum

openssl:
  pkg.latest:
    - name: openssl

postfix:
  pkg.latest:
    - name: postfix

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




## @todo

#/etc/hosts:
#  file.managed:
#    - source: salt://config/hosts
#    - user: root
#    - group: root
#    - mode: 644


#worth noting that there will be some changes as this just gets nuked it seems
#a fix here http://totalcae.com/blog/2013/06/prevent-etcresolv-conf-from-being-blown-away-by-rhelcentos-after-customizing/
#/etc/resolv.conf:
#  file.managed:
#    - source: salt://config/resolv.conf
#    - user: root
#    - group: root
#    - mode: 644
