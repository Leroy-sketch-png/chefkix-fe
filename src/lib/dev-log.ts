const isDevelopment = process.env.NODE_ENV === 'development'

export const logDevError = (...args: unknown[]) => {
	if (!isDevelopment) return
	console.error(...args)
}

export const logDevWarn = (...args: unknown[]) => {
	if (!isDevelopment) return
	console.warn(...args)
}
