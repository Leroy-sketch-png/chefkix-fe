import type { ImageProps } from 'next/image'

type ImageSrc = ImageProps['src']

interface CloudinaryTransformOptions {
	width?: number
	height?: number
	crop?: 'limit' | 'fill' | 'fit' | 'thumb'
	quality?: string
	format?: string
}

const CLOUDINARY_IMAGE_UPLOAD_PATTERN =
	/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/i

const DEFAULT_CLOUDINARY_OPTIONS: Required<
	Pick<CloudinaryTransformOptions, 'crop' | 'quality' | 'format'>
> & {
	width: number
	height?: number
} = {
	width: 1600,
	crop: 'limit',
	quality: 'auto',
	format: 'auto',
}

export function isRemoteImageSrc(src: ImageSrc | null | undefined): boolean {
	return typeof src === 'string' && /^https?:\/\//i.test(src)
}

export function isCloudinaryImageSrc(
	src: ImageSrc | null | undefined,
): boolean {
	return (
		typeof src === 'string' && CLOUDINARY_IMAGE_UPLOAD_PATTERN.test(src.trim())
	)
}

export function getOptimizedCloudinaryImageSrc(
	src: string,
	options: CloudinaryTransformOptions = {},
): string {
	const trimmedSrc = src.trim()
	const match = CLOUDINARY_IMAGE_UPLOAD_PATTERN.exec(trimmedSrc)
	if (!match) return src

	const [, prefix, rest] = match
	if (!prefix || !rest) return src

	const merged = { ...DEFAULT_CLOUDINARY_OPTIONS, ...options }
	const transformParts = [
		`c_${merged.crop}`,
		`w_${merged.width}`,
		merged.height ? `h_${merged.height}` : null,
		`q_${merged.quality}`,
		`f_${merged.format}`,
	].filter(Boolean)
	const transform = transformParts.join(',')

	if (rest.startsWith(`${transform}/`)) return trimmedSrc

	return `${prefix}${transform}/${rest}`
}

export function getImageDeliveryProps(
	src: ImageSrc,
	options: CloudinaryTransformOptions = {},
): { src: ImageSrc; unoptimized: boolean } {
	if (!isRemoteImageSrc(src)) {
		return { src, unoptimized: false }
	}

	if (typeof src === 'string' && isCloudinaryImageSrc(src)) {
		return {
			src: getOptimizedCloudinaryImageSrc(src, options),
			unoptimized: false,
		}
	}

	return { src, unoptimized: true }
}
