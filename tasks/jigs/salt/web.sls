# set up data first
###########################################################
{%- set nginx = pillar['nginx'] -%}
{%- set php = pillar['php'] -%}
{% set vars = {'isLocal': False} %}
{% if vars.update({'ip': salt['cmd.run']('(ifconfig eth1 2>/dev/null || ifconfig eth0 2>/dev/null) | grep "inet " | awk \'{gsub("addr:","",$2);  print $2 }\'') }) %} {% endif %}
{% if vars.update({'isLocal': salt['cmd.run']('test -n "$SERVER_TYPE" && echo $SERVER_TYPE || echo "false"') }) %} {% endif %}
{% set cpu_count = salt['grains.get']('num_cpus', '') %}

###########################################################
###########################################################
# php-fpm
###########################################################

# Remi has a repository specifically setup for PHP 7.0. This continues
# to reply on the standard Remi repository for some packages.
remi-php70-repo:
  pkgrepo.managed:
    - humanname: Remi PHP 7 Repository
    - baseurl: http://rpms.famillecollet.com/enterprise/$releasever/php70/$basearch/
    - gpgcheck: 0
    - require_in:
      - pkg: php-fpm

php-fpm:
  pkg.latest:
    - pkgs:
      - php-fpm
    - php:
      - sls: serverbase
  service.running:
    - require:
      - pkg: php-fpm
    - watch:
      - file: /etc/php-fpm.d/www.conf
    - required_in:
      - sls: finalize.restart

{% if 'database' in grains.get('roles') %}
php-mysqlnd:
  pkg.latest:
    - pkgs:
      - php-mysqlnd
{% endif %}

php-cli:
  pkg.latest:
    - pkgs:
      - php-cli

php-common:
  pkg.latest:
    - pkgs:
      - php-common

php-soap:
  pkg.latest:
    - pkgs:
      - php-soap

php-pear:
  pkg.latest:
    - pkgs:
      - php-pear

php-pdo:
  pkg.latest:
    - pkgs:
      - php-pdo




php-mcrypt:
  pkg.latest:
    - pkgs:
      - php-mcrypt

php-imap:
  pkg.latest:
    - pkgs:
      - php-imap


php-gd:
  pkg.latest:
    - pkgs:
      - php-gd

php-mbstring:
  pkg.latest:
    - pkgs:
      - php-mbstring

php-ldap:
  pkg.latest:
    - pkgs:
      - php-ldap

#php-opcache:
#  pkg.latest:
#    - pkgs:
#      - php-opcache

php-pecl-msgpack:
  pkg.latest:
    - pkgs:
      - php-pecl-msgpack

php-pecl-memcached:
  pkg.latest:
    - pkgs:
      - php-pecl-memcached

php-pecl-oauth:
  pkg.latest:
    - pkgs:
      - php-pecl-oauth

php-intl:
  pkg.latest:
    - pkgs:
      - php-intl

php-bcmath:
  pkg.latest:
    - pkgs:
      - php-bcmath

php-xml:
  pkg.latest:
    - pkgs:
      - php-xml

ImageMagick:
  pkg.latest:
    - pkgs:
      - php-pecl-imagick
      - ImageMagick


# Set php-fpm to run in levels 2345.
php-fpm-reboot-auto:
  cmd.run:
    - name: chkconfig --level 2345 php-fpm on
    - cwd: /
    - user: root
    - require:
      - pkg: php-fpm


#***************************************
# php-fpm files & configs
#***************************************
/etc/php-fpm.d/www.conf:
  file.managed:
    - source: salt://config/php-fpm/www.conf
    - user: root
    - group: root
    - mode: 644
    - require:
      - pkg: php-fpm

/etc/php.ini:
  file.managed:
    - source: salt://config/php-fpm/php.ini
    - user: root
    - group: root
    - mode: 644
    - template: jinja
    - context:
      php: {{ php }}
    - require:
      - pkg: php-fpm

/etc/php.d/opcache.ini:
  file.managed:
    - source: salt://config/php-fpm/opcache.ini
    - user: root
    - group: root
    - mode: 644
    - require:
      - pkg: php-fpm









###########################################################
###########################################################
# nginx
###########################################################
nginx-compiler-base:
  pkg.installed:
    - pkgs:
      - gcc
      - gcc-c++
      - make
      - automake
      - autoconf
      - libtool
      - zlib-devel
      - pcre-devel
      - openssl-devel
      - libxml2
      - libxml2-devel
      - httpd-devel
      - curl
      - libcurl-devel



# ensure folders to run nginx
###########################################################
# Provide the sites directory for nginx
/etc/nginx/sites-enabled:
  file.directory:
    - user: root
    - group: root
    - mode: 600
    - makedirs: true
    - require_in:
      - cmd: nginx-compile

# Provide the cache directory for nginx
/var/cache/nginx:
  file.directory:
    - user: root
    - group: root
    - mode: 755
    - require_in:
      - cmd: nginx-compile

# Provide the log directory for nginx
/var/log/nginx:
  file.directory:
    - user: root
    - group: root
    - mode: 755
    - require_in:
      - cmd: nginx-compile

