import puppeteer from 'puppeteer'
import { AxeResults } from './types/axe'

/**
 * axe 접근성 검사를 실제로 수행하는 함수
 * - puppeteer로 페이지 로드
 * - axe-core를 브라우저 DOM에 주입
 * - axe.run() 실행
 */
export async function runAxeScan(url: string): Promise<AxeResults> {
    // Headless Chrome 실행
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
        ],
    })

    // 새 페이지 열기
    const page = await browser.newPage()

    // 대상 URL 이동 (네트워크 안정될 때까지 대기)
    // await page.goto(url, { waitUntil: 'networkidle2' })
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/122.0.0.0 Safari/537.36'
    )

    try {
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 60000,
        })
    } catch (e) {
        await browser.close()
        throw new Error('PAGE_BLOCKED')
    }

    // axe-core 스크립트를 페이지에 주입
    await page.addScriptTag({
        path: require.resolve('axe-core'),
    })

    // 브라우저 컨텍스트에서 axe 실행
    const results: AxeResults = await page.evaluate(async () => {
        // window.axe는 타입 정의가 없으므로 ts-ignore
        // @ts-ignore
        return await window.axe.run()
    })

    // 브라우저 종료
    await browser.close()

    // axe 전체 결과 반환
    return results
}
