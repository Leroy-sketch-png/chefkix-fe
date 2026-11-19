import { canOfferStepPhotoPrompt } from '../step-photo-prompt'

describe('step photo prompt mode', () => {
	it('keeps the touch-only capture prompt out of voice-primary messy-hands mode', () => {
		expect(canOfferStepPhotoPrompt('MESSY_HANDS')).toBe(false)
	})

	it.each(['PREP', 'ACTIVE', 'MONITORING'] as const)(
		'offers the optional photo prompt outside messy-hands mode (%s)',
		mode => {
			expect(canOfferStepPhotoPrompt(mode)).toBe(true)
		},
	)

	it.each(['COMPLETION', null] as const)(
		'does not offer the prompt without an active touch-capable step (%s)',
		mode => {
			expect(canOfferStepPhotoPrompt(mode)).toBe(false)
		},
	)
})
