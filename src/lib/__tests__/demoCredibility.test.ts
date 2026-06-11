import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const readWorkspaceFile = (path: string) =>
	readFileSync(join(process.cwd(), path), 'utf8')

describe('demo credibility guardrails', () => {
	it('keeps unsupported proof claims out of user-facing copy', () => {
		const userFacingCopy = [
			'messages/en.json',
			'src/components/onboarding/FirstVisitHints.tsx',
			'src/app/(main)/explore/layout.tsx',
		]
			.map(readWorkspaceFile)
			.join('\n')

		const unsupportedClaims = [
			/5x more followers/i,
			/97%.*(?:new|first-time) cooks/i,
			/(?:browse|discover) thousands of recipes/i,
			/screen is off/i,
			/new challenges drop (?:daily|every week)/i,
			/never forget a timer/i,
		]

		for (const claim of unsupportedClaims) {
			expect(userFacingCopy).not.toMatch(claim)
		}
	})

	it('keeps shared page surfaces free of continuous blurred decoration', () => {
		const sharedSurfaces = [
			'src/components/ui/mesh-gradient.tsx',
			'src/components/layout/PremiumSurface.tsx',
		]
			.map(readWorkspaceFile)
			.join('\n')

		expect(sharedSurfaces).not.toContain('repeat: Infinity')
		expect(sharedSurfaces).not.toContain('blur-[90px]')
		expect(sharedSurfaces).not.toContain('showOrbs')
	})

	it('does not advertise zero-value rewards or pulse dashboard decoration forever', () => {
		const dashboardSurfaces = [
			'src/components/dashboard/ActiveChallengesWidget.tsx',
			'src/components/pending/PendingPostsSection.tsx',
		]
			.map(readWorkspaceFile)
			.join('\n')

		expect(dashboardSurfaces).not.toContain('bonusXp || 0')
		expect(dashboardSurfaces).not.toContain('repeat: Infinity')
		expect(readWorkspaceFile('messages/en.json')).not.toContain(
			'No claimable XP left',
		)
	})

	it('renders truthful metric values before they enter the viewport', () => {
		const numberTicker = readWorkspaceFile(
			'src/components/ui/number-ticker.tsx',
		)

		expect(numberTicker).toContain('const initialValue = from ?? value')
		expect(numberTicker).not.toContain('from = 0')
	})

	it('does not show a stale cook plan after its controls change', () => {
		const planner = readWorkspaceFile('src/app/(main)/meal-planner/page.tsx')

		expect(planner).toContain('const planMatchesControls = Boolean(')
		expect(planner).toContain(
			'const hasPendingChanges = Boolean(plan) && !planMatchesControls',
		)
		expect(planner).toContain(
			'const showPlan = hasPlan && planMatchesControls && !generating',
		)
		expect(planner).toContain("t('applyChanges')")
	})

	it('publishes a stable frontend identity contract for readiness probes', () => {
		const healthContract = JSON.parse(
			readWorkspaceFile('public/chefkix-health.json'),
		) as {
			service?: string
			contractVersion?: number
		}

		expect(healthContract).toEqual({
			service: 'chefkix-frontend',
			contractVersion: 1,
		})
	})

	it('keeps one authoritative cockpit conductor owner', () => {
		const runtime = readWorkspaceFile(
			'src/components/dev/DemoCockpitRuntime.tsx',
		)
		const legacyWidget = readWorkspaceFile('src/components/dev/DemoWidget.tsx')

		expect(runtime.match(/<PhantomConductor/g) ?? []).toHaveLength(1)
		expect(legacyWidget).not.toContain('PhantomConductor')
		expect(legacyWidget).not.toContain('isDemoCockpitSession')
	})
})
