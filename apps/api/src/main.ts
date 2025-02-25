import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NotFoundObfuscationFilter } from './common/filters/not-found-obfuscation.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { AppModule } from './app.module';
import { AppConfigService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new NotFoundObfuscationFilter(), new ValidationExceptionFilter());
  const config = app.get(AppConfigService);
  await app.listen(config.port);
}

bootstrap();
