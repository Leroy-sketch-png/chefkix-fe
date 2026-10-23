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
const RESEARCH_AUTH_HEADER = 'X-Iron-Chef-Research-Key'
const RESEARCH_ROUTE = ['research', 'suggest_substitutions']
const RESEARCH_KEY_PLACEHOLDERS = new Set([
	'CHANGE_ME',
	'CHANGE_ME_IRON_CHEF_RESEARCH_API_KEY',
])
const MAX_RESEARCH_BODY_CHARS = 1024
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

async function readRequestBodyAtMost(request: NextRequest, maxBytes: number) {
	const reader = request.body?.getReader()
	if (!reader) return null

	const chunks: Uint8Array[] = []
	let byteLength = 0
	try {
		while (true) {
			const { done, value } = await reader.read()
			if (done) break
			byteLength += value.byteLength
			if (byteLength > maxBytes) {
				await reader.cancel()
				return null
			}
			chunks.push(value)
		}
	} catch {
		return null
	}

	const body = new Uint8Array(byteLength)
	let offset = 0
	for (const chunk of chunks) {
		body.set(chunk, offset)
		offset += chunk.byteLength
	}
	try {
		return new TextDecoder('utf-8', { fatal: true }).decode(body)
	} catch {
		return null
	}
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
	const researchApiKey = normalizeEnvValue(
		process.env.IRON_CHEF_RESEARCH_API_KEY || '',
	)

	return {
		apiKey,
		baseUrl,
		backendUrl,
		rateLimitSubjectSecret,
		rateLimitPseudonymSecret,
		researchApiKey,
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

async function createResearchRequestBody(request: NextRequest) {
	const contentLength = Number(request.headers.get('content-length'))
	if (
		Number.isFinite(contentLength) &&
		contentLength > MAX_RESEARCH_BODY_CHARS * 4
	) {
		return null
	}
	if (
		!request.headers
			.get('content-type')
			?.toLowerCase()
			.includes('application/json')
	) {
		return null
	}

	let value: unknown
	try {
		const body = await readRequestBodyAtMost(
			request,
			MAX_RESEARCH_BODY_CHARS * 4,
		)
		if (body === null) return null
		if (body.length > MAX_RESEARCH_BODY_CHARS) return null
		value = JSON.parse(body)
	} catch {
		return null
	}

	if (
		typeof value !== 'object' ||
		value === null ||
		Array.isArray(value) ||
		Object.keys(value).length !== 1 ||
		!('ingredient' in value) ||
		typeof value.ingredient !== 'string' ||
		value.ingredient.length < 1 ||
		value.ingredient.trim().length === 0 ||
		value.ingredient.length > 200
	) {
		return null
	}

	return JSON.stringify({ ingredient: value.ingredient, reason: 'unavailable' })
}

async function proxyAiRequest(
	request: NextRequest,
	context: ProxyContext,
	method: 'GET' | 'POST',
) {
	const params = await context.params
	const pathParts = params.aiPath ?? []
	const researchRoute =
		method === 'POST' &&
		pathParts.length === RESEARCH_ROUTE.length &&
		pathParts.every((part, index) => part === RESEARCH_ROUTE[index])
	const targetPath = researchRoute
		? 'suggest_substitutions'
		: allowedPath(pathParts, method)

	if (!targetPath) {
		return jsonFailure('AI route not found', 404)
	}

	const {
		apiKey,
		baseUrl,
		backendUrl,
		rateLimitSubjectSecret,
		rateLimitPseudonymSecret,
		researchApiKey,
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
	if (
		researchRoute &&
		(process.env.IRON_CHEF_RESEARCH_ROUTE_ENABLED !== 'true' ||
			researchApiKey.length < 32 ||
			RESEARCH_KEY_PLACEHOLDERS.has(researchApiKey) ||
			researchApiKey === apiKey ||
			researchApiKey === rateLimitSubjectSecret ||
			researchApiKey === rateLimitPseudonymSecret)
	) {
		return jsonFailure(
			'Research substitution is not enabled on the server.',
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

	const requestBody = researchRoute
		? await createResearchRequestBody(request)
		: method === 'POST'
			? await request.text()
			: undefined
	if (researchRoute && !requestBody) {
		return jsonFailure(
			'Research substitution accepts only a source ingredient.',
			400,
		)
	}
	const upstreamUrl = `${baseUrl}/api/v1/${targetPath}`

	try {
		const headers: Record<string, string> = {
			'Content-Type': researchRoute
				? 'application/json'
				: request.headers.get('content-type') || 'application/json',
			'X-AI-Service-Key': apiKey,
			[AI_RATE_LIMIT_SUBJECT_HEADER]: rateLimitSubject,
		}
		if (researchRoute) {
			headers[RESEARCH_AUTH_HEADER] = researchApiKey
		} else if (request.headers.get('x-chefkix-allergen-flags')) {
			headers['X-ChefKix-Allergen-Flags'] = request.headers.get(
				'x-chefkix-allergen-flags',
			) as string
		}

		const upstreamResponse = await fetch(upstreamUrl, {
			method,
			headers,
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
