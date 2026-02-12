// src/app/dashboard/layout.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Building2,
    FolderKanban,
    ScanSearch,
    FileBarChart,
    ShieldCheck,
    Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils' // shadcn 설치 시 기본 제공되는 유틸리티

const menuItems = [
    { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
    { name: '고객사 관리', href: '/dashboard/organizations', icon: Building2 },
    { name: '프로젝트', href: '/dashboard/projects', icon: FolderKanban },
    { name: '검사 수행', href: '/dashboard/scans', icon: ScanSearch },
    { name: '리포트', href: '/dashboard/reports', icon: FileBarChart },
    { name: '검사 규칙', href: '/dashboard/rules', icon: ShieldCheck },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 w-64 border-r bg-white shadow-sm transition-all duration-300">
                <div className="flex h-16 items-center border-b px-6">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 font-bold text-xl text-blue-600"
                    >
                        <ShieldCheck className="w-8 h-8" />
                        <span className="tracking-tight">AbleFlow</span>
                    </Link>
                </div>

                <nav className="flex flex-col gap-1 p-4">
                    <p className="px-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Main Menu
                    </p>
                    {menuItems.map(item => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        'w-5 h-5',
                                        isActive
                                            ? 'text-blue-600'
                                            : 'text-slate-400'
                                    )}
                                />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                {/* 하단 설정 영역 */}
                <div className="absolute bottom-4 w-full px-4">
                    <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <Settings className="w-5 h-5 text-slate-400" />
                        환경 설정
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="pl-64 flex-1">
                <header className="h-16 border-b bg-white/50 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-500">
                        Welcome back!
                    </div>
                    <div className="flex items-center gap-4">
                        {/* 유저 프로필이나 알림 아이콘 위치 */}
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                            MY
                        </div>
                    </div>
                </header>
                <div className="p-8">{children}</div>
            </main>
        </div>
    )
}
