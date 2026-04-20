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
    // URL 객체를 생성 (자동으로 프로토콜, 호스트 등을 파싱해 줌)
    const urlObj = new URL(baseUrl);
    // 슬래시(/) 유무에 상관없이 "https://ifcommunity.co.kr" 같은 도메인 루트(Origin)만 추출
    const baseOrigin = urlObj.origin;
    console.log(`[Crawl] 필터링 기준 경로(Origin): ${baseOrigin}`);
    const browser = await puppeteer_1.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
        const page = await browser.newPage();
        await page.goto(baseUrl, { waitUntil: 'networkidle2' });
        const pages = await page.evaluate(({ origin, originalUrl }) => {
            const anchors = Array.from(document.querySelectorAll('a'));
            return anchors
                .map(a => {
                // 1. 화면에 보이는 텍스트 추출
                let titleText = a.innerText.trim();
                // 2. 텍스트가 없다면 접근성/대체 텍스트 속성 확인 (aria-label, title)
                if (!titleText) {
                    titleText = a.getAttribute('aria-label') || a.getAttribute('title') || '';
                }
                // 3. 그래도 없다면 a 태그 내부의 img 태그 alt 속성 확인 (로고 이미지 등)
                if (!titleText) {
                    const img = a.querySelector('img');
                    if (img) {
                        titleText = img.getAttribute('alt') || '';
                    }
                }
                titleText = titleText.trim();
                // 4. 모든 시도에도 불구하고 빈 값일 때의 처리
                if (!titleText) {
                    // URL이 메인(루트) 경로와 일치하면 '메인페이지'로 명명
                    if (a.href === origin || a.href === origin + '/') {
                        titleText = '메인페이지';
                    }
                    else {
                        // 일반 내부 링크인데 텍스트가 없는 경우
                        titleText = '제목 없음';
                    }
                }
                return {
                    title: titleText,
                    url: a.href,
                };
            })
                .filter(item => {
                // 필터링 조건:
                // 1. 같은 도메인(origin)으로 시작할 것 (완벽한 내부 링크 판별)
                // 2. 해시(#)를 포함한 앵커 링크 제외
                // 3. 최초 요청한 원본 URL(자기 자신) 제외
                // 4. 원본 URL에 '/'가 붙은 형태의 자기 자신도 혹시 모르니 제외
                const isInternal = item.url.startsWith(origin) &&
                    !item.url.includes('#');
                // item.url !== originalUrl &&
                // item.url !== originalUrl + '/';
                const excludedExtensions = [
                    '.pdf',
                    '.docx',
                    '.pptx',
                    '.xlsx',
                    '.zip',
                    '.jpg',
                    '.png',
                ];
                const isFile = excludedExtensions.some(ext => item.url.toLowerCase().endsWith(ext));
                return isInternal && !isFile;
            });
        }, { origin: baseOrigin, originalUrl: baseUrl }); // baseOrigin 전달
        const uniquePages = Array.from(new Map(pages.map(p => [p.url, p])).values());
        console.log(`[Crawl] 최종 결과: ${uniquePages.length}개 발견`);
        return uniquePages;
    }
    catch (error) {
        console.error('[Crawl] 에러 발생:', error);
        throw error;
    }
    finally {
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