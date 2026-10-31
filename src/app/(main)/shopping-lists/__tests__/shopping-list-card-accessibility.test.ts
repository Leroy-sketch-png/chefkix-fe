import fs from 'node:fs'
import path from 'node:path'

const source = fs.readFileSync(
	path.join(process.cwd(), 'src/app/(main)/shopping-lists/page.tsx'),
	'utf8',
)

describe('shopping-list card accessibility contract', () => {
	it('uses an independently named native button to open each list', () => {
		expect(source).toContain(
			"aria-label={t('ariaOpenList', { name: list.name })}",
		)
		expect(source).toContain('onClick={() => handleOpenList(list.id)}')
		expect(source).toContain("type='button'")
	})

	it('keeps delete independent from the open action', () => {
		expect(source).toContain("className='relative z-20 flex size-10")
		expect(source).toContain('onClick={() => setConfirmingDeleteId(list.id)}')
		expect(source).not.toMatch(
			/onClick=\{e => \{[\s\S]{0,120}setConfirmingDeleteId\(list\.id\)/,
		)
	})

	it('does not assign click authority to the card container', () => {
		expect(source).toContain('<motion.article')
		expect(source).not.toMatch(
			/<motion\.(?:div|article)[\s\S]{0,180}onClick=\{\(\) => handleOpenList/,
		)
	})

	it('uses the matching overview title in the detail view when available', () => {
		expect(source).toContain(
			'lists.find(list => list.id === selectedList.id)?.name ?? selectedList.name',
		)
		expect(source).toContain('heading={selectedListName}')
	})
})
