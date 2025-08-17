// src/services/authService.js
import { supabase } from '../lib/supabase.js'
import toast from 'react-hot-toast'

export class AuthService {
  // 회원가입
  static async signUp(email, password, name) {
    try {
      console.log('🚀 회원가입 시작:', { email, name })
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      })

      console.log('📧 Supabase Auth 응답:', { data, error })

      if (error) {
        console.error('❌ Auth 오류:', error)
        throw error
      }

      // 사용자 프로필 생성 (사용자가 이메일 확인 후 트리거에서 처리)
      if (data.user && !data.user.email_confirmed_at) {
        console.log('✉️ 이메일 확인 대기 중...')
        toast.success('회원가입이 완료되었습니다! 이메일을 확인해주세요.')
        return { data, error: null }
      }

      // 이메일이 확인된 경우 즉시 프로필 생성
      if (data.user && data.user.email_confirmed_at) {
        console.log('👤 사용자 프로필 생성 중...')
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert([{
            id: data.user.id,
            email: data.user.email,
            name: name,
            subscription_tier: 'free',
            usage_count: 0,
            monthly_limit: 10
          }])

        if (profileError) {
          console.error('❌ 프로필 생성 오류:', profileError)
          // 프로필 생성 실패해도 회원가입은 성공으로 처리
        } else {
          console.log('✅ 프로필 생성 완료')
        }
      }

      toast.success('회원가입이 완료되었습니다! 이메일을 확인해주세요.')
      return { data, error: null }
    } catch (error) {
      console.error('❌ SignUp error:', error)
      const message = this.getErrorMessage(error)
      toast.error(message)
      return { data: null, error }
    }
  }

  // 로그인
  static async signIn(email, password) {
    try {
      console.log('🔐 로그인 시도:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      console.log('🔐 로그인 응답:', { data, error })

      if (error) throw error

      // 프로필이 없다면 생성
      if (data.user) {
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (!existingProfile) {
          console.log('👤 프로필 생성 (로그인시)')
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([{
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.name || '사용자',
              subscription_tier: 'free',
              usage_count: 0,
              monthly_limit: 10
            }])

          if (profileError) {
            console.error('❌ 프로필 생성 오류 (로그인시):', profileError)
          }
        }
      }

      toast.success('로그인되었습니다!')
      return { data, error: null }
    } catch (error) {
      console.error('❌ SignIn error:', error)
      const message = this.getErrorMessage(error)
      toast.error(message)
      return { data: null, error }
    }
  }

  // 로그아웃
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      toast.success('로그아웃되었습니다.')
      return { error: null }
    } catch (error) {
      console.error('SignOut error:', error)
      toast.error('로그아웃 중 오류가 발생했습니다.')
      return { error }
    }
  }

  // 비밀번호 재설정
  static async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      toast.success('비밀번호 재설정 이메일을 보냈습니다.')
      return { error: null }
    } catch (error) {
      console.error('Reset password error:', error)
      const message = this.getErrorMessage(error)
      toast.error(message)
      return { error }
    }
  }

  // 현재 사용자 정보 가져오기
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error

      if (user) {
        // 프로필 정보도 함께 가져오기
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Profile fetch error:', profileError)
          return { user, profile: null }
        }

        return { user, profile }
      }

      return { user: null, profile: null }
    } catch (error) {
      console.error('Get current user error:', error)
      return { user: null, profile: null }
    }
  }

  // 사용자 프로필 업데이트
  static async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      toast.success('프로필이 업데이트되었습니다.')
      return { data, error: null }
    } catch (error) {
      console.error('Update profile error:', error)
      toast.error('프로필 업데이트 중 오류가 발생했습니다.')
      return { data: null, error }
    }
  }

  // 사용량 체크
  static async checkUsageLimit(userId) {
    try {
      const { data, error } = await supabase
        .rpc('check_usage_limit', { user_uuid: userId })

      if (error) throw error
      return data // true/false
    } catch (error) {
      console.error('Check usage limit error:', error)
      return false
    }
  }

  // 사용량 증가
  static async incrementUsage(userId) {
    try {
      const { data, error } = await supabase
        .rpc('increment_usage', { user_uuid: userId })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Increment usage error:', error)
      return false
    }
  }

  // 에러 메시지 변환
  static getErrorMessage(error) {
    const errorMessages = {
      'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
      'Email not confirmed': '이메일 인증이 필요합니다. 이메일을 확인해주세요.',
      'User already registered': '이미 가입된 이메일입니다.',
      'Password should be at least 6 characters': '비밀번호는 최소 6자 이상이어야 합니다.',
      'Unable to validate email address: invalid format': '이메일 형식이 올바르지 않습니다.',
      'Email rate limit exceeded': '이메일 전송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
      'Signup is disabled': '회원가입이 비활성화되어 있습니다.',
      'Email link is invalid or has expired': '이메일 링크가 유효하지 않거나 만료되었습니다.',
      'Too many requests': '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
    }

    return errorMessages[error.message] || error.message || '알 수 없는 오류가 발생했습니다.'
  }

  // 인증 상태 변화 감지
  static onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}
