#!/bin/bash
echo "Server type is: ${SERVER_TYPE}"
mkdir -p /srv/builder

if [ $SERVER_TYPE = "VAGRANT" ]; then
    cp /vagrant/server_project.conf /srv/builder/server_project.conf
fi

cd /
if [ ! -h /usr/sbin/gitploy ]; then
    curl  https://raw.githubusercontent.com/jeremyBass/gitploy/master/gitploy | sudo sh -s -- install
    [ -h /usr/sbin/gitploy ] || echoerr "gitploy failed install"
else
    gitploy update_gitploy
fi

rpm -qa | grep -qw epel-release || yum install -y epel-release
rpm -qa | grep -qw nodejs || yum install -y nodejs
if ! rpm -qa | grep -qw npm; then
    yum install -y npm
    npm install -g grunt-cli
fi

[ -d /srv/builder ] || mkdir -p /srv/builder

gitploy init 2>&1 | grep -qi "already initialized" && echo ""
gitploy ls 2>&1 | grep -qi "serverbase" && gitploy up serverbase
gitploy ls 2>&1 | grep -qi "serverbase" || gitploy add -p /srv/builder serverbase https://github.com/jeremyBass/server_builder.git

cd /srv/builder
npm install
grunt build_salt
grunt build_server



#salt-call --local --log-level=info --config-dir=/etc/salt state.highstate env=base
#env=base


#rm /etc/salt/minion.d/*.conf
#cp /srv/salt/minions/server.conf /etc/salt/minion.d/
#salt-call --local --log-level=info --config-dir=/etc/salt state.highstate env=base

#salt-call --log-level=info state.highstate env=base