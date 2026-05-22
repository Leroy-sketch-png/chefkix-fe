import { Topbar } from '@/components/layout/Topbar'
import { LeftSidebar } from '@/components/layout/LeftSidebar'
import { RightSidebar } from '@/components/layout/RightSidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { MessagesDrawer } from '@/components/layout/MessagesDrawer'
import { NotificationsPopup } from '@/components/layout/NotificationsPopup'
import { CookingPlayer } from '@/components/cooking/CookingPlayer'
import { CookingPanel } from '@/components/cooking/CookingPanel'
import { MiniCookingBar } from '@/components/cooking/MiniCookingBar'
import { CookingSidebarSwitch } from '@/components/cooking/CookingSidebarSwitch'
import { CookingTimerProvider } from '@/components/providers/CookingTimerProvider'
import { ErrorBoundary } from '@/components/providers/ErrorBoundary'
import { EventTrackerProvider } from '@/components/providers/EventTrackerProvider'
import { NotificationSocketProvider } from '@/components/providers/NotificationSocketProvider'
import { PushNotificationProvider } from '@/components/providers/PushNotificationProvider'
import { PresenceProvider } from '@/components/providers/PresenceProvider'
import { DemoWidget } from '@/components/dev/DemoWidget'
import { AppShell } from '@/components/layout/AppShell'

const SHOW_DEMO_WIDGET = process.env.NEXT_PUBLIC_ENABLE_DEMO_WIDGET === 'true'

export default function MainAppLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<>
			<AppShell
				header={
					<ErrorBoundary>
						<Topbar />
					</ErrorBoundary>
				}
				sidebar={
					<ErrorBoundary>
						<LeftSidebar />
					</ErrorBoundary>
				}
				rightPanel={
					<ErrorBoundary>
						<CookingSidebarSwitch />
					</ErrorBoundary>
				}
			>
				<ErrorBoundary>{children}</ErrorBoundary>
			</AppShell>

			{/* Global overlays and drawers - wrapped in error boundaries to prevent crashes */}
			<ErrorBoundary>
				<MessagesDrawer />
			</ErrorBoundary>
			<ErrorBoundary>
				<NotificationsPopup />
			</ErrorBoundary>
			{/* Fullscreen cooking player - for expanded mode */}
			<ErrorBoundary>
				<CookingPlayer />
			</ErrorBoundary>
			{/* Mini cooking bar - for mobile collapsed mode */}
			<ErrorBoundary>
				<MiniCookingBar />
			</ErrorBoundary>
			{/* Mobile bottom navigation - hidden on desktop, shown below md breakpoint */}
			<MobileBottomNav />
			{/* Centralized timer ticking + completion notifications */}
			<CookingTimerProvider />
			<EventTrackerProvider>{null}</EventTrackerProvider>
			{/* WebSocket provider - wrapped to prevent connection errors from crashing app */}
			<ErrorBoundary>
				<NotificationSocketProvider />
			</ErrorBoundary>
			<PushNotificationProvider />
			<PresenceProvider />
			{SHOW_DEMO_WIDGET ? <DemoWidget /> : null}
		</>
	)
}
