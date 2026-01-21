/**
 * 이 결과 타입 하나로
 * axe / lighthouse / 향후 AI 검사 결과까지 전부 통합 관리
 */
export type RuleSource = 'axe' | 'lighthouse';
export interface RuleResult {
    ruleId: string;
    title: string;
    description: string;
    severity: 'minor' | 'moderate' | 'serious' | 'critical';
    selector?: string | null;
    source: RuleSource;
    helpUrl?: string;
}
//# sourceMappingURL=rule-result.d.ts.map