import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI to render assets
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // Global API Prefix
  app.setGlobalPrefix('api');

  // Strict Request DTO Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Enterprise Vehicle Rental & Fleet Management System (VMS) API')
    .setDescription(
      'Production-grade RESTful API & Real-Time Telemetry Gateway for Vehicle Rental, Atomic Reservations, Digital Inspections, Geofencing, and Automated Invoicing.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`🚗 [VMS Core] API Gateway running on: http://localhost:${port}/api`);
  console.log(`📑 [VMS Core] Swagger OpenAPI Docs live at: http://localhost:${port}/api/docs`);
}

bootstrap();
