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
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // This is useful for development to see the full error messages.
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Enable CORS to allow requests from different origins (e.g., your frontend)
  app.enableCors({
    origin: (origin, callback) => {
      // Allow any origin, or specify allowed origins
      callback(null, true);
    },
      credentials: true, // CRITICAL: Allow cookies/credentials
      optionsSuccessStatus: 200, // For legacy browsers
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // Register cookie parser middleware BEFORE global pipes
  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({transform: true, whitelist: true }));

  // Serve static files from the 'public' directory.
  // This setup tries the project root first, then the dist folder.
  const publicPath = join(__dirname, '..', '..', 'public');
  app.useStaticAssets(publicPath, { prefix: '/public' });

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
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
