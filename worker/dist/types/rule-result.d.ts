/**
 * 이 결과 타입 하나로
 * axe / lighthouse / 향후 AI 검사 결과까지 전부 통합 관리
 */
export type RuleSource = 'axe' | 'lighthouse' | 'ai';
export interface RuleResult {
    ruleId: string;
    title: string;
    description: string;
    severity: 'minor' | 'moderate' | 'serious' | 'critical';
    selector?: string | null;
    source: RuleSource;
    helpUrl?: string;
    htmlSnippet?: string | null;
    failureSummary?: string | null;
    rawDetail?: any;
}
//# sourceMappingURL=rule-result.d.ts.map