'use client' // 검색 상태 관리를 위해 클라이언트 컴포넌트 사용

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input' // shadcn/ui 인풋
import {
    Plus,
    Building2,
    ChevronRight,
    Globe,
    Search,
    Filter,
} from 'lucide-react'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination'

export default function OrganizationsPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [organizations, setOrganizations] = useState<any[]>([])
    const [meta, setMeta] = useState({ total: 0, page: 1, last_page: 0 })
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)

    // 데이터를 가져오는 함수를 하나로 통합 (useCallback으로 최적화)
    const fetchOrgs = useCallback(async (page: number, keyword: string) => {
        try {
            setLoading(true)
            // GET 방식으로 변경 (쿼리 파라미터 전달)
            const res = await api.post('/organizations/organizationAll', {
                page: page,
                limit: 9, // 3개씩 3줄이면 9개가 예쁨
                keyword: keyword,
            })
            setOrganizations(res.data.data) // 데이터 리스트
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

    return (
        <div className="space-y-6">
            {/* 1. 헤더 */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        고객사 관리
                    </h2>
                    <p className="text-muted-foreground">
                        전체 {meta.total}개의 고객사가 등록되어 있습니다.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/organizations/detail/new">
                        <Plus className="w-4 h-4 mr-2" /> 추가
                    </Link>
                </Button>
            </div>

            {/* 2. 검색 바 */}
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

            {/* 3. 목록 그리드 */}
            {loading ? (
                <div className="text-center py-10">로딩 중...</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {organizations.map(org => (
                        <Card
                            key={org.org_id}
                            className="group hover:border-primary/50 transition-all"
                        >
                            <Link
                                href={`/dashboard/organizations/detail/${org.org_id}`}
                            >
                                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Building2 className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">
                                            {org.org_name}
                                        </CardTitle>
                                        <CardDescription>
                                            {org.business_number}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                            </Link>
                        </Card>
                    ))}
                </div>
            )}

            {/* 4. 페이징 처리 */}
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
                    {[...Array(Math.max(1, meta.last_page))].map((_, i) => (
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
