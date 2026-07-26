import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const readWorkspaceFile = (path: string) =>
	readFileSync(join(process.cwd(), path), 'utf8')

const findTicketProofRoutes = (path: string): string[] =>
	readdirSync(path, { withFileTypes: true }).flatMap(entry => {
		if (!entry.isDirectory()) return []

		const entryPath = join(path, entry.name)
		return [
			...(/^(?:__)?q\d+-proof$/i.test(entry.name) ? [entryPath] : []),
			...findTicketProofRoutes(entryPath),
		]
	})

describe('demo credibility guardrails', () => {
	it('keeps ticket-named proof scaffolding out of product routes', () => {
		expect(findTicketProofRoutes(join(process.cwd(), 'src/app'))).toEqual([])
	})

	it('keeps Explore recipe labels and narrow challenge metadata presentable', () => {
		const messages = JSON.parse(readWorkspaceFile('messages/en.json')) as {
			recipe: Record<string, string>
		}
		const challengeBanner = readWorkspaceFile(
			'src/components/challenges/DailyChallengeBanner.tsx',
		)

		expect(messages.recipe).toMatchObject({
			diffBeginner: 'Beginner',
			diffIntermediate: 'Intermediate',
			diffAdvanced: 'Advanced',
			diffExpert: 'Expert',
		})
		expect(challengeBanner).toContain("className='mb-4 flex flex-wrap gap-3'")
	})

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

	it('keeps investor-path display type product-dense', () => {
		const welcome = readWorkspaceFile('src/app/welcome/WelcomeClient.tsx')
		const recipeDetail = readWorkspaceFile(
			'src/app/(main)/recipes/[id]/page.tsx',
		)
		const recipeCard = readWorkspaceFile(
			'src/components/recipe/RecipeCardEnhanced.tsx',
		)
		const incomingCall = readWorkspaceFile(
			'src/components/chat/IncomingCallOverlay.tsx',
		)

		expect(welcome).not.toMatch(/text-(?:7|8|9)xl/)
		expect(recipeDetail).not.toMatch(/(?:md|lg):text-(?:5|6)xl/)
		expect(recipeCard).not.toContain('md:text-3xl')
		expect(incomingCall).not.toContain('text-3xl')
		expect(incomingCall).not.toContain('Ai đó')
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

	it('keeps high-value actions on real canonical destinations', () => {
		const navigationCluster = [
			'src/components/challenges/DailyChallengeBanner.tsx',
			'src/components/settings/SettingsContextRail.tsx',
			'src/components/dashboard/DashboardCommandDeck.tsx',
			'src/components/layout/RightSidebar.tsx',
			'src/components/dev/PhantomConductor.tsx',
			'src/components/dev/DemoWidget.tsx',
			'src/lib/demo-sequences.ts',
			'src/app/(main)/challenges/page.tsx',
		]
			.map(readWorkspaceFile)
			.join('\n')

		expect(navigationCluster).not.toContain('/recipes/explore')
		expect(navigationCluster).not.toContain('/recipes?challenge=today')
		expect(navigationCluster).not.toContain("href='/cooking'")
		expect(navigationCluster).not.toContain('/explore?search=')
		expect(navigationCluster).not.toContain('/explore?difficulty=Beginner')
		expect(navigationCluster).toContain('PATHS.EXPLORE_SEARCH')
		expect(navigationCluster).toContain('PATHS.COOK')
		expect(navigationCluster).toContain('challenge.matchingRecipes.length > 2')
	})

	it('owns My Groups with a static route before the dynamic group detail route', () => {
		const myGroupsPage = readWorkspaceFile('src/app/(main)/groups/my/page.tsx')
		const groupsGrid = readWorkspaceFile(
			'src/components/groups/GroupsExploreGrid.tsx',
		)

		expect(myGroupsPage).toContain("source='mine'")
		expect(groupsGrid).toContain("source === 'mine'")
		expect(groupsGrid).toContain('await getMyGroups(undefined, pageNum, 12)')
		expect(myGroupsPage).toContain(
			'isHydrated && !isLoading && !isAuthenticated',
		)
	})

	it('defines every dashboard translation used by the page cluster', () => {
		const messages = JSON.parse(readWorkspaceFile('messages/en.json')) as {
			dashboard: Record<string, string>
		}
		const componentSources = readdirSync(
			join(process.cwd(), 'src/components/dashboard'),
		)
			.filter(file => file.endsWith('.tsx'))
			.map(file => readWorkspaceFile(`src/components/dashboard/${file}`))
			.filter(source => source.includes("useTranslations('dashboard')"))
		const dashboardSources = [
			readWorkspaceFile('src/app/(main)/dashboard/page.tsx'),
			...componentSources,
		]
		const usedKeys = new Set<string>()

		for (const source of dashboardSources) {
			for (const match of source.matchAll(
				/\b(?:t|td)(?:\.rich)?\('([^']+)'/g,
			)) {
				usedKeys.add(match[1])
			}
		}

		expect([...usedKeys].sort()).not.toEqual([])
		for (const key of usedKeys) {
			expect(messages.dashboard).toHaveProperty(key)
		}
	})
})
