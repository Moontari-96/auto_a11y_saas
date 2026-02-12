"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.performCrawl = performCrawl;
const express_1 = __importDefault(require("express"));
const axe_runner_1 = require("./axe-runner");
const lighthouse_runner_1 = require("./lighthouse-runner");
const axe_nomarlizer_1 = require("./normalizers/axe-nomarlizer");
const lighthouse_nomalizer_1 = require("./normalizers/lighthouse-nomalizer");
const puppeteer_1 = __importDefault(require("puppeteer"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)()); // 모든 도메인 허용 (가장 상단에 배치)
app.use((req, res, next) => {
    console.log('-----------------------------------------');
    console.log(`[접속시도] ${req.method} ${req.path}`);
    console.log('바디:', req.body);
    console.log('-----------------------------------------');
    next();
});
app.use(express_1.default.json()); // NestJS가 보내는 JSON 데이터를 읽기 위해 필수!
/**
 * 지정된 URL을 기준으로 하위 페이지 목록을 크롤링합니다.
 * @param baseUrl 크롤링을 시작할 루트 URL
 */
async function performCrawl(baseUrl) {
    console.log(`[Crawl] 작업 시작: ${baseUrl}`);
    // URL 객체를 생성하여 호스트 및 경로 분석
    const urlObj = new URL(baseUrl);
    // 파일명(예: index.html)을 제외한 디렉토리 경로 추출
    // startsWith 비교 시 정확한 범위를 지정하기 위함
    const baseDir = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
    console.log(`[Crawl] 필터링 기준 경로: ${baseDir}`);
    // Puppeteer 브라우저 인스턴스 실행
    const browser = await puppeteer_1.default.launch({
        headless: true, // 브라우저 창 없이 실행
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
        const page = await browser.newPage();
        // 네트워크 연결이 2개 이하로 남을 때까지 기다려 페이지 로딩 완결성 확보
        await page.goto(baseUrl, { waitUntil: 'networkidle2' });
        // 브라우저 컨텍스트 내부에서 자바스크립트 실행 (DOM 접근)
        const pages = await page.evaluate(dir => {
            // 모든 <a> 태그 수집
            const anchors = Array.from(document.querySelectorAll('a'));
            return anchors
                .map(a => ({
                title: a.innerText.trim() || '제목 없음', // 링크 텍스트 추출
                url: a.href, // 절대 경로 URL 추출
            }))
                .filter(item => {
                // 필터링 조건:
                // 1. 추출된 디렉토리 경로로 시작할 것 (내부 링크 확인)
                // 2. 해시(#)를 포함한 앵커 링크 제외
                // 3. 기준 디렉토리 자체이거나 index.html인 경우(자기 자신) 제외
                const isInternal = item.url.startsWith(dir) &&
                    !item.url.includes('#') &&
                    item.url !== dir &&
                    item.url !== dir + 'index.html';
                // 2. 제외할 파일 확장자 목록 (문서 파일 등)
                const excludedExtensions = [
                    '.pdf',
                    '.docx',
                    '.pptx',
                    '.xlsx',
                    '.zip',
                    '.jpg',
                    '.png',
                ];
                // 3. URL이 제외 확장자로 끝나는지 확인 (대소문자 무시)
                const isFile = excludedExtensions.some(ext => item.url.toLowerCase().endsWith(ext));
                // 내부 링크이면서 파일이 아닌 경우만 반환
                return isInternal && !isFile;
            });
        }, baseDir); // 추출한 baseDir를 브라우저 컨텍스트로 전달
        // URL을 키로 사용하여 중복된 페이지 제거
        const uniquePages = Array.from(new Map(pages.map(p => [p.url, p])).values());
        console.log(`[Crawl] 최종 결과: ${uniquePages.length}개 발견`);
        return uniquePages;
    }
    catch (error) {
        console.error('[Crawl] 에러 발생:', error);
        throw error;
    }
    finally {
        // 에러 발생 여부와 상관없이 브라우저 리소스 해제
        await browser.close();
    }
}
// 2. 크롤링 API 추가
app.post('/crawl', async (req, res) => {
    const { url } = req.body;
    if (!url)
        return res.status(400).json({ error: 'URL이 필요합니다.' });
    try {
        console.log(`[Worker] 크롤링 시작: ${url}`);
        const pages = await performCrawl(url);
        res.json({ success: true, data: pages });
    }
    catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});
// 로직을 별도 함수로 분리 (기존 main 함수 내용)
async function performScan(url) {
    // 1. axe 검사
    const axeResults = await (0, axe_runner_1.runAxeScan)(url);
    const axeRules = (0, axe_nomarlizer_1.normalizeAxeResults)(axeResults);
    // 2. lighthouse 검사
    const lighthouseAudits = await (0, lighthouse_runner_1.runLighthouse)(url);
    const lighthouseRules = (0, lighthouse_nomalizer_1.normalizeLighthouseAudits)(lighthouseAudits);
    // 3. 결과 통합 및 반환
    return [...axeRules, ...lighthouseRules];
}
// API 엔드포인트 생성
app.post('/run-scan', async (req, res) => {
    const { targetUrl } = req.body; // NestJS에서 보낸 { targetUrl: '...' }
    if (!targetUrl) {
        return res.status(400).json({ error: 'URL이 필요합니다.' });
    }
    try {
        console.log(`[Worker] 검사 시작: ${targetUrl}`);
        const finalResults = await performScan(targetUrl);
        console.log(`[Worker] 검사 완료: ${finalResults.length}개 위반 발견`);
        // NestJS 백엔드에 결과 전송
        res.json({
            success: true,
            results: finalResults,
        });
    }
    catch (error) {
        console.error('[Worker] 에러 발생:', error);
        // error가 Error 객체인지 확인 (타입 가드)
        if (error instanceof Error) {
            res.status(500).json({ success: false, error: error.message });
        }
        else {
            // Error 객체가 아닐 경우(문자열 등) 처리
            res.status(500).json({ success: false, error: String(error) });
        }
    }
});
const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Accessibility Worker Server가 ${PORT}번 포트에서 실행 중입니다.`);
});
//# sourceMappingURL=index.js.map