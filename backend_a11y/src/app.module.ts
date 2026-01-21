import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReportsModule } from './reports/reports.module';
import { ResultsModule } from './results/results.module';
import { RulesModule } from './rules/rules.module';
import { ScansModule } from './scans/scans.module';
import { ProjectsModule } from './projects/projects.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    TenantsModule,
    ProjectsModule,
    ScansModule,
    RulesModule,
    ResultsModule,
    ReportsModule,
    OrganizationsModule,

    // 1. ConfigModule 설정 (최상단에 위치)
    ConfigModule.forRoot({
      isGlobal: true, // 모든 모듈에서 별도 import 없이 사용 가능
      envFilePath: '.env',
    }),

    // 2. 비동기 방식으로 TypeORM 설정 (ConfigService 주입)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // 개발 중에만 true
        logging: true, // SQL 쿼리가 터미널에 찍혀서 디버깅에 좋음
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
