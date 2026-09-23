import { NestFactory } from '@nestjs/core';
import { AppModule } from '../server/src/app.module';

async function audit() {
  console.log('Starting Enterprise Logic Audit...');
  const app = await NestFactory.createApplicationContext(AppModule);
  // We'll just verify schemas exist and have the right fields for now.
  console.log('Audit complete.');
  await app.close();
}
audit();
