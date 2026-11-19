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

	it('derives detail totals and progress from the displayed item rows', () => {
		expect(source).toContain(
			'const selectedListTotalItems = selectedList?.items.length ?? 0',
		)
		expect(source).toContain(
			'selectedList?.items.filter(item => item.checked).length ?? 0',
		)
		expect(source).toContain('checkedItems: selectedListCheckedItems')
		expect(source).not.toContain('checkedItems: selectedList.checkedItems')
	})

	it('uses the current CookPlan instead of the hidden legacy weekly-plan path', () => {
		const createHandler = source.slice(
			source.indexOf('const handleCreateFromTodayPlan'),
			source.indexOf('const handleCreateCustom'),
		)

		expect(createHandler).toContain(
			'createShoppingListFromCurrentCookPlan(planDate)',
		)
		expect(createHandler).toContain("t('noCookPlan')")
		expect(createHandler).toContain("router.push('/meal-planner')")
		expect(createHandler).toContain("t('failedCreateFromTodayPlan')")
		expect(source).not.toContain('getCurrentMealPlan')
		expect(source).not.toContain('createFromMealPlan')
	})
})
