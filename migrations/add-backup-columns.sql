-- Migração para adicionar colunas de configuração de backup na tabela empresas
-- Data: 2024-01-15
-- Descrição: Adiciona suporte para configurações de agendamento automático de backup

ALTER TABLE empresas ADD COLUMN auto_backup_enabled INTEGER DEFAULT 0;
ALTER TABLE empresas ADD COLUMN backup_frequency TEXT DEFAULT 'daily';
ALTER TABLE empresas ADD COLUMN backup_time TEXT DEFAULT '02:00';
ALTER TABLE empresas ADD COLUMN keep_local_backup INTEGER DEFAULT 1;
ALTER TABLE empresas ADD COLUMN max_backups INTEGER DEFAULT 5;
ALTER TABLE empresas ADD COLUMN last_backup DATETIME;

-- Comentários sobre as colunas:
-- auto_backup_enabled: 0 = desabilitado, 1 = habilitado
-- backup_frequency: 'daily', 'weekly', 'monthly'
-- backup_time: horário no formato HH:MM (24h)
-- keep_local_backup: 0 = não manter, 1 = manter cópia local
-- max_backups: número máximo de backups a manter
-- last_backup: timestamp do último backup realizado