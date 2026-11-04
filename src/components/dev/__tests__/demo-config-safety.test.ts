import fs from 'node:fs'
import path from 'node:path'
import { getRecipeById } from '@/services/recipe'
import { useAuthStore } from '@/store/authStore'
import { useCookingStore } from '@/store/cookingStore'
import {
	getDemoPitchShortcut,
	getDemoShortcutIoBlockers,
	resolveDemoShortcut,
	summarizeServiceHealth,
	type DemoPitchShortcut,
} from '@/components/dev/demo-config'

jest.mock('@/services/recipe', () => ({ getRecipeById: jest.fn() }))
jest.mock('@/store/authStore', () => ({
	useAuthStore: { getState: jest.fn() },
}))
jest.mock('@/store/cookingStore', () => ({
	useCookingStore: { setState: jest.fn() },
}))

const source = fs.readFileSync(
	path.join(process.cwd(), 'src/components/dev/demo-config.ts'),
	'utf8',
)

const section = (start: string, end: string) => {
	const startIndex = source.indexOf(start)
	const endIndex = source.indexOf(end, startIndex + start.length)

	expect(startIndex).toBeGreaterThanOrEqual(0)
	expect(endIndex).toBeGreaterThan(startIndex)
	return source.slice(startIndex, endIndex)
}

const shortcut: DemoPitchShortcut = {
	id: 'co-cook',
	label: 'Cook Together',
	icon: 'users',
	description: 'Create a cooking room',
	kind: 'runtime',
	actionId: 'co-cook',
	requiresAuth: true,
}

const jsonResponse = (payload: unknown, status = 200) => ({
	ok: status >= 200 && status < 300,
	status,
	json: async () => payload,
})

describe('demo pre-show service health truth', () => {
	const healthyServices = [
		{ name: 'Monolith', healthy: true },
		{ name: 'AI Service', healthy: true },
		{ name: 'Keycloak', healthy: true },
	]

	it('passes only when every configured service is healthy', () => {
		expect(summarizeServiceHealth(healthyServices)).toEqual({
			status: 'pass',
			detail: 'Monolith, AI, Keycloak all healthy',
		})
	})

	it('warns instead of passing when one service is unavailable', () => {
		expect(
			summarizeServiceHealth([
				...healthyServices.slice(0, 2),
				{ name: 'Keycloak', healthy: false },
			]),
		).toEqual({
			status: 'warn',
			detail:
				'Keycloak is not ready. Check affected beat readiness and use its documented fallback.',
		})
	})

	it('fails when multiple dependencies are unavailable', () => {
		expect(
			summarizeServiceHealth([
				{ name: 'Monolith', healthy: false },
				{ name: 'AI Service', healthy: false },
				{ name: 'Keycloak', healthy: true },
			]),
		).toEqual({
			status: 'fail',
			detail: 'Monolith, AI Service are not ready — demo may break',
		})
	})

	it('fails closed when no service probes are configured', () => {
		expect(summarizeServiceHealth([])).toEqual({
			status: 'fail',
			detail: 'No service health probes were configured',
		})
	})

	it('does not treat HTTP 401 as a healthy service response', () => {
		const serviceCheck = section(
			"'services-health',",
			'// 2. Physical I/O evidence',
		)
		expect(serviceCheck).toContain('probeHttpService(')
		expect(serviceCheck).toContain("service: 'ai-service'")
		expect(serviceCheck).not.toContain('res.status === 401')
		expect(serviceCheck).toContain('return health')
	})

	it('keeps semantic failure detail in the pre-show verdict', () => {
		expect(
			summarizeServiceHealth([
				{ name: 'AI Service', healthy: false, detail: 'Reported degraded' },
			]),
		).toEqual({
			status: 'warn',
			detail:
				'AI Service (Reported degraded) is not ready. Check affected beat readiness and use its documented fallback.',
		})
	})
})

