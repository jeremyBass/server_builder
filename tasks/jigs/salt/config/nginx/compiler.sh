#!/bin/bash

resulting=""
name="nginx-compile"

#if [ -z "$1" ]; then
#    resulting="Faild to provide a version of nginx to use"
#    echo "name=$name result=False changed=False comment=$resulting"
#    exit
#fi

nginxVersion="{{ nginx['nginxVersion'] }}"
opensslVersion="{{ nginx['opensslVersion'] }}"
npsVersion="{{ nginx['npsVersion'] }}"
msVersion="{{ nginx['msVersion'] }}"

touch /var/log/failed_nginx_compile.log
touch /var/log/nginx-${nginxVersion}_compile.log


#set the compiler to be quite
#then return message only it it's a fail
ini(){
    cd /src

    #clear past installs
    rm -rf nginx*

    #nginxVersion="1.5.8" # set the value here from nginx website
    wget -N http://nginx.org/download/nginx-${nginxVersion}.tar.gz 2>/var/log/nginx-${nginxVersion}_compile.log
    tar -xzf nginx-${nginxVersion}.tar.gz 2>/var/log/nginx-${nginxVersion}_compile.log
    ln -sf nginx-${nginxVersion} nginx

    cd /src/nginx/src/http/

    #/src/nginx/src/http/ngx_http_header_filter_module.c > src/http/ngx_http_header_filter_module.c.main.bak
    # hidding the tech helps hide which attack to use
    cp ngx_http_header_filter_module.c{,.bak}
    sed -i 's|string\[\] = "Server: nginx"|string[] = "Server: {{ nginx['nginxServername'] }}"|' ngx_http_header_filter_module.c
    sed -i 's|string\[\] = "Server: " NGINX_VER|string[] = "Server: {{ nginx['nginxServername'] }}"|' ngx_http_header_filter_module.c

{% if nginx['msVersion'] != "false" %}
    cd /src/nginx/
    yum -y install httpd httpd-devel pcre pcre-devel libxml2-devel
    # Fetch modsecurity
    wget -N -O modsecurity-${msVersion}.tar.gz https://github.com/SpiderLabs/ModSecurity/releases/download/v${msVersion}/modsecurity-${msVersion}.tar.gz 2>/var/log/nginx-${nginxVersion}_compile.log
    tar -xzf modsecurity-${msVersion}.tar.gz
    cd modsecurity-${msVersion}
    ./configure --enable-standalone-module --disable-mlogc
    make && make install  2>/var/log/nginx-${nginxVersion}_compile.log
{% endif %}

    cd /src/nginx

{% if nginx['opensslVersion'] != "false" -%}
    # Fetch openssl
    wget -N http://www.openssl.org/source/openssl-${opensslVersion}.tar.gz 2>/var/log/nginx-${nginxVersion}_compile.log
    tar -xzf openssl-${opensslVersion}.tar.gz 2>/var/log/nginx-${nginxVersion}_compile.log
{% endif -%}

{% if nginx['npsVersion']  != "false" -%}
    #for pagespeed
    yum -y install gcc-c++ pcre-devel zlib-devel make unzip
    rpm --import https://linux.web.cern.ch/linux/scientific6/docs/repository/cern/slc6X/i386/RPM-GPG-KEY-cern
    wget -O /etc/yum.repos.d/slc6-devtoolset.repo https://linux.web.cern.ch/linux/scientific6/docs/repository/cern/devtoolset/slc6-devtoolset.repo
    yum -y install devtoolset-2-binutils devtoolset-2-gcc-c++
    PS_NGX_EXTRA_FLAGS="--with-cc=/opt/rh/devtoolset-2/root/usr/bin/gcc"

    #get page speed
    wget https://github.com/pagespeed/ngx_pagespeed/archive/release-${npsVersion}-beta.zip 2>/var/log/nginx-${nginxVersion}_compile.log
    unzip release-${npsVersion}-beta 2>/var/log/nginx-${nginxVersion}_compile.log
    cd ngx_pagespeed-release-${npsVersion}-beta/
    wget https://dl.google.com/dl/page-speed/psol/${npsVersion}.tar.gz 2>/var/log/nginx-${nginxVersion}_compile.log
    tar -xzvf ${npsVersion}.tar.gz 2>/var/log/nginx-${nginxVersion}_compile.log # expands to psol/
{% endif -%}

    #mkdir /tmp/nginx-modules
    #cd /tmp/nginx-modules
    #wget https://github.com/agentzh/headers-more-nginx-module/archive/v0.19.tar.gz
    #tar -xzvf v0.19.tar.gz

    cd /src/nginx

    ./configure \
--user={{ nginx['user'] }} \
--group={{ nginx['user'] }} \
--prefix=/etc/nginx \
--sbin-path=/usr/sbin/nginx \
{% if nginx['msVersion']  != "false" -%}
--add-module=/src/nginx/modsecurity-${msVersion}/nginx/modsecurity \
{% endif -%}
{% if nginx['opensslVersion']  != "false" -%}
--with-http_v2_module \
--with-http_ssl_module \
--with-openssl=/src/nginx/openssl-${opensslVersion} \
--with-sha1=/usr/include/openssl \
--with-md5=/usr/include/openssl \
{% endif -%}
{% if nginx['npsVersion']  != "false" -%}
--add-module=/src/nginx/ngx_pagespeed-release-${npsVersion}-beta ${PS_NGX_EXTRA_FLAGS} \
{% endif -%}
--conf-path=/etc/nginx/nginx.conf \
--pid-path=/var/run/nginx.pid \
--lock-path=/var/lock/subsys/nginx \
--error-log-path=/var/log/nginx/error.log \
--http-log-path=/var/log/nginx/access.log \
--http-client-body-temp-path=/var/cache/nginx/client_temp \
--http-proxy-temp-path=/var/cache/nginx/proxy_temp \
--http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp \
--http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp \
--http-scgi-temp-path=/var/cache/nginx/scgi_temp \
--with-pcre \
--with-ipv6 \
--with-file-aio \
--with-http_realip_module \
--without-http_scgi_module \
--without-http_uwsgi_module \
--with-http_auth_request_module \
--with-http_sub_module \
--with-http_mp4_module \
--with-http_flv_module \
--with-http_addition_module \
--with-http_dav_module \
--with-http_gzip_static_module \
--with-http_stub_status_module \
--with-http_sub_module
    make && make install  2>/var/log/nginx-${nginxVersion}_compile.log
}

LOGOUTPUT=$(ini)

if [ $(nginx -v 2>&1 | grep -qi "$nginx_version") ]; then
    resulting="Just finished installing nginx $nginxVersion"
    echo "result=True changed=True comment='$resulting'"
    #echo "{'name': 'nginx-compile', 'changes': {}, 'result': True, 'comment': ''}"
else
    resulting="Failed installing nginx $nginxVersion, check /failed_nginx_compile for details"
    echo $LOGOUTPUT >> /failed_nginx_compile
    echo "result=False changed=False comment='$resulting'"
    #echo "{'name': 'nginx-compile', 'changes': {}, 'result': False, 'comment': ''}"
fi
