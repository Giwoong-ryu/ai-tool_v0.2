// src/store/authStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthService } from '../services/authService.js'
import { guardService } from '../services/guardService.ts'
import { featureFlags } from '../config/featureFlags.ts'

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: true,
      
      // Plan & Permission State
      currentPlan: 'free',
      teamPlan: null,
      quotaStatus: {},
      permissionCache: new Map(),

      // Actions
      initialize: async () => {
        set({ isLoading: true })
        
        try {
          const { user, profile } = await AuthService.getCurrentUser()
          set({ 
            user, 
            profile, 
            isAuthenticated: !!user,
            isLoading: false 
          })

          // 인증 상태 변화 감지 설정
          if (!get().authStateListener) {
            const { data: { subscription } } = AuthService.onAuthStateChange(async (event, session) => {
              if (event === 'SIGNED_IN' && session?.user) {
                try {
                  const { user, profile } = await AuthService.getCurrentUser()
                  set({ 
                    user, 
                    profile, 
                    isAuthenticated: true 
                  })
                  
                  // 권한 시스템 업데이트
                  get().updatePermissions()
                } catch (error) {
                  console.error('Get current user error:', error)
                  // 에러가 발생해도 기본 사용자 정보는 설정
                  set({ 
                    user: session.user, 
                    profile: null, 
                    isAuthenticated: true 
                  })
                }
              } else if (event === 'SIGNED_OUT') {
                set({ 
                  user: null, 
                  profile: null, 
                  isAuthenticated: false,
                  currentPlan: 'free',
                  teamPlan: null,
                  quotaStatus: {},
                  permissionCache: new Map()
                })
              }
            })
            
            set({ authStateListener: subscription })
          }
        } catch (error) {
          console.error('Get current user error:', error)
          set({ 
            user: null, 
            profile: null, 
            isAuthenticated: false, 
            isLoading: false,
            currentPlan: 'free',
            teamPlan: null,
            quotaStatus: {},
            permissionCache: new Map()
          })
        }
        
        // 초기 권한 업데이트
        if (get().isAuthenticated) {
          get().updatePermissions()
        }
      },

      signUp: async (email, password, name) => {
        try {
          const { data, error } = await AuthService.signUp(email, password, name)
          if (!error && data.user) {
            // 이메일 확인 대기 상태로 설정
            set({ 
              user: data.user, 
              profile: null, 
              isAuthenticated: false 
            })
          }
          return { data, error }
        } catch (error) {
          console.error('Sign up error:', error)
          return { data: null, error }
        }
      },

      signIn: async (email, password) => {
        try {
          const { data, error } = await AuthService.signIn(email, password)
          if (!error && data.user) {
            // 즉시 상태 업데이트
            set({ 
              user: data.user, 
              profile: null, 
              isAuthenticated: true 
            })
            
            // 프로필 정보 가져오기
            try {
              const { user, profile } = await AuthService.getCurrentUser()
              set({ 
                user, 
                profile, 
                isAuthenticated: true 
              })
            } catch (profileError) {
              console.error('Get profile error:', profileError)
              // 프로필 정보가 없어도 로그인은 성공으로 처리
            }
          }
          return { data, error }
        } catch (error) {
          console.error('Sign in error:', error)
          return { data: null, error }
        }
      },

      signOut: async () => {
        try {
          const { error } = await AuthService.signOut()
          if (!error) {
            set({ 
              user: null, 
              profile: null, 
              isAuthenticated: false 
            })
          }
          return { error }
        } catch (error) {
          console.error('Sign out error:', error)
          return { error }
        }
      },

      updateProfile: async (updates) => {
        const { user } = get()
        if (!user) return { data: null, error: 'Not authenticated' }

        try {
          const { data, error } = await AuthService.updateProfile(user.id, updates)
          if (!error && data) {
            set(state => ({ 
              profile: { ...state.profile, ...data } 
            }))
          }
          return { data, error }
        } catch (error) {
          console.error('Update profile error:', error)
          return { data: null, error }
        }
      },

      checkUsageLimit: async () => {
        const { user } = get()
        if (!user) return false
        
        try {
          return await AuthService.checkUsageLimit(user.id)
        } catch (error) {
          console.error('Check usage limit error:', error)
          return true // 에러시 사용 제한으로 처리
        }
      },

      incrementUsage: async () => {
        const { user, profile } = get()
        if (!user) return false

        try {
          const result = await AuthService.incrementUsage(user.id)
          if (result && profile) {
            // 로컬 상태 업데이트
            set(state => ({
              profile: {
                ...state.profile,
                usage_count: (state.profile?.usage_count || 0) + 1
              }
            }))
          }
          return result
        } catch (error) {
          console.error('Increment usage error:', error)
          return false
        }
      },

      resetPassword: async (email) => {
        try {
          return await AuthService.resetPassword(email)
        } catch (error) {
          console.error('Reset password error:', error)
          return { data: null, error }
        }
      },

      // Permission & Plan Management
      updatePermissions: async () => {
        try {
          await guardService.updateUserPlan()
          const planInfo = guardService.featureFlags?.getPlanInfo()
          
          if (planInfo) {
            set({
              currentPlan: planInfo.plan,
              teamPlan: planInfo.isTeamPlan ? planInfo.plan : null
            })
          }
        } catch (error) {
          console.error('Update permissions error:', error)
        }
      },

      checkPermission: async (action, resourceId, quantity = 1) => {
        try {
          return await guardService.checkPermission(action, resourceId, quantity)
        } catch (error) {
          console.error('Check permission error:', error)
          return { allowed: false, error: { message: '권한 확인 중 오류가 발생했습니다.' } }
        }
      },

      executeWithGuard: async (action, operation, options = {}) => {
        try {
          return await guardService.executeWithGuard(action, operation, options)
        } catch (error) {
          console.error('Execute with guard error:', error)
          throw error
        }
      },

      hasFeature: (feature) => {
        try {
          return guardService.hasFeature(feature)
        } catch (error) {
          console.error('Check feature error:', error)
          return false
        }
      },

      getQuotaStatus: async (action) => {
        try {
          const quota = await guardService.getQuotaStatus(action)
          if (quota) {
            set(state => ({
              quotaStatus: {
                ...state.quotaStatus,
                [action]: quota
              }
            }))
          }
          return quota
        } catch (error) {
          console.error('Get quota status error:', error)
          return null
        }
      },

      // Enhanced usage methods with guard integration
      checkUsageLimitWithGuard: async (action = 'compile') => {
        const result = await get().checkPermission(action)
        return result.allowed
      },

      incrementUsageWithGuard: async (action = 'compile', resourceId) => {
        try {
          const result = await get().checkPermission(action, resourceId)
          if (!result.allowed) {
            return false
          }

          // 기존 incrementUsage 로직 유지
          const { user, profile } = get()
          if (!user) return false

          const apiResult = await AuthService.incrementUsage(user.id)
          if (apiResult && profile) {
            set(state => ({
              profile: {
                ...state.profile,
                usage_count: (state.profile?.usage_count || 0) + 1
              }
            }))
          }

          // 쿼터 상태 업데이트
          await get().getQuotaStatus(action)
          
          return apiResult
        } catch (error) {
          console.error('Increment usage with guard error:', error)
          return false
        }
      },

      // Plan and subscription helpers
      getCurrentPlan: () => {
        const { teamPlan, currentPlan } = get()
        return teamPlan || currentPlan
      },

      isUnlimitedPlan: () => {
        const plan = get().getCurrentPlan()
        return plan === 'pro' || plan === 'team'
      },

      getUpgradeUrl: (feature) => {
        try {
          const upgradeInfo = guardService.getUpgradeInfo(get().getCurrentPlan(), feature)
          return upgradeInfo?.upgradeUrl || '/pricing'
        } catch (error) {
          console.error('Get upgrade URL error:', error)
          return '/pricing'
        }
      },

      // Cleanup
      cleanup: () => {
        const { authStateListener } = get()
        if (authStateListener) {
          authStateListener.unsubscribe()
          set({ authStateListener: null })
        }
        
        // 캐시 정리
        guardService.clearCache()
        set({ permissionCache: new Map() })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
        currentPlan: state.currentPlan,
        teamPlan: state.teamPlan,
        quotaStatus: state.quotaStatus
      })
    }
  )
)

export default useAuthStore
