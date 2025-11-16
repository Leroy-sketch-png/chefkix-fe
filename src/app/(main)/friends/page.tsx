import { redirect } from 'next/navigation'
import { PATHS } from '@/constants/paths'

export default function FriendsRedirectPage() {
	redirect(PATHS.COMMUNITY)
}
