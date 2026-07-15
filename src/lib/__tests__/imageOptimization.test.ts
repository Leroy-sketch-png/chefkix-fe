import {
	getImageDeliveryProps,
	getOptimizedCloudinaryImageSrc,
	isCloudinaryImageSrc,
} from '../imageOptimization'

describe('imageOptimization', () => {
	it('detects Cloudinary image delivery URLs only', () => {
		expect(
			isCloudinaryImageSrc(
				'https://res.cloudinary.com/demo/image/upload/v123/chefkix/photo.jpg',
			),
		).toBe(true)
		expect(
			isCloudinaryImageSrc(
				'https://res.cloudinary.com/demo/video/upload/v123/clip.mp4',
			),
		).toBe(false)
		expect(isCloudinaryImageSrc('https://example.com/photo.jpg')).toBe(false)
	})

	it('adds bounded delivery transforms to Cloudinary image URLs', () => {
		expect(
			getOptimizedCloudinaryImageSrc(
				'https://res.cloudinary.com/demo/image/upload/v123/chefkix/photo.jpg',
				{ width: 800, height: 600, crop: 'fill' },
			),
		).toBe(
			'https://res.cloudinary.com/demo/image/upload/c_fill,w_800,h_600,q_auto,f_auto/v123/chefkix/photo.jpg',
		)
	})

	it('uses Next image optimization for Cloudinary but keeps unknown remotes unoptimized', () => {
		expect(
			getImageDeliveryProps(
				'https://res.cloudinary.com/demo/image/upload/v123/photo.jpg',
				{ width: 400 },
			),
		).toEqual({
			src: 'https://res.cloudinary.com/demo/image/upload/c_limit,w_400,q_auto,f_auto/v123/photo.jpg',
			unoptimized: false,
		})

		expect(getImageDeliveryProps('https://example.com/photo.jpg')).toEqual({
			src: 'https://example.com/photo.jpg',
			unoptimized: true,
		})
	})
})
