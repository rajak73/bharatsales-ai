import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security & Performance
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', process.env.FRONTEND_URL || ''],
    credentials: true,
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true, // For extra strictness
    }),
  );

  // Swagger API Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('BharatSales AI API')
    .setDescription('The core backend for field sales & distribution')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const port = process.env.PORT || 6002;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 BharatSales AI API running on port ${port}`);
}
bootstrap();
