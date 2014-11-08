#!/bin/bash
echo "Server type is: ${SERVER_TYPE}"
if [ $SERVER_TYPE = "VAGRANT" ]; then
	mkdir -p /srv/builder
	cp /vagrant/server_project.conf /srv/builder/server_project.conf
fi
cd /
curl  https://raw.githubusercontent.com/jeremyBass/gitploy/master/gitploy | sudo sh -s -- install
[ -h /usr/sbin/gitploy ] || echoerr "gitploy failed install"
yum install -y epel-release
yum install -y nodejs
yum install -y npm
npm install -g grunt-cli

[ -d /srv/builder ] || mkdir -p /srv/builder


git_cmd="gitploy add -p /srv/builder serverbase https://github.com/jeremyBass/server_builder.git"

gitploy init 2>&1 | grep -qi "already initialized" && echo ""
gitploy ls 2>&1 | grep -qi "serverbase" || eval $git_cmd

cd /srv/builder
npm install
grunt build_salt
grunt build_server

sh /srv/salt/boot/bootstrap-salt.sh -K stable
rm /etc/salt/minion.d/*.conf
cp /srv/salt/minions/server.conf /etc/salt/minion.d/
salt-call --local --log-level=info --config-dir=/etc/salt state.highstate
