import { redirect } from 'next/navigation'

/**
 * /feed is a legacy route. Dashboard IS the feed for authenticated users.
 * Guests are redirected to /explore instead.
 */
export default function FeedPage() {
	redirect('/explore')
}
