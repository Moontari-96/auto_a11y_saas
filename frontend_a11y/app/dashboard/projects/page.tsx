'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import {
    Plus,
    Globe,
    Building,
    ChevronLeft,
    ChevronRight,
    Search,
    FolderKanban,
} from 'lucide-react'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination'
import { Input } from '@/components/ui/input'

export default function ProjectsPage() {
    const [projects, setProjects] = useState([])
    const itemsPerPage = 5 // 한 페이지에 5개씩
    const [meta, setMeta] = useState({ total: 0, page: 1, last_page: 0 })
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [searchTerm, setSearchTerm] = useState('')

    const fetchOrgs = useCallback(async (page: number, keyword: string) => {
        try {
            setLoading(true)
            // GET 방식으로 변경 (쿼리 파라미터 전달)
            const res = await api.post('/projects/projectsAll', {
                page: page,
                limit: itemsPerPage, // 5개 고정
                keyword: keyword,
            })
            setProjects(res.data.data) // 데이터 리스트
            setMeta(res.data.meta) // 페이징 정보
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [])

    // 페이지가 바뀌거나 초기 로딩 시 실행
    useEffect(() => {
        fetchOrgs(currentPage, '')
    }, [currentPage, fetchOrgs])

    // 검색 실행 함수
    const handleSearch = () => {
        setCurrentPage(1) // 검색 시에는 다시 1페이지부터
        fetchOrgs(1, searchTerm)
    }
    // 엔터키 지원
    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch()
    }

    // 페이지네이션 계산 로직

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">프로젝트 목록</h2>
                    <p className="text-sm text-slate-500">
                        총 {projects?.length}개의 프로젝트가 있습니다.
                    </p>
                </div>
                <Button asChild className="gap-2">
                    <Link href="/dashboard/projects/detail/new">
                        <Plus className="w-4 h-4" /> 새 프로젝트
                    </Link>
                </Button>
            </div>

            {/* 프로젝트 리스트 (그리드 대신 리스트 형태로 5개씩 보여줌) */}
            <div className="grid gap-4">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="고객사 명칭으로 검색..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyDown={onKeyDown}
                        />
                    </div>
                    <Button onClick={handleSearch}>검색</Button>
                </div>
                {loading ? (
                    // 로딩 스켈레톤이나 메시지
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
                        <p>데이터를 불러오는 중입니다...</p>
                    </div>
                ) : projects?.length > 0 ? (
                    // 데이터가 있을 때 map 실행
                    projects?.map((project: any) => (
                        <Link
                            key={project.org_id}
                            href={`/dashboard/projects/detail/${project.org_id}`}
                            className="block group"
                        >
                            <Card className="group-hover:border-blue-500 transition-all cursor-pointer shadow-sm hover:shadow-md">
                                <CardContent className="p-5 flex items-center justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-lg group-hover:text-blue-600 transition-colors">
                                                {project.organization
                                                    ?.org_name ||
                                                    '미지정 고객사'}
                                            </p>
                                            {/* 중복 제거 전략에 따라 '메인' 뱃지 등을 달아주면 좋습니다 */}
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                                대표
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-slate-500">
                                            <span className="flex items-center gap-1.5">
                                                <Building className="w-4 h-4 text-slate-400" />
                                                <span className="font-medium text-slate-700">
                                                    {project.organization
                                                        ?.business_number || ''}
                                                </span>
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Globe className="w-4 h-4 text-slate-400" />
                                                {project.organization.base_url}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400 mr-2">
                                            상세보기
                                        </span>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                ) : (
                    // 데이터가 없을 때
                    <div className="text-center py-20 text-slate-400 border border-dashed rounded-xl bg-slate-50/50">
                        <div className="mb-3 flex justify-center">
                            <FolderKanban className="w-10 h-10 text-slate-300" />
                        </div>
                        <p className="text-sm">등록된 프로젝트가 없습니다.</p>
                        <p className="text-xs mt-1 text-slate-300">
                            새 프로젝트를 생성하여 검사를 시작해보세요.
                        </p>
                    </div>
                )}
            </div>

            {/* 페이지네이션 UI */}
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <Button
                            variant="ghost"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            이전
                        </Button>
                    </PaginationItem>

                    {/* last_page가 0이어도 최소 1개는 렌더링하도록 설정 */}
                    {[...Array(Math.max(1, meta?.last_page))].map((_, i) => (
                        <PaginationItem key={i}>
                            <PaginationLink
                                isActive={currentPage === i + 1}
                                onClick={() => setCurrentPage(i + 1)}
                            >
                                {i + 1}
                            </PaginationLink>
                        </PaginationItem>
                    ))}

                    <PaginationItem>
                        <Button
                            variant="ghost"
                            disabled={currentPage >= (meta.last_page || 1)}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            다음
                        </Button>
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    )
}
