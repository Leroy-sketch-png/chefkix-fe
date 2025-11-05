/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				// Design system colors
				border: 'var(--border-color)',
				input: 'var(--border-color)',
				ring: 'var(--focus)',
				background: 'var(--bg)',
				foreground: 'var(--text)',
				// Semantic color aliases for easier usage
				bg: 'var(--bg)',
				'bg-page': 'var(--bg-page)',
				'bg-card': 'var(--bg-card)',
				'bg-hover': 'var(--bg-hover)',
				text: 'var(--text)',
				'text-primary': 'var(--text-primary)',
				'text-secondary': 'var(--text-secondary)',
				'text-tertiary': 'var(--text-tertiary)',
				'panel-bg': 'var(--panel-bg)',
				'border-subtle': 'var(--border-subtle)',
				'border-medium': 'var(--border-medium)',
				primary: {
					DEFAULT: 'var(--primary)',
					dark: 'var(--primary-dark)',
					light: 'var(--primary-light)',
					foreground: '#ffffff',
				},
				secondary: {
					DEFAULT: 'var(--muted)',
					foreground: 'var(--text)',
				},
				destructive: {
					DEFAULT: '#e74c3c',
					foreground: '#ffffff',
				},
				muted: {
					DEFAULT: 'var(--muted)',
					strong: 'var(--muted-strong)',
					foreground: 'var(--muted-strong)',
				},
				accent: {
					DEFAULT: 'var(--accent)',
					strong: 'var(--accent-strong)',
					light: 'var(--accent-light)',
					foreground: 'var(--text)',
				},
				mint: 'var(--mint)',
				gold: 'var(--gold)',
				popover: {
					DEFAULT: 'var(--panel-bg)',
					foreground: 'var(--text)',
				},
				card: {
					DEFAULT: 'var(--panel-bg)',
					foreground: 'var(--text)',
				},
			},
			borderRadius: {
				DEFAULT: 'var(--radius)',
				radius: 'var(--radius)', // Alias for components using 'rounded-radius'
				sm: 'var(--radius-sm)',
				lg: 'var(--radius-lg)',
				xl: 'var(--radius-lg)',
				'2xl': '24px',
				full: '9999px',
			},
			fontFamily: {
				sans: [
					'Inter',
					'system-ui',
					'-apple-system',
					'Segoe UI',
					'Roboto',
					'Helvetica Neue',
					'Arial',
					'sans-serif',
				],
				display: ['Pacifico', 'cursive'],
				mono: ['var(--font-geist-mono)'],
			},
			fontSize: {
				xs: 'var(--font-size-xs)',
				sm: 'var(--font-size-sm)',
				base: 'var(--font-size-base)',
				lg: 'var(--font-size-lg)',
				xl: 'var(--font-size-xl)',
				'2xl': 'var(--font-size-2xl)',
			},
			fontWeight: {
				normal: 'var(--font-weight-normal)',
				medium: 'var(--font-weight-medium)',
				semibold: 'var(--font-weight-semibold)',
				bold: 'var(--font-weight-bold)',
				extrabold: 'var(--font-weight-extrabold)',
			},
			spacing: {
				// Numeric scale (8px baseline)
				1: 'var(--space-1)',
				2: 'var(--space-2)',
				3: 'var(--space-3)',
				4: 'var(--space-4)',
				5: 'var(--space-5)',
				6: 'var(--space-6)',
				8: 'var(--space-8)',
				10: 'var(--space-10)',
				12: 'var(--space-12)',
				// Semantic aliases (backward compatibility)
				xs: 'var(--space-xs)',
				sm: 'var(--space-sm)',
				md: 'var(--space-md)',
				lg: 'var(--space-lg)',
				xl: 'var(--space-xl)',
				'2xl': 'var(--space-2xl)',
				'3xl': 'var(--space-3xl)',
			},
			lineHeight: {
				tight: 'var(--line-height-tight)',
				normal: 'var(--line-height-normal)',
				relaxed: 'var(--line-height-relaxed)',
			},
			width: {
				// Canonical layout sizes mapped to CSS variables defined in globals.css
				nav: 'var(--nav-w)',
				right: 'var(--right-w)',
			},
			maxWidth: {
				// Container widths
				'container-sm': 'var(--container-sm)',
				'container-md': 'var(--container-md)',
				'container-lg': 'var(--container-lg)',
				'container-xl': 'var(--container-xl)',
			},
			minWidth: {
				nav: 'var(--nav-w)',
				search: '120px', // Search bar minimum width
			},
			minHeight: {
				textarea: 'var(--h-textarea-min)',
				content: 'var(--h-content-min)',
				'content-tall': 'var(--h-content-tall)',
			},
			boxShadow: {
				sm: 'var(--shadow-sm)',
				DEFAULT: 'var(--shadow-md)',
				md: 'var(--shadow-md)',
				lg: 'var(--shadow-lg)',
				glow: 'var(--shadow-glow)',
			},
			transitionTimingFunction: {
				ease: 'var(--transition-ease)',
				bounce: 'var(--transition-bounce)',
			},
			zIndex: {
				base: 'var(--z-base)',
				dropdown: 'var(--z-dropdown)',
				sticky: 'var(--z-sticky)',
				modal: 'var(--z-modal)',
				notification: 'var(--z-notification)',
				tooltip: 'var(--z-tooltip)',
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-success': 'var(--gradient-success)',
				'gradient-warm': 'var(--gradient-warm)',
				'gradient-cool': 'var(--gradient-cool)',
				'gradient-gold': 'var(--gradient-gold)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
				fadeIn: {
					from: { opacity: 0, transform: 'translateY(10px)' },
					to: { opacity: 1, transform: 'translateY(0)' },
				},
				slideInUp: {
					'0%': {
						opacity: 0,
						transform: 'translateY(100px) scale(0.9)',
						filter: 'blur(10px)',
					},
					'100%': {
						opacity: 1,
						transform: 'translateY(0) scale(1)',
						filter: 'blur(0)',
					},
				},
				shine: {
					'0%': {
						transform: 'translateX(-100%) translateY(-100%) rotate(45deg)',
					},
					'100%': {
						transform: 'translateX(100%) translateY(100%) rotate(45deg)',
					},
				},
				'avatar-glow': {
					'0%, 100%': { filter: 'blur(8px)', opacity: 0.5 },
					'50%': { filter: 'blur(12px)', opacity: 0.8 },
				},
				'story-pulse': {
					'0%, 100%': { boxShadow: '0 0 0 0 rgba(102, 126, 234, 0.7)' },
					'50%': { boxShadow: '0 0 0 8px rgba(102, 126, 234, 0)' },
				},
				'heart-beat': {
					'0%, 100%': { transform: 'scale(1)' },
					'25%': { transform: 'scale(1.3)' },
					'50%': { transform: 'scale(1.1)' },
					'75%': { transform: 'scale(1.25)' },
				},
				'like-pop': {
					'0%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(1.4)' },
					'100%': { transform: 'scale(1)' },
				},
				pulse: {
					'0%, 100%': {
						transform: 'scale(1)',
						boxShadow: '0 0 0 0 rgba(255, 210, 74, 0.7)',
					},
					'50%': {
						transform: 'scale(1.05)',
						boxShadow: '0 0 10px 15px rgba(255, 210, 74, 0)',
					},
				},
				spin: {
					to: { transform: 'rotate(360deg)' },
				},
				'challenge-rotate': {
					'100%': { transform: 'rotate(360deg)' },
				},
				'achievement-in': {
					to: { transform: 'scale(1)' },
				},
				blink: {
					'0%, 100%': { opacity: 0.3 },
					'50%': { opacity: 1 },
				},
				'confetti-pop': {
					'0%': { transform: 'scale(0.5) rotate(-10deg)', opacity: 0 },
					'50%': { transform: 'scale(1.2) rotate(10deg)', opacity: 1 },
					'100%': { transform: 'scale(1) rotate(0deg)', opacity: 1 },
				},
				ripple: {
					'0%': { transform: 'scale(0)', opacity: 1 },
					'100%': { transform: 'scale(4)', opacity: 0 },
				},
				scaleIn: {
					'0%': { opacity: 0, transform: 'scale(0.8)' },
					'100%': { opacity: 1, transform: 'scale(1)' },
				},
				fadeOut: {
					from: { opacity: 1 },
					to: { opacity: 0 },
				},
				'xp-shimmer': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' },
				},
				'float-up': {
					from: { opacity: 1, transform: 'translateY(0)' },
					to: { opacity: 0, transform: 'translateY(-30px)' },
				},
				'toast-bounce-in': {
					'0%': {
						opacity: 0,
						transform: 'translateX(-50%) translateY(100px) scale(0.8)',
					},
					'50%': {
						transform: 'translateX(-50%) translateY(-10px) scale(1.05)',
					},
					'100%': {
						opacity: 1,
						transform: 'translateX(-50%) translateY(0) scale(1)',
					},
				},
				'toast-slide-out': {
					to: {
						opacity: 0,
						transform: 'translateX(-50%) translateY(100px) scale(0.8)',
					},
				},
				shimmer: {
					'0%': { backgroundPosition: '-1000px 0' },
					'100%': { backgroundPosition: '1000px 0' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				fadeIn: 'fadeIn 0.3s ease-in-out',
				slideInUp: 'slideInUp 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
				shine: 'shine 2s ease-in-out infinite',
				'avatar-glow': 'avatar-glow 2s ease-in-out infinite',
				'story-pulse': 'story-pulse 1.5s ease-in-out infinite',
				'heart-beat': 'heart-beat 0.5s ease-in-out',
				'like-pop': 'like-pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
				pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				spin: 'spin 1s linear infinite',
				'challenge-rotate': 'challenge-rotate 20s linear infinite',
				'achievement-in':
					'achievement-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
				blink: 'blink 1.4s infinite',
				'confetti-pop':
					'confetti-pop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
				ripple: 'ripple 0.6s ease-out',
				scaleIn: 'scaleIn 0.3s ease-out',
				fadeOut: 'fadeOut 0.3s ease-out',
				'xp-shimmer': 'xp-shimmer 2s ease-in-out infinite',
				'float-up': 'float-up 1s ease-out forwards',
				'toast-bounce-in':
					'toast-bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
				'toast-slide-out': 'toast-slide-out 0.3s ease-in forwards',
				shimmer: 'shimmer 2s infinite linear',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}
