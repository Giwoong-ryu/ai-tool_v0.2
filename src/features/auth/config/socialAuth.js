// 소셜 로그인 설정
export const socialAuthConfig = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
    redirectUri: window.location.origin + '/auth/google/callback',
    scope: 'email profile'
  },
  naver: {
    clientId: import.meta.env.VITE_NAVER_CLIENT_ID || 'YOUR_NAVER_CLIENT_ID',
    redirectUri: window.location.origin + '/auth/naver/callback',
    state: Math.random().toString(36).substring(7)
  },
  kakao: {
    clientId: import.meta.env.VITE_KAKAO_CLIENT_ID || 'YOUR_KAKAO_CLIENT_ID',
    redirectUri: window.location.origin + '/auth/kakao/callback'
  }
}

// 소셜 로그인 URL 생성 함수
export const getSocialLoginUrl = (provider) => {
  switch (provider) {
    case 'google':
      return `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${socialAuthConfig.google.clientId}` +
        `&redirect_uri=${encodeURIComponent(socialAuthConfig.google.redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(socialAuthConfig.google.scope)}`
      
    case 'naver':
      return `https://nid.naver.com/oauth2.0/authorize?` +
        `client_id=${socialAuthConfig.naver.clientId}` +
        `&redirect_uri=${encodeURIComponent(socialAuthConfig.naver.redirectUri)}` +
        `&response_type=code` +
        `&state=${socialAuthConfig.naver.state}`
      
    case 'kakao':
      return `https://kauth.kakao.com/oauth/authorize?` +
        `client_id=${socialAuthConfig.kakao.clientId}` +
        `&redirect_uri=${encodeURIComponent(socialAuthConfig.kakao.redirectUri)}` +
        `&response_type=code`
      
    default:
      throw new Error('Unknown social provider')
  }
}

// 소셜 로그인 처리 함수 (데모용)
export const handleSocialLogin = async (provider) => {
  // 실제 구현시에는 백엔드 API와 연동
  // const url = getSocialLoginUrl(provider)
  // window.location.href = url
  
  // 데모용 코드
  const demoUser = {
    id: Date.now(),
    email: `user@${provider}.com`,
    name: `${provider} 사용자`,
    provider: provider,
    createdAt: new Date().toISOString()
  }
  
  return { success: true, user: demoUser }
}
