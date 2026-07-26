import { act, render, screen, waitFor } from '@testing-library/react'
import {
	RuntimePreferencesProvider,
	useRuntimePreferences,
} from '../RuntimePreferencesProvider'
import { DEFAULT_APP_PREFERENCES } from '@/lib/types/settings'

const mockGetAppPreferences = jest.fn()
const mockSetMotionPreference = jest.fn()
const mockSetAudioEnabled = jest.fn()
const mockSetKitchenPreferences = jest.fn()
let mockAuth: {
	isAuthenticated: boolean
	isHydrated: boolean
	user: { userId: string } | null
} = {
	isAuthenticated: true,
	isHydrated: true,
	user: { userId: 'cook-1' },
}

jest.mock('@/hooks/useAuth', () => ({
	useAuth: () => mockAuth,
}))

jest.mock('@/services/settings', () => ({
	getAppPreferences: () => mockGetAppPreferences(),
}))

jest.mock('@/components/providers/ReducedMotionProvider', () => ({
	useReducedMotionPreference: () => ({
		setMotionPreference: mockSetMotionPreference,
	}),
}))

jest.mock('@/lib/audio', () => ({
	setAudioEnabled: (enabled: boolean) => mockSetAudioEnabled(enabled),
}))

jest.mock('@/lib/voice', () => ({
	getKitchenAudioCoordinator: () => ({
		setPreferences: mockSetKitchenPreferences,
	}),
}))

function PreferenceProbe() {
	const { preferences, isReady, applyPreferences } = useRuntimePreferences()
	return (
		<div>
			<span data-testid='ready'>{String(isReady)}</span>
			<span data-testid='autoplay'>{String(preferences.autoPlayVideos)}</span>
			<span data-testid='wake'>{String(preferences.keepScreenOn)}</span>
			<button
				type='button'
				onClick={() =>
					applyPreferences({
						autoPlayVideos: true,
						keepScreenOn: true,
						reducedMotion: false,
					})
				}
			>
				Apply
			</button>
		</div>
	)
}

describe('RuntimePreferencesProvider', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockAuth = {
			isAuthenticated: true,
			isHydrated: true,
			user: { userId: 'cook-1' },
		}
		mockGetAppPreferences.mockResolvedValue({
			success: true,
			data: {
				...DEFAULT_APP_PREFERENCES,
				autoPlayVideos: false,
				keepScreenOn: false,
				reducedMotion: true,
				soundEffects: false,
			},
		})
	})

	it('hydrates authenticated runtime behavior from server preferences', async () => {
		render(
			<RuntimePreferencesProvider>
				<PreferenceProbe />
			</RuntimePreferencesProvider>,
		)

		await waitFor(() => {
			expect(screen.getByTestId('ready').textContent).toBe('true')
		})
		expect(screen.getByTestId('autoplay').textContent).toBe('false')
		expect(screen.getByTestId('wake').textContent).toBe('false')
		expect(mockGetAppPreferences).toHaveBeenCalledTimes(1)
		expect(mockSetMotionPreference).toHaveBeenCalledWith('reduced')
		expect(mockSetAudioEnabled).toHaveBeenCalledWith(false)
		expect(mockSetKitchenPreferences).toHaveBeenCalledWith(
			DEFAULT_APP_PREFERENCES.kitchenAudio,
		)
	})

	it('applies an optimistic runtime update synchronously', async () => {
		render(
			<RuntimePreferencesProvider>
				<PreferenceProbe />
			</RuntimePreferencesProvider>,
		)
		await waitFor(() => {
			expect(screen.getByTestId('ready').textContent).toBe('true')
		})

		act(() => {
			screen.getByRole('button', { name: 'Apply' }).click()
		})

		expect(screen.getByTestId('autoplay').textContent).toBe('true')
		expect(screen.getByTestId('wake').textContent).toBe('true')
		expect(mockSetMotionPreference).toHaveBeenLastCalledWith('auto')
	})

	it('keeps preference-gated behavior disabled when hydration fails', async () => {
		mockGetAppPreferences.mockResolvedValue({
			success: false,
			message: 'Unavailable',
			statusCode: 503,
		})

		render(
			<RuntimePreferencesProvider>
				<PreferenceProbe />
			</RuntimePreferencesProvider>,
		)

		await waitFor(() => {
			expect(mockGetAppPreferences).toHaveBeenCalledTimes(1)
		})
		expect(screen.getByTestId('ready').textContent).toBe('false')
		expect(mockSetMotionPreference).not.toHaveBeenCalled()
		expect(mockSetAudioEnabled).not.toHaveBeenCalled()
		expect(mockSetKitchenPreferences).not.toHaveBeenCalled()
	})

	it('does not fetch account preferences for a guest', async () => {
		mockAuth = {
			isAuthenticated: false,
			isHydrated: true,
			user: null,
		}

		render(
			<RuntimePreferencesProvider>
				<PreferenceProbe />
			</RuntimePreferencesProvider>,
		)

		await waitFor(() => {
			expect(screen.getByTestId('ready').textContent).toBe('true')
		})
		expect(mockGetAppPreferences).not.toHaveBeenCalled()
		expect(screen.getByTestId('autoplay').textContent).toBe('true')
		expect(screen.getByTestId('wake').textContent).toBe('true')
	})
})
