import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 8 * 1024
const DEFAULT_BACKEND_URL = 'http://localhost:8080'

function jsonFailure(message: string, status: number) {
	return NextResponse.json(
		{ success: false, statusCode: status, message },
		{ status, headers: { 'Cache-Control': 'no-store' } },
	)
}

async function readBodyAtMost(request: NextRequest): Promise<string | null> {
	const reader = request.body?.getReader()
	if (!reader) return null

	const chunks: Uint8Array[] = []
	let byteLength = 0
	while (true) {
		const { done, value } = await reader.read()
		if (done) break
		byteLength += value.byteLength
		if (byteLength > MAX_BODY_BYTES) {
			await reader.cancel()
			return null
		}
		chunks.push(value)
	}

	const bytes = new Uint8Array(byteLength)
	let offset = 0
	for (const chunk of chunks) {
		bytes.set(chunk, offset)
		offset += chunk.byteLength
	}
	return new TextDecoder().decode(bytes)
}

export async function POST(request: NextRequest) {
	if (
		!request.headers
			.get('content-type')
			?.toLowerCase()
			.includes('application/json')
	) {
		return jsonFailure('Please provide a JSON substitution request.', 400)
	}
	const contentLength = Number(request.headers.get('content-length'))
	if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
		return jsonFailure('The substitution request is too large.', 413)
	}

	let body: string | null
	try {
		body = await readBodyAtMost(request)
	} catch {
		return jsonFailure('Could not read the substitution request.', 400)
	}
	if (body === null)
		return jsonFailure('The substitution request is too large.', 413)
	if (!body.trim())
		return jsonFailure('The substitution request is empty.', 400)
	try {
		const parsed: unknown = JSON.parse(body)
		if (
			typeof parsed !== 'object' ||
			parsed === null ||
			Array.isArray(parsed)
		) {
			return jsonFailure('The substitution request is invalid.', 400)
		}
	} catch {
		return jsonFailure('The substitution request is invalid JSON.', 400)
	}

	const backendUrl = (
		process.env.BACKEND_URL ||
		process.env.NEXT_PUBLIC_BASE_URL ||
		DEFAULT_BACKEND_URL
	).replace(/\/+$/, '')
	try {
		const upstream = await fetch(
			`${backendUrl}/api/v1/knowledge/substitutions/from-photo`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body,
				cache: 'no-store',
			},
		)
		const responseBody = await upstream.text()
		return new NextResponse(responseBody, {
			status: upstream.status,
			headers: {
				'Content-Type':
					upstream.headers.get('content-type') || 'application/json',
				'Cache-Control': 'no-store',
			},
		})
	} catch {
		return jsonFailure('Knowledge graph is unavailable right now.', 503)
	}
}
