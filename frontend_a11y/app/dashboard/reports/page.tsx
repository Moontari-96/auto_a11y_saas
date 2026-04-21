'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FileText, Search, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { Organization, ProjectFilter, ScanHistory } from '@/types'

// --- 인터페이스 정의 (any 제거) ---

function ReportContent() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const selectedOrgId = searchParams.get('orgId') || ''
    const selectedProjectId = searchParams.get('projectId') || 'all'
    const searchTerm = searchParams.get('q') || ''

    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [projects, setProjects] = useState<ProjectFilter[]>([])
    const [scanHistories, setScanHistories] = useState<ScanHistory[]>([])
    const [searchInput, setSearchInput] = useState(searchTerm)

    useEffect(() => {
        api.post('/organizations/scanSelectAll').then(res => {
            setOrganizations(res.data.data || [])
        })
    }, [])

    useEffect(() => {
        if (!selectedOrgId) {
            setProjects([])
            setScanHistories([])
            return
        }

        api.post(`/projects/findAllByOrg/${selectedOrgId}`).then(res => {
            setProjects(res.data.data || [])
        })

        api.get(`/scans/historyReporting/${selectedOrgId}`).then(res => {
            const data = Array.isArray(res.data) ? res.data : res.data.data
            setScanHistories(data || [])
        })
    }, [selectedOrgId])

    const filteredHistories = useMemo(() => {
        return scanHistories.filter(scan => {
            const matchProject =
                selectedProjectId === 'all' ||
                scan.project_id === selectedProjectId
            const matchSearch =
                scan.target_url
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                scan.project_name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
            return matchProject && matchSearch
        })
    }, [scanHistories, selectedProjectId, searchTerm])

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set(key, value)
        if (key === 'orgId') {
            params.delete('projectId')
        }
        router.push(`${pathname}?${params.toString()}`)
    }
    
    const handleSearch = () => {
        handleFilterChange('q', searchInput)
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-8 space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        통합 리포트
                    </h2>
                    <p className="text-slate-500 mt-1">
                        완료된 접근성 검사 결과를 조회하고 상세 내역을 분석합니다.
                    </p>
                </div>
                <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" /> CSV 내보내기
                </Button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4">
                <Select
                    value={selectedOrgId}
                    onValueChange={value => handleFilterChange('orgId', value)}
                >
                    <SelectTrigger className="w-50 bg-white border-slate-200">
                        <SelectValue placeholder="고객사 선택" />
                    </SelectTrigger>
                    <SelectContent>
                        {organizations.map(org => (
                            <SelectItem key={org.org_id} value={org.org_id}>
                                {org.org_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={selectedProjectId}
                    onValueChange={value => handleFilterChange('projectId', value)}
                    disabled={!selectedOrgId}
                >
                    <SelectTrigger className="w-50 bg-white border-slate-200">
                        <SelectValue placeholder="프로젝트 필터 (전체)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체 프로젝트</SelectItem>
                        {projects.map(proj => (
                            <SelectItem
                                key={proj.project_id}
                                value={proj.project_id}
                            >
                                {proj.project_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="relative flex-1 min-w-62.5">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="URL 또는 프로젝트 검색..."
                        className="pl-9 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-blue-500"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                 <Button onClick={handleSearch}>검색</Button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-semibold text-slate-600">
                                프로젝트명
                            </TableHead>
                            <TableHead className="font-semibold text-slate-600">
                                검사 URL
                            </TableHead>
                            <TableHead className="font-semibold text-slate-600">
                                검사 일시
                            </TableHead>
                            <TableHead className="font-semibold text-slate-600 text-center">
                                점수
                            </TableHead>
                            <TableHead className="font-semibold text-slate-600 text-center">
                                치명적 위반
                            </TableHead>
                            <TableHead className="text-right font-semibold text-slate-600">
                                액션
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredHistories.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="h-32 text-center text-slate-500"
                                >
                                    조회된 리포트 데이터가 없습니다.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredHistories.map(scan => (
                                <TableRow
                                    key={scan.scan_id}
                                    className="hover:bg-slate-50/50 transition-colors"
                                >
                                    <TableCell className="font-medium text-slate-900">
                                        {scan.project_name}
                                    </TableCell>
                                    <TableCell
                                        className="text-slate-500 max-w-62.5 truncate"
                                        title={scan.target_url}
                                    >
                                        {scan.target_url}
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {new Date(
                                            scan.finished_at
                                        ).toLocaleString('ko-KR', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: false,
                                        })}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant={
                                                scan.overall_score >= 80
                                                    ? 'default'
                                                    : 'destructive'
                                            }
                                        >
                                            {scan.overall_score}점
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {scan.critical_issues !==
                                            undefined && (
                                            <span
                                                className={`font-bold ${
                                                    scan.critical_issues > 0
                                                        ? 'text-red-600'
                                                        : 'text-emerald-600'
                                                }`}
                                            >
                                                {scan.critical_issues}건
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold"
                                            onClick={() =>
                                                router.push(
                                                    `/dashboard/reports/detail/${scan.scan_id}`
                                                )
                                            }
                                        >
                                            <FileText className="w-4 h-4 mr-1.5" />{' '}
                                            상세 보기
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export default function ReportPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ReportContent />
        </Suspense>
    )
}
