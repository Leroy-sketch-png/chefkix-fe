// src/services/auth.ts

import { api } from '@/lib/axios'
import { SignInDto, SignUpDto } from '@/lib/types'

export const signIn = async (data: SignInDto) => {
	const res = await api.post('/api/auth/login', data)
	return res.data
}

export const signUp = async (data: SignUpDto) => {
	const res = await api.post('/api/auth/register', data)
	return res.data
}

export const signInGoogle = async (token: string) => {
	const res = await api.post('/api/auth/google', { token })
	const data = res.data
	localStorage.setItem('jwt', data.jwt)
	return data
}
