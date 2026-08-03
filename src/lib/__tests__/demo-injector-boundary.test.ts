import {
	createDemoInjector,
	type DemoInjectionEvent,
} from '@/lib/demo-injector'

describe('demo injector capability boundary', () => {
	it('is inert and removes stale browser exposure when disabled', () => {
		const stale = createDemoInjector(true)
		const target = { __DEMO_INJECTOR: stale }
		const injector = createDemoInjector(false, target)
		const listener = jest.fn<void, [DemoInjectionEvent]>()

		injector.subscribe(listener)
		injector.injectAiResponse('fabricated guidance')
		injector.toggleTimeWarp(true)

		expect(listener).not.toHaveBeenCalled()
		expect(injector.timeWarpActive).toBe(false)
		expect(target.__DEMO_INJECTOR).toBeUndefined()
	})

	it('retains presenter events and browser exposure when enabled', () => {
		const target: { __DEMO_INJECTOR?: ReturnType<typeof createDemoInjector> } =
			{}
		const injector = createDemoInjector(true, target)
		const listener = jest.fn<void, [DemoInjectionEvent]>()

		injector.subscribe(listener)
		injector.injectAiResponse('presenter guidance')
		injector.toggleTimeWarp(true)

		expect(target.__DEMO_INJECTOR).toBe(injector)
		expect(listener).toHaveBeenNthCalledWith(1, {
			type: 'AI_OVERRIDE',
			data: { text: 'presenter guidance' },
		})
		expect(listener).toHaveBeenNthCalledWith(2, {
			type: 'TIME_WARP',
			data: { enabled: true },
		})
		expect(injector.timeWarpActive).toBe(true)
	})

	it('reuses the enabled singleton for hot reload continuity', () => {
		const target: { __DEMO_INJECTOR?: ReturnType<typeof createDemoInjector> } =
			{}
		const first = createDemoInjector(true, target)
		const second = createDemoInjector(true, target)

		expect(second).toBe(first)
	})
})
