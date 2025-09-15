-- Adicionar coluna requer_numero_processo à tabela modalidades_compra
ALTER TABLE modalidades_compra ADD COLUMN requer_numero_processo INTEGER DEFAULT 0;

-- Atualizar modalidades que requerem número de processo
UPDATE modalidades_compra SET requer_numero_processo = 1 
WHERE codigo IN ('LICITADO', 'PREGAO', 'CONCORRENCIA', 'TOMADA_PRECOS', 'DISPENSA');

-- Manter como 0 (não requer) para COMPRA_DIRETA
UPDATE modalidades_compra SET requer_numero_processo = 0 
WHERE codigo = 'COMPRA_DIRETA';