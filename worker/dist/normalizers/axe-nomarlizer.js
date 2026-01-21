"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeAxeResults = normalizeAxeResults;
/**
 * axe 결과(JSON)를
 * 우리 시스템에서 쓰는 RuleResult 배열로 변환
 */
function normalizeAxeResults(results) {
    const output = [];
    // axe가 발견한 모든 violation 순회
    results.violations.forEach(violation => {
        // 하나의 violation에 여러 DOM node가 있을 수 있음
        violation.nodes.forEach(node => {
            output.push({
                // axe rule id를 우리 시스템 ID로 변환
                ruleId: `AXE_${violation.id.toUpperCase()}`,
                // axe가 제공하는 도움말 제목
                title: violation.help,
                // 규칙 설명
                description: violation.description,
                // axe impact → severity
                severity: (violation.impact ?? 'moderate'),
                // 문제가 발생한 DOM selector
                selector: node.target.join(' '),
                // 출처 표시
                source: 'axe',
                // axe 공식 문서 링크
                helpUrl: violation.helpUrl,
            });
        });
    });
    return output;
}
//# sourceMappingURL=axe-nomarlizer.js.map