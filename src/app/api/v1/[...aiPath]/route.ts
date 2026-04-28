import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const AI_PROXY_ERROR = 'AI proxy request failed'
const DEFAULT_AI_SERVICE_URL = 'http://localhost:8000'
const ALLOWED_AI_PATHS = new Set([
	'process_recipe',
	'calculate_metas',
	'validate_recipe',
	'cooking_assistant',
	'moderate',
	'moderate/rules-only',
	'moderate/ai-only',
	'suggest_substitutions',
	'remix_recipe',
	'ml/calibrate-difficulty',
	'ml/content-guard',
	'ner/extract',
	'quality/score',
	'generate_meal_plan',
])

const ENV_FILE_CANDIDATES = [
	path.resolve(process.cwd(), '.env.local'),
	path.resolve(process.cwd(), '.env'),
	path.resolve(process.cwd(), '../chefkix-ai-service/.env'),
	path.resolve(process.cwd(), '../chefkix-monolith/.env'),
]

const jsonFailure = (message: string, status: number) =>
	NextResponse.json(
		{
			success: false,
			message,
			statusCode: status,
		},
		{
			status,
			headers: {
				'Cache-Control': 'no-store',
			},
		},
	)

const normalizeEnvValue = (value: string) => {
	const trimmed = value.trim()
	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		return trimmed.slice(1, -1).trim()
	}
	return trimmed
}

const readEnvValueFromContent = (
	content: string,
	key: string,
): string | null => {
	for (const rawLine of content.split(/\r?\n/)) {
		const line = rawLine.trim()
		if (!line || line.startsWith('#')) continue

		const normalizedLine = line.startsWith('export ')
			? line.slice('export '.length)
			: line

		if (!normalizedLine.startsWith(`${key}=`)) continue

		return normalizeEnvValue(normalizedLine.slice(key.length + 1))
	}

	return null
}

const resolveEnvValue = async (key: string): Promise<string | null> => {
	for (const candidate of ENV_FILE_CANDIDATES) {
		try {
			const content = await readFile(candidate, 'utf8')
			const value = readEnvValueFromContent(content, key)
			if (value) return value
		} catch {
			continue
		}
	}

	return null
}

const resolveAiConfig = async () => {
	const apiKey = normalizeEnvValue(
		process.env.AI_SERVICE_API_KEY ||
			process.env.NEXT_PUBLIC_AI_SERVICE_API_KEY ||
			(await resolveEnvValue('AI_SERVICE_API_KEY')) ||
			'',
	)
	const baseUrl = normalizeEnvValue(
		process.env.AI_SERVICE_URL ||
			process.env.NEXT_PUBLIC_AI_SERVICE_URL ||
			(await resolveEnvValue('NEXT_PUBLIC_AI_SERVICE_URL')) ||
			(await resolveEnvValue('AI_SERVICE_URL')) ||
			DEFAULT_AI_SERVICE_URL,
	).replace(/\/+$/, '')

	return { apiKey, baseUrl }
}

export async function POST(
	request: NextRequest,
	context: { params: Promise<{ aiPath?: string[] }> },
) {
	const params = await context.params
	const aiPath = params.aiPath ?? []
	const targetPath = aiPath.join('/')

	if (!ALLOWED_AI_PATHS.has(targetPath)) {
		return jsonFailure('AI route not found', 404)
	}

	const { apiKey, baseUrl } = await resolveAiConfig()
	if (!apiKey) {
		return jsonFailure(
			'AI proxy is missing AI_SERVICE_API_KEY on the server.',
			503,
		)
	}

	const requestBody = await request.text()
	const upstreamUrl = `${baseUrl}/api/v1/${targetPath}`

	try {
		const upstreamResponse = await fetch(upstreamUrl, {
			method: 'POST',
			headers: {
				'Content-Type':
					request.headers.get('content-type') || 'application/json',
				'X-AI-Service-Key': apiKey,
			},
			body: requestBody,
			cache: 'no-store',
		})

		const responseText = await upstreamResponse.text()

		return new NextResponse(responseText, {
			status: upstreamResponse.status,
			headers: {
				'Content-Type':
					upstreamResponse.headers.get('content-type') || 'application/json',
				'Cache-Control': 'no-store',
			},
		})
	} catch (error) {
		const message =
			error instanceof Error && error.message
				? `${AI_PROXY_ERROR}: ${error.message}`
				: AI_PROXY_ERROR

		return jsonFailure(message, 503)
	}
}
