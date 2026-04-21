'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import {
    Plus,
    Globe,
    Building,
    ChevronRight,
    Search,
    FolderKanban,
} from 'lucide-react'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
} from '@/components/ui/pagination'
import { Input } from '@/components/ui/input'

function ProjectsContent() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const currentPage = Number(searchParams.get('page') || '1')
    const currentKeyword = searchParams.get('keyword') || ''

    const [projects, setProjects] = useState([])
    const itemsPerPage = 5
    const [meta, setMeta] = useState({ total: 0, page: 1, last_page: 0 })
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState(currentKeyword)

    const fetchProjects = useCallback(
        async (page: number, keyword: string) => {
            try {
                setLoading(true)
                const res = await api.post('/projects/projectsAll', {
                    page: page,
                    limit: itemsPerPage,
                    keyword: keyword,
                })
                setProjects(res.data.data)
                setMeta(res.data.meta)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        },
        []
    )

    useEffect(() => {
        fetchProjects(currentPage, currentKeyword)
    }, [currentPage, currentKeyword, fetchProjects])

    const handleSearch = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', '1')
        params.set('keyword', searchTerm)
        router.push(`${pathname}?${params.toString()}`)
    }

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', String(newPage))
        router.push(`${pathname}?${params.toString()}`)
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch()
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">프로젝트 목록</h2>
                    <p className="text-sm text-slate-500">
                        총 {meta.total}개의 프로젝트가 있습니다.
                    </p>
                </div>
                <Button asChild className="gap-2">
                    <Link href="/dashboard/projects/detail/new">
                        <Plus className="w-4 h-4" /> 새 프로젝트
                    </Link>
                </Button>
            </div>

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
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
                        <p>데이터를 불러오는 중입니다...</p>
                    </div>
                ) : projects?.length > 0 ? (
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

            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <Button
                            variant="ghost"
                            disabled={currentPage <= 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                        >
                            이전
                        </Button>
                    </PaginationItem>

                    {[...Array(Math.max(1, meta?.last_page))].map((_, i) => (
                        <PaginationItem key={i}>
                            <PaginationLink
                                isActive={currentPage === i + 1}
                                onClick={() => handlePageChange(i + 1)}
                            >
                                {i + 1}
                            </PaginationLink>
                        </PaginationItem>
                    ))}

                    <PaginationItem>
                        <Button
                            variant="ghost"
                            disabled={currentPage >= (meta.last_page || 1)}
                            onClick={() => handlePageChange(currentPage + 1)}
                        >
                            다음
                        </Button>
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    )
}

export default function ProjectsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProjectsContent />
        </Suspense>
    )
}