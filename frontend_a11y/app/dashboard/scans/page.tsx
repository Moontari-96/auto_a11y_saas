'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

type ScanStatus = 'idle' | 'queued' | 'running' | 'done' | 'failed'

export default function ScanPage() {
    const [url, setUrl] = useState('')
    const [scanId, setScanId] = useState<string | null>(null)
    const [status, setStatus] = useState<ScanStatus>('idle')

    // 검사 요청
    const startScan = async () => {
        try {
            setStatus('queued')
            console.log(url)
            const res = await api.post('/scans', {
                url,
            })
            setScanId(res.data.scanId)
        } catch (e) {
            setStatus('failed')
        }
    }

    // 상태 polling
    useEffect(() => {
        if (!scanId) return

        const timer = setInterval(async () => {
            try {
                const res = await api.get(`/scans/${scanId}`)
                setStatus(res.data.status)

                if (
                    res.data.status === 'done' ||
                    res.data.status === 'failed'
                ) {
                    clearInterval(timer)
                }
            } catch (e) {
                setStatus('failed')
                clearInterval(timer)
            }
        }, 2000)

        return () => clearInterval(timer)
    }, [scanId])

    return (
        <div className="max-w-xl space-y-6">
            <h2 className="text-2xl font-bold">접근성 검사</h2>

            <Card className="p-6 space-y-4">
                <Input
                    placeholder="https://example.com"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                />

                <Button
                    onClick={startScan}
                    disabled={
                        !url || status === 'queued' || status === 'running'
                    }
                >
                    검사 실행
                </Button>

                {status === 'queued' && (
                    <Badge variant="secondary">대기 중...</Badge>
                )}

                {status === 'running' && (
                    <Badge variant="secondary">검사 중...</Badge>
                )}

                {status === 'done' && (
                    <Badge variant="default">검사 완료</Badge>
                )}

                {status === 'failed' && (
                    <Badge variant="destructive">검사 실패</Badge>
                )}
            </Card>
        </div>
    )
}
