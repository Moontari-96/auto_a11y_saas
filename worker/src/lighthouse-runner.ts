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
        chromeFlags: ['--headless'],
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
