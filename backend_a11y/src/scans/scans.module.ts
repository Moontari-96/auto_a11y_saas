// src/scans/scans.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ScansService } from './scans.service';
import { ScansController } from './scans.controller';
import { ScanSession } from './entities/scan-session.entity';
import { A11yIssue } from './entities/a11y-issue.entity';

@Module({
  imports: [
    // 1. HttpService를 위해 HttpModule이 필요합니다.
    HttpModule,
    // 2. ScanSession 레포지토리를 위해 반드시 추가해야 합니다.
    // 만약 A11yIssue도 서비스에서 쓰실 거라면 같이 넣어주세요.
    TypeOrmModule.forFeature([ScanSession, A11yIssue]),
  ],
  controllers: [ScansController],
  providers: [ScansService],
  exports: [ScansService], // 다른 모듈에서 사용한다면 export
})
export class ScansModule {}
