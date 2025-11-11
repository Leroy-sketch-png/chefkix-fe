import { Topbar } from '@/components/layout/Topbar'
import { LeftSidebar } from '@/components/layout/LeftSidebar'
import { RightSidebar } from '@/components/layout/RightSidebar'
import { MessagesDrawer } from '@/components/layout/MessagesDrawer'
import { NotificationsPopup } from '@/components/layout/NotificationsPopup'
import { CookingPlayer } from '@/components/cooking/CookingPlayer'
import { ErrorBoundary } from '@/components/providers/ErrorBoundary'

export default function MainAppLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className='flex h-screen w-full flex-col overflow-hidden bg-background'>
			{/* Topbar fixed at top, spans full width */}
			<ErrorBoundary>
				<Topbar />
			</ErrorBoundary>
			{/* Main content area with sidebars - scrollable */}
			<div className='flex flex-1 overflow-hidden'>
				<ErrorBoundary>
					<LeftSidebar />
				</ErrorBoundary>
				<main className='flex flex-1 flex-col gap-4 overflow-y-auto scroll-smooth p-4 lg:gap-6 lg:p-6'>
					<ErrorBoundary>{children}</ErrorBoundary>
				</main>
				<ErrorBoundary>
					<RightSidebar />
				</ErrorBoundary>
			</div>
			<MessagesDrawer />
			<NotificationsPopup />
			<CookingPlayer />
		</div>
	)
}
