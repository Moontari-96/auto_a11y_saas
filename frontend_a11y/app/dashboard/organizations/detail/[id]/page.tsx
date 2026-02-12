'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Save, Trash2, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function OrganizationManagePage() {
    const params = useParams()
    const router = useRouter()
    const orgId = params.id === 'new' ? null : params.id // 'new'인 경우 등록 모드
    const [loading, setLoading] = useState(false)
    // 폼 데이터 상태 정의
    const [formData, setFormData] = useState({
        org_name: '',
        business_number: '',
        base_url: '',
    })
    // 1. 수정 모드일 때 데이터 불러오기 (Mock)
    useEffect(() => {
        if (orgId) {
            const fetchDetail = async () => {
                try {
                    setLoading(true)
                    // POST로 설계했다면 Body에 orgId 전달
                    const res = await api.post('/organizations/findOne', {
                        org_id: orgId, // DTO 컬럼명과 맞출 것
                    })
                    // res.data는 Axios의 전체 응답 바디
                    // res.data.data는 우리가 서버에서 설정한 'data' 필드
                    const orgData = res.data.data

                    if (orgData) {
                        setFormData({
                            org_name: orgData.org_name || '',
                            business_number: orgData.business_number || '',
                            base_url: orgData.base_url || '', // DB 컬럼명 확인 필수
                        })
                    }
                } catch (e) {
                    console.error('데이터 로드 실패:', e)
                    alert('정보를 불러오지 못했습니다.')
                } finally {
                    setLoading(false)
                }
            }
            fetchDetail()
        }
    }, [orgId])

    // 2. 등록/수정 핸들러
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (orgId) {
                console.log(formData)
                // 수정 모드: PATCH /organizations/:id
                // formData의 내용만 풀어서 전달
                const res = await api.patch(
                    `/organizations/updateOrg/${orgId}`,
                    {
                        ...formData,
                    }
                )

                if (res.data.success) {
                    alert(res.data.message || '수정되었습니다.')
                    // 성공 후 목록 페이지로 이동
                    router.push('/dashboard/organizations')
                    // 목록 페이지 데이터 갱신을 위해 refresh 호출 (선택)
                    router.refresh()
                } else {
                    alert(res.data.message || '수정에 실패했습니다.')
                }
            } else {
                // 등록 모드: POST /organizations/createOrg (기존에 정한 경로)
                const res = await api.post('/organizations/createOrg', {
                    ...formData,
                })

                if (res.data.success) {
                    alert(res.data.message || '등록되었습니다.')
                    // 성공 후 목록 페이지로 이동
                    router.push('/dashboard/organizations')
                    // 목록 페이지 데이터 갱신을 위해 refresh 호출 (선택)
                    router.refresh()
                } else {
                    alert(res.data.message || '등록에 실패했습니다.')
                }
            }
        } catch (e: any) {
            console.error('저장 실패:', e)
            const errorMsg =
                e.response?.data?.message || '저장 중 오류가 발생했습니다.'
            alert(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    // 3. 삭제 핸들러
    const handleDelete = async () => {
        if (
            !confirm(
                '정말로 이 고객사를 삭제하시겠습니까? 관련 프로젝트 데이터가 모두 삭제됩니다.'
            )
        )
            return

        setLoading(true)
        const res = await api.patch(`/organizations/deleteOrg/${orgId}`)
        if (res.data.success) {
            setLoading(false)
            router.push('/dashboard/organizations')
        }
        // TODO: DELETE /organizations/:id
    }

    if (loading && orgId)
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin" />
            </div>
        )

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* 상단 내비게이션 */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/organizations">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <h2 className="text-2xl font-bold tracking-tight">
                    {orgId ? '고객사 정보 수정' : '새 고객사 등록'}
                </h2>
            </div>

            <form onSubmit={handleSave}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5" /> 기본 정보
                        </CardTitle>
                        <CardDescription>
                            {orgId
                                ? '기존 고객사의 정보를 수정합니다.'
                                : '새로운 고객사를 시스템에 등록합니다.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="org_name">
                                고객사 명칭{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="org_name"
                                placeholder="예: (주)말이음"
                                value={formData.org_name}
                                onChange={e =>
                                    setFormData({
                                        ...formData,
                                        org_name: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="business_number">
                                    사업자 번호
                                </Label>
                                <Input
                                    id="business_number"
                                    placeholder="000-00-00000"
                                    value={formData.business_number}
                                    onChange={e =>
                                        setFormData({
                                            ...formData,
                                            business_number: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="base_url">대표 URL</Label>
                                <Input
                                    id="base_url"
                                    placeholder="https://"
                                    value={formData.base_url}
                                    onChange={e =>
                                        setFormData({
                                            ...formData,
                                            base_url: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t p-6 bg-gray-50/50">
                        {orgId ? (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                className="gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> 삭제하기
                            </Button>
                        ) : (
                            <div />
                        )}

                        <div className="flex gap-2">
                            <Button type="button" variant="outline" asChild>
                                <Link href="/dashboard/organizations">
                                    취소
                                </Link>
                            </Button>
                            <Button type="submit" className="gap-2">
                                <Save className="w-4 h-4" />{' '}
                                {orgId ? '변경사항 저장' : '고객사 등록'}
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </form>
        </div>
    )
}
