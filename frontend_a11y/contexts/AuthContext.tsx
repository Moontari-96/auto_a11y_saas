'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface AuthContextType {
    isAuthenticated: boolean
    login: (access_token: string) => void
    logout: () => void
    loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem('access_token')
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`
            setIsAuthenticated(true)
        }
        setLoading(false)
    }, [])

    const login = (access_token: string) => {
        localStorage.setItem('access_token', access_token)
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
        setIsAuthenticated(true)
        router.push('/dashboard')
    }

    const logout = () => {
        localStorage.removeItem('access_token')
        delete api.defaults.headers.common['Authorization']
        setIsAuthenticated(false)
        router.push('/login')
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
