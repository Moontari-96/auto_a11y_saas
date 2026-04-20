'use client'

import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Globe, Play, FileText, Clock, AlertCircle } from 'lucide-react'
import { StatusIndicator, ScanStatus } from './StatusIndicator'

// 1. 프론트엔드 인터페이스에 이전 스캔 내역 속성 추가
export interface Project {
    project_id: string
    project_name: string
    target_url: string
    status: ScanStatus
    last_scan_id?: string
    last_scan_date?: string
    last_score?: number
}

interface ProjectCardProps {
    project: Project
    isSelected: boolean
    onSelect: (checked: boolean) => void
    onExecute: () => void
}

export function ProjectCard({
                                project,
                                isSelected,
                                onSelect,
                                onExecute,
                            }: ProjectCardProps) {
    const router = useRouter()

    // 현재 상태 파악
    const isRunning = project.status === 'PROGRESS'
    const isCompleted = project.status === 'COMPLETED' || !!project.last_scan_id

    return (
        <Card
            className={`group relative border-none shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50/30' : 'bg-white'
            }`}
        >
            <CardHeader className="p-5 pb-3">
                <div className="flex justify-between items-start mb-3">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={checked => onSelect(!!checked)}
                        disabled={isRunning}
                        className={`transition-opacity mt-0.5 ${
                            isSelected
                                ? 'opacity-100'
                                : 'opacity-0 group-hover:opacity-100'
                        }`}
                    />
                    <div className="flex items-center gap-2">
                        {/* 이전 검사 점수가 있을 경우 뱃지로 표시 */}
                        {project.last_score !== undefined && !isRunning && (
                            <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    project.last_score >= 80
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-red-100 text-red-700'
                                }`}
                            >
                                {project.last_score}점
                            </span>
                        )}
                        <StatusIndicator status={project.status} />
                    </div>
                </div>
                <CardTitle className="text-base font-bold text-slate-800 line-clamp-1">
                    {project.project_name}
                </CardTitle>
            </CardHeader>

            {/* 본문 영역 (URL 및 시간) */}
            <CardContent className="px-5 pb-4 flex-1">
                <div className="flex items-center text-xs text-slate-400 bg-slate-50 p-2 rounded-md truncate mb-2">
                    <Globe className="w-3 h-3 mr-1.5 shrink-0" />
                    <span className="truncate">{project.target_url}</span>
                </div>

                {/* 마지막 스캔 일자 표시 */}
                {project.last_scan_date && !isRunning && (
                    <div className="flex items-center text-[11px] text-slate-400 font-medium">
                        <Clock className="w-3 h-3 mr-1.5" />
                        최근 검사: {new Date(project.last_scan_date).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false // 24시간제로 표시 (예: 14:30). 오전/오후 표기를 원하시면 true로 변경하세요.
                    })}
                    </div>
                )}
            </CardContent>

            {/* 하단 버튼 영역 */}
            <div className="px-5 pb-5 grid grid-cols-1 gap-2 mt-auto">
                {/* 리포트 버튼: 스캔 이력이 있을 때만 노출 */}
                {isCompleted && !isRunning && (
                    <Button
                        variant="outline"
                        className="w-full text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation()
                            if (project.last_scan_id) {
                                router.push(`/dashboard/reports/detail/${project.last_scan_id}`)
                            }
                        }}
                    >
                        <FileText className="w-3 h-3 mr-1.5" /> 결과 리포트 보기
                    </Button>
                )}

                {/* 단독 검사 / 다시 검사 / 검사 중 버튼 */}
                <Button
                    variant={isSelected && !isRunning ? 'default' : 'outline'}
                    disabled={isRunning}
                    className={`w-full text-xs font-bold transition-colors ${
                        !isSelected && !isRunning &&
                        'text-slate-600 border-slate-200 hover:bg-slate-50'
                    } ${isRunning && 'bg-slate-100 text-slate-400 border-slate-100'}`}
                    onClick={(e) => {
                        e.stopPropagation()
                        onExecute()
                    }}
                >
                    {isRunning ? (
                        <>
                            <AlertCircle className="w-3 h-3 mr-2 animate-spin" /> 검사 진행 중...
                        </>
                    ) : (
                        <>
                            <Play className="w-3 h-3 mr-2" /> {isCompleted ? '재검사 실행' : '단독 검사 실행'}
                        </>
                    )}
                </Button>
            </div>
        </Card>
    )
}