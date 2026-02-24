'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Search, PlayCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { ProjectCard } from '@/components/ProjectCard'
import { ScanStatus } from '@/components/StatusIndicator'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination'

interface Project {
    project_id: string
    project_name: string
    target_url: string
    status: ScanStatus
}

export default function ScanPage() {
    const [organizations, setOrganizations] = useState<any[]>([])
    const [selectedOrgId, setSelectedOrgId] = useState<string>('')
    const [projects, setProjects] = useState<Project[]>([])
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])

    // 검색 및 페이지네이션 상태
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 8

    // 폴링 타이머 관리용 레퍼런스
    const pollingTimers = useRef<{ [key: string]: NodeJS.Timeout }>({})

    // 초기 데이터 로드 (고객사 목록)
    useEffect(() => {
        api.post('/organizations/scanSelectAll').then(res => {
            setOrganizations(res.data.data || [])
        })

        // 언마운트 시 모든 타이머 제거
        return () => {
            Object.values(pollingTimers.current).forEach(clearInterval)
        }
    }, [])

    // 고객사 선택 시 프로젝트 로드
    useEffect(() => {
        if (!selectedOrgId) return
        api.post(`/projects/findAllByOrg/${selectedOrgId}`).then(res => {
            setProjects(
                (res.data.data || []).map((p: any) => ({
                    ...p,
                    status: 'idle',
                }))
            )
            setSelectedProjectIds([])
            setCurrentPage(1)
        })
    }, [selectedOrgId])

    // 검색 필터링
    const filteredProjects = useMemo(() => {
        return projects.filter(
            p =>
                p.project_name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                p.target_url.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [projects, searchTerm])

    // 페이지네이션 계산
    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)
    const currentProjects = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return filteredProjects.slice(start, start + itemsPerPage)
    }, [filteredProjects, currentPage])

    const isAllSelected =
        currentProjects.length > 0 &&
        currentProjects.every(p => selectedProjectIds.includes(p.project_id))

    // --- 비즈니스 로직 함수들 ---

    const goToPage = (page: number) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleSelectAll = (checked: boolean) => {
        const currentPageIds = currentProjects.map(p => p.project_id)
        if (checked) {
            setSelectedProjectIds(prev =>
                Array.from(new Set([...prev, ...currentPageIds]))
            )
        } else {
            setSelectedProjectIds(prev =>
                prev.filter(id => !currentPageIds.includes(id))
            )
        }
    }

    const updateProjectStatus = (projectId: string, status: ScanStatus) => {
        setProjects(prev =>
            prev.map(p => (p.project_id === projectId ? { ...p, status } : p))
        )
    }

    const startPolling = (scanId: string, projectId: string) => {
        if (pollingTimers.current[scanId]) return

        const timer = setInterval(async () => {
            try {
                const res = await api.get(`/scans/${scanId}`)
                const currentStatus = res.data.status as ScanStatus

                updateProjectStatus(projectId, currentStatus)

                if (
                    currentStatus === 'COMPLETED' ||
                    currentStatus === 'FAILED'
                ) {
                    clearInterval(timer)
                    delete pollingTimers.current[scanId]
                }
            } catch (error) {
                updateProjectStatus(projectId, 'FAILED')
                clearInterval(timer)
                delete pollingTimers.current[scanId]
            }
        }, 2000)

        pollingTimers.current[scanId] = timer
    }

    const executeScan = async (targetProjects: Project[]) => {
        if (targetProjects.length === 0) return

        const targetIds = targetProjects.map(p => p.project_id)
        setProjects(prev =>
            prev.map(p =>
                targetIds.includes(p.project_id)
                    ? { ...p, status: 'PROGRESS' } // 'QUEUED' 대신 'PROGRESS'
                    : p
            )
        )

        try {
            const res = await api.post('/scans/run', {
                orgId: selectedOrgId,
                targets: targetProjects.map(p => ({
                    projectId: p.project_id,
                    url: p.target_url,
                })),
            })

            if (res.data.success) {
                res.data.scans.forEach((item: any) => {
                    startPolling(item.scanId, item.projectId)
                })
            }
        } catch (error) {
            setProjects(prev =>
                prev.map(p =>
                    targetIds.includes(p.project_id)
                        ? { ...p, status: 'FAILED' }
                        : p
                )
            )
        }
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-8 space-y-8">
            {/* 1. Header */}
            <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                    접근성 검사 센터
                </h2>
                <p className="text-slate-500 mt-1">
                    프로젝트별 웹 접근성 준수 여부를 실시간으로 진단합니다.
                </p>
            </div>

            {/* 2. Control Bar */}
            <div className="bg-white/80 backdrop-blur-md sticky top-4 z-10 p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Select
                        value={selectedOrgId}
                        onValueChange={setSelectedOrgId}
                    >
                        <SelectTrigger className="w-[180px] bg-white border-slate-200">
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

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="프로젝트 이름 또는 URL 검색..."
                            className="pl-9 w-[320px] bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-blue-500"
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1)
                            }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                        <Checkbox
                            id="all-select"
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                        />
                        <label
                            htmlFor="all-select"
                            className="text-xs font-semibold text-slate-600 cursor-pointer select-none"
                        >
                            현재 페이지 전체 선택
                        </label>
                    </div>
                    <Button
                        disabled={selectedProjectIds.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-md shadow-blue-200"
                        onClick={() =>
                            executeScan(
                                projects.filter(p =>
                                    selectedProjectIds.includes(p.project_id)
                                )
                            )
                        }
                    >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        종합 검사 실행 ({selectedProjectIds.length})
                    </Button>
                </div>
            </div>

            {/* 3. Card Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-h-[400px]">
                {currentProjects.map(project => (
                    <ProjectCard
                        key={project.project_id}
                        project={project}
                        isSelected={selectedProjectIds.includes(
                            project.project_id
                        )}
                        onSelect={checked => {
                            setSelectedProjectIds(prev =>
                                checked
                                    ? [...prev, project.project_id]
                                    : prev.filter(
                                          id => id !== project.project_id
                                      )
                            )
                        }}
                        onExecute={() => executeScan([project])}
                    />
                ))}
            </div>

            {/* 4. Pagination */}
            {totalPages > 0 && (
                <div className="flex flex-col items-center gap-4 py-10">
                    <Pagination>
                        <PaginationContent>
                            {/* 이전 버튼 */}
                            <PaginationItem>
                                <Button
                                    variant="ghost"
                                    className="gap-1 pl-2.5"
                                    disabled={currentPage <= 1}
                                    onClick={() => goToPage(currentPage - 1)}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span>이전</span>
                                </Button>
                            </PaginationItem>

                            {/* 페이지 번호 루프 */}
                            {[...Array(Math.max(1, totalPages))].map((_, i) => (
                                <PaginationItem
                                    key={i}
                                    className="cursor-pointer"
                                >
                                    <PaginationLink
                                        isActive={currentPage === i + 1}
                                        onClick={() => goToPage(i + 1)}
                                    >
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}

                            {/* 다음 버튼 */}
                            <PaginationItem>
                                <Button
                                    variant="ghost"
                                    className="gap-1 pr-2.5"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => goToPage(currentPage + 1)}
                                >
                                    <span>다음</span>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    )
}
