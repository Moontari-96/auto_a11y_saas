import { RuleResult } from '../types/rule-result'

export function normalizeLighthouseAudits(audits?: Record<string, any>): RuleResult[] {
    if (!audits) return [];

    const results: RuleResult[] = [];

    const targetAudits = [
        // 기존 항목 유지 및 유효하지 않은 항목 제거
        'color-contrast',
        'link-name',
        'heading-order',
        'logical-tab-order',
        'document-title', // 문서 제목
        'html-has-lang', // HTML lang 속성

        // 이미지 및 미디어
        'image-alt',
        'input-image-alt',
        'object-alt',
        'video-caption',

        // ARIA 속성 관련
        'aria-allowed-attr',
        'aria-command-name',
        'aria-hidden-body',
        'aria-hidden-focus',
        'aria-input-field-name',
        'aria-meter-name',
        'aria-progressbar-name',
        'aria-required-attr',
        'aria-required-children',
        'aria-required-parent',
        'aria-roles',
        'aria-toggle-field-name',
        'aria-tooltip-name',
        'aria-valid-attr-value',
        'aria-valid-attr',

        // 상호작용 및 네비게이션
        'accesskeys',
        'button-name',
        'bypass',
        'frame-title',
        'label',
        'form-field-multiple-labels',

        // 테이블 및 목록
        'td-headers-attr',
        'th-has-data-cells',
        'list',
        'listitem',
        'definition-list',
        'dlitem',

        // 기타 중요 항목
        'meta-viewport',
        'duplicate-id-active',
        'duplicate-id-aria',
    ];

    for (const id of targetAudits) {
        const audit = audits[id];
        // 존재하지 않거나, 통과(score === 1)했거나, 검사 불가(null)인 경우 제외
        if (!audit || audit.score === 1 || audit.score === null) continue;

        const baseResult = {
            // 수정된 부분: engine 대신 source 사용!
            source: 'lighthouse' as const,
            ruleId: `LH_${id.toUpperCase().replace(/-/g, '_')}`,
            title: audit.title,
            description: audit.explanation || audit.description || '접근성 기준 미충족',
            severity: 'serious' as const, // Lighthouse는 기본 serious로 매핑
            helpUrl: audit.helpUrl || undefined, // null 대신 undefined로 변경 (RuleResult 타입에 맞춤)
        };

        // Lighthouse가 위반 요소를 디테일하게 배열로 제공하는지 확인
        if (audit.details && audit.details.items && audit.details.items.length > 0) {
            audit.details.items.forEach((item: any) => {
                results.push({
                    ...baseResult,
                    // node.selector와 node.snippet 추출
                    selector: item.node?.selector || null,
                    htmlSnippet: item.node?.snippet || null,
                    rawDetail: item,
                });
            });
        } else {
            // 특정 요소가 아닌 페이지 전체 레벨의 위반 (예: logical-tab-order)
            results.push({
                ...baseResult,
                selector: null,
                htmlSnippet: null,
                rawDetail: audit,
            });
        }
    }

    return results;
}