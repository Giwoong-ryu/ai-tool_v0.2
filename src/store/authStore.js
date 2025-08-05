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
                const { user, profile } = await AuthService.getCurrentUser()
                set({ 
                  user, 
                  profile, 
                  isAuthenticated: true 
                })
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
          console.error('Auth initialization error:', error)
          set({ 
            user: null, 
            profile: null, 
            isAuthenticated: false, 
            isLoading: false 
          })
        }
      },

      signUp: async (email, password, name) => {
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
      },

      signIn: async (email, password) => {
        const { data, error } = await AuthService.signIn(email, password)
        if (!error && data.user) {
          const { user, profile } = await AuthService.getCurrentUser()
          set({ 
            user, 
            profile, 
            isAuthenticated: true 
          })
        }
        return { data, error }
      },

      signOut: async () => {
        const { error } = await AuthService.signOut()
        if (!error) {
          set({ 
            user: null, 
            profile: null, 
            isAuthenticated: false 
          })
        }
        return { error }
      },

      updateProfile: async (updates) => {
        const { user } = get()
        if (!user) return { data: null, error: 'Not authenticated' }

        const { data, error } = await AuthService.updateProfile(user.id, updates)
        if (!error && data) {
          set(state => ({ 
            profile: { ...state.profile, ...data } 
          }))
        }
        return { data, error }
      },

      checkUsageLimit: async () => {
        const { user } = get()
        if (!user) return false
        
        return await AuthService.checkUsageLimit(user.id)
      },

      incrementUsage: async () => {
        const { user, profile } = get()
        if (!user) return false

        const result = await AuthService.incrementUsage(user.id)
        if (result && profile) {
          // 로컬 상태 업데이트
          set(state => ({
            profile: {
              ...state.profile,
              usage_count: state.profile.usage_count + 1
            }
          }))
        }
        return result
      },

      resetPassword: async (email) => {
        return await AuthService.resetPassword(email)
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
