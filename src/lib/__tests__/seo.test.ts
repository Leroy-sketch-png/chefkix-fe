import { generateRecipeJsonLd, jsonLd, serializeJsonLd } from '@/lib/seo'

describe('seo JSON-LD helpers', () => {
	it('escapes script-breaking characters in structured data', () => {
		const payload = {
			'@type': 'Recipe',
			name: '</script><img src=x onerror=alert(1)>',
			description: 'line separator \u2028 paragraph separator \u2029',
		}

		const serialized = serializeJsonLd(payload)

		expect(serialized).not.toContain('</script>')
		expect(serialized).not.toContain('<img')
		expect(serialized).toContain('\\u003c/script>')
		expect(serialized).toContain('\\u003cimg')
		expect(serialized).toContain('\\u2028')
		expect(serialized).toContain('\\u2029')
		expect(JSON.parse(serialized)).toEqual(payload)
	})

	it('uses the safe serializer for recipe JSON-LD script props', () => {
		const recipeJsonLd = generateRecipeJsonLd({
			id: 'recipe-1',
			title: '</script><img src=x onerror=alert(1)>',
			description: 'unsafe title regression',
		})

		const scriptProps = jsonLd(recipeJsonLd)

		expect(scriptProps.__html).not.toContain('</script>')
		expect(scriptProps.__html).toContain('\\u003c/script>')
		expect(JSON.parse(scriptProps.__html).name).toBe(
			'</script><img src=x onerror=alert(1)>',
		)
	})
})
