import { Test, TestingModule } from '@nestjs/testing';
import { ScansService } from './scans.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ScanSession } from './entities/scan-session.entity';
import { A11yIssue } from './entities/a11y-issue.entity';
import { HttpService } from '@nestjs/axios';
import { DataSource } from 'typeorm';

describe('ScansService', () => {
  let service: ScansService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScansService,
        {
          provide: getRepositoryToken(ScanSession),
          useValue: {},
        },
        {
          provide: getRepositoryToken(A11yIssue),
          useValue: {},
        },
        {
          provide: HttpService,
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ScansService>(ScansService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
