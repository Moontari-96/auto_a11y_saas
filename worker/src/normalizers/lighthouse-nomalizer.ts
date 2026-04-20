import { RuleResult } from '../types/rule-result'

export function normalizeLighthouseAudits(audits?: Record<string, any>): RuleResult[] {
    if (!audits) return [];

    const results: RuleResult[] = [];

    const targetAudits = [
        'color-contrast',
        'keyboard',
        'focus-visible',
        'logical-tab-order',
        'link-name',
        'heading-order',
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