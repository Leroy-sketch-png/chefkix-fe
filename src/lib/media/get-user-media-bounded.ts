export const MEDIA_PERMISSION_TIMEOUT_MS = 12_000

export async function getUserMediaBounded(
	constraints: MediaStreamConstraints,
	timeoutMs = MEDIA_PERMISSION_TIMEOUT_MS,
): Promise<MediaStream> {
	if (!navigator.mediaDevices?.getUserMedia) {
		throw new DOMException(
			'Media devices are unavailable.',
			'NotSupportedError',
		)
	}

	let timedOut = false
	const request = navigator.mediaDevices.getUserMedia(constraints)
	request
		.then(stream => {
			if (timedOut) stream.getTracks().forEach(track => track.stop())
		})
		.catch(() => undefined)

	let timeoutId = 0
	const timeout = new Promise<never>((_, reject) => {
		timeoutId = window.setTimeout(() => {
			timedOut = true
			reject(new DOMException('Permission request timed out.', 'TimeoutError'))
		}, timeoutMs)
	})

	try {
		return await Promise.race([request, timeout])
	} finally {
		window.clearTimeout(timeoutId)
	}
}
