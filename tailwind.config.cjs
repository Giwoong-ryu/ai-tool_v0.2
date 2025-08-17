/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  
  theme: {
    extend: {
      // 컬러 시스템
      colors: {
        primary: {
          50: '#EBF4FF',
          100: '#D1E7FF', 
          200: '#B3D4FF',
          300: '#84B6F4',
          400: '#528BDF',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
          800: '#1E3A8A',
          900: '#1E293B'
        },
        secondary: {
          50: '#F8FAF9',
          100: '#E8F0ED',
          200: '#D1E1DB', 
          300: '#A8C4B8',
          400: '#7D8E82',
          500: '#60796F',
          600: '#4A5D54',
          700: '#3A4A42',
          800: '#2F3B34',
          900: '#26312C'
        },
        neutral: {
          0: '#FFFFFF',
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
          950: '#030712'
        }
      },

      // 폰트 패밀리
      fontFamily: {
        'sans': ['Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        'display': ['Poppins', 'Pretendard Variable', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace']
      },

      // 폰트 크기
      fontSize: {
        'display-xl': 'clamp(2.8rem, 5vw+1rem, 3.5rem)',
        'display-lg': 'clamp(2rem, 4vw+0.8rem, 2.75rem)',
        'display-md': 'clamp(1.5rem, 2vw+0.6rem, 2rem)',
        'heading': '1.25rem',
        'body': '1rem',
        'body-sm': '0.875rem',
        'responsive-lg': 'clamp(1rem, 1.2vw, 1.125rem)'
      },

      // 간격 시스템
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem'
      },

      // 그림자
      boxShadow: {
        'glass': '0 8px 32px rgb(37 99 235 / 0.12)',
        'card': '0 4px 20px rgb(107 114 128 / 0.08)',
        'hover': '0 12px 28px rgb(107 114 128 / 0.12)',
        'elev': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        'elev-hover': '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)'
      },

      // 애니메이션
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'gradient-xy': 'gradient-xy 15s ease infinite'
      },

      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgb(37 99 235 / 0.3)' },
          '100%': { boxShadow: '0 0 30px rgb(37 99 235 / 0.6)' }
        },
        'gradient-xy': {
          '0%, 100%': { backgroundPosition: '0% 0%' },
          '50%': { backgroundPosition: '100% 100%' }
        }
      }
    }
  },

  plugins: []
};