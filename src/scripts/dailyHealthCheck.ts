/**
 * Daily Health Check Script
 * Executa 1x por dia para garantir que o projeto não pause por inatividade
 *
 * Uso:
 * npx ts-node src/scripts/dailyHealthCheck.ts
 */

import { performHealthCheck, logHealthCheck } from '../lib/supabaseHealthCheck';

async function runDailyHealthCheck() {
  console.log(`\nStarting daily health check at ${new Date().toISOString()}`);

  try {
    // Log do health check
    await logHealthCheck();

    // Realiza operações de warm-up para manter o projeto ativo
    console.log('Performing warm-up operations...');

    // Aqui você pode adicionar mais operações de manutenção
    // Por exemplo, limpar dados antigos, atualizar caches, etc.

    const result = await performHealthCheck();

    if (result.status === 'healthy') {
      console.log('All systems operational!');
      process.exit(0);
    } else if (result.status === 'warning') {
      console.log('System running with warnings');
      process.exit(0);
    } else {
      console.error('System has errors');
      process.exit(1);
    }
  } catch (error) {
    console.error('Health check failed:', error);
    process.exit(1);
  }
}

// Execute o health check
runDailyHealthCheck();
