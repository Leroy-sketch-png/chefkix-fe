import { render, screen } from '@testing-library/react'
import { NumberTicker } from '../number-ticker'

jest.mock('framer-motion', () => ({
	motion: {
		span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
			<span {...props}>{children}</span>
		),
	},
	useInView: () => false,
	useSpring: (initialValue: number) => ({
		on: () => () => undefined,
		set: jest.fn(),
		get: () => initialValue,
	}),
}))

describe('NumberTicker', () => {
	it('renders the truthful target value before entering the viewport', () => {
		render(<NumberTicker value={3379} locale='en-US' />)

		expect(screen.queryByText('3,379')).not.toBeNull()
	})

	it('uses an explicit starting value only when count-up animation is requested', () => {
		render(<NumberTicker value={50} from={0} suffix=' XP' />)

		expect(screen.queryByText('0 XP')).not.toBeNull()
	})
})
