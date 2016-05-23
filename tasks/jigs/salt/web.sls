# set up data first
###########################################################
{%- set nginx = pillar['nginx'] -%}
{%- set php = pillar['php'] -%}
{%- set memcached = pillar['memcached'] -%}
{% set vars = {'isLocal': False} %}
{% if vars.update({'ip': salt['cmd.run']('(ifconfig eth1 2>/dev/null || ifconfig eth0 2>/dev/null) | grep "inet " | awk \'{gsub("addr:","",$2);  print $2 }\'') }) %} {% endif %}
{% if vars.update({'isLocal': salt['cmd.run']('test -n "$SERVER_TYPE" && echo $SERVER_TYPE || echo "false"') }) %} {% endif %}
{% set cpu_count = salt['grains.get']('num_cpus', '') %}

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

###########################################################
###########################################################
# php-fpm
###########################################################

# Remi has a repository specifically setup for PHP 5.5. This continues
# to reply on the standard Remi repository for some packages.
#remi-php55-repo:
#  pkgrepo.managed:
#    - humanname: Remi PHP 5.5 Repository
#    - baseurl: http://rpms.famillecollet.com/enterprise/$releasever/php55/$basearch/
#    - gpgcheck: 0
#    - require_in:
#      - pkg: php-fpm

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
      - php-cli
      - php-common
      - php-soap
      - php-pear
      - php-pdo
{% if 'database' in grains.get('roles') %}
      - php-mysqlnd
{% endif %}
      - php-mcrypt
      - php-imap
      - php-gd
      - php-mbstring
      - php-ldap
      - php-pecl-msgpack
      - php-pecl-oauth
      - php-intl
      - php-xml
    - require:
      - sls: serverbase
  service.running:
    - require:
      - pkg: php-fpm
    - watch:
      - file: /etc/php-fpm.d/www.conf
    - required_in:
      - sls: finalize.restart

ImageMagick:
  pkg.installed:
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
    - template: jinja
    - context:
      isLocal: {{ vars.isLocal }}
      saltenv: {{ saltenv }}
      nginx: {{ nginx }}

/etc/php.ini:
  file.managed:
    - source: salt://config/php-fpm/php.ini
    - user: root
    - group: root
    - mode: 644
    - template: jinja
    - context:
      php: {{ php }}
      memcached: {{ memcached }}
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
      nginx: {{ nginx }}

/etc/nginx/gzip.conf:
  file.managed:
    - source: salt://config/nginx/gzip.conf
    - user: root
    - group: root
    - mode: 644
    - require:
      - cmd: nginx-compile
    - template: jinja
    - context:
      isLocal: {{ vars.isLocal }}
      saltenv: {{ saltenv }}
      nginx: {{ nginx }}


# Ensure a source folder (/etc/nginx/cache/) is there to do `make`'s in
/etc/nginx/cache/:
  file.directory:
    - name: /etc/nginx/cache/
    - user: root
    - group: root

/etc/nginx/fastcgi_caching.conf:
  file.managed:
    - source: salt://config/nginx/caching/fastcgi_caching.conf
    - user: root
    - group: root
    - mode: 644
    - require:
      - cmd: nginx-compile
    - template: jinja
    - context:
      isLocal: {{ vars.isLocal }}
      saltenv: {{ saltenv }}
      nginx: {{ nginx }}


/etc/nginx/general-security.conf:
  file.managed:
    - source: salt://config/nginx/security/general-security.conf
    - user: root
    - group: root
    - mode: 644
    - require:
      - cmd: nginx-compile
    - template: jinja
    - context:
      isLocal: {{ vars.isLocal }}
      saltenv: {{ saltenv }}
      nginx: {{ nginx }}


/etc/nginx/location-security.conf:
  file.managed:
    - source: salt://config/nginx/security/location-security.conf
    - user: root
    - group: root
    - mode: 644
    - require:
      - cmd: nginx-compile
    - template: jinja
    - context:
      isLocal: {{ vars.isLocal }}
      saltenv: {{ saltenv }}
      nginx: {{ nginx }}





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

/etc/nginx/ssl/ssl-base.conf:
  file.managed:
    - source: salt://config/nginx/security/ssl-base.conf
    - user: root
    - group: root
    - mode: 644
    - require:
      - cmd: nginx-compile
    - template: jinja
    - context:
      isLocal: {{ vars.isLocal }}
      saltenv: {{ saltenv }}
      nginx: {{ nginx }}
{% endif %}



{% if nginx['msVersion'] %}
# Ensure a source folder (/etc/nginx/modsecurity/ is there to do `make`'s in
/etc/nginx/modsecurity/:
  file.directory:
    - name: /etc/nginx/modsecurity/
    - user: root
    - group: root

/etc/nginx/modsecurity/modsecurity.conf:
  file.managed:
    - source: salt://config/nginx/security/modsecurity/modsecurity.conf
    - user: root
    - group: root
    - mode: 644
    - require:
      - cmd: nginx-compile
    - template: jinja
    - context:
      isLocal: {{ vars.isLocal }}
      saltenv: {{ saltenv }}
      nginx: {{ nginx }}

/etc/nginx/modsecurity/unicode.mapping:
  file.managed:
    - source: salt://config/nginx/security/modsecurity/unicode.mapping
    - user: root
    - group: root
    - mode: 644
    - require:
      - cmd: nginx-compile
{% endif %}

{% if nginx['npsVersion'] %}
/etc/nginx/pagespeed.conf:
  file.managed:
    - source: salt://config/nginx/caching/pagespeed/pagespeed.conf
    - user: root
    - group: root
    - mode: 644
    - require:
      - cmd: nginx-compile
    - template: jinja
    - context:
      isLocal: {{ vars.isLocal }}
      saltenv: {{ saltenv }}
      nginx: {{ nginx }}
{% endif %}

/etc/nginx/sites-enabled/default:
  file.managed:
    - source: salt://config/nginx/default
    - user: root
    - group: root
    - mode: 644
    - require:
      - cmd: nginx-compile
    - template: jinja
    - context:
      isLocal: {{ vars.isLocal }}
      saltenv: {{ saltenv }}
      nginx: {{ nginx }}


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
      - user: {{ nginx['user'] }}
      - group: {{ nginx['user'] }}
    - watch:
      - file: /etc/nginx/nginx.conf
      - file: /etc/nginx/sites-enabled/default
    - required_in:
      - sls: finalize.restart




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


