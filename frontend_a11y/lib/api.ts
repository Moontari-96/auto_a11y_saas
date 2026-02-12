import axios from 'axios'

export const api = axios.create({
    baseURL: 'http://localhost:3001/a11y',
    headers: {
        'Content-Type': 'application/json',
    },
})
