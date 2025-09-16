-- Criação da tabela de logs de e-mail
-- Esta tabela armazena informações sobre todos os e-mails enviados pelo sistema

CREATE TABLE IF NOT EXISTS email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'rejected')),
  response TEXT,
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_email_logs_message_id ON email_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

-- Comentários sobre a tabela
-- message_id: ID único da mensagem retornado pelo provedor de e-mail
-- to_email: E-mail(s) do(s) destinatário(s)
-- subject: Assunto do e-mail
-- status: Status do envio (sent, failed, rejected)
-- response: Resposta do servidor SMTP
-- error_message: Mensagem de erro em caso de falha
-- created_at: Data e hora de criação do registro
-- updated_at: Data e hora da última atualização