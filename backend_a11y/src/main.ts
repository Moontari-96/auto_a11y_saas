import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 글로벌 프리픽스 설정
  app.setGlobalPrefix('a11y');

  app.enableCors({
    origin: [
      'http://localhost:3000', // 로컬 개발용
      'https://auto-a11y-saas.vercel.app', // 현재 EC2 IP (프론트엔드 포트가 3000인 경우)
    ],
    credentials: true,
  });

  // Swagger 설정 시작
  const config = new DocumentBuilder()
    .setTitle('A11Y Saas Includify') // 프로젝트 네이밍 반영
    .setDescription('AI 기반 웹 접근성 솔루션 API 문서')
    .setVersion('1.0')
    .addTag('scans') // 컨트롤러 태그
    .addTag('Organization') // 컨트롤러 태그
    .addTag('Project') // 컨트롤러 태그
    .addBearerAuth() // JWT 인증이 필요할 경우 추가
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // 첫 번째 인자 'api'가 접속 경로

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
