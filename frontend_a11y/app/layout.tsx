import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
    title: 'AbleFlow',
    description: '웹 접근성 자동 검사 및 관리 솔루션',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ko" suppressHydrationWarning>
            <body className="min-h-screen bg-background text-foreground">
                {children}
                <Toaster position="top-center" richColors />
            </body>
        </html>
    )
}
