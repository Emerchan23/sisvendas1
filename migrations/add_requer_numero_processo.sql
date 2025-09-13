-- Adicionar campo requer_numero_processo na tabela modalidades_compra
ALTER TABLE modalidades_compra ADD COLUMN requer_numero_processo BOOLEAN DEFAULT 0;

-- Atualizar modalidades que tradicionalmente requerem número do processo
UPDATE modalidades_compra SET requer_numero_processo = 1 WHERE codigo IN ('DISPENSA', 'LICITADO', 'PREGAO');

-- Criar índice para o novo campo
CREATE INDEX IF NOT EXISTS idx_modalidades_compra_requer_numero ON modalidades_compra(requer_numero_processo);