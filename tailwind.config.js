/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#050810',
          'black-2': '#080d1a',
          navy: '#0a1020',
          'navy-2': '#0d1526',
          'navy-3': '#101a2e',
          cyan: '#00f0ff',
          'cyan-dim': '#00a8b8',
          blue: '#0066ff',
          'blue-electric': '#1a7fff',
          red: '#ff2d55',
          'red-dim': '#cc1f44',
          green: '#00ff88',
          amber: '#ffaa00',
          gray: '#1a2236',
          'gray-2': '#243049',
          'gray-3': '#2e3d5c',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'scan-line': 'scan-line 2s ease-in-out infinite',
        'scan-line-vertical': 'scan-line-vertical 2s ease-in-out infinite',
        'radar-sweep': 'radar-sweep 4s linear infinite',
        'glitch': 'glitch 0.3s steps(2) infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.5s ease-out forwards',
        'progress-bar': 'progress-bar 3s ease-out forwards',
        'blink': 'blink 1s step-end infinite',
        'rotate-slow': 'rotate-slow 20s linear infinite',
        'grid-move': 'grid-move 20s linear infinite',
        'particle': 'particle 8s linear infinite',
        'flicker': 'flicker 3s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'draw-line': 'draw-line 1.5s ease-out forwards',
        'ping-slow': 'ping-slow 3s cubic-bezier(0,0,0.2,1) infinite',
      },
      keyframes: {
        'scan-line': {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.3' },
          '50%': { transform: 'translateY(100%)', opacity: '1' },
        },
        'scan-line-vertical': {
          '0%, 100%': { transform: 'translateX(0)', opacity: '0.3' },
          '50%': { transform: 'translateX(100%)', opacity: '1' },
        },
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '25%': { transform: 'translate(-2px, 1px)' },
          '50%': { transform: 'translate(2px, -1px)' },
          '75%': { transform: 'translate(-1px, -1px)' },
          '100%': { transform: 'translate(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', filter: 'brightness(1)' },
          '50%': { opacity: '1', filter: 'brightness(1.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'progress-bar': {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress, 100%)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'rotate-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'grid-move': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '40px 40px' },
        },
        particle: {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '0.5' },
          '100%': { transform: 'translateY(-100vh) translateX(50px)', opacity: '0' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '33%': { opacity: '0.8' },
          '66%': { opacity: '0.9' },
          '67.1%': { opacity: '0.3' },
          '67.2%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'draw-line': {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        'ping-slow': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
