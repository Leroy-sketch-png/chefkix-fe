import fs from 'node:fs'
import path from 'node:path'

const profileDirectory = path.resolve(process.cwd(), 'src/components/profile')
const appDirectory = path.resolve(process.cwd(), 'src/app/(main)')

const read = (filePath: string) => fs.readFileSync(filePath, 'utf8')

describe('profile loading continuity contract', () => {
	it('loads profile data and the profile experience independently', () => {
		const source = read(path.join(profileDirectory, 'ProfilePageClient.tsx'))

		expect(source).toContain('if (UserProfileComponent) return')
		expect(source).not.toContain('if (!profile || UserProfileComponent) return')
		expect(source).toContain('}, [UserProfileComponent, componentLoadAttempt])')
		expect(source).toContain('setComponentError(true)')
		expect(source).toContain('setComponentLoadAttempt(count => count + 1)')
	})

	it('uses one profile chunk instead of nested blank dynamic boundaries', () => {
		const source = read(path.join(profileDirectory, 'UserProfile.tsx'))

		expect(source).not.toContain("from 'next/dynamic'")
		expect(source).not.toContain('loading: () => null')
		expect(source).not.toContain('const CookingHistoryTab = dynamic')
		expect(source).not.toContain('const ProfileCommandRail = dynamic')
	})

	it('keeps route, suspense, client, and redirect loading inside one shell', () => {
		const client = read(path.join(profileDirectory, 'ProfilePageClient.tsx'))
		const route = read(path.join(appDirectory, '[userId]/page.tsx'))
		const routeLoading = read(path.join(appDirectory, '[userId]/loading.tsx'))
		const redirectLoading = read(path.join(appDirectory, 'profile/loading.tsx'))

		for (const source of [client, route, routeLoading, redirectLoading]) {
			expect(source).toContain('ProfilePageShell')
		}
	})
})
