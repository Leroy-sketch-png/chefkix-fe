/**
 * CommandParser — Maps voice transcript → cooking actions.
 *
 * Uses keyword matching with confidence threshold.
 * Spec: vision_and_spec/22-voice-mode.txt §2
 */

export type VoiceAction =
	| 'NEXT_STEP'
	| 'PREV_STEP'
	| 'START_TIMER'
	| 'STOP_TIMER'
	| 'READ_STEP'
	| 'TIME_LEFT'
	| 'COMPLETE_STEP'
	| 'SHOW_HELP'
	| 'TOGGLE_MESSY_HANDS'

interface CommandDef {
	keywords: string[]
	action: VoiceAction
	label: string
	icon: string
}

/** Order matters — longer/more specific phrases first to avoid false matches */
export const COMMANDS: CommandDef[] = [
	{
		keywords: ['next step', 'next', 'forward', 'continue'],
		action: 'NEXT_STEP',
		label: 'Next Step',
		icon: '➡️',
	},
	{
		keywords: ['previous step', 'previous', 'go back', 'back'],
		action: 'PREV_STEP',
		label: 'Previous Step',
		icon: '⬅️',
	},
	{
		keywords: ['start timer', 'set timer', 'timer start'],
		action: 'START_TIMER',
		label: 'Start Timer',
		icon: '⏱️',
	},
	{
		keywords: ['stop timer', 'cancel timer', 'pause timer', 'pause'],
		action: 'STOP_TIMER',
		label: 'Stop Timer',
		icon: '⏹️',
	},
	{
		keywords: ['read step', 'read', "what's the step", 'repeat'],
		action: 'READ_STEP',
		label: 'Read Step',
		icon: '🔊',
	},
	{
		keywords: ['how long left', 'time left', 'remaining', 'how long'],
		action: 'TIME_LEFT',
		label: 'Time Left',
		icon: '⏰',
	},
	{
		keywords: ['done', 'complete', 'finished', 'mark done'],
		action: 'COMPLETE_STEP',
		label: 'Complete Step',
		icon: '✅',
	},
	{
		keywords: ['help', 'commands', 'what can i say'],
		action: 'SHOW_HELP',
		label: 'Show Help',
		icon: '❓',
	},
	{
		keywords: ['messy hands', 'dirty hands', 'hands busy', 'hands full', 'clean hands', 'hands free'],
		action: 'TOGGLE_MESSY_HANDS',
		label: 'Toggle Messy Hands',
		icon: '🙌',
	},
]

export const CONFIDENCE_THRESHOLD = 0.6

export interface ParsedCommand {
	action: VoiceAction
	label: string
	icon: string
	transcript: string
	confidence: number
}

/**
 * Parse a voice transcript into a command action.
 * Returns null if no command matched or confidence is too low.
 */
export function parseCommand(
	transcript: string,
	confidence: number,
): ParsedCommand | null {
	if (confidence < CONFIDENCE_THRESHOLD) return null

	const lower = transcript.toLowerCase().trim()

	for (const cmd of COMMANDS) {
		if (cmd.keywords.some(k => lower.includes(k))) {
			return {
				action: cmd.action,
				label: cmd.label,
				icon: cmd.icon,
				transcript: lower,
				confidence,
			}
		}
	}

	return null
}
