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
                // axe rule id를 우리 시스템 ID로 변환 (ex: color-contrast -> AXE_COLOR_CONTRAST)
                ruleId: `AXE_${violation.id.toUpperCase().replace(/-/g, '_')}`,
                // axe가 제공하는 도움말 제목
                title: violation.help,
                // 규칙 설명
                description: violation.description,
                // axe impact → severity (any 제거, 안전한 타입 캐스팅)
                severity: violation.impact || 'moderate',
                // 문제가 발생한 DOM selector (배열을 띄어쓰기로 연결)
                selector: node.target && node.target.length > 0 ? node.target.join(' ') : null,
                // 출처 표시
                source: 'axe',
                // axe 공식 문서 링크
                helpUrl: violation.helpUrl,
                // ==========================================
                // [추가된 부분] SaaS 리포트용 상세 데이터
                // ==========================================
                // 실제 위반한 HTML 소스 코드
                htmlSnippet: node.html || null,
                // 위반한 구체적인 이유 요약
                failureSummary: node.failureSummary || null,
                // DB에 통째로 넣기 위한 원본 데이터 보존
                rawDetail: node,
            });
        });
    });
    return output;
}
//# sourceMappingURL=axe-nomarlizer.js.map