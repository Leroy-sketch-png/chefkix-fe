import { Topbar } from '@/components/layout/Topbar'
import { LeftSidebar } from '@/components/layout/LeftSidebar'
import { RightSidebar } from '@/components/layout/RightSidebar'
import { MessagesDrawer } from '@/components/layout/MessagesDrawer'
import { NotificationsPopup } from '@/components/layout/NotificationsPopup'
import { CookingPlayer } from '@/components/cooking/CookingPlayer'
import { CookingPanel } from '@/components/cooking/CookingPanel'
import { MiniCookingBar } from '@/components/cooking/MiniCookingBar'
import { CookingSidebarSwitch } from '@/components/cooking/CookingSidebarSwitch'
import { CookingTimerProvider } from '@/components/providers/CookingTimerProvider'
import { ErrorBoundary } from '@/components/providers/ErrorBoundary'
import { KeyboardShortcuts } from '@/components/shared/KeyboardShortcuts'

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
				{/* Conditional: CookingPanel (when cooking) or RightSidebar (default) */}
				<ErrorBoundary>
					<CookingSidebarSwitch />
				</ErrorBoundary>
			</div>
			<MessagesDrawer />
			<NotificationsPopup />
			{/* Fullscreen cooking player - for expanded mode */}
			<CookingPlayer />
			{/* Mini cooking bar - for mobile collapsed mode */}
			<MiniCookingBar />
			{/* Centralized timer ticking + completion notifications */}
			<CookingTimerProvider />
			<KeyboardShortcuts />
		</div>
	)
}
