#!/bin/bash

curl  https://raw.githubusercontent.com/jeremyBass/gitploy/master/gitploy | sudo sh -s -- install
[ -h /usr/sbin/gitploy ] || echoerr "gitploy failed install"
yum install -y epel-release
yum install -y nodejs
yum install -y npm


$build_folder="/srv/builder"


[ -d "${build_folder}" ] || mkdir -p "${build_folder}"


git_cmd="gitploy add -p ${build_folder} serverbase https://github.com/jeremyBass/server_builder.git"
cd /

gitploy init 2>&1 | grep -qi "already initialized" && echo ""
gitploy ls 2>&1 | grep -qi "serverbase" || eval $git_cmd

cd "${build_folder}"
npm install
grunt server_build

