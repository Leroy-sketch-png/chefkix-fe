import { NextRequest, NextResponse } from 'next/server'

import { authenticateAiProxyCaller } from '@/lib/ai-proxy-auth'
import {
	AI_RATE_LIMIT_SUBJECT_HEADER,
	createAiRateLimitSubject,
	isAiRateLimitSubjectSecretConfigured,
} from '@/lib/ai-rate-limit-subject'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const AI_PROXY_ERROR = 'AI proxy request failed'
const DEFAULT_AI_SERVICE_URL = 'http://localhost:8000'
const DEFAULT_BACKEND_URL = 'http://localhost:8080'
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
	'ml/taste-dna',
	'ner/extract',
	'quality/score',
	'generate_meal_plan',
	'copilot/query',
	'compound/analyze-pair',
])

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

const resolveAiConfig = () => {
	const apiKey = normalizeEnvValue(process.env.AI_SERVICE_API_KEY || '')
	const baseUrl = normalizeEnvValue(
		process.env.AI_SERVICE_URL || DEFAULT_AI_SERVICE_URL,
	).replace(/\/+$/, '')
	const backendUrl = normalizeEnvValue(
		process.env.BACKEND_URL ||
			process.env.NEXT_PUBLIC_BASE_URL ||
			DEFAULT_BACKEND_URL,
	).replace(/\/+$/, '')

	const rateLimitSubjectSecret = normalizeEnvValue(
		process.env.AI_RATE_LIMIT_SUBJECT_SECRET || '',
	)
	const rateLimitPseudonymSecret = normalizeEnvValue(
		process.env.AI_RATE_LIMIT_PSEUDONYM_SECRET || '',
	)

	return {
		apiKey,
		baseUrl,
		backendUrl,
		rateLimitSubjectSecret,
		rateLimitPseudonymSecret,
	}
}

type ProxyContext = { params: Promise<{ aiPath?: string[] }> }

function allowedPath(parts: string[], method: 'GET' | 'POST') {
	if (method === 'POST') {
		const path = parts.join('/')
		return ALLOWED_AI_PATHS.has(path) ? path : null
	}
	const name = parts[2]?.trim()
	return parts.length === 3 &&
		parts[0] === 'compound' &&
		parts[1] === 'profile' &&
		name &&
		name.length <= 120 &&
		!/[\\/]/.test(name) &&
		name !== '.' &&
		name !== '..'
		? `compound/profile/${encodeURIComponent(name)}`
		: null
}

async function proxyAiRequest(
	request: NextRequest,
	context: ProxyContext,
	method: 'GET' | 'POST',
) {
	const params = await context.params
	const targetPath = allowedPath(params.aiPath ?? [], method)

	if (!targetPath) {
		return jsonFailure('AI route not found', 404)
	}

	const {
		apiKey,
		baseUrl,
		backendUrl,
		rateLimitSubjectSecret,
		rateLimitPseudonymSecret,
	} = resolveAiConfig()
	if (
		!apiKey ||
		!isAiRateLimitSubjectSecretConfigured(
			rateLimitPseudonymSecret,
			rateLimitSubjectSecret,
			apiKey,
		)
	) {
		return jsonFailure(
			'AI proxy trust configuration is incomplete on the server.',
			503,
		)
	}

	const caller = await authenticateAiProxyCaller(
		request.headers.get('authorization'),
		backendUrl,
	)
	if (caller.authenticated === false) {
		return jsonFailure(caller.message, caller.status)
	}
	const rateLimitSubject = createAiRateLimitSubject(
		caller.userId,
		rateLimitPseudonymSecret,
		rateLimitSubjectSecret,
	)

	const requestBody = method === 'POST' ? await request.text() : undefined
	const upstreamUrl = `${baseUrl}/api/v1/${targetPath}`

	try {
		const upstreamResponse = await fetch(upstreamUrl, {
			method,
			headers: {
				'Content-Type':
					request.headers.get('content-type') || 'application/json',
				'X-AI-Service-Key': apiKey,
				...(request.headers.get('x-chefkix-allergen-flags')
					? {
							'X-ChefKix-Allergen-Flags': request.headers.get(
								'x-chefkix-allergen-flags',
							) as string,
						}
					: {}),
				[AI_RATE_LIMIT_SUBJECT_HEADER]: rateLimitSubject,
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
	} catch {
		return jsonFailure(AI_PROXY_ERROR, 503)
	}
}

export function GET(request: NextRequest, context: ProxyContext) {
	return proxyAiRequest(request, context, 'GET')
}

export function POST(request: NextRequest, context: ProxyContext) {
	return proxyAiRequest(request, context, 'POST')
}
