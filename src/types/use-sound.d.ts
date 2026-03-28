declare module 'use-sound' {
	export default function useSound(
		soundUrl: string | string[],
		options?: any,
	): [
		() => void,
		{
			stop: () => void
			pause: () => void
			duration: number | null
			sound: any
		},
	]
}
