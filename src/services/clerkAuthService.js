// src/services/clerkAuthService.js
import { useUser, useAuth, useClerk } from '@clerk/clerk-react'
import { syncClerkToSupabase, syncUserProfile, getUserPermissions } from '../lib/clerk.js'
import { supabase } from '../lib/supabase.js'
import toast from 'react-hot-toast'

export class ClerkAuthService {
  // 현재 사용자 정보 가져오기 (Clerk + Supabase 프로필)
  static async getCurrentUser() {
    try {
      const { user, isLoaded } = useUser()
      const { getToken, isSignedIn } = useAuth()
      
      if (!isLoaded || !isSignedIn || !user) {
        return { user: null, profile: null }
      }

      // Clerk - Supabase JWT 동기화
      const session = await getToken({ template: 'supabase' })
      if (session) {
        await syncClerkToSupabase({ getToken: () => Promise.resolve(session) })
      }

      // Supabase 프로필 동기화 및 조회
      const profile = await syncUserProfile(user)
      
      return {
        user: {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          name: user.fullName || user.firstName,
          avatar_url: user.imageUrl,
          email_verified: user.emailAddresses[0]?.verification?.status === 'verified',
          phone_verified: user.phoneNumbers?.[0]?.verification?.status === 'verified',
          created_at: user.createdAt,
          last_sign_in: user.lastSignInAt
        },
        profile
      }
    } catch (error) {
      console.error('❌ getCurrentUser 오류:', error)
      return { user: null, profile: null }
    }
  }

  // 사용자 프로필 업데이트 (Clerk + Supabase)
  static async updateProfile(updates) {
    try {
      const { user } = useUser()
      const clerk = useClerk()
      
      if (!user) {
        throw new Error('로그인이 필요합니다.')
      }

      // Clerk 프로필 업데이트
      if (updates.name) {
        await user.update({
          firstName: updates.name.split(' ')[0],
          lastName: updates.name.split(' ').slice(1).join(' ') || ''
        })
      }

      if (updates.avatar_url && updates.avatar_url !== user.imageUrl) {
        await user.setProfileImage({ file: updates.avatar_url })
      }

      // Supabase 프로필 업데이트
      const { data, error } = await supabase
        .from('clerk_profiles')
        .update({
          name: updates.name || user.fullName,
          avatar_url: updates.avatar_url || user.imageUrl,
          preferences: updates.preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      toast.success('프로필이 업데이트되었습니다.')
      return { data, error: null }
    } catch (error) {
      console.error('❌ updateProfile 오류:', error)
      toast.error('프로필 업데이트 중 오류가 발생했습니다.')
      return { data: null, error }
    }
  }

  // 사용량 제한 확인
  static async checkUsageLimit(userId, eventType = 'compile_prompt') {
    if (!userId) return false

    try {
      // 사용자 권한 정보 가져오기
      const permissions = await getUserPermissions(userId)
      
      // 무료 사용자 제한 체크
      if (permissions.role === 'free') {
        const { data, error } = await supabase.rpc('check_usage_limit', {
          p_user_id: userId,
          p_event_type: eventType,
          p_count: 1
        })

        if (error) {
          console.error('❌ 사용량 체크 오류:', error)
          return false
        }

        return data
      }

      // 유료 사용자는 더 높은 제한 또는 무제한
      return true
    } catch (error) {
      console.error('❌ checkUsageLimit 오류:', error)
      return false
    }
  }

  // 사용량 기록 및 증가
  static async incrementUsage(userId, eventType = 'compile_prompt', resourceId = null, metadata = {}) {
    if (!userId) return false

    try {
      const { data, error } = await supabase.rpc('record_usage_event', {
        p_user_id: userId,
        p_event_type: eventType,
        p_resource_id: resourceId,
        p_count: 1,
        p_metadata: metadata
      })

      if (error) {
        console.error('❌ 사용량 기록 오류:', error)
        return false
      }

      return data
    } catch (error) {
      console.error('❌ incrementUsage 오류:', error)
      return false
    }
  }

  // 구독 상태 확인
  static async getSubscriptionStatus(userId) {
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('clerk_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      return data?.[0] || null
    } catch (error) {
      console.error('❌ getSubscriptionStatus 오류:', error)
      return null
    }
  }

  // 사용량 통계 조회
  static async getUsageStats(userId, period = '30 days') {
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('clerk_usage_events')
        .select('event_type, count')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      // 이벤트 타입별 사용량 집계
      const stats = data.reduce((acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + event.count
        return acc
      }, {})

      return {
        totalUsage: Object.values(stats).reduce((sum, count) => sum + count, 0),
        byEventType: stats,
        period
      }
    } catch (error) {
      console.error('❌ getUsageStats 오류:', error)
      return null
    }
  }

  // 인증 상태 변화 감지 및 처리
  static setupAuthStateListener() {
    const { isLoaded, isSignedIn, user } = useUser()
    const { getToken } = useAuth()

    React.useEffect(() => {
      const handleAuthChange = async () => {
        if (!isLoaded) return

        if (isSignedIn && user) {
          // 로그인시 Supabase 동기화
          try {
            const token = await getToken({ template: 'supabase' })
            if (token) {
              await syncClerkToSupabase({ getToken: () => Promise.resolve(token) })
              await syncUserProfile(user)
            }
          } catch (error) {
            console.error('❌ 인증 동기화 오류:', error)
          }
        } else {
          // 로그아웃시 Supabase 세션 정리
          await supabase.auth.signOut()
        }
      }

      handleAuthChange()
    }, [isLoaded, isSignedIn, user, getToken])
  }
}

// React Hook으로 인증 상태 관리
export const useClerkAuth = () => {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser()
  const { getToken, isLoaded: authLoaded } = useAuth()
  const [profile, setProfile] = React.useState(null)
  const [permissions, setPermissions] = React.useState({ role: 'free', permissions: [] })
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const initializeAuth = async () => {
      if (!userLoaded || !authLoaded) return

      setIsLoading(true)
      
      if (isSignedIn && user) {
        try {
          // JWT 동기화
          const token = await getToken({ template: 'supabase' })
          if (token) {
            await syncClerkToSupabase({ getToken: () => Promise.resolve(token) })
          }

          // 프로필 동기화
          const userProfile = await syncUserProfile(user)
          setProfile(userProfile)

          // 권한 정보 조회
          const userPermissions = await getUserPermissions(user.id)
          setPermissions(userPermissions)

        } catch (error) {
          console.error('❌ 인증 초기화 오류:', error)
        }
      } else {
        // 로그아웃 상태
        setProfile(null)
        setPermissions({ role: 'free', permissions: [] })
        await supabase.auth.signOut()
      }
      
      setIsLoading(false)
    }

    initializeAuth()
  }, [userLoaded, authLoaded, isSignedIn, user, getToken])

  return {
    user,
    profile,
    permissions,
    isAuthenticated: isSignedIn && !!user,
    isLoading: isLoading || !userLoaded || !authLoaded,
    checkUsageLimit: (eventType) => ClerkAuthService.checkUsageLimit(user?.id, eventType),
    incrementUsage: (eventType, resourceId, metadata) => 
      ClerkAuthService.incrementUsage(user?.id, eventType, resourceId, metadata),
    getSubscriptionStatus: () => ClerkAuthService.getSubscriptionStatus(user?.id),
    getUsageStats: (period) => ClerkAuthService.getUsageStats(user?.id, period),
    updateProfile: (updates) => ClerkAuthService.updateProfile(updates)
  }
}