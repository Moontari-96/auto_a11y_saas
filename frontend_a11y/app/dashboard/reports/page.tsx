'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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

// --- 인터페이스 정의 (any 제거) ---
interface Organization {
    org_id: string
    org_name: string
}

interface ProjectFilter {
    project_id: string
    project_name: string
}

interface ScanHistory {
    scan_id: string
    project_id: string
    project_name: string
    target_url: string
    overall_score: number
    finished_at: string
    status: string
    critical_issues?: number
    total_issues?: number
}

export default function ReportPage() {
    const router = useRouter()

    // 상태 관리 (정확한 타입 지정)
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [selectedOrgId, setSelectedOrgId] = useState<string>('')
    const [projects, setProjects] = useState<ProjectFilter[]>([])
    const [selectedProjectId, setSelectedProjectId] = useState<string>('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [scanHistories, setScanHistories] = useState<ScanHistory[]>([])

    // 1. 초기 로드 (고객사 목록)
    useEffect(() => {
        api.post('/organizations/scanSelectAll').then(res => {
            setOrganizations(res.data.data || [])
        })
    }, [])

    // 2. 고객사 선택 시 데이터 로드
    useEffect(() => {
        if (!selectedOrgId) return

        // 프로젝트 필터 목록 로드
        api.post(`/projects/findAllByOrg/${selectedOrgId}`).then(res => {
            setProjects(res.data.data || [])
        })

        // 중요: res.data가 아닌 res.data를 확인하여 배열을 직접 주입
        api.get(`/scans/historyReporting/${selectedOrgId}`).then(res => {
            // 서버 응답 구조가 { data: [...] } 인지 그냥 [...] 인지 확인 필요
            // 이전 답변의 서비스 로직대로면 배열이 바로 올 것이고, 공통 포맷이면 .data에 있을 것입니다.
            const data = Array.isArray(res.data) ? res.data : res.data.data;
            setScanHistories(data || [])
        })
    }, [selectedOrgId])

    // 필터링 로직 (프로젝트 선택 및 URL 검색)
    const filteredHistories = useMemo(() => {
        return scanHistories.filter(scan => {
            const matchProject = selectedProjectId === 'all' || scan.project_id === selectedProjectId
            const matchSearch = scan.target_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                scan.project_name.toLowerCase().includes(searchTerm.toLowerCase())
            return matchProject && matchSearch
        })
    }, [scanHistories, selectedProjectId, searchTerm])

    return (
        <div className="min-h-screen bg-slate-50/50 p-8 space-y-8">
            {/* Header */}
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

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4">
                <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
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

                <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={!selectedOrgId}>
                    <SelectTrigger className="w-50 bg-white border-slate-200">
                        <SelectValue placeholder="프로젝트 필터 (전체)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체 프로젝트</SelectItem>
                        {projects.map(proj => (
                            <SelectItem key={proj.project_id} value={proj.project_id}>
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
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-semibold text-slate-600">프로젝트명</TableHead>
                            <TableHead className="font-semibold text-slate-600">검사 URL</TableHead>
                            <TableHead className="font-semibold text-slate-600">검사 일시</TableHead>
                            <TableHead className="font-semibold text-slate-600 text-center">점수</TableHead>
                            <TableHead className="font-semibold text-slate-600 text-center">치명적 위반</TableHead>
                            <TableHead className="text-right font-semibold text-slate-600">액션</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredHistories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                    조회된 리포트 데이터가 없습니다.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredHistories.map(scan => (
                                <TableRow key={scan.scan_id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-medium text-slate-900">{scan.project_name}</TableCell>
                                    <TableCell className="text-slate-500 max-w-62.5 truncate" title={scan.target_url}>
                                        {scan.target_url}
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {new Date(scan.finished_at).toLocaleString('ko-KR', {
                                            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
                                        })}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={scan.overall_score >= 80 ? 'default' : 'destructive'}>
                                            {scan.overall_score}점
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {scan.critical_issues !== undefined && (
                                            <span className={`font-bold ${scan.critical_issues > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                {scan.critical_issues}건
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold"
                                            onClick={() => router.push(`/dashboard/reports/detail/${scan.scan_id}`)}
                                        >
                                            <FileText className="w-4 h-4 mr-1.5" /> 상세 보기
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