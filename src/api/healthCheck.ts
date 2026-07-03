/**
 * Health Check API Endpoint
 * Pode ser chamado por um cron job externo para validar o sistema
 *
 * Endpoint: POST /api/health-check
 * Auth: Bearer token ou IP whitelist
 * Frequency: 1x por dia (recomendado: 2h da manhã)
 */

import { performHealthCheck, logHealthCheck } from '../lib/supabaseHealthCheck';

interface HealthCheckRequest {
  timestamp?: string;
  detailed?: boolean;
  notify?: boolean;
}

interface HealthCheckResponse {
  success: boolean;
  timestamp: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  data?: {
    latency: number;
    tablesChecked: number;
    tablesHealthy: number;
    persistenceWorking: boolean;
    executionTime: number;
  };
}

/**
 * Handler para GET /api/health-check
 */
export async function GET(): Promise<Response> {
  try {
    const startTime = Date.now();
    const result = await performHealthCheck();
    const executionTime = Date.now() - startTime;

    // Log
    console.log(`[${new Date().toISOString()}] Health Check: ${result.status.toUpperCase()}`);

    const healthyTables = result.database.tables.filter(t => t.accessible).length;
    const totalTables = result.database.tables.length;

    const response: HealthCheckResponse = {
      success: result.status !== 'error',
      timestamp: result.timestamp,
      status: result.status,
      message: result.summary,
      data: {
        latency: result.connection.latency,
        tablesChecked: totalTables,
        tablesHealthy: healthyTables,
        persistenceWorking: result.persistence.working,
        executionTime
      }
    };

    return new Response(JSON.stringify(response), {
      status: result.status === 'error' ? 503 : 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Health-Status': result.status
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        timestamp: new Date().toISOString(),
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handler para POST /api/health-check (com dados)
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json() as HealthCheckRequest;
    const detailed = body.detailed ?? false;
    const notify = body.notify ?? false;

    const startTime = Date.now();

    // Log completo se detailed
    if (detailed) {
      console.log('=== DETAILED HEALTH CHECK ===');
      await logHealthCheck();
    }

    const result = await performHealthCheck();
    const executionTime = Date.now() - startTime;

    const healthyTables = result.database.tables.filter(t => t.accessible).length;
    const totalTables = result.database.tables.length;

    // Preparar resposta
    const response: HealthCheckResponse = {
      success: result.status !== 'error',
      timestamp: result.timestamp,
      status: result.status,
      message: result.summary,
      data: {
        latency: result.connection.latency,
        tablesChecked: totalTables,
        tablesHealthy: healthyTables,
        persistenceWorking: result.persistence.working,
        executionTime
      }
    };

    // Notificar se houver problemas
    if (notify && result.status !== 'healthy') {
      await notifyHealthStatus(result.status, result.summary);
    }

    return new Response(JSON.stringify(response), {
      status: result.status === 'error' ? 503 : 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Health-Status': result.status,
        'X-Execution-Time': `${executionTime}ms`
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        timestamp: new Date().toISOString(),
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Notifica sobre problemas de saúde do sistema
 */
async function notifyHealthStatus(status: string, message: string): Promise<void> {
  // Implementar notificações (Slack, Email, etc)
  const notification = {
    timestamp: new Date().toISOString(),
    status,
    message,
    environment: import.meta.env.MODE || 'production'
  };

  console.warn('[HEALTH ALERT]', notification);

  // Integrar com seu sistema de notificação
  // await sendSlackNotification(notification);
  // await sendEmailAlert(notification);
}

/**
 * Função auxiliar para testar manualmente
 */
export async function testHealthCheck(): Promise<void> {
  console.log('Testing health check...');
  const result = await performHealthCheck();
  console.log('Health check complete:', result.status);
}
