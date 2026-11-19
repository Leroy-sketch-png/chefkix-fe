import { resolveApiBaseUrl } from '@/lib/api-origin'

const app = {
	AXIOS_TIMEOUT: 30000,
	API_BASE_URL: resolveApiBaseUrl(
		process.env.NEXT_PUBLIC_BASE_URL,
		process.env.NODE_ENV,
	),
	KEYCLOAK_URL: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8180',
}

export default app
