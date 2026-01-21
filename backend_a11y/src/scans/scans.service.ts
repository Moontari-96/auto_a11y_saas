import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
@Injectable()
export class ScansService {
  constructor(private readonly httpService: HttpService) {}

  async requestScanToWorker(url: string) {
    const workerUrl = 'http://localhost:4000/run-scan';
    // const workerUrl = 'http://외부-노드-서버-IP:포트/run-scan';

    // 외부 서버로 데이터 전달
    const response = await firstValueFrom(
      this.httpService.post(workerUrl, { targetUrl: url }),
    );
    console.log(response);
    return response.data; // 외부 서버에서 준 응답 (ex: { jobStarted: true })
  }
}
