/**
 * Lighthouse 접근성 검사 실행
 * - 실제 Chrome 실행
 * - 렌더링 기반 검사 (명도 대비, 키보드)
 */
export declare function runLighthouse(url: string): Promise<Record<string, import("lighthouse/types/lhr/audit-result").Result> | undefined>;
//# sourceMappingURL=lighthouse-runner.d.ts.map