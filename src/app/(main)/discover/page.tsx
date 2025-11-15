import { redirect } from 'next/navigation'
import { PATHS } from '@/constants'

export default function DiscoverRedirect() {
	redirect(PATHS.COMMUNITY)
}
