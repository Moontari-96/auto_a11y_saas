import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/projects.entity';
import { OrganizationsModule } from '@/organizations/organizations.module';
@Module({
  imports: [
    // 3. 이 모듈에서 Project 엔티티를 Repository로 사용하겠다고 등록!
    TypeOrmModule.forFeature([Project]),
    OrganizationsModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
