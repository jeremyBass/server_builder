{% set pillar = pillars.memcached -%}
memcached:
  port: {{ pillar.port if pillar.port else "11211" }}
  host: "{{ pillar.host if pillar.host else "127.0.0.1" }}"
  user: "{{ pillar.user if pillar.user else "memcached" }}"
  max_connections: {{ pillar.max_connections if pillar.max_connections else "1024" }}
  cache_size: {{ pillar.cache_size if pillar.cache_size else "64" }}
  options: "{{ pillar.options if pillar.options else "-l 127.0.0.1" }}"
  use_for_php_session: {{ pillar.use_for_php_session if pillar.use_for_php_session else "true" }}
