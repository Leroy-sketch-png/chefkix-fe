export type DemoInjectionEvent =
	| {
			type: 'FORCE_LEVEL_UP'
			data: { oldLevel: number; newLevel: number; xp: number }
	  }
	| { type: 'AI_OVERRIDE'; data: { text: string } }
	| {
			type: 'CO_COOK_SYNC'
			data: { userId: string; action: string; step?: number }
	  }
	| { type: 'LASER_FOCUS'; data: { selector: string } }
	| { type: 'TIME_WARP'; data: { enabled: boolean } }

type InjectorCallback = (event: DemoInjectionEvent) => void

declare global {
	interface Window {
		__DEMO_INJECTOR?: DemoInjector
	}
}

type DemoInjectorTarget = {
	__DEMO_INJECTOR?: DemoInjector
}

export class DemoInjector {
	private readonly listeners = new Set<InjectorCallback>()
	public timeWarpActive = false

	constructor(private readonly enabled: boolean) {}

	subscribe(callback: InjectorCallback) {
		if (!this.enabled) return () => undefined

		this.listeners.add(callback)
		return () => this.listeners.delete(callback)
	}

	dispatch(event: DemoInjectionEvent) {
		if (!this.enabled) return

		if (event.type === 'TIME_WARP') {
			this.timeWarpActive = event.data.enabled
		}
		this.listeners.forEach(callback => callback(event))
	}

	triggerLevelUp(oldLevel = 4, newLevel = 5, xp = 5000) {
		this.dispatch({ type: 'FORCE_LEVEL_UP', data: { oldLevel, newLevel, xp } })
	}

	injectAiResponse(
		text = 'Yes, you can substitute butter for olive oil in a 1:1 ratio. The flavor will be richer.',
	) {
		this.dispatch({ type: 'AI_OVERRIDE', data: { text } })
	}

	simulateCoCookFriend(action = 'check-ingredient') {
		this.dispatch({
			type: 'CO_COOK_SYNC',
			data: { userId: 'mock-friend', action },
		})
	}

	toggleTimeWarp(enabled: boolean) {
		this.dispatch({ type: 'TIME_WARP', data: { enabled } })
	}
}

export const createDemoInjector = (
	enabled: boolean,
	target?: DemoInjectorTarget,
) => {
	if (!enabled) {
		if (target) delete target.__DEMO_INJECTOR
		return new DemoInjector(false)
	}

	if (target?.__DEMO_INJECTOR) return target.__DEMO_INJECTOR

	const injector = new DemoInjector(true)
	if (target) target.__DEMO_INJECTOR = injector
	return injector
}

const demoInjectionEnabled =
	process.env.NEXT_PUBLIC_ENABLE_DEMO_WIDGET === 'true'

export const demoInjector = createDemoInjector(
	demoInjectionEnabled,
	typeof window === 'undefined' ? undefined : window,
)
