'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api' // API 유틸리티 추가
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    ExternalLink,
    AlertOctagon,
    AlertTriangle,
    Info,
    CheckCircle2,
    LucideIcon,
} from 'lucide-react'
import type {
    Severity,
    A11yIssue,
    ScanDetail,
    SeverityConfigProps,
} from '@/types'

// --- 타입 정의 ---

const severityConfig: Record<Severity, SeverityConfigProps> = {
    critical: {
        label: '치명적',
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: AlertOctagon,
    },
    serious: {
        label: '심각함',
        color: 'bg-orange-100 text-orange-700 border-orange-200',
        icon: AlertTriangle,
    },
    moderate: {
        label: '보통',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: Info,
    },
    minor: {
        label: '경미함',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: CheckCircle2,
    },
}

function ReportDetailContent() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const scanId = params.scan_id as string

    const activeFilter = (searchParams.get('filter') as Severity | 'all') || 'all'

    const [detail, setDetail] = useState<ScanDetail | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                setLoading(true)
                const res = await api.get(`/scans/getReportDetail/${scanId}`)

                if (res.data.success) {
                    setDetail(res.data.data)
                } else {
                    setDetail(res.data)
                }
            } catch (error) {
                console.error('[Fetch Report Detail Error]', error)
                alert('리포트 데이터를 불러오는 데 실패했습니다.')
                router.back()
            } finally {
                setLoading(false)
            }
        }

        if (scanId) {
            fetchDetail()
        }
    }, [scanId, router])

    const filteredIssues = useMemo(() => {
        if (!detail) return []
        if (activeFilter === 'all') return detail.issues
        return detail.issues.filter(issue => issue.severity === activeFilter)
    }, [detail, activeFilter])

    const issueCounts = useMemo(() => {
        const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 }
        detail?.issues.forEach(issue => {
            if (counts.hasOwnProperty(issue.severity)) {
                counts[issue.severity]++
            }
        })
        return counts
    }, [detail])
    
    const handleFilterChange = (filter: Severity | 'all') => {
        const params = new URLSearchParams(searchParams.toString())
        if (filter === 'all') {
            params.delete('filter')
        } else {
            params.set('filter', filter)
        }
        router.push(`?${params.toString()}`, { scroll: false })
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium">
                        리포트 데이터를 분석하는 중입니다...
                    </p>
                </div>
            </div>
        )
    }

    if (!detail) return null

    return (
        <div className="min-h-screen bg-slate-50/50 p-8 space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <Button
                        variant="ghost"
                        className="text-slate-500 hover:text-slate-900 px-0 mb-4"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> 목록으로 돌아가기
                    </Button>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                        {detail.project_name} 리포트
                        <Badge
                            variant={
                                detail.overall_score >= 80
                                    ? 'default'
                                    : 'destructive'
                            }
                            className="text-lg px-3 py-1"
                        >
                            {detail.overall_score}점
                        </Badge>
                    </h2>
                    <p className="text-slate-500 mt-2 flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        <a
                            href={detail.target_url}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline"
                        >
                            {detail.target_url}
                        </a>
                        <span className="text-slate-300">|</span>
                        <span>
                            검사 일시:{' '}
                            {new Date(detail.finished_at).toLocaleString(
                                'ko-KR'
                            )}
                        </span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card
                    className={`bg-white border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition-colors ${
                        activeFilter === 'all' ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => handleFilterChange('all')}
                >
                    <CardContent className="p-5 flex flex-col items-center justify-center">
                        <span className="text-slate-500 text-sm font-semibold mb-1">
                            총 발견된 문제
                        </span>
                        <span className="text-3xl font-bold text-slate-800">
                            {detail.issues.length}건
                        </span>
                    </CardContent>
                </Card>

                {(
                    Object.entries(severityConfig) as [
                        Severity,
                        SeverityConfigProps,
                    ][]
                ).map(([key, config]) => {
                    const Icon = config.icon
                    const count = issueCounts[key]
                    const isActive = activeFilter === key

                    return (
                        <Card
                            key={key}
                            onClick={() => handleFilterChange(key)}
                            className={`cursor-pointer transition-all border ${
                                isActive
                                    ? `ring-2 ring-offset-1 ${config.color
                                          .split(' ')[1]
                                          .replace('text-', 'ring-')}`
                                    : 'border-slate-200 shadow-sm hover:shadow-md'
                            }`}
                        >
                            <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                                <div
                                    className={`p-2 rounded-full mb-2 ${
                                        config.color.split(' ')[0]
                                    }`}
                                >
                                    <Icon
                                        className={`w-5 h-5 ${
                                            config.color.split(' ')[1]
                                        }`}
                                    />
                                </div>
                                <span className="text-slate-600 text-sm font-semibold mb-1">
                                    {config.label}
                                </span>
                                <span className="text-2xl font-bold text-slate-800">
                                    {count}건
                                </span>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="space-y-4 pt-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    상세 위반 내역
                    <span className="text-sm font-normal text-slate-500">
                        ({filteredIssues.length}건)
                    </span>
                </h3>

                {filteredIssues.length === 0 ? (
                    <Card className="bg-slate-50 border-dashed border-slate-300">
                        <CardContent className="p-10 text-center text-slate-500">
                            해당 심각도에 해당하는 위반 사항이 없습니다. 🎉
                        </CardContent>
                    </Card>
                ) : (
                    filteredIssues.map(issue => {
                        const config = severityConfig[issue.severity]
                        const Icon = config.icon

                        return (
                            <Card
                                key={issue.issueId}
                                className="border-slate-200 shadow-sm overflow-hidden"
                            >
                                <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100 flex flex-row items-start justify-between">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className={`${config.color} border font-bold`}
                                            >
                                                <Icon className="w-3 h-3 mr-1" />{' '}
                                                {config.label}
                                            </Badge>
                                            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                                {issue.rule_id}
                                            </span>
                                        </div>
                                        <CardTitle className="text-base text-slate-800 leading-relaxed">
                                            {issue.description}
                                        </CardTitle>
                                    </div>
                                    {issue.help_url && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-blue-600 border-blue-200 shrink-0"
                                            asChild
                                        >
                                            <a
                                                href={issue.help_url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                가이드 보기{' '}
                                                <ExternalLink className="w-3 h-3 ml-1.5" />
                                            </a>
                                        </Button>
                                    )}
                                </CardHeader>
                            </Card>
                        )
                    })
                )}
            </div>
        </div>
    )
}

export default function ReportDetailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ReportDetailContent />
        </Suspense>
    )
}
