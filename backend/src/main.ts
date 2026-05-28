import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const corsOrigins = (process.env.CORS_ORIGINS ?? '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: corsOrigins.length === 1 && corsOrigins[0] === '*' ? true : corsOrigins,
    },
  });

  app.setGlobalPrefix('api', {
    // Static /api/uploads/* is served by useStaticAssets below — exclude it
    // from the controller-routing prefix so it doesn't double-mount.
    exclude: [],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  const uploadDir = resolve(process.env.UPLOAD_DIR ?? './uploads');
  app.useStaticAssets(uploadDir, { prefix: '/api/uploads/' });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(
    `Inno backend listening on http://localhost:${port}/api (uploads → ${uploadDir})`,
    'Bootstrap',
  );
}

void bootstrap();
