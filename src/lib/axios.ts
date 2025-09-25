import app from '@/configs/app'
import axios from 'axios'

export const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080',
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: app.AXIOS_TIMEOUT,
})
