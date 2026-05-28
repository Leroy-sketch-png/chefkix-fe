import { useTelemetryStore } from './ghost-driver'
import { useCookingStore } from '@/store/cookingStore'

let lastSnapshot: any = null
let lastUrl: string = '/'
let lastScrollY: number = 0

export function saveTemporalSnapshot(beatName: string) {
	if (typeof window === 'undefined') return
	
	try {
		// Serialize all relevant Zustand stores
		lastSnapshot = {
			cookingStore: JSON.stringify(useCookingStore.getState())
		}
		
		lastUrl = window.location.pathname
		lastScrollY = window.scrollY
		
		useTelemetryStore.getState().addLog('CHRONOS', 'info', `Temporal Snapshot secured for beat: ${beatName}`)
	} catch (e) {
		useTelemetryStore.getState().addLog('CHRONOS', 'error', `Failed to snapshot: ${e}`)
	}
}

export async function rewindTimeline() {
	if (typeof window === 'undefined') return
	if (!lastSnapshot) {
		useTelemetryStore.getState().addLog('CHRONOS', 'warn', 'No temporal snapshot available for rewind.')
		return
	}
	
	useTelemetryStore.getState().addLog('CHRONOS', 'warn', '⏪ INITIATING TEMPORAL REWIND...')
	
	try {
		// 1. Rehydrate Route
		if (window.location.pathname !== lastUrl) {
			window.history.pushState(null, '', lastUrl)
			// Trigger popstate so Next.js or React Router notices the change
			window.dispatchEvent(new PopStateEvent('popstate'))
		}
		
		// 2. Rehydrate DOM Scroll
		window.scrollTo({ top: lastScrollY, behavior: 'instant' as ScrollBehavior })
		
		// 3. Rehydrate Zustand State
		useCookingStore.setState(JSON.parse(lastSnapshot.cookingStore))
		
		useTelemetryStore.getState().addLog('CHRONOS', 'success', 'Temporal Rehydration Complete. Reality restored.')
	} catch (e) {
		useTelemetryStore.getState().addLog('CHRONOS', 'error', `Temporal Rehydration Failed: ${e}`)
	}
}
