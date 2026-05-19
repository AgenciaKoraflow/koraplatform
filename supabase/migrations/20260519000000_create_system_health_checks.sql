-- Isolated table for health check write/read probes.
-- Keeps test records out of production tables (clients, etc.).
-- Records are ephemeral: each probe inserts one row and deletes it immediately.

CREATE TABLE IF NOT EXISTS system_health_checks (
  id   TEXT        PRIMARY KEY,
  value TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE system_health_checks ENABLE ROW LEVEL SECURITY;

-- Authenticated users can run health probes.
-- Records are deleted by the probe itself within the same request,
-- so there is no meaningful data retention risk.
CREATE POLICY "authenticated_health_probe" ON system_health_checks
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Safety net: auto-purge rows older than 5 minutes that were not cleaned up
-- (e.g. browser closed mid-probe). Runs on every INSERT via a trigger.
CREATE OR REPLACE FUNCTION purge_stale_health_checks()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM system_health_checks
  WHERE created_at < NOW() - INTERVAL '5 minutes';
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_purge_stale_health_checks
  AFTER INSERT ON system_health_checks
  EXECUTE FUNCTION purge_stale_health_checks();
