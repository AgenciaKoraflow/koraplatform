-- Fix the client_observability_summary view to handle UUID comparison
DROP VIEW IF EXISTS client_observability_summary;

CREATE OR REPLACE VIEW client_observability_summary AS
SELECT 
  ci.client_id,
  COALESCE(c.company, 'Koraflow Interno') as client_name,
  COUNT(*) as total_integrations,
  COUNT(*) FILTER (WHERE ci.status = 'active') as active_integrations,
  COUNT(*) FILTER (WHERE ci.status = 'error') as error_integrations,
  MAX(ih.checked_at) as last_health_check,
  (SELECT COUNT(*) FROM integration_logs il 
   WHERE il.integration_id = ANY(ARRAY_AGG(ci.id))
   AND il.severity IN ('error', 'critical')
   AND il.created_at >= NOW() - INTERVAL '7 days'
  ) as errors_7d
FROM client_integrations ci
LEFT JOIN clients c ON ci.client_id::uuid = c.id
LEFT JOIN integration_health ih ON ci.id = ih.integration_id
GROUP BY ci.client_id, c.company;
