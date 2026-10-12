'use client'

import { SmilePlus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const ROOM_REACTIONS = [
	{ emoji: '🔥', labelKey: 'ctReactionFire' },
	{ emoji: '👏', labelKey: 'ctReactionApplause' },
	{ emoji: '❤️', labelKey: 'ctReactionLove' },
	{ emoji: '😂', labelKey: 'ctReactionLaugh' },
	{ emoji: '😮', labelKey: 'ctReactionWow' },
	{ emoji: '💪', labelKey: 'ctReactionStrong' },
] as const

interface RoomReactionControlProps {
	isConnected: boolean
	kitchenMode?: boolean
	onSelect: (emoji: string) => void
}

export function RoomReactionControl({
	isConnected,
	kitchenMode = false,
	onSelect,
}: RoomReactionControlProps) {
	const t = useTranslations('cooking')
	const accessibleLabel = isConnected
		? t('ctReactionPickerLabel')
		: t('ctConnecting')

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type='button'
					disabled={!isConnected}
					aria-label={accessibleLabel}
					title={accessibleLabel}
					className={cn(
						'inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/15 font-semibold text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-50',
						kitchenMode ? 'min-h-12 px-4 text-base' : 'min-h-10 px-3 text-sm',
					)}
				>
					<SmilePlus className='size-4' aria-hidden='true' />
					<span>{t('ctReactionButton')}</span>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align='center'
				sideOffset={8}
				aria-label={t('ctReactionPickerLabel')}
				className='grid min-w-0 grid-cols-3 gap-1 p-2'
			>
				{ROOM_REACTIONS.map(reaction => {
					const label = t(reaction.labelKey)

					return (
						<DropdownMenuItem
							key={reaction.emoji}
							aria-label={label}
							onSelect={() => onSelect(reaction.emoji)}
							className='size-12 cursor-pointer justify-center p-0 text-2xl'
						>
							<span aria-hidden='true'>{reaction.emoji}</span>
							<span className='sr-only'>{label}</span>
						</DropdownMenuItem>
					)
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
