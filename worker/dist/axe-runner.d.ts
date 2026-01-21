import { AxeResults } from './types/axe';
/**
 * axe 접근성 검사를 실제로 수행하는 함수
 * - puppeteer로 페이지 로드
 * - axe-core를 브라우저 DOM에 주입
 * - axe.run() 실행
 */
export declare function runAxeScan(url: string): Promise<AxeResults>;
//# sourceMappingURL=axe-runner.d.ts.map