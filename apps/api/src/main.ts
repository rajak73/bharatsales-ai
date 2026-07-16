import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', process.env.FRONTEND_URL || ''],
    credentials: true,
  });
  
  const port = process.env.PORT || 6002;
  await app.listen(port);
  console.log(`🚀 BharatSales AI API running on port ${port}`);
}
bootstrap();
