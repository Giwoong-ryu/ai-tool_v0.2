// src/store/authStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthService } from '../services/authService.js'

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: true,

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
                  isAuthenticated: false 
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
            isLoading: false 
          })
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

      // Cleanup
      cleanup: () => {
        const { authStateListener } = get()
        if (authStateListener) {
          authStateListener.unsubscribe()
          set({ authStateListener: null })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

export default useAuthStore
