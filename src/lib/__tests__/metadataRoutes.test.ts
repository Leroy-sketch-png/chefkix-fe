import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const readWorkspaceFile = (path: string) =>
	readFileSync(join(process.cwd(), path), 'utf8')

const metadataRoutes = [
	{
		page: 'src/app/welcome/page.tsx',
		client: 'src/app/welcome/WelcomeClient.tsx',
		component: '<WelcomeClient />',
	},
	{
		page: 'src/app/auth/sign-in/page.tsx',
		client: 'src/app/auth/sign-in/SignInClient.tsx',
		component: '<SignInClient />',
	},
	{
		page: 'src/app/auth/sign-up/page.tsx',
		client: 'src/app/auth/sign-up/SignUpClient.tsx',
		component: '<SignUpClient />',
	},
	{
		page: 'src/app/auth/verify-otp/page.tsx',
		client: 'src/app/auth/verify-otp/VerifyOtpClient.tsx',
		component: '<VerifyOtpClient />',
	},
	{
		page: 'src/app/(main)/dashboard/page.tsx',
		client: 'src/app/(main)/dashboard/DashboardClient.tsx',
		component: '<DashboardClient />',
	},
	{
		page: 'src/app/(main)/explore/page.tsx',
		client: 'src/app/(main)/explore/ExploreClient.tsx',
		component: '<ExploreClient />',
	},
]

describe('route metadata guardrails', () => {
	it('keeps investor-path pages as server metadata wrappers', () => {
		for (const route of metadataRoutes) {
			const page = readWorkspaceFile(route.page)

			expect(page).toContain('export const metadata')
			expect(page).toContain(route.component)
			expect(page).not.toMatch(/^['"]use client['"]/)
		}
	})

	it('keeps interactive route bodies in explicit client components', () => {
		for (const route of metadataRoutes) {
			const client = readWorkspaceFile(route.client)

			expect(client).toMatch(/^['"]use client['"]/)
		}
	})

	it('keeps private and transactional metadata out of search results', () => {
		const privatePages = [
			'src/app/auth/sign-in/page.tsx',
			'src/app/auth/verify-otp/page.tsx',
			'src/app/(main)/dashboard/page.tsx',
		]

		for (const pagePath of privatePages) {
			const page = readWorkspaceFile(pagePath)

			expect(page).toContain('index: false')
			expect(page).toContain('follow: false')
		}
	})
})
