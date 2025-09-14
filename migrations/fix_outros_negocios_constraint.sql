-- Migração para corrigir constraint da tabela outros_negocios
-- Permitir valores 'emprestimo' e 'venda' além de 'receita' e 'despesa'

BEGIN TRANSACTION;

-- Criar tabela temporária com a nova constraint
CREATE TABLE outros_negocios_temp (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('emprestimo', 'venda', 'receita', 'despesa')),
  valor REAL NOT NULL,
  descricao TEXT,
  categoria TEXT,
  cliente_id TEXT,
  data_transacao TEXT NOT NULL,
  forma_pagamento TEXT,
  observacoes TEXT,
  anexos TEXT,
  status TEXT DEFAULT 'ativo',
  juros_ativo BOOLEAN DEFAULT 0,
  juros_mes_percent REAL DEFAULT 0,
  multa_ativa BOOLEAN DEFAULT 0,
  multa_percent REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copiar dados existentes
INSERT INTO outros_negocios_temp 
SELECT * FROM outros_negocios;

-- Remover tabela antiga
DROP TABLE outros_negocios;

-- Renomear tabela temporária
ALTER TABLE outros_negocios_temp RENAME TO outros_negocios;

COMMIT;