/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
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
				// Background colors - Dark Intelligence Theme
				'bg-base': '#0A1425',
				'bg-surface': '#1B2A3A',
				'bg-elevated': '#2C3E50',
				// Text colors
				'text-primary': '#FFFFFF',
				'text-secondary': '#E8E8E8',
				'text-tertiary': '#A0AEC0',
				// Accent colors - Teal/Cyan
				'accent-primary': '#00CED1',
				'accent-secondary': '#20B2AA',
				// Sentiment colors
				'sentiment-positive': '#00FF7F',
				'sentiment-neutral': '#FFA500',
				'sentiment-negative': '#FF4444',
				'live-indicator': '#32CD32',
				'warning-color': '#FFD700',
				// Conflict intensity colors
				'conflict-low': '#10b981',
				'conflict-medium': '#f59e0b',
				'conflict-high': '#ef4444',
				'conflict-critical': '#dc2626',
				// Original shadcn colors for compatibility
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#00CED1',
					foreground: '#FFFFFF',
				},
				secondary: {
					DEFAULT: '#20B2AA',
					foreground: '#FFFFFF',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: '#00CED1',
					foreground: '#FFFFFF',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: '#1B2A3A',
					foreground: '#FFFFFF',
				},
			},
			spacing: {
				'space-1': '8px',
				'space-2': '16px',
				'space-3': '24px',
				'space-4': '32px',
				'space-6': '48px',
				'space-8': '64px',
				'space-12': '96px',
				'space-16': '128px',
			},
			borderRadius: {
				sm: '12px',
				md: '16px',
				lg: '20px',
				xl: '24px',
				full: '9999px',
			},
			boxShadow: {
				'far': '0 2px 8px rgba(0, 0, 0, 0.08)',
				'mid': '0 8px 24px rgba(0, 0, 0, 0.12)',
				'near': '0 16px 48px rgba(0, 0, 0, 0.18)',
				'float': '0 24px 64px rgba(0, 0, 0, 0.24)',
				'accent-glow': '0 8px 24px rgba(0, 206, 209, 0.4), 0 0 40px rgba(0, 206, 209, 0.2)',
				'teal-glow': '0 0 20px rgba(0, 206, 209, 0.5)',
			},
			fontFamily: {
				sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
			},
			fontSize: {
				'hero-3d': ['96px', { lineHeight: '1.0', letterSpacing: '-0.03em' }],
				'heading-xl': ['48px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
				'heading-lg': ['36px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
				'heading-md': ['24px', { lineHeight: '1.3', letterSpacing: '0' }],
				'body-lg': ['20px', { lineHeight: '1.6', letterSpacing: '0' }],
				'body': ['16px', { lineHeight: '1.5', letterSpacing: '0' }],
				'body-sm': ['14px', { lineHeight: '1.5', letterSpacing: '0.01em' }],
				'caption': ['12px', { lineHeight: '1.4', letterSpacing: '0.02em' }],
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'marquee': 'marquee 30s linear infinite',
				'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
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
				'marquee': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(-100%)' },
				},
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}