{% if 'ssl' in grains.get('roles') %}
# Provide the ssl directory for nginx
/etc/nginx/ssl:
  file.directory:
    - user: root
    - group: root
    - mode: 600
    - makedirs: true
    - require_in:
      - cmd: nginx-compile
{% endif %}

# Provide the proxy directory for nginx
/var/lib/nginx:
  file.directory:
    - user: root
    - group: root
    - mode: 755
    - require_in:
      - cmd: nginx-compile

# Provide the proxy directory for nginx
/var/lib/nginx/proxy:
  file.directory:
    - user: root
    - group: root
    - mode: 755
    - require_in:
      - cmd: nginx-compile


# Provide the lock directory for nginx
/var/lock/subsys/nginx:
  file.directory:
    - user: root
    - group: root
    - mode: 755
    - require_in:
      - cmd: nginx-compile

{% if nginx['npsVersion'] %}
# Provide the pagespeed cache directory for nginx
/var/ngx_pagespeed_cache:
  file.directory:
    - user: root
    - group: root
    - mode: 755
    - require_in:
      - cmd: nginx-compile
{% endif %}

# Adds the service file.
/etc/init.d/nginx:
  file.managed:
    - name: /etc/init.d/nginx
    - source: salt://config/nginx/nginx
    - user: root
    - group: root
    - mode: 755
  cmd.run: #insure it's going to run on windows hosts
    - name: dos2unix /etc/init.d/nginx
    - require:
      - pkg: dos2unix

# Ensure a source folder (/src/) is there to do `make`'s in
/src/:
  file.directory:
    - name: /src/
    - user: root
    - group: root
    - mode: 777

#/srv/salt/base/config/nginx/compiler.sh:
#  file.managed:
#   - user: root
#   - group: root
#   - mode: 755

# ensure compile script for Nginx exists
nginx-compile-script:
  file.managed:
    - name: /src/compiler.sh
    - source: salt://config/nginx/compiler.sh
    - user: root
    - group: root
    - mode: 755
    - template: jinja
    - context:
      nginx: {{ nginx }}
      isLocal: {{ vars.isLocal }}
      saltenv: {{ saltenv }}
  cmd.run: #insure it's going to run on windows hosts.. note it's files as folders the git messes up
    - name: dos2unix /src/compiler.sh
    - require:
      - pkg: dos2unix

# Run compiler
nginx-compile:
  cmd.run:
    - name: /src/compiler.sh
    - cwd: /
    - user: root
    - stateful: True
    - unless: nginx -v 2>&1 | grep -qi "{{ nginx.nginxVersion }}"
    - require:
      - pkg: nginx-compiler-base

# Set Nginx to run in levels 2345.
nginx-reboot-auto:
  cmd.run:
    - name: chkconfig --level 2345 nginx on
    - cwd: /
    - user: root
    - require:
      - cmd: nginx-compile


#***************************************
# nginx files & configs
#***************************************
/etc/nginx/nginx.conf:
  file.managed:
    - source: salt://config/nginx/nginx.conf
    - user: root
    - group: root
    - mode: 644
    - require:
      - cmd: nginx-compile
    - template: jinja
    - context:
      isLocal: {{ vars.isLocal }}
      saltenv: {{ saltenv }}
      cpu_count: {{ cpu_count }}

/etc/nginx/general-security.conf:
  file.managed:
    - source: salt://config/nginx/general-security.conf
    - user: root
    - group: root
    - mode: 644
    - require:
      - cmd: nginx-compile
    - template: jinja
    - context:
      isLocal: {{ vars.isLocal }}
      saltenv: {{ saltenv }}

{% if nginx['msVersion'] %}
/etc/nginx/modsecurity.conf:
  file.managed:
    - source: salt://config/nginx/modsecurity.conf
    - user: root
    - group: root
    - mode: 644
    - require:
      - cmd: nginx-compile
    - template: jinja
    - context:
      isLocal: {{ vars.isLocal }}
      saltenv: {{ saltenv }}
{% endif %}

/etc/nginx/sites-enabled/default:
  file.managed:
    - source: salt://config/nginx/default
    - user: root
    - group: root
    - mode: 644
    - require:
      - cmd: nginx-compile

/etc/nginx/mime.types:
  file.managed:
    - source: salt://config/nginx/mime.types
    - user: root
    - group: root
    - mode: 644
    - require:
      - cmd: nginx-compile



# Start nginx
nginx:
  service.running:
    - user: root
    - require:
      - cmd: nginx-compile
      - user: www-data
      - group: www-data
    - watch:
      - file: /etc/nginx/nginx.conf
      - file: /etc/nginx/sites-enabled/default
    - required_in:
      - sls: finalize.restart



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


###########################################################
###########################################################
# composer
###########################################################
#get-composer:
#  cmd.run:
#    - name: 'CURL=`which curl`; $CURL -sS https://getcomposer.org/installer | php'
#    - unless: test -f /usr/local/bin/composer
#    - user: root
#    - cwd: /root/
#
#install-composer:
#  cmd.wait:
#    - name: mv /root/composer.phar /usr/local/bin/composer
#    - cwd: /root/
#    - user: root
#    - watch:
#      - cmd: get-composer


