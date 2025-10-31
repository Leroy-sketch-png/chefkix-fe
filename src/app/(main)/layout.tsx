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
		<div className='grid min-h-screen w-full grid-cols-1 bg-background md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr_300px]'>
			<LeftSidebar />
			<div className='flex flex-col'>
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
