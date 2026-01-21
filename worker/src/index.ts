import express from 'express'
import { runAxeScan } from './axe-runner'
import { runLighthouse } from './lighthouse-runner'
import { normalizeAxeResults } from './normalizers/axe-nomarlizer'
import { normalizeLighthouseAudits } from './normalizers/lighthouse-nomalizer'

const app = express()
app.use(express.json()) // NestJS가 보내는 JSON 데이터를 읽기 위해 필수!

// 로직을 별도 함수로 분리 (기존 main 함수 내용)
async function performScan(url: string) {
    // 1. axe 검사
    const axeResults = await runAxeScan(url)
    const axeRules = normalizeAxeResults(axeResults)

    // 2. lighthouse 검사
    const lighthouseAudits = await runLighthouse(url)
    const lighthouseRules = normalizeLighthouseAudits(lighthouseAudits)

    // 3. 결과 통합 및 반환
    return [...axeRules, ...lighthouseRules]
}

// API 엔드포인트 생성
app.post('/run-scan', async (req, res) => {
    const { targetUrl } = req.body // NestJS에서 보낸 { targetUrl: '...' }

    if (!targetUrl) {
        return res.status(400).json({ error: 'URL이 필요합니다.' })
    }

    try {
        console.log(`[Worker] 검사 시작: ${targetUrl}`)
        const finalResults = await performScan(targetUrl)

        console.log(`[Worker] 검사 완료: ${finalResults.length}개 위반 발견`)

        // NestJS 백엔드에 결과 전송
        res.json({
            success: true,
            results: finalResults,
        })
    } catch (error) {
        console.error('[Worker] 에러 발생:', error)

        // error가 Error 객체인지 확인 (타입 가드)
        if (error instanceof Error) {
            res.status(500).json({ success: false, error: error.message })
        } else {
            // Error 객체가 아닐 경우(문자열 등) 처리
            res.status(500).json({ success: false, error: String(error) })
        }
    }
})

const PORT = 4000
app.listen(PORT, () => {
    console.log(
        `Accessibility Worker Server가 ${PORT}번 포트에서 실행 중입니다.`
    )
})
