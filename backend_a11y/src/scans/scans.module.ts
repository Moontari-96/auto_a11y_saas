import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // 이 부분을 확인하세요!
import { ScansService } from './scans.service';
import { ScansController } from './scans.controller';

@Module({
  imports: [
    HttpModule, // <- HttpModule 추가.
  ],
  controllers: [ScansController],
  providers: [ScansService],
})
export class ScansModule {}
