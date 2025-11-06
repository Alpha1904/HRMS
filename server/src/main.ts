import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { config } from 'dotenv';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
config();
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'public'));

  app.setGlobalPrefix('api');

  // Swagger API Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('HRMS API')
    .setDescription('API documentation for the Human Resource Management System')
    .setVersion('1.0')
    .addBearerAuth() // If you use JWTs, this adds the "Authorize" button
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Enable CORS to allow requests from different origins (e.g., your frontend)
  app.enableCors({
    origin: true, // Reflect the request origin
    credentials: true, // Allow cookies to be sent
  });

  app.useGlobalPipes(new ValidationPipe({transform: true, whitelist: true }));
  app.use(cookieParser());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
