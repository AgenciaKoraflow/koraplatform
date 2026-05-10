-- Update contract signature system for Koraflow-first flow

-- Add new columns to contracts table
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS koraflow_signed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS koraflow_signature_data TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS koraflow_signer_name VARCHAR(255);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS koraflow_signer_email VARCHAR(255);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS koraflow_signer_user_id VARCHAR(255);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_cpf VARCHAR(14);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signed_document_data TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signature_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signature_link_expires_at TIMESTAMP WITH TIME ZONE;

-- Update status constraint to include new statuses
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_status_check;
ALTER TABLE contracts ADD CONSTRAINT contracts_status_check 
  CHECK (status IN ('draft', 'awaiting_koraflow_signature', 'awaiting_client_signature', 'signed', 'expired'));

-- Create email_logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS signature_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  email_type VARCHAR(50) NOT NULL CHECK (email_type IN ('signature_request', 'signature_confirmation', 'reminder')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'failed')),
  error_message TEXT
);

-- Create signature_attempts table for rate limiting
CREATE TABLE IF NOT EXISTS signature_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  ip_address VARCHAR(45),
  attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT FALSE
);

-- Create index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_signature_attempts_contract_ip ON signature_attempts(contract_id, ip_address);
CREATE INDEX IF NOT EXISTS idx_signature_attempts_time ON signature_attempts(attempt_at);

-- Create function to check rate limit (max 5 attempts per hour per IP)
CREATE OR REPLACE FUNCTION check_signature_rate_limit(p_contract_id UUID, p_ip_address VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_attempts INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_attempts
  FROM signature_attempts
  WHERE contract_id = p_contract_id
    AND ip_address = p_ip_address
    AND attempt_at > NOW() - INTERVAL '1 hour';
  
  RETURN v_attempts < 5;
END;
$$;

-- Create function to generate signed document
CREATE OR REPLACE FUNCTION generate_signed_document(p_contract_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_contract RECORD;
  v_signed_doc TEXT;
BEGIN
  SELECT * INTO v_contract FROM contracts WHERE id = p_contract_id;
  
  IF v_contract IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- In a real implementation, this would merge signatures into the PDF
  -- For now, we'll just return the original document data
  -- The actual PDF manipulation would be done in the Edge Function
  
  RETURN v_contract.document_data;
END;
$$;

-- Create trigger to update status when Koraflow signs
CREATE OR REPLACE FUNCTION update_status_on_koraflow_signature()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.koraflow_signed_at IS NOT NULL AND OLD.koraflow_signed_at IS NULL THEN
    NEW.status := 'awaiting_client_signature';
    
    -- Log the signature event
    INSERT INTO signature_audit_log (contract_id, event_type, event_data)
    VALUES (
      NEW.id,
      'koraflow_signed',
      jsonb_build_object(
        'signer_name', NEW.koraflow_signer_name,
        'signer_email', NEW.koraflow_signer_email,
        'signed_at', NEW.koraflow_signed_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_status_on_koraflow_signature ON contracts;
CREATE TRIGGER trg_update_status_on_koraflow_signature
BEFORE UPDATE ON contracts
FOR EACH ROW
WHEN (NEW.koraflow_signed_at IS DISTINCT FROM OLD.koraflow_signed_at)
EXECUTE FUNCTION update_status_on_koraflow_signature();

-- Create trigger to update status when client signs
CREATE OR REPLACE FUNCTION update_status_on_client_signature()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.client_signed_at IS NOT NULL AND OLD.client_signed_at IS NULL THEN
    -- Check if Koraflow has also signed
    IF NEW.koraflow_signed_at IS NOT NULL THEN
      NEW.status := 'signed';
      NEW.fully_signed_at := NOW();
      
      -- Generate signed document
      -- In production, this would call a PDF generation service
      NEW.signed_document_data := NEW.document_data;
    END IF;
    
    -- Log the signature event
    INSERT INTO signature_audit_log (contract_id, event_type, event_data)
    VALUES (
      NEW.id,
      'client_signed',
      jsonb_build_object(
        'signer_name', NEW.client_signer_name,
        'signer_email', NEW.client_signer_email,
        'signer_cpf', NEW.client_cpf,
        'signed_at', NEW.client_signed_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_status_on_client_signature ON contracts;
CREATE TRIGGER trg_update_status_on_client_signature
BEFORE UPDATE ON contracts
FOR EACH ROW
WHEN (NEW.client_signed_at IS DISTINCT FROM OLD.client_signed_at)
EXECUTE FUNCTION update_status_on_client_signature();

-- Add comments
COMMENT ON COLUMN contracts.koraflow_signed_at IS 'Timestamp when Koraflow signed the contract';
COMMENT ON COLUMN contracts.koraflow_signer_name IS 'Name of the person who signed for Koraflow';
COMMENT ON COLUMN contracts.koraflow_signer_user_id IS 'ID of the user who signed for Koraflow';
COMMENT ON COLUMN contracts.client_cpf IS 'CPF of the client signer for validation';
COMMENT ON COLUMN contracts.signed_document_data IS 'Final signed document with both signatures';
COMMENT ON TABLE signature_email_logs IS 'Log of all signature-related emails sent';
COMMENT ON TABLE signature_attempts IS 'Track signature attempts for rate limiting';
