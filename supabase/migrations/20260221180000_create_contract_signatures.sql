-- Create contract_signatures table for digital signature system
CREATE TABLE IF NOT EXISTS contract_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  signer_type VARCHAR(20) NOT NULL CHECK (signer_type IN ('client', 'contractor')),
  signer_name VARCHAR(255) NOT NULL,
  signer_email VARCHAR(255) NOT NULL,
  signature_token UUID NOT NULL DEFAULT gen_random_uuid(),
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_data TEXT,
  signature_ip VARCHAR(45),
  signature_user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(contract_id, signer_type)
);

-- Create signature_settings table for contract-wide signature configuration
CREATE TABLE IF NOT EXISTS signature_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE UNIQUE,
  signature_order VARCHAR(20) NOT NULL DEFAULT 'simultaneous' CHECK (signature_order IN ('simultaneous', 'client_first', 'contractor_first')),
  require_client_signature BOOLEAN DEFAULT TRUE,
  require_contractor_signature BOOLEAN DEFAULT TRUE,
  auto_notify_on_signature BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create signature_audit_log table for tracking all signature events
CREATE TABLE IF NOT EXISTS signature_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add signature-related columns to contracts table
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signature_link_token UUID DEFAULT gen_random_uuid();
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signature_link_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_signed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_signature_data TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_signer_name VARCHAR(255);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_signer_email VARCHAR(255);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contractor_signed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contractor_signature_data TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contractor_signer_name VARCHAR(255);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contractor_signer_email VARCHAR(255);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signature_order VARCHAR(20) DEFAULT 'simultaneous' CHECK (signature_order IN ('simultaneous', 'client_first', 'contractor_first'));
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS fully_signed_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contract_signatures_contract_id ON contract_signatures(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_token ON contract_signatures(signature_token);
CREATE INDEX IF NOT EXISTS idx_contracts_signature_link_token ON contracts(signature_link_token);
CREATE INDEX IF NOT EXISTS idx_signature_audit_log_contract_id ON signature_audit_log(contract_id);

-- Create function to generate signature link
CREATE OR REPLACE FUNCTION generate_signature_link(p_contract_id UUID)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_token UUID;
BEGIN
  v_token := gen_random_uuid();
  
  UPDATE contracts 
  SET signature_link_token = v_token,
      signature_link_expires_at = NOW() + INTERVAL '30 days'
  WHERE id = p_contract_id;
  
  RETURN v_token;
END;
$$;

-- Create function to check if contract is fully signed
CREATE OR REPLACE FUNCTION check_contract_fully_signed(p_contract_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_client_signed BOOLEAN;
  v_contractor_signed BOOLEAN;
  v_settings RECORD;
BEGIN
  -- Get signature status
  SELECT 
    client_signed_at IS NOT NULL,
    contractor_signed_at IS NOT NULL
  INTO v_client_signed, v_contractor_signed
  FROM contracts
  WHERE id = p_contract_id;
  
  -- Get signature settings
  SELECT require_client_signature, require_contractor_signature
  INTO v_settings
  FROM signature_settings
  WHERE contract_id = p_contract_id;
  
  -- If no settings, assume both signatures required
  IF v_settings IS NULL THEN
    IF v_client_signed AND v_contractor_signed THEN
      UPDATE contracts SET fully_signed_at = NOW() WHERE id = p_contract_id;
      RETURN TRUE;
    END IF;
    RETURN FALSE;
  END IF;
  
  -- Check based on requirements
  IF (NOT v_settings.require_client_signature OR v_client_signed) AND
     (NOT v_settings.require_contractor_signature OR v_contractor_signed) THEN
    UPDATE contracts SET fully_signed_at = NOW(), status = 'signed' WHERE id = p_contract_id;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Create trigger to log signature events
CREATE OR REPLACE FUNCTION log_signature_event()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO signature_audit_log (contract_id, event_type, event_data)
  VALUES (
    NEW.id,
    CASE 
      WHEN NEW.client_signed_at IS NOT NULL AND OLD.client_signed_at IS NULL THEN 'client_signed'
      WHEN NEW.contractor_signed_at IS NOT NULL AND OLD.contractor_signed_at IS NULL THEN 'contractor_signed'
      WHEN NEW.fully_signed_at IS NOT NULL AND OLD.fully_signed_at IS NULL THEN 'fully_signed'
      ELSE 'updated'
    END,
    jsonb_build_object(
      'client_signed', NEW.client_signed_at IS NOT NULL,
      'contractor_signed', NEW.contractor_signed_at IS NOT NULL,
      'fully_signed', NEW.fully_signed_at IS NOT NULL
    )
  );
  RETURN NEW;
END;
$$;

-- Create trigger for signature logging
DROP TRIGGER IF EXISTS trg_log_signature_event ON contracts;
CREATE TRIGGER trg_log_signature_event
AFTER UPDATE ON contracts
FOR EACH ROW
WHEN (OLD.client_signed_at IS DISTINCT FROM NEW.client_signed_at OR 
      OLD.contractor_signed_at IS DISTINCT FROM NEW.contractor_signed_at OR
      OLD.fully_signed_at IS DISTINCT FROM NEW.fully_signed_at)
EXECUTE FUNCTION log_signature_event();

-- Add comment to table
COMMENT ON TABLE contract_signatures IS 'Stores digital signature information for contracts';
COMMENT ON TABLE signature_settings IS 'Configuration for contract signature workflow';
COMMENT ON TABLE signature_audit_log IS 'Audit trail for all signature events';
