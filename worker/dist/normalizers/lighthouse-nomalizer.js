"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeLighthouseAudits = normalizeLighthouseAudits;
function normalizeLighthouseAudits(audits) {
    if (!audits)
        return [];
    const results = [];
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
        if (!audit)
            continue;
        // score === 1 → 통과 → 제외
        if (audit.score === 1)
            continue;
        // Lighthouse는 selector가 없어도 "실패" 자체가 중요
        results.push({
            ruleId: `LH_${id.toUpperCase().replace(/-/g, '_')}`,
            title: audit.title,
            description: audit.explanation || audit.description || '접근성 기준 미충족',
            selector: null,
            severity: 'serious',
            source: 'lighthouse',
            helpUrl: audit.helpUrl,
        });
    }
    return results;
}
//# sourceMappingURL=lighthouse-nomalizer.js.map