import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger 세팅
  const config = new DocumentBuilder()
      .setTitle('iAi API Docs')
      .setDescription('iAi 서비스 백엔드 API 문서')
      .setVersion('1.0.0')
      .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
