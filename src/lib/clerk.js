// src/lib/clerk.js
import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-react'
import { koKR } from '@clerk/localizations'
import { supabase } from './supabase.js'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!CLERK_PUBLISHABLE_KEY) {
  console.error('Missing VITE_CLERK_PUBLISHABLE_KEY')
}

// Clerk 테마 설정 (한국어 최적화)
export const clerkAppearance = {
  elements: {
    formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
    formFieldInput: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
    footerActionLink: 'text-blue-600 hover:text-blue-700',
    modalCloseButton: 'text-gray-400 hover:text-gray-600',
    card: 'rounded-lg shadow-md border border-gray-200',
    headerTitle: 'text-2xl font-bold text-gray-900',
    headerSubtitle: 'text-gray-600',
    socialButtonsBlockButton: 'border border-gray-300 hover:bg-gray-50',
    socialButtonsBlockButtonText: 'text-gray-700 font-medium',
    dividerLine: 'bg-gray-200',
    dividerText: 'text-gray-500 text-sm',
    formFieldLabel: 'text-gray-700 font-medium',
    identityPreviewEditButton: 'text-blue-600 hover:text-blue-700'
  },
  layout: {
    socialButtonsPlacement: 'top',
    socialButtonsVariant: 'blockButton',
    termsPageUrl: '/terms',
    privacyPageUrl: '/privacy'
  },
  variables: {
    colorPrimary: '#2563eb',
    colorText: '#111827',
    colorTextSecondary: '#6b7280',
    colorBackground: '#ffffff',
    colorInputBackground: '#ffffff',
    colorInputText: '#111827',
    borderRadius: '0.5rem',
    spacingUnit: '1rem',
    fontSize: '14px',
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  }
}

// Supabase와 Clerk JWT 동기화 함수
export const syncClerkToSupabase = async (session) => {
  try {
    if (session) {
      // Clerk JWT 토큰을 Supabase에 설정
      const supabaseAccessToken = await session.getToken({
        template: 'supabase'
      })
      
      if (supabaseAccessToken) {
        // Supabase 클라이언트에 JWT 설정
        await supabase.auth.setSession({
          access_token: supabaseAccessToken,
          refresh_token: 'placeholder' // Clerk에서는 refresh token을 직접 제공하지 않음
        })

        console.log('✅ Clerk JWT → Supabase 동기화 완료')
        return true
      }
    } else {
      // 로그아웃시 Supabase 세션도 정리
      await supabase.auth.signOut()
      console.log('✅ Supabase 세션 정리 완료')
    }
  } catch (error) {
    console.error('❌ Clerk ↔ Supabase 동기화 오류:', error)
    return false
  }
}

// Clerk 사용자 → Supabase 프로필 동기화
export const syncUserProfile = async (user) => {
  if (!user) return null

  try {
    const profileData = {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || user.email,
      name: user.fullName || user.firstName || '사용자',
      avatar_url: user.imageUrl || user.profileImageUrl,
      role: 'free', // 기본 역할
      auth_metadata: {
        clerk_id: user.id,
        email_verified: user.emailAddresses[0]?.verification?.status === 'verified',
        phone_verified: user.phoneNumbers?.[0]?.verification?.status === 'verified',
        created_at: user.createdAt,
        last_sign_in: user.lastSignInAt
      },
      preferences: {
        language: 'ko',
        theme: 'light',
        notifications: {
          email: true,
          push: false
        }
      }
    }

    // Supabase profiles 테이블에 upsert
    const { data, error } = await supabase
      .from('clerk_profiles')
      .upsert(profileData, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      console.error('❌ 프로필 동기화 오류:', error)
      return null
    }

    console.log('✅ 사용자 프로필 동기화 완료:', data)
    return data
  } catch (error) {
    console.error('❌ 프로필 동기화 예외:', error)
    return null
  }
}

// 사용자 권한 및 구독 상태 확인
export const getUserPermissions = async (userId) => {
  if (!userId) return { role: 'free', permissions: [] }

  try {
    const { data: profile, error } = await supabase
      .from('clerk_profiles')
      .select(`
        role,
        plan,
        current_period_end,
        clerk_subscriptions (
          status,
          plan,
          current_period_end
        )
      `)
      .eq('id', userId)
      .single()

    if (error) {
      console.error('❌ 권한 조회 오류:', error)
      return { role: 'free', permissions: [] }
    }

    const isActiveSubscriber = profile?.clerk_subscriptions?.some(
      sub => sub.status === 'active' && 
             sub.current_period_end && 
             new Date(sub.current_period_end) > new Date()
    )

    const role = isActiveSubscriber ? profile.role : 'free'
    
    // 역할별 권한 정의
    const permissions = {
      free: ['search_query', 'bookmark_create', 'review_create'],
      pro: ['compile_prompt', 'run_workflow', 'ai_generation', 'export_data'],
      business: ['team_management', 'custom_integrations', 'white_label', 'dedicated_support']
    }

    return {
      role,
      permissions: [...permissions.free, ...(permissions[role] || [])],
      subscription: profile?.clerk_subscriptions?.[0] || null,
      profile
    }
  } catch (error) {
    console.error('❌ 권한 조회 예외:', error)
    return { role: 'free', permissions: [] }
  }
}

// ClerkProvider 래퍼 컴포넌트
export const ClerkProvider = ({ children }) => {
  return (
    <BaseClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY}
      localization={koKR}
      appearance={clerkAppearance}
    >
      {children}
    </BaseClerkProvider>
  )
}

export { CLERK_PUBLISHABLE_KEY }