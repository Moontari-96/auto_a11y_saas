import lighthouse from 'lighthouse'
import chromeLauncher from 'chrome-launcher'

/**
 * Lighthouse 접근성 검사 실행
 * - 실제 Chrome 실행
 * - 렌더링 기반 검사 (명도 대비, 키보드)
 */
export async function runLighthouse(url: string) {
    // Chrome 실행
    const chrome = await chromeLauncher.launch({
        chromeFlags: [
            '--headless',
            '--no-sandbox',           // 필수
            '--disable-setuid-sandbox', // 필수
            '--disable-gpu',
            '--disable-dev-shm-usage'  // 컨테이너 메모리 부족 방지
        ],
        // 만약 환경변수가 안 먹힐 경우를 대비해 직접 경로 지정 가능
        // chromePath: '/usr/bin/chromium-browser'
    })

    // 접근성 카테고리만 검사
    const result = await lighthouse(url, {
        port: chrome.port,
        onlyCategories: ['accessibility'],
    })

    // Chrome 종료
    await chrome.kill()

    // audit 결과만 반환
    return result?.lhr.audits
}
