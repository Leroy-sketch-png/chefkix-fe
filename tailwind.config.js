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
				// Core design system colors
				border: 'var(--border-color)',
				input: 'var(--border-medium)',
				ring: 'var(--focus)',
				background: 'var(--bg)',
				foreground: 'var(--text)',

				// Brand color system
				brand: {
					DEFAULT: 'var(--color-brand)',
					hover: 'var(--color-brand-hover)',
					subtle: 'var(--color-brand-subtle)',
				},

				// Accent colors - Purple (gaming, XP, achievements)
				'accent-purple': {
					DEFAULT: 'var(--color-accent-purple)',
					hover: 'var(--color-accent-purple-hover)',
					subtle: 'var(--color-accent-purple-subtle)',
				},

				// Accent colors - Teal (discovery, explore)
				'accent-teal': {
					DEFAULT: 'var(--color-accent-teal)',
					hover: 'var(--color-accent-teal-hover)',
					subtle: 'var(--color-accent-teal-subtle)',
				},

				// Semantic colors - with vivid variants
				success: {
					DEFAULT: 'var(--color-success)',
					vivid: 'var(--color-success-vivid)',
				},
				warning: {
					DEFAULT: 'var(--color-warning)',
					vivid: 'var(--color-warning-vivid)',
				},
				error: {
					DEFAULT: 'var(--color-error)',
					vivid: 'var(--color-error-vivid)',
				},
				info: {
					DEFAULT: 'var(--color-info)',
					vivid: 'var(--color-info-vivid)',
				},

				// Gaming colors
				streak: {
					DEFAULT: 'var(--color-streak)',
					urgent: 'var(--color-streak-urgent)',
				},
				xp: {
					DEFAULT: 'var(--color-xp)',
					bonus: 'var(--color-xp-bonus)',
				},
				level: {
					DEFAULT: 'var(--color-level)',
					glow: 'var(--color-level-glow)',
				},
				badge: 'var(--color-badge)',
				rare: 'var(--color-rare)',
				combo: 'var(--color-combo)',
				legendary: 'var(--color-legendary)',

				// Medal colors for leaderboards
				medal: {
					gold: {
						DEFAULT: 'var(--color-medal-gold)',
						glow: 'var(--color-medal-gold-glow)',
					},
					silver: {
						DEFAULT: 'var(--color-medal-silver)',
						glow: 'var(--color-medal-silver-glow)',
					},
					bronze: {
						DEFAULT: 'var(--color-medal-bronze)',
						glow: 'var(--color-medal-bronze-glow)',
					},
				},

				// Background colors
				bg: {
					DEFAULT: 'var(--bg)',
					page: 'var(--bg-page)',
					card: 'var(--bg-card)',
					elevated: 'var(--bg-elevated)',
					hover: 'var(--bg-hover)',
					input: 'var(--bg-input)',
				},

				// Text colors
				text: {
					DEFAULT: 'var(--text)',
					primary: 'var(--text-primary)',
					secondary: 'var(--text-secondary)',
					tertiary: 'var(--text-tertiary)',
					muted: 'var(--text-muted)',
				},

				// Border colors
				'border-subtle': 'var(--border-subtle)',
				'border-medium': 'var(--border-medium)',
				'border-strong': 'var(--border-strong)',

				// Legacy compatibility - mapped to new system
				'panel-bg': 'var(--bg-card)',
				primary: {
					DEFAULT: 'var(--color-brand)',
					dark: 'var(--color-brand-hover)',
					light: 'var(--color-brand)',
					foreground: '#ffffff',
				},
				secondary: {
					DEFAULT: 'var(--bg-elevated)',
					foreground: 'var(--text-primary)',
				},
				destructive: {
					DEFAULT: 'var(--color-error)',
					foreground: '#ffffff',
				},
				muted: {
					DEFAULT: 'var(--muted)',
					strong: 'var(--muted-strong)',
					foreground: 'var(--text-muted)',
				},
				accent: {
					DEFAULT: 'var(--color-accent-purple)', // Purple for gaming feel!
					strong: 'var(--color-accent-purple-hover)',
					light: 'var(--color-brand-subtle)',
					foreground: 'var(--text)',
				},
				mint: 'var(--color-success)',
				gold: 'var(--color-warning)',
				popover: {
					DEFAULT: 'var(--bg-elevated)',
					foreground: 'var(--text)',
				},
				card: {
					DEFAULT: 'var(--bg-card)',
					foreground: 'var(--text)',
				},
			},
			borderRadius: {
				DEFAULT: 'var(--radius)',
				radius: 'var(--radius)', // Alias for components using 'rounded-radius'
				sm: 'var(--radius-sm)',
				lg: 'var(--radius-lg)',
				xl: 'var(--radius-xl)', // 20px - large modals, cards with extra rounding
				'2xl': '24px',
				'3xl': '28px',
				full: '9999px',
			},
			fontFamily: {
				// Primary: Plus Jakarta Sans - Modern, friendly, slightly rounded
				// Perfect for body text, buttons, navigation
				sans: [
					'var(--font-sans)',
					'Plus Jakarta Sans',
					'system-ui',
					'-apple-system',
					'Segoe UI',
					'Roboto',
					'sans-serif',
				],
				// Display: Space Grotesk - Bold, geometric, gaming vibes
				// For XP numbers, level badges, stats, headings with punch
				display: [
					'var(--font-display)',
					'Space Grotesk',
					'system-ui',
					'sans-serif',
				],
				// Serif: Playfair Display - Elegant, cookbook aesthetic
				// For recipe titles, quotes, editorial moments
				serif: ['var(--font-serif)', 'Playfair Display', 'Georgia', 'serif'],
				// Mono: System mono stack for code/technical
				mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
			},
			fontSize: {
				'2xs': 'var(--font-size-2xs)',
				xs: 'var(--font-size-xs)',
				sm: 'var(--font-size-sm)',
				caption: 'var(--font-size-caption)', // 13px - metadata, small captions
				label: 'var(--font-size-label)', // 15px - tab labels, semi-prominent
				base: 'var(--font-size-base)',
				lg: 'var(--font-size-lg)',
				xl: 'var(--font-size-xl)',
				'2xl': 'var(--font-size-2xl)',
				'icon-lg': 'var(--font-size-icon-lg)',
				'icon-xl': 'var(--font-size-icon-xl)',
				'icon-2xl': 'var(--font-size-icon-2xl)',
				'icon-3xl': 'var(--font-size-icon-3xl)',
				'icon-4xl': 'var(--font-size-icon-4xl)',
				'icon-emoji-xl': 'var(--font-size-icon-emoji-xl)',
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
				drawer: 'var(--drawer-w)',
				// Icon sizes
				'icon-2xs': 'var(--icon-2xs)',
				'icon-xs': 'var(--icon-xs)',
				'icon-sm': 'var(--icon-sm)',
				'icon-md': 'var(--icon-md)',
				'icon-lg': 'var(--icon-lg)',
				'icon-xl': 'var(--icon-xl)',
				'icon-2xl': 'var(--icon-2xl)',
				'icon-emoji': 'var(--icon-emoji)',
				'icon-emoji-lg': 'var(--icon-emoji-lg)',
				'icon-emoji-xl': 'var(--icon-emoji-xl)',
				// Avatar sizes
				'avatar-xs': 'var(--avatar-xs)',
				'avatar-sm': 'var(--avatar-sm)',
				'avatar-md': 'var(--avatar-md)',
				'avatar-lg': 'var(--avatar-lg)',
				'avatar-xl': 'var(--avatar-xl)',
				// Thumbnail sizes
				'thumbnail-sm': 'var(--thumbnail-sm)',
				'thumbnail-md': 'var(--thumbnail-md)',
				'thumbnail-lg': 'var(--thumbnail-lg)',
				'thumbnail-xl': 'var(--thumbnail-xl)',
				'thumbnail-2xl': 'var(--thumbnail-2xl)',
			},
			height: {
				// Icon sizes (matching width)
				'icon-2xs': 'var(--icon-2xs)',
				'icon-xs': 'var(--icon-xs)',
				'icon-sm': 'var(--icon-sm)',
				'icon-md': 'var(--icon-md)',
				'icon-lg': 'var(--icon-lg)',
				'icon-xl': 'var(--icon-xl)',
				'icon-2xl': 'var(--icon-2xl)',
				'icon-emoji': 'var(--icon-emoji)',
				'icon-emoji-lg': 'var(--icon-emoji-lg)',
				'icon-emoji-xl': 'var(--icon-emoji-xl)',
				// Avatar sizes
				'avatar-xs': 'var(--avatar-xs)',
				'avatar-sm': 'var(--avatar-sm)',
				'avatar-md': 'var(--avatar-md)',
				'avatar-lg': 'var(--avatar-lg)',
				'avatar-xl': 'var(--avatar-xl)',
				// Thumbnail sizes
				'thumbnail-sm': 'var(--thumbnail-sm)',
				'thumbnail-md': 'var(--thumbnail-md)',
				'thumbnail-lg': 'var(--thumbnail-lg)',
				'thumbnail-xl': 'var(--thumbnail-xl)',
				'thumbnail-2xl': 'var(--thumbnail-2xl)',
				// Card image heights
				'card-image': 'var(--card-image-height)',
				// Drawer height
				drawer: 'var(--drawer-h)',
				// Panel heights
				'panel-md': 'var(--h-panel-md)',
				'panel-lg': 'var(--h-panel-lg)',
				'panel-xl': 'var(--h-panel-xl)',
			},
			size: {
				// Combined width/height tokens for square elements
				'icon-2xs': 'var(--icon-2xs)',
				'icon-xs': 'var(--icon-xs)',
				'icon-sm': 'var(--icon-sm)',
				'icon-md': 'var(--icon-md)',
				'icon-lg': 'var(--icon-lg)',
				'icon-xl': 'var(--icon-xl)',
				'icon-2xl': 'var(--icon-2xl)',
				'icon-emoji': 'var(--icon-emoji)',
				'icon-emoji-lg': 'var(--icon-emoji-lg)',
				'icon-emoji-xl': 'var(--icon-emoji-xl)',
				'avatar-xs': 'var(--avatar-xs)',
				'avatar-sm': 'var(--avatar-sm)',
				'avatar-md': 'var(--avatar-md)',
				'avatar-lg': 'var(--avatar-lg)',
				'avatar-xl': 'var(--avatar-xl)',
				'thumbnail-sm': 'var(--thumbnail-sm)',
				'thumbnail-md': 'var(--thumbnail-md)',
				'thumbnail-lg': 'var(--thumbnail-lg)',
				'thumbnail-xl': 'var(--thumbnail-xl)',
				'thumbnail-2xl': 'var(--thumbnail-2xl)',
			},
			maxWidth: {
				// Container widths
				'container-sm': 'var(--container-sm)',
				'container-md': 'var(--container-md)',
				'container-lg': 'var(--container-lg)',
				'container-xl': 'var(--container-xl)',
				'container-form': 'var(--container-form)', // 900px - wide forms
				// Modal widths
				'modal-sm': 'var(--modal-sm)',
				'modal-md': 'var(--modal-md)',
				'modal-lg': 'var(--modal-lg)',
				'modal-xl': 'var(--modal-xl)',
				'modal-2xl': 'var(--modal-2xl)', // Near-fullscreen modals (768px)
				// Chat bubble widths
				'bubble-sm': 'var(--bubble-sm)',
				'bubble-md': 'var(--bubble-md)',
				'bubble-lg': 'var(--bubble-lg)',
				// Cooking player
				'step-dots': 'var(--step-dots-max-w)', // 280px - mobile
				'step-dots-lg': 'var(--step-dots-max-w-lg)', // 400px - desktop
				// Element max-widths
				'thumbnail-sm': 'var(--thumbnail-sm)',
				'thumbnail-md': 'var(--thumbnail-md)',
				'thumbnail-lg': 'var(--thumbnail-lg)',
				'thumbnail-xl': 'var(--thumbnail-xl)',
				'thumbnail-2xl': 'var(--thumbnail-2xl)',
			},
			maxHeight: {
				// Panel heights
				'panel-md': 'var(--h-panel-md)',
				'panel-lg': 'var(--h-panel-lg)',
				'panel-xl': 'var(--h-panel-xl)',
				// Modal/Sheet viewport heights
				modal: 'var(--h-modal-max)', // 90vh - standard modal max
				'sheet-mobile': 'var(--h-sheet-mobile)', // 85vh - mobile sheets
				'sheet-full': 'var(--h-sheet-full)', // 95vh - near fullscreen
				'modal-constrained': 'var(--h-modal-constrained)', // 80vh - with header visible
				'content-max': 'var(--h-content-max)', // 70vh - content areas
			},
			height: {
				// Sheet specific heights
				'sheet-mobile': 'var(--h-sheet-mobile)', // 85vh - mobile sheets
			},
			minWidth: {
				nav: 'var(--nav-w)',
				search: 'var(--input-search-min-w)', // 200px - Search input minimum width
				// Component min-widths
				'thumbnail-sm': 'var(--thumbnail-sm)', // 52px - badges, small elements
				'thumbnail-md': 'var(--thumbnail-md)', // 60px - leaderboard points
				'thumbnail-lg': 'var(--thumbnail-lg)', // 72px - medium elements
				'thumbnail-xl': 'var(--thumbnail-xl)', // 100px - badges showcase
			},
			minHeight: {
				textarea: 'var(--h-textarea-min)',
				'textarea-sm': 'var(--h-textarea-sm)', // 120px - compact textarea
				'textarea-lg': 'var(--h-textarea-lg)', // 200px - large textarea
				content: 'var(--h-content-min)',
				'content-tall': 'var(--h-content-tall)',
				banner: 'var(--banner-min-height)',
				'panel-md': 'var(--h-panel-md)',
			},
			boxShadow: {
				sm: 'var(--shadow-sm)',
				DEFAULT: 'var(--shadow-md)',
				md: 'var(--shadow-md)',
				lg: 'var(--shadow-lg)',
				glow: 'var(--shadow-glow)',
				card: 'var(--shadow-card)' /* Subtle lift for cards */,
				warm: 'var(--shadow-warm)' /* Cozy warm shadow */,
			},
			backdropBlur: {
				sm: 'var(--blur-sm)',
				md: 'var(--blur-md)',
				lg: 'var(--blur-lg)',
			},
			backdropSaturate: {
				DEFAULT: 'var(--saturate)',
			},
			inset: {
				'mobile-header': 'var(--h-mobile-header)', // 60px offset for mobile sticky bars
			},
			transitionTimingFunction: {
				ease: 'var(--transition-ease)',
				bounce: 'var(--transition-bounce)',
			},
			zIndex: {
				base: 'var(--z-base)',
				dropdown: 'var(--z-dropdown)',
				sticky: 'var(--z-sticky)',
				popover: 'var(--z-popover)',
				modal: 'var(--z-modal)',
				notification: 'var(--z-notification)',
				tooltip: 'var(--z-tooltip)',
			},
			backgroundImage: {
				// Primary gradients
				'gradient-brand': 'var(--gradient-brand)',
				'gradient-primary': 'var(--gradient-brand)',

				// Semantic gradients
				'gradient-success': 'var(--gradient-success)',
				'gradient-gold': 'var(--gradient-gold)',

				// Gaming gradients
				'gradient-xp': 'var(--gradient-xp)',
				'gradient-streak': 'var(--gradient-streak)',

				// Thematic gradients
				'gradient-warm': 'var(--gradient-warm)',
				'gradient-cool': 'var(--gradient-cool)',
				'gradient-ocean': 'var(--gradient-ocean)',
				'gradient-party': 'var(--gradient-party)',
				'gradient-sunset': 'var(--gradient-warm)',

				// Celebration gradients
				'gradient-celebration': 'var(--gradient-celebration)',
				'gradient-celebration-alt': 'var(--gradient-celebration-alt)',
			},
			borderWidth: {
				DEFAULT: '1px',
				0: '0',
				2: 'var(--border-2)',
				3: 'var(--border-3)',
				4: 'var(--border-4)',
				5: 'var(--border-5)',
			},
			ringWidth: {
				DEFAULT: '3px',
				0: '0',
				1: '1px',
				2: '2px',
				3: 'var(--border-3)',
				4: 'var(--border-4)',
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
				'spin-slow': 'spin 4s linear infinite',
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
