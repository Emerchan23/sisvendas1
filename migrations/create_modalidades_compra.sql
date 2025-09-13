-- Criar tabela modalidades_compra
CREATE TABLE IF NOT EXISTS modalidades_compra (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inserir modalidades padrão
INSERT OR IGNORE INTO modalidades_compra (codigo, nome, descricao, ativo) VALUES
('COMPRA_DIRETA', 'Compra Direta', 'Compra direta sem processo licitatório', 1),
('LICITADO', 'Licitado', 'Processo licitatório regular', 1),
('DISPENSA', 'Dispensa de Licitação', 'Dispensa de licitação conforme lei', 1),
('PREGAO', 'Pregão', 'Modalidade pregão presencial ou eletrônico', 1),
('TOMADA_PRECOS', 'Tomada de Preços', 'Modalidade tomada de preços', 1),
('CONCORRENCIA', 'Concorrência', 'Modalidade concorrência pública', 1);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_modalidades_compra_codigo ON modalidades_compra(codigo);
CREATE INDEX IF NOT EXISTS idx_modalidades_compra_ativo ON modalidades_compra(ativo);