describe('presenter actions respect physical I/O prerequisites', () => {
	const now = Date.parse('2026-06-11T08:00:00.000Z')
	const passed = (verifiedAt: string) => ({
		status: 'pass' as const,
		detail: 'Presenter verified',
		verifiedAt,
	})

	it('requires speaker and timer certification for cooking audio only', () => {
		const results = {
			speaker: passed('2026-06-11T07:30:00.000Z'),
			timer: passed('2026-06-11T07:30:00.000Z'),
		}
		const audioShortcut = getDemoPitchShortcut('cooking-audio')
		const dashboardShortcut = getDemoPitchShortcut('dashboard')

		expect(getDemoShortcutIoBlockers(audioShortcut, results, now)).toEqual([])
		expect(getDemoShortcutIoBlockers(dashboardShortcut, results, now)).toEqual(
			[],
		)
		expect(getDemoShortcutIoBlockers(audioShortcut, null, now)).toEqual([
			'Speaker output',
			'Timer while narration muted',
		])
	})

	it('requires TURN relay certification before co-cook can be launched', () => {
		const shortcut = getDemoPitchShortcut('co-cook')

		expect(getDemoShortcutIoBlockers(shortcut, null, now)).toEqual([
			'TURN relay candidate',
		])
		expect(
			getDemoShortcutIoBlockers(
				shortcut,
				{ turn: passed('2026-06-11T07:30:00.000Z') },
				now,
			),
		).toEqual([])
	})

	it('keeps server-side command gates for direct and autopilot commands', () => {
		const conductor = fs.readFileSync(
			path.join(process.cwd(), 'src/components/dev/PhantomConductor.tsx'),
			'utf8',
		)
		const remote = fs.readFileSync(
			path.join(process.cwd(), 'src/app/demo-remote/page.tsx'),
			'utf8',
		)

		expect(conductor).toContain('getDemoShortcutIoBlockers(shortcut)')
		expect(conductor).toContain("getDemoPitchShortcut('co-cook')")
		expect(remote).toContain('disabled={actionBlocked}')
		expect(remote).toContain('Requires verified {ioBlockers.join')
		expect(remote).toContain('const firstAction = beat.actions[0]')
		expect(remote).toContain('Stage check required: ${ioBlockers.join')
	})
})

describe('demo co-cook readiness safety', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		;(useAuthStore.getState as jest.Mock).mockReturnValue({
			user: { userId: 'presenter-id' },
		})
		global.fetch = jest.fn(async (input: RequestInfo | URL) => {
			if (String(input) === '/demo-manifest.json') {
				return jsonResponse({
					scenes: { heroRecipeId: 'recipe-1' },
				}) as Response
			}
			return jsonResponse({ success: false, statusCode: 409 }, 409) as Response
		})
	})

	it('does not abandon an active session when room creation conflicts', async () => {
		await expect(
			resolveDemoShortcut(shortcut, 'presenter-token'),
		).rejects.toThrow('Existing cooking state was preserved')

		const urls = (global.fetch as jest.Mock).mock.calls.map(([url]) =>
			String(url),
		)
		expect(urls).not.toContain(
			'http://localhost:8080/api/v1/cooking-rooms/leave-active',
		)
		expect(urls).not.toContain(
			'http://localhost:8080/api/v1/cooking-sessions/abandon-active',
		)
		expect(useCookingStore.setState).not.toHaveBeenCalled()
	})

	it('returns a token-free manual spectator link after room creation', async () => {
		;(global.fetch as jest.Mock).mockImplementation(
			async (input: RequestInfo | URL) => {
				if (String(input) === '/demo-manifest.json') {
					return jsonResponse({
						scenes: { heroRecipeId: 'recipe-1' },
					}) as Response
				}
				return jsonResponse({
					success: true,
					data: {
						roomCode: 'ROOM42',
						recipeId: 'recipe-1',
						hostUserId: 'presenter-id',
						participants: [],
					},
				}) as Response
			},
		)
		;(getRecipeById as jest.Mock).mockResolvedValue({
			success: true,
			data: { id: 'recipe-1', title: 'Test Recipe' },
		})
		const openSpy = jest.spyOn(window, 'open').mockReturnValue(null)

		const result = await resolveDemoShortcut(shortcut, 'presenter-token')

		expect(result.watchUrl).toContain('ROOM42')
		expect(result.watchUrl).not.toContain('presenter-token')
		expect(result.watchUrl).not.toContain('demoToken')
		expect(result.notice).toContain('second signed-in account or device')
		expect(openSpy).not.toHaveBeenCalled()
		openSpy.mockRestore()
	})

	it('preserves an existing cook instead of clearing and retrying on conflict', () => {
		const shortcut = section(
			'async function createCookTogetherShortcut(',
			'export async function resolveDemoShortcut(',
		)

		expect(shortcut).not.toContain('clearBackendDemoCookingState')
		expect(shortcut).toContain('Existing cooking state was preserved')
	})

	it('does not put a persona access token in the spectator URL or auto-open a companion', () => {
		const shortcut = section(
			'async function createCookTogetherShortcut(',
			'export async function resolveDemoShortcut(',
		)

		expect(source).not.toContain('demoToken')
		expect(shortcut).not.toContain('window.open')
		expect(shortcut).toContain(
			'Open the spectator link on a second signed-in account or device.',
		)
	})

	it('uses the read-only infrastructure report and labels room evidence REST-only', () => {
		const roomCheck = section(
			'// 10. Read the explicit infrastructure probe; this checklist must not mutate cook state.',
			'// 11. Manifest freshness',
		)

		expect(roomCheck).toContain('loadDemoReadinessReport()')
		expect(roomCheck).toContain(
			'WebSocket events, ICE/TURN, and multi-device co-cooking are not certified.',
		)
		expect(roomCheck).not.toMatch(
			/method:\s*['"]POST['"]|clearBackendDemoCookingState/,
		)
		expect(roomCheck).not.toContain('WebSocket path confirmed')
	})
})
