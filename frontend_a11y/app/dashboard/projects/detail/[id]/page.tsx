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

// 1. 타입 정의 정립
interface Organization {
    org_id: string;
    org_name: string;
    base_url: string;
}

interface ProjectItem {
    project_id?: string;
    temp_id?: string;
    org_id?: string;
    project_name: string;
    target_url: string;
    display_yn: string;
    delete_yn: string;
    organization?: Organization;
}

export default function ProjectManagePage() {
    const params = useParams()
    const router = useRouter()

    // URL 파라미터가 'new'가 아니면 수정 모드로 판단
    const isEditMode = params.id !== 'new'
    const orgIdFromParam = isEditMode ? (params.id as string) : null

    // 상태 관리
    const [loading, setLoading] = useState(false)
    const [crawling, setCrawling] = useState(false)
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [projectItems, setProjectItems] = useState<ProjectItem[]>([])

    const [formData, setFormData] = useState({
        project_title: '',
        project_name: '',
        org_id: '',
        base_url: '',
        target_url: '',
        selected_urls: [] as string[],
    })

    // 1. 초기 데이터 로드
    useEffect(() => {
        const initData = async () => {
            try {
                setLoading(true)
                const orgRes = await api.post('/organizations/selectAll')
                let currentOrgs: Organization[] = orgRes.data.data || []

                if (isEditMode && orgIdFromParam) {
                    const res = await api.post(
                        `/projects/findAllByOrg/${orgIdFromParam}`
                    )
                    const data: ProjectItem[] = res.data.data

                    if (data && data.length > 0) {
                        const first = data[0]

                        // 조인해서 가져온 고객사가 기존 목록에 없는 경우에만 추가
                        if (
                            first.organization &&
                            !currentOrgs.find(o => o.org_id === first.org_id) // any 제거
                        ) {
                            currentOrgs = [...currentOrgs, first.organization]
                        }

                        setOrganizations(currentOrgs)

                        setFormData({
                            project_title: first.project_name || '', // DB 구조에 맞게 매핑 주의
                            project_name: first.project_name || '',
                            org_id: first.organization?.org_id || '',
                            target_url: first.target_url || '',
                            base_url: first.organization?.base_url || '',
                            selected_urls: data
                                .filter(item => item.delete_yn === 'N')
                                .map(item => item.target_url),
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
                toast.error('데이터를 불러오는 중 오류가 발생했습니다.')
            } finally {
                setLoading(false)
            }
        }
        initData()
    }, [isEditMode, orgIdFromParam])

    // 2. 고객사 변경 시 target_url 자동 세팅
    const handleOrgChange = (id: string) => {
        const org = organizations.find(o => o.org_id === id) // any 제거
        setFormData(prev => ({
            ...prev,
            org_id: id,
            base_url: org?.base_url || '',
        }))
    }

    // 3. 크롤링 핸들러 (신규 추가 로직)
    const handleStartCrawling = async () => {
        if (!formData.base_url) {
            return toast.warning('URL을 입력해주세요.') // alert 대신 toast 사용
        }

        setCrawling(true)
        try {
            const res = await api.post('/crawl/getCrawling', {
                url: formData.base_url,
            })
            // 크롤링 응답 데이터 타입 정의
            const newPages: { title: string; url: string }[] = res.data.data

            const combined = [...projectItems]
            const newUrls = [...formData.selected_urls]

            newPages.forEach(page => {
                // 중복 체크
                if (!combined.find(item => (item.target_url || item.target_url) === page.url)) {
                    combined.push({
                        temp_id: `crawl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                        project_name: page.title,
                        target_url: page.url,
                        display_yn: 'Y',
                        delete_yn: 'N',
                    })
                    newUrls.push(page.url)
                }
            })

            setProjectItems(combined)
            setFormData(prev => ({ ...prev, selected_urls: newUrls }))
            toast.success(`${newPages.length}개의 페이지를 크롤링했습니다.`)
        } catch (e) {
            console.error('크롤링 에러:', e)
            toast.error('크롤링에 실패했습니다. URL을 확인해주세요.')
        } finally {
            setCrawling(false)
        }
    }

    // 4. 저장 핸들러
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()

        if (projectItems.length === 0) {
            toast.error('항목 누락', {
                description: '크롤링 추가 버튼 혹은 수동으로 항목을 추가해주세요.',
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
                    target_url: item.target_url,
                    display_yn: item.display_yn || 'Y',
                    delete_yn: item.delete_yn || 'N',
                })),
            }

            const response = await api.patch('/projects/upsertProj', payload)

            if (response.data.success) {
                toast.success(response.data.message)
                router.push('/dashboard/projects')
            } else {
                toast.error('저장 실패', { description: response.data.message })
            }
        } catch (e) {
            console.error('저장 에러:', e)
            toast.error('저장 실패', { description: '서버 에러가 발생했습니다.' })
        } finally {
            setLoading(false)
        }
    }

    // 5. 항목 수정 핸들러 (타입 안정성 강화)
    const updateItemField = (id: string, field: keyof ProjectItem, value: string) => {
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

    // 6. 수동 항목 추가 핸들러
    const addNewItem = () => {
        setProjectItems(prev => [
            ...prev,
            {
                temp_id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                project_name: '',
                target_url: '',
                display_yn: 'Y',
                delete_yn: 'N',
            },
        ])
    }

    // 로딩 화면
    if (loading && isEditMode) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

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
                                        <SelectItem key={org.org_id} value={org.org_id}>
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
                                onChange={e => setFormData(prev => ({ ...prev, project_title: e.target.value }))}
                                placeholder="예: 2026 웹 접근성 진단"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>검사 시작 URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={formData.base_url}
                                    onChange={e => setFormData(prev => ({ ...prev, base_url: e.target.value }))}
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

                        {/* 하단 목록 영역 */}
                        <div className="pt-6 border-t space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base flex items-center gap-2">
                                    <ListChecks className="w-5 h-5 text-blue-600" />{' '}
                                    대상 페이지 목록 (
                                    {projectItems.filter(i => i.delete_yn === 'N').length}
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

                            <div className="grid gap-4 max-h-[500px] overflow-y-auto p-4 border rounded-lg bg-slate-50/50">
                                {projectItems.map((item, idx) => {
                                    if (item.delete_yn === 'Y') return null

                                    // 타입 안정성을 위해 보장된 ID를 키로 사용
                                    const itemKey = item.project_id || item.temp_id || `fallback-${idx}`

                                    return (
                                        <div
                                            key={itemKey}
                                            className="group relative bg-white p-4 rounded-xl border shadow-sm hover:border-blue-300 transition-all space-y-3"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1 grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold">페이지 명칭</Label>
                                                        <Input
                                                            value={item.project_name || ''}
                                                            onChange={e => updateItemField(itemKey, 'project_name', e.target.value)}
                                                            className="h-8 text-sm font-bold"
                                                            placeholder="예: 메인 페이지"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold">Target URL</Label>
                                                        <Input
                                                            value={item.target_url || ''}
                                                            onChange={e => updateItemField(itemKey, 'target_url', e.target.value)}
                                                            className="h-8 text-sm text-slate-500"
                                                            placeholder="https://..."
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 pl-4 border-l">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Label className="text-[10px] text-slate-400 text-center">노출</Label>
                                                        <Checkbox
                                                            checked={item.display_yn !== 'N'}
                                                            onCheckedChange={checked => updateItemField(itemKey, 'display_yn', checked ? 'Y' : 'N')}
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => updateItemField(itemKey, 'delete_yn', 'Y')}
                                                        className="text-slate-300 hover:text-red-500"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>

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
                                {projectItems.filter(i => i.delete_yn === 'N').length === 0 && (
                                    <div className="text-center py-8 text-slate-500 text-sm">
                                        추가된 페이지가 없습니다. 크롤링을 실행하거나 수동으로 추가해주세요.
                                    </div>
                                )}
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