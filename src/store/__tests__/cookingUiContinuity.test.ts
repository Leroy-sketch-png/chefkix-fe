import fs from 'fs'
import path from 'path'
import { useCookingStore } from '@/store/cookingStore'
import { resolveCookingCloseMode, useUiStore } from '@/store/uiStore'

const activeSession = {
	sessionId: 'session-1',
	recipeId: 'recipe-1',
	status: 'in_progress',
} as unknown as NonNullable<
	ReturnType<typeof useCookingStore.getState>['session']
>

const loadedRecipe = {
	id: 'recipe-1',
	title: 'Pho',
	steps: [],
} as unknown as NonNullable<
	ReturnType<typeof useCookingStore.getState>['recipe']
>

describe('cooking UI continuity', () => {
	beforeEach(() => {
		useCookingStore.setState({
			session: null,
			recipe: null,
			isPreviewMode: false,
		})
		useUiStore.setState({
			cookingMode: 'expanded',
			isCookingPlayerOpen: true,
		})
	})

	it.each(['in_progress', 'paused'])(
		'keeps a loaded %s session reopenable',
		status => {
			expect(
				resolveCookingCloseMode({
					isPreviewMode: false,
					session: { status },
					recipe: { title: 'Pho' },
				}),
			).toBe('mini')
		},
	)

	it.each([
		['preview', true, { status: 'in_progress' }, { title: 'Pho' }],
		['absent session', false, null, { title: 'Pho' }],
		['missing recipe', false, { status: 'in_progress' }, null],
		['partial session', false, {}, { title: 'Pho' }],
		['completed session', false, { status: 'completed' }, { title: 'Pho' }],
		['abandoned session', false, { status: 'abandoned' }, { title: 'Pho' }],
		['unknown status', false, { status: 'expired' }, { title: 'Pho' }],
	])('hides %s state', (_label, isPreviewMode, session, recipe) => {
		expect(resolveCookingCloseMode({ isPreviewMode, session, recipe })).toBe(
			'hidden',
		)
	})

	it.each(['closeCookingPanel', 'minimizeCookingPanel'] as const)(
		'%s collapses a live session to mini through the real store',
		action => {
			useCookingStore.setState({
				session: activeSession,
				recipe: loadedRecipe,
			})

			useUiStore.getState()[action]()

			expect(useUiStore.getState()).toMatchObject({
				cookingMode: 'mini',
				isCookingPlayerOpen: false,
			})
		},
	)

	it('closes a terminal session to hidden through the real store', () => {
		useCookingStore.setState({
			session: { ...activeSession, status: 'completed' },
			recipe: loadedRecipe,
		})

		useUiStore.getState().closeCookingPanel()

		expect(useUiStore.getState()).toMatchObject({
			cookingMode: 'hidden',
			isCookingPlayerOpen: false,
		})
	})

	it('routes every close owner through one policy and preserves desktop mini mode', () => {
		const read = (file: string) =>
			fs.readFileSync(path.join(process.cwd(), file), 'utf8')
		const store = read('src/store/uiStore.ts')
		const mini = read('src/components/cooking/MiniCookingBar.tsx')

		// One declaration plus four policy consumers: legacy toggle, setter, close, minimize.
		expect(store.match(/resolveCurrentCookingCloseMode\(\)/g)).toHaveLength(5)
		// Hidden remains the initial mode, but no transition assigns it directly.
		expect(store.match(/cookingMode: 'hidden'/g)).toHaveLength(1)
		expect(mini).toContain("cookingMode === 'docked' && 'xl:hidden'")
		expect(mini).not.toContain('md:bottom-0 xl:hidden')
	})
})
