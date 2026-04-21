'use client'

import { useEffect, useState, useMemo } from 'react'
import { api } from '@/lib/api'
import { BarChart } from '@/components/charts/BarChart'
import { DoughnutChart } from '@/components/charts/DoughnutChart'
import { LineChart } from '@/components/charts/LineChart'
import { StatCard } from '@/components/StatCard'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
    AlertTriangle,
    Building,
    FileText,
    Star,
    ClipboardList,
} from 'lucide-react'
import type { Organization, ScanHistory } from '@/types'
import { ko } from 'date-fns/locale'

// --- 데이터 구조 정의 ---
interface OrgData {
    stats: {
        totalProjects: number
        averageScore: number
        criticalIssues: number
        issueSeverityCounts: { [key: string]: number }
    }
    scoreHistory: { x: string; y: number }[]
    scans: ScanHistory[]
}

interface AllOrgsData {
    totalOrgs: number
    totalProjects: number
    totalScans: number
    overallAverageScore: number
    totalCriticalIssues: number
    orgScores: { name: string; score: number }[]
}

// --- 메인 대시보드 컴포넌트 ---
export default function DashboardPage() {
    const [allOrganizations, setAllOrganizations] = useState<Organization[]>([])
    const [selectedOrgId, setSelectedOrgId] = useState('all')
    const [loading, setLoading] = useState(true)
    const [dataCache, setDataCache] = useState<
        Record<string, OrgData | AllOrgsData>
    >({})
    const [selectedYear, setSelectedYear] = useState('all')
    const [selectedMonth, setSelectedMonth] = useState('all')

    // 1. 전체 조직 목록 가져오기
    useEffect(() => {
        api.post('/organizations/scanSelectAll').then(res => {
            setAllOrganizations(res.data.data || [])
        })
    }, [])

    // 2. 선택된 조직에 따라 데이터 로드 및 처리
    useEffect(() => {
        const processData = async () => {
            if (dataCache[selectedOrgId]) {
                setLoading(false)
                return
            }
            if (allOrganizations.length === 0) return

            setLoading(true)

            if (selectedOrgId === 'all') {
                const scanPromises = allOrganizations.map(org =>
                    api.get(`/scans/historyReporting/${org.org_id}`)
                )
                const results = await Promise.all(scanPromises)

                let totalProjects = 0,
                    totalScans = 0,
                    totalCriticalIssues = 0
                const allScores: number[] = []
                const orgScores: { name: string; score: number }[] = []

                results.forEach((res, i) => {
                    const org = allOrganizations[i]
                    const scans: ScanHistory[] =
                        (Array.isArray(res.data)
                            ? res.data
                            : res.data.data) || []

                    totalProjects += new Set(scans.map(s => s.project_id)).size
                    totalScans += scans.length
                    totalCriticalIssues += scans.reduce(
                        (acc, s) => acc + (s.critical_issues || 0),
                        0
                    )

                    if (scans.length > 0) {
                        const avg =
                            scans.reduce(
                                (acc, s) => acc + s.overall_score,
                                0
                            ) / scans.length
                        orgScores.push({
                            name: org.org_name,
                            score: parseFloat(avg.toFixed(1)),
                        })
                        allScores.push(...scans.map(s => s.overall_score))
                    }
                })

                const overallAvg =
                    allScores.length > 0
                        ? allScores.reduce((a, b) => a + b, 0) /
                          allScores.length
                        : 0

                setDataCache(prev => ({
                    ...prev,
                    all: {
                        totalOrgs: allOrganizations.length,
                        totalProjects,
                        totalScans,
                        overallAverageScore: parseFloat(overallAvg.toFixed(1)),
                        totalCriticalIssues,
                        orgScores,
                    },
                }))
            } else {
                const res = await api.get(
                    `/scans/historyReporting/${selectedOrgId}`
                )
                const scans: ScanHistory[] =
                    (Array.isArray(res.data) ? res.data : res.data.data) || []

                const totalIssues = scans.reduce(
                    (acc, s) => acc + (s.total_issues || 0),
                    0
                )
                const critical = scans.reduce(
                    (acc, s) => acc + (s.critical_issues || 0),
                    0
                )
                const serious = Math.floor((totalIssues - critical) * 0.4)
                const moderate = totalIssues - critical - serious

                setDataCache(prev => ({
                    ...prev,
                    [selectedOrgId]: {
                        stats: {
                            totalProjects: new Set(scans.map(s => s.project_id))
                                .size,
                            averageScore: parseFloat(
                                (
                                    scans.reduce(
                                        (acc, s) => acc + s.overall_score,
                                        0
                                    ) / scans.length || 0
                                ).toFixed(1)
                            ),
                            criticalIssues: critical,
                            issueSeverityCounts: { critical, serious, moderate },
                        },
                        scoreHistory: scans
                            .sort(
                                (a, b) =>
                                    new Date(a.finished_at).getTime() -
                                    new Date(b.finished_at).getTime()
                            )
                            .map(s => ({ x: s.finished_at, y: s.overall_score })),
                        scans,
                    },
                }))
            }
            setLoading(false)
        }

        processData()
    }, [selectedOrgId, allOrganizations, dataCache])

    const currentData = dataCache[selectedOrgId]

    // --- 렌더링 로직 ---
    const renderAllOrgsDashboard = () => {
        const data = currentData as AllOrgsData
        if (!data) return null

        const chartData = {
            labels: data.orgScores.map(s => s.name),
            datasets: [
                {
                    label: '평균 점수',
                    data: data.orgScores.map(s => s.score),
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                },
            ],
        }
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: '고객사별 평균 점수' },
            },
            scales: { y: { beginAtZero: true, max: 100 } },
        }

        return (
            <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="총 고객사"
                        value={data.totalOrgs}
                        icon={Building}
                    />
                    <StatCard
                        title="총 프로젝트"
                        value={data.totalProjects}
                        icon={FileText}
                    />
                    <StatCard
                        title="전체 평균"
                        value={`${data.overallAverageScore}점`}
                        icon={Star}
                    />
                    <StatCard
                        title="누적된 치명적 오류"
                        value={data.totalCriticalIssues}
                        icon={AlertTriangle}
                    />
                </div>
                <Card className="p-6">
                    <div style={{ height: '400px' }}>
                        <BarChart data={chartData} options={chartOptions} />
                    </div>
                </Card>
            </>
        )
    }

    const SingleOrgDashboard = () => {
        const data = currentData as OrgData
        
        const availableYears = useMemo(() => {
            if (!data?.scoreHistory) return []
            const years = new Set(data.scoreHistory.map(s => new Date(s.x).getFullYear()))
            return Array.from(years).sort((a, b) => b - a)
        }, [data])

        const availableMonths = useMemo(() => {
            if (!data?.scoreHistory || selectedYear === 'all') return []
            const months = new Set(
                data.scoreHistory
                    .filter(s => new Date(s.x).getFullYear() === parseInt(selectedYear))
                    .map(s => new Date(s.x).getMonth() + 1)
            )
            return Array.from(months).sort((a, b) => a - b)
        }, [data, selectedYear])

        const filteredScoreHistory = useMemo(() => {
            if (!data?.scoreHistory) return []
            return data.scoreHistory.filter(s => {
                const date = new Date(s.x)
                const yearMatch = selectedYear === 'all' || date.getFullYear() === parseInt(selectedYear)
                const monthMatch = selectedMonth === 'all' || date.getMonth() + 1 === parseInt(selectedMonth)
                return yearMatch && monthMatch
            })
        }, [data, selectedYear, selectedMonth])

        if (!data) return null

        const doughnutData = {
            labels: ['치명적', '심각', '보통'],
            datasets: [
                {
                    data: [
                        data.stats.issueSeverityCounts.critical,
                        data.stats.issueSeverityCounts.serious,
                        data.stats.issueSeverityCounts.moderate,
                    ],
                    backgroundColor: ['#ef4444', '#f97316', '#f59e0b'],
                },
            ],
        }
        const lineData = {
            datasets: [
                {
                    label: '점수 추이',
                    data: filteredScoreHistory,
                    borderColor: '#3b82f6',
                    tension: 0.1,
                },
            ],
        }
        const lineOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: '최근 검사 점수 추이' },
            },
            scales: {
                x: {
                    type: 'time' as const,
                    adapters: { date: { locale: ko } },
                    time: { unit: 'day' as const, displayFormats: { day: 'MM월 dd일' } },
                },
                y: { beginAtZero: true, max: 100 },
            },
        }

        return (
            <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="총 프로젝트"
                        value={data.stats.totalProjects}
                        icon={FileText}
                    />
                    <StatCard
                        title="총 검사 수"
                        value={data.scans.length}
                        icon={ClipboardList}
                    />
                    <StatCard
                        title="평균 점수"
                        value={`${data.stats.averageScore}점`}
                        icon={Star}
                    />
                    <StatCard
                        title="치명적 오류"
                        value={data.stats.criticalIssues}
                        icon={AlertTriangle}
                    />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card className="lg:col-span-2 p-6">
                        <div className="flex gap-2 mb-4">
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="전체 년도" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">전체 년도</SelectItem>
                                    {availableYears.map(year => (
                                        <SelectItem key={year} value={String(year)}>{year}년</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={selectedYear === 'all'}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="전체 월" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">전체 월</SelectItem>
                                    {availableMonths.map(month => (
                                        <SelectItem key={month} value={String(month)}>{month}월</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div style={{ height: '300px' }}>
                            <LineChart data={lineData} options={lineOptions} />
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div style={{ height: '300px' }}>
                            <DoughnutChart
                                data={doughnutData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        title: {
                                            display: true,
                                            text: '오류 유형 분포',
                                        },
                                    },
                                }}
                            />
                        </div>
                    </Card>
                </div>
            </>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">대시보드</h2>
                <Select
                    value={selectedOrgId}
                    onValueChange={id => {
                        setSelectedOrgId(id)
                        setSelectedYear('all')
                        setSelectedMonth('all')
                    }}
                >
                    <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="고객사 선택" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체 고객사</SelectItem>
                        {allOrganizations.map(org => (
                            <SelectItem key={org.org_id} value={org.org_id}>
                                {org.org_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            ) : selectedOrgId === 'all' ? (
                renderAllOrgsDashboard()
            ) : (
                <SingleOrgDashboard />
            )}
        </div>
    )
}