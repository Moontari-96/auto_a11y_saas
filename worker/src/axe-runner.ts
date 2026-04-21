import puppeteer from 'puppeteer'
import { AxeResults } from './types/axe'
import koLocale from './locales/ko.json';

// runAxeScan.ts 수정본
export async function runAxeScan(url: string): Promise<AxeResults> {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
        ],
    })
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // 2. axe-core 주입
        await page.addScriptTag({ path: require.resolve('axe-core') });

        // 3. 브라우저 내 실행 옵션 강화
        const results: AxeResults = await page.evaluate(async (localeData) => {
            // @ts-ignore
            const axe = window.axe;
            
            // 한글 로케일 및 옵션 설정
            axe.configure({ locale: localeData });
            
            return await axe.run({
                runOnly: {
                    type: 'tag',
                    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] 
                    // 범위를 WCAG 2.1 레벨까지 확장
                },
                resultTypes: ['violations', 'incomplete'] // 판단 불가능한 항목도 포함하면 분석이 풍부해짐
            });
        }, koLocale);

        return results;
    } finally {
        await browser.close();
    }
}