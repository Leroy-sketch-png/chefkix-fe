import fs from 'node:fs'
import path from 'node:path'

describe('Next build output isolation', () => {
	it('keeps development artifacts away from the production bundle', () => {
		const config = fs.readFileSync(
			path.join(process.cwd(), 'next.config.mjs'),
			'utf8',
		)

		expect(config).toContain(
			"distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next'",
		)
	})

	it('keeps both generated output directories out of source control', () => {
		const gitignore = fs.readFileSync(
			path.join(process.cwd(), '.gitignore'),
			'utf8',
		)

		expect(gitignore).toContain('/.next/')
		expect(gitignore).toContain('/.next-dev/')
	})

	it('includes generated development route types in TypeScript checks', () => {
		const tsconfig = fs.readFileSync(
			path.join(process.cwd(), 'tsconfig.json'),
			'utf8',
		)

		expect(tsconfig).toContain('".next-dev/types/**/*.ts"')
	})
})
