'use client'

import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

// 백엔드 Enum과 일치시킵니다.
export type ScanStatus = 'READY' | 'PROGRESS' | 'COMPLETED' | 'FAILED' | 'IDLE'

interface StatusIndicatorProps {
    status: string // 타입을 우선 string으로 받고 내부에서 처리
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
    // 1. 대문자로 변환하여 비교 (방어 코드)
    const upperStatus = status?.toUpperCase() || 'READY'

    const config: Record<
        string,
        { color: string; text: string; icon: React.ReactNode }
    > = {
        READY: {
            color: 'bg-slate-200',
            text: '대기',
            icon: <Clock className="w-3 h-3 text-slate-500" />,
        },
        PROGRESS: {
            color: 'bg-blue-500',
            text: '검사중',
            icon: <Loader2 className="w-3 h-3 animate-spin text-white" />,
        },
        COMPLETED: {
            color: 'bg-emerald-500',
            text: '완료',
            icon: <CheckCircle2 className="w-3 h-3 text-white" />,
        },
        FAILED: {
            color: 'bg-rose-500',
            text: '실패',
            icon: <AlertCircle className="w-3 h-3 text-white" />,
        },
    }

    // 일치하는 상태가 없으면 READY(대기)로 기본 표시
    const current = config[upperStatus] || config.READY

    return (
        <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {current.text}
            </span>
            <div
                className={`w-5 h-5 rounded-full ${current.color} flex items-center justify-center shadow-inner`}
            >
                {current.icon}
            </div>
        </div>
    )
}
