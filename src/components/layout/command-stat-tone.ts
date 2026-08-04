export type CommandStatTone =
	| 'brand'
	| 'info'
	| 'success'
	| 'warning'
	| 'xp'
	| 'streak'
	| 'error'
	| 'muted'

const COMMAND_STAT_TONE_CLASSES: Record<CommandStatTone, string> = {
	brand: 'border-brand/20 bg-brand/8 text-brand',
	info: 'border-info/20 bg-info/8 text-info',
	success: 'border-success/20 bg-success/8 text-success',
	warning: 'border-warning/20 bg-warning/8 text-warning',
	xp: 'border-xp/20 bg-xp/8 text-xp',
	streak: 'border-streak/20 bg-streak/8 text-streak',
	error: 'border-error/20 bg-error/8 text-error',
	muted: 'border-border-subtle bg-bg-elevated text-text-muted',
}

export function getCommandStatToneClass(tone: CommandStatTone): string {
	return COMMAND_STAT_TONE_CLASSES[tone]
}
