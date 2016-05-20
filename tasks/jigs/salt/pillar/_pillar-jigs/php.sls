{% set pillar = pillars.php -%}
php:
   memory_limit: {{ pillar.memory_limit if pillar.memory_limit else "512M" }}
   max_input_time: {{ pillar.max_input_time if pillar.max_input_time else "120" }}
   max_execution_time: {{ pillar.max_execution_time if pillar.max_execution_time else "600" }}
   expose_php: {{ pillar.expose_php if pillar.expose_php else "Off" }}
   file_uploads: {{ pillar.file_uploads if pillar.file_uploads else "On" }}
   upload_max_filesize: {{ pillar.upload_max_filesize if pillar.upload_max_filesize else "20M" }}
   max_file_uploads: {{ pillar.max_file_uploads if pillar.max_file_uploads else "20" }}
   date_timezone: {{ pillar.date_timezone if pillar.date_timezone else "America/Los_Angeles" }}
   date_default_latitude: {{ pillar.date_default_latitude if pillar.date_default_latitude else "46.7311399" }}
   date_default_longitude: {{ pillar.date_default_longitude if pillar.date_default_longitude else "-117.1603188" }}
