// src/app/page.tsx
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

export default function HomePage() {
    return (
        <main className="min-h-screen flex items-center justify-center">
            <Card className="w-full max-w-xl p-10 text-center">
                <Badge variant="secondary" className="mb-4">
                    WCAG · KWCAG
                </Badge>

                <h1 className="text-4xl font-bold tracking-tight mb-4">
                    웹 접근성 자동 검사 · 관리 SaaS
                </h1>

                <p className="text-muted-foreground mb-8">
                    WCAG / KWCAG 기반 자동 검증과 AI 기반 접근성 수정 제안까지
                    한 번에
                </p>

                <div className="flex justify-center gap-4">
                    <Button size="lg" asChild>
                        <Link href="/dashboard">시작하기</Link>
                    </Button>

                    <Button size="lg" variant="outline">
                        데모 보기
                    </Button>
                </div>
            </Card>
        </main>
    )
}
