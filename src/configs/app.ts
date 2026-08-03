const app = {
	AXIOS_TIMEOUT: 30000,
	API_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080',
	AI_SERVICE_URL:
		process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000',
	KEYCLOAK_URL: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8180',
}

export default app
