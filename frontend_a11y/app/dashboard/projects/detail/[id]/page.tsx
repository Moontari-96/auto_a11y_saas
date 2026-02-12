'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    FolderPlus,
    Save,
    Trash2,
    ArrowLeft,
    Loader2,
    Globe,
    ListChecks,
    Plus,
} from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function ProjectManagePage() {
    const params = useParams()
    const router = useRouter()
    // URL 파라미터가 'new'가 아니면 수정 모드로 판단
    const isEditMode = params.id !== 'new'
    const orgIdFromParam = isEditMode ? (params.id as string) : null

    const [loading, setLoading] = useState(false)
    const [crawling, setCrawling] = useState(false)
    const [organizations, setOrganizations] = useState<any[]>([])

    // 하단 목록 데이터 (DB에서 온 데이터 + 크롤링으로 추가된 데이터)
    const [projectItems, setProjectItems] = useState<any[]>([])

    const [formData, setFormData] = useState({
        project_title: '',
        project_name: '',
        org_id: '',
        base_url: '',
        target_url: '',
        selected_urls: [] as string[], // 체크된 URL들 관리
    })
    // 크롤링된 전체 페이지 리스트
    const [crawledPages, setCrawledPages] = useState<any[]>([])

    // 1. 초기 데이터 로드
    useEffect(() => {
        const initData = async () => {
            try {
                setLoading(true)
                const orgRes = await api.post('/organizations/selectAll')
                let currentOrgs = orgRes.data.data || []

                if (isEditMode && orgIdFromParam) {
                    const res = await api.post(
                        `/projects/findAllByOrg/${orgIdFromParam}`
                    )
                    const data = res.data.data

                    if (data && data.length > 0) {
                        const first = data[0]

                        // 조인해서 가져온 고객사가 기존 목록에 없는 경우에만 추가
                        if (
                            first.organization &&
                            !currentOrgs.find(
                                (o: any) => o.org_id === first.org_id
                            )
                        ) {
                            currentOrgs = [...currentOrgs, first.organization]
                        }

                        setOrganizations(currentOrgs) // 중복 체크가 완료된 리스트 세팅

                        setFormData({
                            project_title: first.project_title || '',
                            project_name: first.project_name || '',
                            org_id: first.org_id || '',
                            target_url: first.target_url || '',
                            base_url: first.organization?.base_url || '',
                            selected_urls: data
                                .filter((item: any) => item.delete_yn === 'N')
                                .map((item: any) => item.target_url),
                        })
                        setProjectItems(data)
                    } else {
                        setOrganizations(currentOrgs)
                    }
                } else {
                    setOrganizations(currentOrgs)
                }
            } catch (e) {
                console.error('초기화 에러:', e)
            } finally {
                setLoading(false)
            }
        }
        initData()
    }, [isEditMode, orgIdFromParam])

    // 2. 고객사 변경 시 target_url 자동 세팅
    const handleOrgChange = (id: string) => {
        const org = organizations.find((o: any) => o.org_id === id)
        setFormData({
            ...formData,
            org_id: id,
            base_url: org?.base_url || '',
        })
    }

    // 3. 크롤링 핸들러 (신규 추가 로직)
    const handleStartCrawling = async () => {
        if (!formData.base_url) return alert('URL을 입력해주세요.')
        setCrawling(true)
        try {
            const res = await api.post('/crawl/getCrawling', {
                url: formData.target_url,
            })
            const newPages = res.data.data // [{ url, title }]

            // 기존 목록에 새로운 크롤링 결과 합치기 (중복 제거)
            const combined = [...projectItems]
            const newUrls: string[] = [...formData.selected_urls]

            newPages.forEach((page: any) => {
                if (
                    !combined.find(
                        item => (item.target_url || item.url) === page.url
                    )
                ) {
                    combined.push({
                        project_name: page.title,
                        target_url: page.url,
                        delete_yn: 'N',
                    })
                    newUrls.push(page.url)
                }
            })

            setProjectItems(combined)
            setFormData({ ...formData, selected_urls: newUrls })
        } catch (e) {
            alert('크롤링 실패')
        } finally {
            setCrawling(false)
        }
    }

    // 5. 저장 핸들러
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()

        // 1. 유효성 검사 (Guard Clause)
        // 수정 모드든 생성 모드든 아이템이 하나도 없으면 진행할 필요가 없습니다.
        if (projectItems.length === 0) {
            toast.error('항목 누락', {
                description:
                    '크롤링 추가 버튼 혹은 수동으로 항목을 추가해주세요.',
            })
            return
        }

        setLoading(true)

        try {
            const payload = {
                project_title: formData.project_title,
                org_id: formData.org_id,
                base_url: formData.base_url,
                items: projectItems.map(item => ({
                    project_id: item.project_id || null,
                    project_name: item.project_name,
                    target_url: item.target_url || item.url,
                    display_yn: item.display_yn || 'Y',
                    delete_yn: item.delete_yn || 'N',
                })),
            }

            console.log('최종 전송 데이터:', payload)

            // 2. 통합된 API 호출
            // 서버에서 이미 action(created/updated)과 message를 보내주므로 그대로 활용합니다.
            const response = await api.patch('/projects/upsertProj', payload)

            if (response.data.success) {
                // 서버가 주는 친절한 메시지("성공적으로 등록/수정되었습니다")를 Toast로 띄웁니다.
                // 서버의 action에 따라 다른 스타일 적용 가능
                toast.success(response.data.message)
                router.push('/dashboard/projects')
            } else {
                toast.error('저장 실패', {
                    description: response.data.message,
                })
            }
        } catch (e) {
            toast.error('저장 실패', {
                description: '서버 에러가 발생했습니다.',
            })
        } finally {
            setLoading(false)
        }
    }

    // 항목 수정 핸들러 (이름, URL, 노출 여부 등)
    const updateItemField = (id: string, field: string, value: any) => {
        setProjectItems(prev =>
            prev.map(item => {
                const currentId = item.project_id || item.temp_id
                if (currentId === id) {
                    return { ...item, [field]: value }
                }
                return item
            })
        )
    }
    // 수동 항목 추가 핸들러
    const addNewItem = () => {
        setProjectItems([
            ...projectItems,
            {
                // DB ID가 없으므로 임시 고유 ID 생성
                temp_id: `new-${Date.now()}`,
                project_name: '', // 초기값 빈 문자열 필수 (Controlled Input 에러 방지)
                target_url: '', // 초기값 빈 문자열 필수
                display_yn: 'Y',
                delete_yn: 'N',
            },
        ])
    }

    if (loading && isEditMode)
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin" />
            </div>
        )

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/projects">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <h2 className="text-2xl font-bold">
                    {isEditMode ? '프로젝트 수정' : '새 프로젝트 생성'}
                </h2>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FolderPlus className="w-5 h-5 text-blue-600" />{' '}
                            기본 설정
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>대상 고객사</Label>
                            <Select
                                onValueChange={handleOrgChange}
                                value={formData.org_id}
                                disabled={isEditMode}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="고객사 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    {organizations.map(org => (
                                        <SelectItem
                                            key={org.org_id}
                                            value={org.org_id}
                                        >
                                            {org.org_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>프로젝트 대제목</Label>
                            <Input
                                value={formData.project_title}
                                onChange={e =>
                                    setFormData({
                                        ...formData,
                                        project_title: e.target.value,
                                    })
                                }
                                placeholder="예: 2026 웹 접근성 진단"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>검사 시작 URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={formData.base_url}
                                    onChange={e =>
                                        setFormData({
                                            ...formData,
                                            base_url: e.target.value,
                                        })
                                    }
                                    placeholder="https://"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleStartCrawling}
                                    disabled={crawling}
                                >
                                    {crawling ? (
                                        <Loader2 className="animate-spin w-4 h-4 mr-2" />
                                    ) : (
                                        <Globe className="w-4 h-4 mr-2" />
                                    )}
                                    크롤링 추가
                                </Button>
                            </div>
                        </div>

                        {/* 하단 목록 영역: DB 데이터 + 크롤링 데이터 하이브리드 */}
                        <div className="pt-6 border-t space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base flex items-center gap-2">
                                    <ListChecks className="w-5 h-5 text-blue-600" />{' '}
                                    대상 페이지 목록 (
                                    {
                                        projectItems.filter(
                                            i => i.delete_yn === 'N'
                                        ).length
                                    }
                                    )
                                </Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addNewItem}
                                    className="gap-2"
                                >
                                    <Plus className="w-4 h-4" /> 항목 수동 추가
                                </Button>
                            </div>

                            <div className="grid gap-4 max-h-125 overflow-y-auto p-4 border rounded-lg bg-slate-50/50">
                                {projectItems.map((item, idx) => {
                                    if (item.delete_yn === 'Y') return null // 삭제(제외)된 항목은 숨김
                                    // 고유 키 생성: DB ID가 있으면 ID 사용, 없으면 URL과 인덱스 조합
                                    const itemKey =
                                        item.project_id ||
                                        item.temp_id ||
                                        item.target_url ||
                                        `idx-${idx}`
                                    return (
                                        <div
                                            key={itemKey}
                                            className="group relative bg-white p-4 rounded-xl border shadow-sm hover:border-blue-300 transition-all space-y-3"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1 grid grid-cols-2 gap-3">
                                                    {/* 항목 이름 수정 */}
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold">
                                                            페이지 명칭
                                                        </Label>
                                                        <Input
                                                            value={
                                                                item.project_name ||
                                                                ''
                                                            }
                                                            onChange={e =>
                                                                updateItemField(
                                                                    itemKey,
                                                                    'project_name',
                                                                    e.target
                                                                        .value
                                                                )
                                                            } // itemKey 전달
                                                            className="h-8 text-sm font-bold"
                                                            placeholder="예: 메인 페이지"
                                                        />
                                                    </div>
                                                    {/* URL 수정 */}
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold">
                                                            Target URL
                                                        </Label>
                                                        <Input
                                                            value={
                                                                item.target_url ||
                                                                ''
                                                            }
                                                            onChange={e =>
                                                                updateItemField(
                                                                    itemKey,
                                                                    'target_url',
                                                                    e.target
                                                                        .value
                                                                )
                                                            } // itemKey 전달
                                                            className="h-8 text-sm text-slate-500"
                                                            placeholder="https://..."
                                                        />
                                                    </div>
                                                </div>

                                                {/* 노출 여부 (display_yn) 및 삭제 버튼 */}
                                                <div className="flex items-center gap-3 pl-4 border-l">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Label className="text-[10px] text-slate-400 text-center">
                                                            노출
                                                        </Label>
                                                        <Checkbox
                                                            checked={
                                                                item.display_yn !==
                                                                'N'
                                                            }
                                                            onCheckedChange={
                                                                checked =>
                                                                    updateItemField(
                                                                        itemKey,
                                                                        'display_yn',
                                                                        checked
                                                                            ? 'Y'
                                                                            : 'N'
                                                                    ) // itemKey 전달
                                                            }
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            updateItemField(
                                                                itemKey,
                                                                'delete_yn',
                                                                'Y'
                                                            )
                                                        } // itemKey 전달
                                                        className="text-slate-300 hover:text-red-500"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* 데이터 출처 표시 */}
                                            <div className="absolute -top-2 -right-2 flex gap-1">
                                                {item.project_id ? (
                                                    <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full shadow-sm">
                                                        DB
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full shadow-sm">
                                                        NEW
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 border-t p-6 bg-slate-50/50">
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <Loader2 className="animate-spin w-4 h-4 mr-2" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            {isEditMode ? '변경사항 저장' : '프로젝트 생성'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    )
}
