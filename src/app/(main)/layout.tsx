import { Topbar } from '@/components/layout/Topbar'
import { LeftSidebar } from '@/components/layout/LeftSidebar'
import { RightSidebar } from '@/components/layout/RightSidebar'
import { MessagesDrawer } from '@/components/layout/MessagesDrawer'
import { NotificationsPopup } from '@/components/layout/NotificationsPopup'
import { CookingPlayer } from '@/components/cooking/CookingPlayer'

export default function MainAppLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className='flex min-h-screen w-full overflow-x-hidden bg-background'>
			<LeftSidebar />
			<div className='flex min-w-0 flex-1 flex-col'>
				<Topbar />
				<main className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
					{children}
				</main>
			</div>
			<RightSidebar />
			<MessagesDrawer />
			<NotificationsPopup />
			<CookingPlayer />
		</div>
	)
}
