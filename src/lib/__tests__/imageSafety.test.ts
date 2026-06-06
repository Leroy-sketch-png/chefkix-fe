import {
	isKnownBrokenImageSrc,
	RECIPE_IMAGE_PLACEHOLDER,
	safeRecipeImageSrc,
} from '../imageSafety'
import { getRecipeImage } from '../types/recipe'

describe('image safety helpers', () => {
	it('identifies known broken external image sources before render', () => {
		expect(
			isKnownBrokenImageSrc(
				'https://images.unsplash.com/photo-1482049016530-d79f7d5e8c6e?w=800',
			),
		).toBe(true)
		expect(isKnownBrokenImageSrc('/images/hero/cacio-e-pepe.png')).toBe(false)
		expect(isKnownBrokenImageSrc(undefined)).toBe(false)
	})

	it('uses the recipe placeholder for empty or known broken recipe images', () => {
		expect(safeRecipeImageSrc(undefined)).toBe(RECIPE_IMAGE_PLACEHOLDER)
		expect(safeRecipeImageSrc('')).toBe(RECIPE_IMAGE_PLACEHOLDER)
		expect(
			safeRecipeImageSrc(
				'https://images.unsplash.com/photo-1596097635121-14b63a7a7e7b?w=800',
			),
		).toBe(RECIPE_IMAGE_PLACEHOLDER)
	})

	it('funnels recipe image selection through image safety', () => {
		expect(
			getRecipeImage({
				coverImageUrl: [
					'https://images.unsplash.com/photo-1482049016530-d79f7d5e8c6e?w=800',
				],
			}),
		).toBe(RECIPE_IMAGE_PLACEHOLDER)

		expect(
			getRecipeImage({
				coverImageUrl: ['/images/recipes/live-demo-cacio.png'],
			}),
		).toBe('/images/recipes/live-demo-cacio.png')
	})
})
