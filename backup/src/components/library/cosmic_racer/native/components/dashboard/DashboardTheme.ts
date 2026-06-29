export const DASHBOARD_THEME = {
  colors: {
      background: '#f8fafc', // Slate-50 — light outer shell
      surface: '#ffffff', // White
      glass: {
          low: 'rgba(255, 255, 255, 0.6)',
          medium: 'rgba(255, 255, 255, 0.8)',
          high: 'rgba(255, 255, 255, 0.95)',
          border: 'rgba(0, 0, 0, 0.06)', // Subtle dark border
      },
      accents: {
          cyan: {
              base: '#0891b2', // Cyan-600
              bg: 'rgba(8, 145, 178, 0.1)',
              glow: 'rgba(8, 145, 178, 0.2)',
              gradient: 'from-cyan-50 to-blue-50'
          },
          emerald: {
              base: '#059669', // Emerald-600
              bg: 'rgba(5, 150, 105, 0.1)',
              glow: 'rgba(5, 150, 105, 0.2)',
              gradient: 'from-emerald-50 to-teal-50'
          },
          amber: {
              base: '#d97706', // Amber-600
              bg: 'rgba(217, 119, 6, 0.1)',
              glow: 'rgba(217, 119, 6, 0.2)',
              gradient: 'from-amber-50 to-orange-50'
          },
          violet: {
              base: '#7c3aed', // Violet-600
              bg: 'rgba(124, 58, 237, 0.1)',
              glow: 'rgba(124, 58, 237, 0.2)',
              gradient: 'from-violet-50 to-purple-50'
          },
          rose: {
            base: '#e11d48', // Rose-600
            bg: 'rgba(225, 29, 72, 0.1)',
            glow: 'rgba(225, 29, 72, 0.2)',
            gradient: 'from-rose-50 to-red-50'
          },
          fuchsia: {
            base: '#c026d3', // Fuchsia-600
            bg: 'rgba(192, 38, 211, 0.1)',
            glow: 'rgba(192, 38, 211, 0.2)',
            gradient: 'from-fuchsia-50 to-purple-50'
        },
          slate: {
              base: '#475569', // Slate-600
              bg: 'rgba(71, 85, 105, 0.1)',
              glow: 'rgba(71, 85, 105, 0.2)',
              gradient: 'from-slate-50 to-slate-100'
          }
      },
      text: {
          primary: '#0f172a', // Slate-900 (High Contrast)
          secondary: '#475569', // Slate-600
          muted: '#94a3b8', // Slate-400
          inverse: '#ffffff'
      }
  },
  effects: {
      glassBox: "backdrop-blur-xl border border-slate-200 bg-white/70 shadow-sm hover:shadow-md transition-all duration-300",
      glassPanel: "backdrop-blur-xl border border-slate-200 bg-white/40 shadow-xl",
      glowText: "drop-shadow-sm",
  }
};
