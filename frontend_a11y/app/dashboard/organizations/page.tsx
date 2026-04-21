'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
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
import { Input } from '@/components/ui/input'
import { Plus, Building2, Search } from 'lucide-react'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
} from '@/components/ui/pagination'

function OrganizationsContent() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const currentPage = Number(searchParams.get('page') || '1')
    const currentKeyword = searchParams.get('keyword') || ''

    const [searchTerm, setSearchTerm] = useState(currentKeyword)
    const [organizations, setOrganizations] = useState<any[]>([])
    const [meta, setMeta] = useState({ total: 0, page: 1, last_page: 0 })
    const [loading, setLoading] = useState(true)

    const fetchOrgs = useCallback(async (page: number, keyword: string) => {
        try {
            setLoading(true)
            const res = await api.post('/organizations/organizationAll', {
                page: page,
                limit: 9,
                keyword: keyword,
            })
            setOrganizations(res.data.data)
            setMeta(res.data.meta)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchOrgs(currentPage, currentKeyword)
    }, [currentPage, currentKeyword, fetchOrgs])

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

                    {[...Array(Math.max(1, meta.last_page))].map((_, i) => (
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

export default function OrganizationsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <OrganizationsContent />
        </Suspense>
    )
}