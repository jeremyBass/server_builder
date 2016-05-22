{% set pillar = pillars.memcached -%}
memcached:
  port: 11211
  host: "127.0.0.1"
  user: "memcached"
  max_connections: 1024
  cache_size: 64
  options: "-l 127.0.0.1"
  use_for_php_session: true
