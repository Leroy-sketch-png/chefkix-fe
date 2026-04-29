declare module 'use-sound' {
	interface UseSoundOptions {
		volume?: number
		playbackRate?: number
		interrupt?: boolean
		soundEnabled?: boolean
		loop?: boolean
		sprite?: Record<string, [number, number]>
		onplay?: () => void
		onend?: () => void
		onpause?: () => void
		onstop?: () => void
		onload?: () => void
		onloaderror?: (id: number | null, error: unknown) => void
	}

	interface ExposedData {
		stop: () => void
		pause: () => void
		duration: number | null
		sound: Howl | null
	}

	export default function useSound(
		soundUrl: string | string[],
		options?: UseSoundOptions,
	): [() => void, ExposedData]
}
