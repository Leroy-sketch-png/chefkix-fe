import { act, render, screen } from '@testing-library/react'
import { DemoCockpitRuntime } from '../DemoCockpitRuntime'
import { formatTime, usePaceTimerState } from '../PaceTimer'

jest.mock('next/navigation', () => ({
	usePathname: () => '/demo-cockpit',
}))

jest.mock('../PhantomConductor', () => ({
	PhantomConductor: () => null,
}))

const PACE_TIMER_STORAGE_KEY = 'chefkix-demo-pace-timer-v1'

function TimerProbe() {
	const timer = usePaceTimerState()
	return (
		<output data-testid='timer-total'>
			{formatTime(timer.totalElapsedMs)}
		</output>
	)
}

describe('demo cockpit pace timer', () => {
	beforeEach(() => {
		localStorage.clear()
	})

	it('owns timer commands while the cockpit is still on its armed screen', () => {
		render(<DemoCockpitRuntime />)

		act(() => {
			window.dispatchEvent(new CustomEvent('chefkix-pace-start'))
		})

		const started = JSON.parse(
			localStorage.getItem(PACE_TIMER_STORAGE_KEY) || '{}',
		)
		expect(started.isVisible).toBe(true)
		expect(started.beatStartedAt).toEqual(expect.any(Number))
		expect(started.sessionStartedAt).toEqual(expect.any(Number))

		act(() => {
			window.dispatchEvent(new CustomEvent('chefkix-pace-reset'))
		})
		expect(localStorage.getItem(PACE_TIMER_STORAGE_KEY)).toBeNull()
	})

	it('migrates an older persisted timer without producing an invalid total', () => {
		localStorage.setItem(
			PACE_TIMER_STORAGE_KEY,
			JSON.stringify({
				isVisible: true,
				currentBeatIndex: 0,
				beatStartedAt: Date.now(),
				sessionStartedAt: Date.now(),
				isPaused: false,
				pausedElapsedMs: 0,
			}),
		)

		render(<TimerProbe />)

		expect(screen.getByTestId('timer-total').textContent).toMatch(
			/^\d{2}:\d{2}$/,
		)
	})
})
