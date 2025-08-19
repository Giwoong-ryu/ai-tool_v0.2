// src/hooks/useRunnerSession.js
import { useEffect, useCallback, useRef } from 'react'
import { useToast } from '../components/ui/use-toast.jsx'
import useWorkflowStore from '../store/workflowStore.js'

/**
 * Custom hook for managing runner session save/resume functionality
 * Provides session management with auto-save, recovery, and browser integration
 */
export function useRunnerSession(runId, options = {}) {
  const {
    autoSave = true,
    resumeOnMount = true,
    saveOnUnload = true,
    sessionName = null
  } = options

  const { toast } = useToast()
  const unloadHandlerRef = useRef(null)

  const {
    // Session state
    currentSession,
    isSessionActive,
    sessionKey,
    availableSessions,
    isLoadingSessions,
    
    // Session actions
    createSession,
    saveSession,
    resumeSession,
    loadAvailableSessions,
    pauseSession,
    completeSession,
    
    // Store state
    currentRun,
    hasUnsavedChanges,
    error
  } = useWorkflowStore()

  // Generate session key from URL or storage
  const generateSessionKey = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const sessionFromUrl = urlParams.get('session')
    const sessionFromStorage = localStorage.getItem(`runner_session_${runId}`)
    
    return sessionFromUrl || sessionFromStorage || null
  }, [runId])

  // Initialize session on mount
  useEffect(() => {
    if (!runId) return

    const initializeSession = async () => {
      try {
        const existingSessionKey = generateSessionKey()
        
        if (existingSessionKey && resumeOnMount) {
          // Try to resume existing session
          try {
            await resumeSession(existingSessionKey)
            toast({
              title: '세션 복원됨',
              description: '이전 작업을 계속할 수 있습니다.'
            })
          } catch (error) {
            console.warn('Failed to resume session:', error)
            // Create new session if resume fails
            await createNewSession()
          }
        } else {
          // Create new session
          await createNewSession()
        }
      } catch (error) {
        console.error('Session initialization error:', error)
        toast({
          title: '세션 초기화 실패',
          description: '새로운 세션으로 시작합니다.',
          variant: 'destructive'
        })
      }
    }

    const createNewSession = async () => {
      const result = await createSession(runId, sessionName)
      if (result?.sessionKey) {
        localStorage.setItem(`runner_session_${runId}`, result.sessionKey)
        
        // Update URL with session key
        const url = new URL(window.location)
        url.searchParams.set('session', result.sessionKey)
        window.history.replaceState(null, '', url.toString())
      }
    }

    initializeSession()
  }, [runId, resumeOnMount, sessionName])

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !isSessionActive || !currentSession) return

    const autoSaveInterval = setInterval(async () => {
      if (hasUnsavedChanges) {
        try {
          await saveSession('auto')
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }
    }, 15000) // Auto-save every 15 seconds

    return () => clearInterval(autoSaveInterval)
  }, [autoSave, isSessionActive, currentSession, hasUnsavedChanges])

  // Browser unload handler
  useEffect(() => {
    if (!saveOnUnload || !isSessionActive) return

    const handleBeforeUnload = async (event) => {
      if (hasUnsavedChanges) {
        // Save session before page unload
        try {
          await saveSession('manual')
          await pauseSession('Browser close/refresh')
        } catch (error) {
          console.error('Failed to save on unload:', error)
        }
        
        // Show confirmation dialog
        event.preventDefault()
        event.returnValue = '저장되지 않은 변경사항이 있습니다. 정말 나가시겠습니까?'
        return event.returnValue
      }
    }

    const handleUnload = () => {
      if (isSessionActive && currentSession) {
        // Use sendBeacon for reliable save on unload
        const sessionData = {
          sessionId: currentSession,
          timestamp: new Date().toISOString(),
          reason: 'page_unload'
        }
        
        navigator.sendBeacon('/api/session/pause', JSON.stringify(sessionData))
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('unload', handleUnload)
    unloadHandlerRef.current = { handleBeforeUnload, handleUnload }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('unload', handleUnload)
    }
  }, [saveOnUnload, isSessionActive, currentSession, hasUnsavedChanges])

  // Manual save with user feedback
  const manualSave = useCallback(async () => {
    if (!currentSession) {
      toast({
        title: '세션 없음',
        description: '활성 세션이 없습니다.',
        variant: 'destructive'
      })
      return false
    }

    try {
      const success = await saveSession('manual')
      if (success) {
        toast({
          title: '저장 완료',
          description: '세션이 성공적으로 저장되었습니다.'
        })
      }
      return success
    } catch (error) {
      toast({
        title: '저장 실패',
        description: error.message || '세션 저장에 실패했습니다.',
        variant: 'destructive'
      })
      return false
    }
  }, [currentSession, saveSession, toast])

  // Resume from session key
  const resumeFromKey = useCallback(async (key) => {
    try {
      const sessionData = await resumeSession(key)
      
      // Update localStorage and URL
      localStorage.setItem(`runner_session_${runId}`, key)
      const url = new URL(window.location)
      url.searchParams.set('session', key)
      window.history.replaceState(null, '', url.toString())
      
      toast({
        title: '세션 복원됨',
        description: '이전 작업을 계속할 수 있습니다.'
      })
      
      return sessionData
    } catch (error) {
      toast({
        title: '세션 복원 실패',
        description: error.message || '세션을 복원할 수 없습니다.',
        variant: 'destructive'
      })
      throw error
    }
  }, [runId, resumeSession, toast])

  // Load available sessions for recovery UI
  const refreshSessions = useCallback(async () => {
    try {
      return await loadAvailableSessions()
    } catch (error) {
      toast({
        title: '세션 목록 로드 실패',
        description: error.message || '세션 목록을 불러올 수 없습니다.',
        variant: 'destructive'
      })
      return []
    }
  }, [loadAvailableSessions, toast])

  // Complete current session
  const finishSession = useCallback(async () => {
    if (!currentSession) return false

    try {
      // Save final state
      await saveSession('manual')
      
      // Complete session
      const success = await completeSession()
      
      if (success) {
        // Clean up local storage
        localStorage.removeItem(`runner_session_${runId}`)
        
        // Remove session from URL
        const url = new URL(window.location)
        url.searchParams.delete('session')
        window.history.replaceState(null, '', url.toString())
        
        toast({
          title: '세션 완료',
          description: '워크플로우가 성공적으로 완료되었습니다.'
        })
      }
      
      return success
    } catch (error) {
      toast({
        title: '세션 완료 실패',
        description: error.message || '세션을 완료할 수 없습니다.',
        variant: 'destructive'
      })
      return false
    }
  }, [currentSession, runId, saveSession, completeSession, toast])

  return {
    // Session state
    sessionId: currentSession,
    sessionKey,
    isActive: isSessionActive,
    availableSessions,
    isLoadingSessions,
    
    // Session actions
    save: manualSave,
    resume: resumeFromKey,
    pause: pauseSession,
    complete: finishSession,
    refreshSessions,
    
    // Utilities
    hasActiveSession: !!currentSession && isSessionActive,
    isRecoverable: availableSessions.length > 0,
    
    // Error state
    error
  }
}

export default useRunnerSession