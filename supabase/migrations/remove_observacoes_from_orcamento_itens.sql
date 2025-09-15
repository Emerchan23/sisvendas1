-- Remove campo observacoes da tabela orcamento_itens
-- Data: 2025-01-27
-- Motivo: Campo não é mais necessário conforme solicitação do usuário

ALTER TABLE orcamento_itens DROP COLUMN observacoes;

-- Verificar se a coluna foi removida com sucesso
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'orcamento_itens' 
AND table_schema = 'public'
ORDER BY ordinal_position;