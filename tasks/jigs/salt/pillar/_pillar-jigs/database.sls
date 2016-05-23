{% set pillar = pillars.database -%}
database:
  host: {{ pillar.host if pillar.host else "127.0.0.1" }}
  name: {{ pillar.name if pillar.name else "wsumage_networks" }}
  user: {{ pillar.user if pillar.user else "mageNtkUsr2014" }}
  pass: {{ pillar.pass if pillar.pass else "VAGRANT" }}
  prefix: {{ pillar.prefix if pillar.prefix else "" }}
