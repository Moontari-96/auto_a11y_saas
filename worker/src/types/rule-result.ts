/**
 * 이 결과 타입 하나로
 * axe / lighthouse / 향후 AI 검사 결과까지 전부 통합 관리
 */

// 향후 AI 검사까지 고려하여 'ai' 추가
export type RuleSource = 'axe' | 'lighthouse' | 'ai';

export interface RuleResult {
    // 우리 시스템의 Rule ID (예: AXE_IMAGE_ALT, LH_COLOR_CONTRAST)
    ruleId: string;

    // 사용자에게 보여줄 제목
    title: string;

    // 규칙 설명 (왜 문제인지)
    description: string;

    // 심각도 (UI 색상 / 점수 감점 / 필터링 기준)
    severity: 'minor' | 'moderate' | 'serious' | 'critical';

    // 문제가 발생한 DOM selector
    selector?: string | null;

    // axe인지 lighthouse인지 출처 (DB의 engine 컬럼에 해당)
    source: RuleSource;

    // 자세한 설명 링크 (Deque, W3C 등)
    helpUrl?: string;

    // ==========================================
    // [추가된 부분] SaaS 리포트 및 DB 저장을 위한 필드
    // ==========================================

    // 위반한 실제 HTML 코드 조각 (프론트에서 "이 코드 고치세요" 하고 보여주기 위함)
    htmlSnippet?: string | null;

    // 왜 실패했는지에 대한 상세 이유 (Axe에서 제공하는 아주 유용한 텍스트)
    failureSummary?: string | null;

    // DB의 'raw_detail' (JSONB) 컬럼에 통째로 밀어넣을 원본 데이터
    rawDetail?: any;
}