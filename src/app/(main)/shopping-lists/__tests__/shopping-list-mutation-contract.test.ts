import fs from 'fs'
import path from 'path'

describe('shopping-list item mutation authority', () => {
	const source = fs.readFileSync(
		path.join(process.cwd(), 'src/app/(main)/shopping-lists/page.tsx'),
		'utf8',
	)

	it('serializes every complete-list writer through one whole-list lock', () => {
		expect(source).toContain('const listMutationLockRef = useRef(false)')
		expect(source.match(/beginListMutation\(/g)).toHaveLength(5)
		expect(source).toContain("beginListMutation({ type: 'share' })")
		expect(source).toContain("beginListMutation({ type: 'reset-share' })")
		expect(source).not.toContain('addingItemRef')
		expect(source).not.toContain('removingItemRef')
	})

	it('applies authoritative toggle responses only to the initiating list', () => {
		expect(source).toContain(
			'const updated = await toggleShoppingItem(listId, itemId)',
		)
		expect(source).toContain('applyListResponse(listId, updated)')
		expect(source).toContain('current?.id === listId ? response : current')
	})

	it('keeps checked rows and checkedItems aligned during local rollback', () => {
		expect(source).toContain('? { ...item, checked: originalChecked }')
		expect(
			source.match(
				/checkedItems: items\.filter\(item => item\.checked\)\.length/g,
			),
		).toHaveLength(2)
	})

	it('distinguishes an absent meal plan from a failed list creation request', () => {
		const createHandler = source.slice(
			source.indexOf('const handleCreateFromMealPlan'),
			source.indexOf('const handleCreateCustom'),
		)

		const normalizedHandler = createHandler.replace(/\s+/g, '')
		expect(normalizedHandler).toContain(
			"if(!plan){toast.error(t('noMealPlan'))",
		)
		expect(normalizedHandler).toContain(
			"catch{toast.error(t('failedCreateFromMealPlan'))",
		)
		expect(createHandler.match(/t\('noMealPlan'\)/g)).toHaveLength(1)
	})
})
