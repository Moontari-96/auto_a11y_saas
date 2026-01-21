/**
 * 이 결과 타입 하나로
 * axe / lighthouse / 향후 AI 검사 결과까지 전부 통합 관리
 */

// 결과가 어디서 왔는지 구분
export type RuleSource = 'axe' | 'lighthouse'

// 모든 접근성 위반 결과의 공통 포맷
export interface RuleResult {
    // 우리 시스템의 Rule ID (예: AXE_IMAGE_ALT, LH_COLOR_CONTRAST)
    ruleId: string

    // 사용자에게 보여줄 제목
    title: string

    // 규칙 설명 (왜 문제인지)
    description: string

    // 심각도 (UI 색상 / 필터링 기준)
    severity: 'minor' | 'moderate' | 'serious' | 'critical'

    // 문제가 발생한 DOM selector
    selector?: string | null

    // axe인지 lighthouse인지 출처
    source: RuleSource

    // 자세한 설명 링크 (Deque, W3C 등)
    helpUrl?: string

    //
}
