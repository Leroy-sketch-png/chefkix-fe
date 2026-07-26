import fs from 'fs'
import path from 'path'

const source = fs.readFileSync(
	path.join(process.cwd(), 'src/app/(main)/settings/page.tsx'),
	'utf8',
)

describe('settings ButtonGroup contract', () => {
	it('uses an explicit localized disabled label at every caller', () => {
		expect(source.match(/<ButtonGroup/g)).toHaveLength(4)
		expect(source.match(/disabledLabel=\{t\('soon'\)\}/g)).toHaveLength(4)
		expect(source).toContain('disabledLabel: string')
		expect(source).not.toContain("t ? t('soon')")
		expect(source).not.toContain("'(Soon)'")
	})

	it('uses native disabled button semantics', () => {
		expect(source).toContain('disabled={option.disabled}')
		expect(source).toContain(
			'onClick={() => !option.disabled && onChange(option.value)}',
		)
	})
})
