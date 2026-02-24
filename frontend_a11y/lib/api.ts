import axios from 'axios'

// 환경 변수가 있으면 EC2 주소를 쓰고, 없으면 로컬 주소를 사용합니다.
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE
    ? `${process.env.NEXT_PUBLIC_API_BASE}/a11y`
    : 'http://localhost:3001/a11y'

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})
