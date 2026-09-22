import cron, { ScheduledTask } from 'node-cron';
import type { Container } from './container';
import { Logger } from './core/logger';

const logger = new Logger('Scheduler');
const TIMEZONE = 'Asia/Kolkata';

interface Job {
  name: string;
  expression: string;
  run: () => Promise<unknown>;
}

// Replaces the old Nest schedule module's @Cron decorators.
export function scheduledJobs(c: Container): Job[] {
  return [
    // was @Cron('*/15 * * * *') on InventoryCleanupService.handleCron
    { name: 'inventory-cleanup', expression: '*/15 * * * *', run: () => c.inventoryCleanupService.handleCron() },
    // was @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) on TargetsService.rollupExpiredTargets
    { name: 'targets-rollup', expression: '0 0 * * *', run: () => c.targetsService.rollupExpiredTargets() },
    // was @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) on BeatsService.notifyMissedOutlets
    { name: 'beats-missed-outlets', expression: '0 0 * * *', run: () => c.beatsService.notifyMissedOutlets() },
  ];
}

/** Starts every cron job. Does nothing under NODE_ENV=test. Returns a stop function. */
export function startScheduler(c: Container): () => void {
  if (process.env.NODE_ENV === 'test') return () => {};

  const tasks: ScheduledTask[] = scheduledJobs(c).map((job) => {
    let running = false;
    return cron.schedule(
      job.expression,
      async () => {
        if (running) return; // don't overlap a slow run with the next tick
        running = true;
        try {
          await job.run();
        } catch (err) {
          logger.error(`Job ${job.name} failed`, err);
        } finally {
          running = false;
        }
      },
      { timezone: TIMEZONE, name: job.name },
    );
  });

  logger.log(`Scheduled ${tasks.length} jobs (${TIMEZONE})`);
  return () => tasks.forEach((t) => t.stop());
}
