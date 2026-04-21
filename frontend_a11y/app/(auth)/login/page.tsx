'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Mock API call for login
            // In a real app, this would be a call to your backend auth endpoint
            const res = await api.post('/auth/login', { email, password })
            if (res.data && res.data.access_token) {
                login(res.data.access_token)
                // Redirect is handled by AuthContext.login
            } else {
                setError(res.data.message || '로그인 실패: 알 수 없는 오류')
            }
        } catch (err: any) {
            console.error('Login error:', err)
            setError(err.response?.data?.message || '로그인 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="w-[360px] border p-6 rounded-lg shadow-lg bg-white">
                <h2 className="text-2xl font-bold text-center mb-6">로그인</h2>

                <form onSubmit={handleSubmit}>
                    <input
                        className="w-full border border-slate-300 p-3 mb-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="이메일"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                    <input
                        className="w-full border border-slate-300 p-3 mb-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        type="password"
                        placeholder="비밀번호"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />

                    {error && (
                        <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
                    )}

                    <button
                        className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? '로그인 중...' : '로그인'}
                    </button>
                </form>
            </div>
        </div>
    )
}
