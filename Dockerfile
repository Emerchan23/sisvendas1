version: "3.9"

services:
  sisvendas:
    build: .
    container_name: sisvendas_app
    ports:
      - "3145:3145"
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
      - PORT=3145
      - DB_PATH=/data/erp.sqlite
    volumes:
      - /data/compose/banco_dados_aqui:/data
    restart: unless-stopped

volumes:
  sisvendas_erp-data:
    driver: local
