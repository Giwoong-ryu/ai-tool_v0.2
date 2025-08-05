module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pretendard: ['Pretendard Variable', 'Pretendard', 'Noto Sans KR', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Malgun Gothic', 'sans-serif'],
        suit: ['SUIT Variable', 'SUIT', 'Noto Sans KR', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        noto: ['Noto Sans KR', 'Pretendard', '-apple-system', 'system-ui', 'sans-serif'],
        display: ['Pretendard Variable', 'Pretendard', 'Noto Sans KR', 'sans-serif'],
        body: ['Pretendard Variable', 'Pretendard', 'SUIT', 'Noto Sans KR', 'sans-serif'],
        sans: ['Pretendard Variable', 'Pretendard', 'Noto Sans KR', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#EEF2FF',
          100: '#D4DBFF', 
          500: '#3E5CFF',
          600: '#2A46E8',
          900: '#1E2B88'
        },
        accent: {
          50: '#FFF1F5',
          500: '#FF6B9C'
        },
        neutral: {
          0: '#FFFFFF',
          50: '#F7F8FC',
          200: '#E5E7EB',
          700: '#4B5563',
          900: '#101014'
        }
      },
      fontSize: {
        'display-xl': 'clamp(2.8rem, 5vw+1rem, 3.5rem)',
        'display-lg': 'clamp(2rem, 4vw+0.8rem, 2.75rem)',
        'display-md': 'clamp(1.5rem, 2vw+0.6rem, 2rem)',
        'heading': '1.25rem',
        'body-lg': '1rem',
        'body-sm': '0.875rem'
      },
      boxShadow: {
        glass: '0 8px 24px rgba(255,255,255,0.08)',
        elev: '0 4px 12px rgba(16,16,20,0.08)',
      },
      borderRadius: {
        sm: '0.5rem',
        lg: '1.5rem',
      },
      spacing: {
        '4': '1rem',
        '6': '1.5rem', 
        '8': '2rem',
        '12': '3rem',
        '16': '4rem',
        '24': '6rem',
        '32': '8rem',
        '48': '12rem'
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px'
      }
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
};