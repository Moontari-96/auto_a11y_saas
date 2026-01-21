"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runLighthouse = runLighthouse;
const lighthouse_1 = __importDefault(require("lighthouse"));
const chrome_launcher_1 = __importDefault(require("chrome-launcher"));
/**
 * Lighthouse 접근성 검사 실행
 * - 실제 Chrome 실행
 * - 렌더링 기반 검사 (명도 대비, 키보드)
 */
async function runLighthouse(url) {
    // Chrome 실행
    const chrome = await chrome_launcher_1.default.launch({
        chromeFlags: ['--headless'],
    });
    // 접근성 카테고리만 검사
    const result = await (0, lighthouse_1.default)(url, {
        port: chrome.port,
        onlyCategories: ['accessibility'],
    });
    // Chrome 종료
    await chrome.kill();
    // audit 결과만 반환
    return result?.lhr.audits;
}
//# sourceMappingURL=lighthouse-runner.js.map