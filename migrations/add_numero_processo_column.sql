-- Adicionar coluna numero_processo na tabela orcamentos
ALTER TABLE orcamentos ADD COLUMN numero_processo TEXT;

-- Comentário: Esta migração adiciona a coluna numero_processo que estava faltando na tabela orcamentos
-- Isso resolve o problema de salvamento do campo "Número do Processo" nos orçamentos