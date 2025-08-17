// Modal State Management - 글로벌 모달 상태 관리
// ============================================================

import { create } from 'zustand'
import { canShowUpgradePrompts, canUseTossPayments } from '../lib/featureFlags.js'

// 모달 타입 정의
export const MODAL_TYPES = {
  UPGRADE: 'upgrade',
  BILLING_DETAILS: 'billing_details',
  PAYMENT: 'payment',
  SUBSCRIPTION_MANAGEMENT: 'subscription_management'
}

// 업그레이드 트리거 타입
export const UPGRADE_TRIGGERS = {
  USAGE_LIMIT: 'usage_limit',
  FEATURE_ACCESS: 'feature_access',
  EXPLICIT_BUTTON: 'explicit_button',
  PERIODIC_PROMPT: 'periodic_prompt'
}

// Modal Store 생성
const useModalStore = create((set, get) => ({
  // ============================================================
  // 상태
  // ============================================================
  
  // 현재 열린 모달
  activeModal: null,
  
  // 모달 데이터 (모달별 props/정보)
  modalData: {},
  
  // 업그레이드 프롬프트 관련 상태
  upgradePrompt: {
    lastShown: null,
    suppressedUntil: null,
    triggerSource: null
  },

  // ============================================================
  // 모달 제어 액션
  // ============================================================
  
  /**
   * 모달 열기
   * @param {string} modalType - MODAL_TYPES 중 하나
   * @param {object} data - 모달에 전달할 데이터
   */
  openModal: (modalType, data = {}) => {
    const state = get()
    
    // Feature Flag 검증
    if (modalType === MODAL_TYPES.UPGRADE && !canShowUpgradePrompts()) {
      console.warn('⚠️ Upgrade modal blocked by feature flag')
      return false
    }
    
    if (modalType === MODAL_TYPES.PAYMENT && !canUseTossPayments()) {
      console.warn('⚠️ Payment modal blocked by feature flag')
      return false
    }
    
    set({
      activeModal: modalType,
      modalData: { ...state.modalData, [modalType]: data }
    })
    
    return true
  },
  
  /**
   * 모달 닫기
   */
  closeModal: () => {
    set({
      activeModal: null,
      modalData: {}
    })
  },
  
  /**
   * 특정 모달 데이터 업데이트
   * @param {string} modalType 
   * @param {object} data 
   */
  updateModalData: (modalType, data) => {
    const state = get()
    set({
      modalData: {
        ...state.modalData,
        [modalType]: { ...state.modalData[modalType], ...data }
      }
    })
  },

  // ============================================================
  // 업그레이드 프롬프트 로직
  // ============================================================
  
  /**
   * 업그레이드 프롬프트 표시 시도
   * @param {string} trigger - UPGRADE_TRIGGERS 중 하나
   * @param {object} context - 트리거 관련 컨텍스트 정보
   */
  tryShowUpgradePrompt: (trigger, context = {}) => {
    const state = get()
    
    // Feature Flag 체크
    if (!canShowUpgradePrompts()) {
      return false
    }
    
    // 억제 기간 체크
    if (state.upgradePrompt.suppressedUntil && 
        new Date() < state.upgradePrompt.suppressedUntil) {
      return false
    }
    
    // 주기적 프롬프트의 경우 최소 간격 체크 (24시간)
    if (trigger === UPGRADE_TRIGGERS.PERIODIC_PROMPT) {
      const lastShown = state.upgradePrompt.lastShown
      if (lastShown && new Date() - lastShown < 24 * 60 * 60 * 1000) {
        return false
      }
    }
    
    // 업그레이드 모달 열기
    const success = get().openModal(MODAL_TYPES.UPGRADE, {
      trigger,
      context,
      timestamp: new Date()
    })
    
    if (success) {
      set({
        upgradePrompt: {
          ...state.upgradePrompt,
          lastShown: new Date(),
          triggerSource: trigger
        }
      })
    }
    
    return success
  },
  
  /**
   * 업그레이드 프롬프트 억제 (사용자가 나중에 보기 선택 시)
   * @param {number} hours - 억제할 시간 (기본 24시간)
   */
  suppressUpgradePrompt: (hours = 24) => {
    const suppressedUntil = new Date()
    suppressedUntil.setHours(suppressedUntil.getHours() + hours)
    
    const state = get()
    set({
      upgradePrompt: {
        ...state.upgradePrompt,
        suppressedUntil
      }
    })
  },

  // ============================================================
  // 유틸리티 함수
  // ============================================================
  
  /**
   * 현재 모달이 열려있는지 확인
   * @param {string} modalType - 확인할 모달 타입
   */
  isModalOpen: (modalType) => {
    return get().activeModal === modalType
  },
  
  /**
   * 현재 모달 데이터 가져오기
   * @param {string} modalType 
   */
  getModalData: (modalType) => {
    return get().modalData[modalType] || {}
  },
  
  /**
   * 업그레이드 프롬프트 가능 여부 확인
   */
  canShowUpgrade: () => {
    const state = get()
    
    // Feature Flag 체크
    if (!canShowUpgradePrompts()) {
      return false
    }
    
    // 억제 기간 체크
    if (state.upgradePrompt.suppressedUntil && 
        new Date() < state.upgradePrompt.suppressedUntil) {
      return false
    }
    
    return true
  },

  // ============================================================
  // 리셋 및 디버그
  // ============================================================
  
  /**
   * 업그레이드 프롬프트 상태 리셋 (개발/테스트용)
   */
  resetUpgradePromptState: () => {
    set({
      upgradePrompt: {
        lastShown: null,
        suppressedUntil: null,
        triggerSource: null
      }
    })
  }
}))

// ============================================================
// Hook 스타일 래퍼 함수들 (편의성)
// ============================================================

/**
 * 업그레이드 모달 열기 간편 함수
 */
export const useUpgradeModal = () => {
  const { tryShowUpgradePrompt, suppressUpgradePrompt, canShowUpgrade } = useModalStore()
  
  return {
    showUpgrade: (trigger, context) => tryShowUpgradePrompt(trigger, context),
    suppressUpgrade: (hours) => suppressUpgradePrompt(hours),
    canShow: canShowUpgrade
  }
}

/**
 * 결제 모달 열기 간편 함수
 */
export const usePaymentModal = () => {
  const { openModal, closeModal, isModalOpen } = useModalStore()
  
  return {
    showPayment: (data) => openModal(MODAL_TYPES.PAYMENT, data),
    closePayment: () => closeModal(),
    isOpen: isModalOpen(MODAL_TYPES.PAYMENT)
  }
}

export default useModalStore

// ============================================================
// 개발 환경 디버그
// ============================================================

if (import.meta.env.DEV) {
  // 글로벌 디버그 함수 추가
  window.__modalStore = useModalStore
  window.__modalTypes = MODAL_TYPES
  window.__upgradeTriggers = UPGRADE_TRIGGERS
  
  console.log('🔧 Modal Store available in window.__modalStore')
}