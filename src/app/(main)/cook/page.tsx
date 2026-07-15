import type { Metadata } from 'next'
import { CookLauncherClient } from './CookLauncherClient'

export const metadata: Metadata = {
	title: 'Cook Now',
	description:
		'Resume an active cooking session or launch a guided cook from a ready recipe.',
}

export default function CookLauncherPage() {
	return <CookLauncherClient />
}
