// src/store/workflowStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { trackEvent } from '../services/analyticsService'

const useWorkflowStore = create(
  persist(
    (set, get) => ({
      // Current run state
      currentRun: null,
      steps: [],
      isLoading: false,
      error: null,

      // Auto-save state
      isAutoSaving: false,
      lastSavedAt: null,
      hasUnsavedChanges: false,
      autoSaveInterval: null,

      // Session management state
      currentSession: null,
      isSessionActive: false,
      sessionKey: null,
      availableSessions: [],
      isLoadingSessions: false,

      // UI state
      currentStepIndex: 0,
      expandedSteps: new Set(),
      viewMode: 'timeline',

      // History for undo/redo
      historyStack: [],
      historyIndex: -1,
      canUndo: false,
      canRedo: false,

      // Actions
      createRun: async (workflowId, title, description, workflowData) => {
        set({ isLoading: true, error: null })
        
        try {
          const { data, error } = await supabase
            .rpc('create_workflow_run', {
              p_workflow_id: workflowId,
              p_title: title,
              p_description: description,
              p_workflow_data: workflowData
            })

          if (error) throw error

          // Initialize steps
          const { data: initResult, error: initError } = await supabase
            .rpc('initialize_run_steps', {
              p_run_id: data,
              p_workflow_data: workflowData
            })

          if (initError) throw initError

          // Fetch the created run with steps
          const { data: runData, error: fetchError } = await supabase
            .from('workflow_runs')
            .select(`
              *,
              steps:workflow_run_steps(*)
            `)
            .eq('id', data)
            .single()

          if (fetchError) throw fetchError

          set({
            currentRun: runData,
            steps: runData.steps || [],
            isLoading: false,
            currentStepIndex: 0,
            hasUnsavedChanges: false
          })

          // Start auto-save
          get().startAutoSave()

          // Track analytics
          trackEvent('start_workflow', {
            workflow_id: workflowId,
            run_id: data,
            total_steps: runData.total_steps
          })

          return data
        } catch (error) {
          console.error('Create run error:', error)
          set({ error: error.message, isLoading: false })
          throw error
        }
      },

      loadRun: async (runId) => {
        set({ isLoading: true, error: null })
        
        try {
          const { data, error } = await supabase
            .from('workflow_runs')
            .select(`
              *,
              steps:workflow_run_steps(*)
            `)
            .eq('id', runId)
            .single()

          if (error) throw error

          set({
            currentRun: data,
            steps: (data.steps || []).sort((a, b) => a.step_number - b.step_number),
            isLoading: false,
            currentStepIndex: data.current_step || 0,
            hasUnsavedChanges: false
          })

          // Start auto-save if run is active
          if (data.status === 'running') {
            get().startAutoSave()
          }

          return data
        } catch (error) {
          console.error('Load run error:', error)
          set({ error: error.message, isLoading: false })
          throw error
        }
      },

      startRun: async () => {
        const { currentRun } = get()
        if (!currentRun) return false

        try {
          const { error } = await supabase
            .rpc('start_workflow_run', { run_id: currentRun.id })

          if (error) throw error

          set(state => ({
            currentRun: {
              ...state.currentRun,
              status: 'running',
              started_at: new Date().toISOString()
            }
          }))

          get().startAutoSave()
          return true
        } catch (error) {
          console.error('Start run error:', error)
          set({ error: error.message })
          return false
        }
      },

      pauseRun: async () => {
        const { currentRun } = get()
        if (!currentRun) return false

        try {
          const { error } = await supabase
            .rpc('pause_workflow_run', { run_id: currentRun.id })

          if (error) throw error

          set(state => ({
            currentRun: {
              ...state.currentRun,
              status: 'paused',
              paused_at: new Date().toISOString()
            }
          }))

          get().stopAutoSave()
          return true
        } catch (error) {
          console.error('Pause run error:', error)
          set({ error: error.message })
          return false
        }
      },

      completeRun: async () => {
        const { currentRun } = get()
        if (!currentRun) return false

        try {
          const { error } = await supabase
            .rpc('complete_workflow_run', { run_id: currentRun.id })

          if (error) throw error

          set(state => ({
            currentRun: {
              ...state.currentRun,
              status: 'completed',
              progress: 100,
              completed_at: new Date().toISOString()
            }
          }))

          get().stopAutoSave()

          // Track completion
          trackEvent('complete_workflow', {
            workflow_id: currentRun.workflow_id,
            run_id: currentRun.id,
            completion_rate: 100,
            total_time: currentRun.actual_completion_time
          })

          return true
        } catch (error) {
          console.error('Complete run error:', error)
          set({ error: error.message })
          return false
        }
      },

      updateStepStatus: async (stepId, status, notes = null, outputData = null) => {
        const { currentRun, steps } = get()
        if (!currentRun) return false

        try {
          // Add to history for undo
          const step = steps.find(s => s.id === stepId)
          if (step) {
            get().addToHistory({
              stepId,
              action: 'status_update',
              oldValue: step.status,
              newValue: status,
              timestamp: new Date().toISOString()
            })
          }

          const { error } = await supabase
            .rpc('update_step_status', {
              p_step_id: stepId,
              p_status: status,
              p_notes: notes,
              p_output_data: outputData
            })

          if (error) throw error

          // Update local state
          set(state => ({
            steps: state.steps.map(step => 
              step.id === stepId 
                ? { 
                    ...step, 
                    status, 
                    notes: notes || step.notes,
                    output_data: outputData || step.output_data,
                    completed_at: status === 'completed' ? new Date().toISOString() : step.completed_at,
                    started_at: status === 'in_progress' && !step.started_at ? new Date().toISOString() : step.started_at
                  }
                : step
            ),
            hasUnsavedChanges: true
          }))

          // Track step completion
          if (status === 'completed') {
            const stepIndex = steps.findIndex(s => s.id === stepId)
            trackEvent('complete_step', {
              workflow_id: currentRun.workflow_id,
              run_id: currentRun.id,
              step_id: stepId,
              step_number: stepIndex + 1
            })
          }

          return true
        } catch (error) {
          console.error('Update step status error:', error)
          set({ error: error.message })
          return false
        }
      },

      updateStepNotes: async (stepId, notes) => {
        try {
          const { error } = await supabase
            .rpc('update_step_notes', {
              p_step_id: stepId,
              p_notes: notes
            })

          if (error) throw error

          set(state => ({
            steps: state.steps.map(step => 
              step.id === stepId ? { ...step, notes } : step
            ),
            hasUnsavedChanges: true
          }))

          return true
        } catch (error) {
          console.error('Update step notes error:', error)
          set({ error: error.message })
          return false
        }
      },

      updateStepData: async (stepId, inputData = null, outputData = null) => {
        try {
          const { error } = await supabase
            .rpc('update_step_data', {
              p_step_id: stepId,
              p_input_data: inputData,
              p_output_data: outputData
            })

          if (error) throw error

          set(state => ({
            steps: state.steps.map(step => 
              step.id === stepId 
                ? { 
                    ...step, 
                    input_data: inputData || step.input_data,
                    output_data: outputData || step.output_data
                  }
                : step
            ),
            hasUnsavedChanges: true
          }))

          return true
        } catch (error) {
          console.error('Update step data error:', error)
          set({ error: error.message })
          return false
        }
      },

      toggleStepExpanded: (stepId) => {
        set(state => {
          const newExpanded = new Set(state.expandedSteps)
          if (newExpanded.has(stepId)) {
            newExpanded.delete(stepId)
          } else {
            newExpanded.add(stepId)
          }
          return { expandedSteps: newExpanded }
        })
      },

      toggleStepCheck: async (stepId) => {
        const { steps } = get()
        const step = steps.find(s => s.id === stepId)
        if (!step) return false

        const newChecked = !step.is_checked

        try {
          const { error } = await supabase
            .from('workflow_run_steps')
            .update({ is_checked: newChecked })
            .eq('id', stepId)

          if (error) throw error

          set(state => ({
            steps: state.steps.map(s => 
              s.id === stepId ? { ...s, is_checked: newChecked } : s
            ),
            hasUnsavedChanges: true
          }))

          return true
        } catch (error) {
          console.error('Toggle step check error:', error)
          set({ error: error.message })
          return false
        }
      },

      setCurrentStep: (index) => {
        set({ currentStepIndex: index })
      },

      setViewMode: (mode) => {
        set({ viewMode: mode })
      },

      // Auto-save functionality
      startAutoSave: () => {
        const { autoSaveInterval } = get()
        if (autoSaveInterval) return

        const interval = setInterval(() => {
          const { hasUnsavedChanges, currentRun } = get()
          if (hasUnsavedChanges && currentRun) {
            get().saveRun()
          }
        }, 30000) // Save every 30 seconds

        set({ autoSaveInterval: interval })
      },

      stopAutoSave: () => {
        const { autoSaveInterval } = get()
        if (autoSaveInterval) {
          clearInterval(autoSaveInterval)
          set({ autoSaveInterval: null })
        }
      },

      saveRun: async () => {
        const { currentRun, hasUnsavedChanges } = get()
        if (!currentRun || !hasUnsavedChanges) return true

        set({ isAutoSaving: true })

        try {
          // Calculate progress
          const { steps } = get()
          const completedSteps = steps.filter(s => s.status === 'completed').length
          const progress = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0

          const { error } = await supabase
            .from('workflow_runs')
            .update({
              progress,
              completed_steps: completedSteps,
              current_step: get().currentStepIndex,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentRun.id)

          if (error) throw error

          set({
            hasUnsavedChanges: false,
            lastSavedAt: new Date().toISOString(),
            isAutoSaving: false
          })

          return true
        } catch (error) {
          console.error('Save run error:', error)
          set({ error: error.message, isAutoSaving: false })
          return false
        }
      },

      // History management for undo/redo
      addToHistory: (action) => {
        set(state => {
          const newStack = [...state.historyStack.slice(0, state.historyIndex + 1), action]
          return {
            historyStack: newStack,
            historyIndex: newStack.length - 1,
            canUndo: true,
            canRedo: false
          }
        })
      },

      undo: async () => {
        const { historyStack, historyIndex } = get()
        if (historyIndex < 0) return false

        const action = historyStack[historyIndex]
        
        try {
          // Revert the action
          if (action.action === 'status_update') {
            await get().updateStepStatus(action.stepId, action.oldValue)
          }

          set(state => ({
            historyIndex: state.historyIndex - 1,
            canUndo: state.historyIndex > 0,
            canRedo: true
          }))

          return true
        } catch (error) {
          console.error('Undo error:', error)
          return false
        }
      },

      redo: async () => {
        const { historyStack, historyIndex } = get()
        if (historyIndex >= historyStack.length - 1) return false

        const action = historyStack[historyIndex + 1]
        
        try {
          // Re-apply the action
          if (action.action === 'status_update') {
            await get().updateStepStatus(action.stepId, action.newValue)
          }

          set(state => ({
            historyIndex: state.historyIndex + 1,
            canUndo: true,
            canRedo: state.historyIndex < state.historyStack.length - 2
          }))

          return true
        } catch (error) {
          console.error('Redo error:', error)
          return false
        }
      },

      // Sharing
      generateShareToken: async () => {
        const { currentRun } = get()
        if (!currentRun) return null

        try {
          const { data, error } = await supabase
            .rpc('generate_share_token', { run_id: currentRun.id })

          if (error) throw error

          set(state => ({
            currentRun: {
              ...state.currentRun,
              share_token: data,
              is_public: true
            }
          }))

          return data
        } catch (error) {
          console.error('Generate share token error:', error)
          set({ error: error.message })
          return null
        }
      },

      // Reset state
      resetState: () => {
        const { autoSaveInterval } = get()
        if (autoSaveInterval) {
          clearInterval(autoSaveInterval)
        }

        set({
          currentRun: null,
          steps: [],
          isLoading: false,
          error: null,
          isAutoSaving: false,
          lastSavedAt: null,
          hasUnsavedChanges: false,
          autoSaveInterval: null,
          currentStepIndex: 0,
          expandedSteps: new Set(),
          viewMode: 'timeline',
          historyStack: [],
          historyIndex: -1,
          canUndo: false,
          canRedo: false
        })
      },

      // Session Management Actions
      createSession: async (runId, sessionName = null) => {
        try {
          // Generate browser info
          const browserInfo = {
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language
          }

          const { data, error } = await supabase
            .rpc('create_runner_session', {
              p_run_id: runId,
              p_session_name: sessionName,
              p_browser_info: browserInfo
            })

          if (error) throw error

          const sessionKey = `session_${data}_${Date.now()}`
          
          set({
            currentSession: data,
            sessionKey,
            isSessionActive: true
          })

          // Auto-save session state
          get().startSessionAutoSave()

          return { sessionId: data, sessionKey }
        } catch (error) {
          console.error('Create session error:', error)
          set({ error: error.message })
          throw error
        }
      },

      saveSession: async (checkpointType = 'auto') => {
        const { currentSession, currentRun, steps, currentStepIndex, expandedSteps, viewMode } = get()
        if (!currentSession || !currentRun) return false

        try {
          const sessionData = {
            runId: currentRun.id,
            steps: steps,
            progress: currentRun.progress,
            status: currentRun.status,
            completedSteps: steps.filter(s => s.status === 'completed').length,
            lastUpdated: new Date().toISOString()
          }

          const uiState = {
            currentStepIndex,
            expandedSteps: Array.from(expandedSteps),
            viewMode
          }

          const { error } = await supabase
            .rpc('save_runner_session', {
              p_session_id: currentSession,
              p_session_data: sessionData,
              p_ui_state: uiState,
              p_checkpoint_type: checkpointType
            })

          if (error) throw error

          set({
            lastSavedAt: new Date().toISOString(),
            hasUnsavedChanges: false
          })

          return true
        } catch (error) {
          console.error('Save session error:', error)
          set({ error: error.message })
          return false
        }
      },

      resumeSession: async (sessionKey) => {
        set({ isLoading: true, error: null })
        
        try {
          const { data, error } = await supabase
            .rpc('resume_runner_session', {
              p_session_key: sessionKey
            })

          if (error) throw error
          if (!data || data.length === 0) {
            throw new Error('Session not found or expired')
          }

          const sessionData = data[0]
          const { session_data, ui_state } = sessionData

          // Load the run data
          const runResult = await get().loadRun(sessionData.run_id)
          if (!runResult) {
            throw new Error('Failed to load run data')
          }

          // Restore UI state
          set({
            currentSession: sessionData.session_id,
            sessionKey,
            isSessionActive: true,
            currentStepIndex: ui_state?.currentStepIndex || 0,
            expandedSteps: new Set(ui_state?.expandedSteps || []),
            viewMode: ui_state?.viewMode || 'timeline',
            lastSavedAt: sessionData.last_checkpoint_at,
            isLoading: false
          })

          // Start auto-save
          get().startSessionAutoSave()

          // Track analytics
          trackEvent('resume_session', {
            session_id: sessionData.session_id,
            run_id: sessionData.run_id
          })

          return sessionData
        } catch (error) {
          console.error('Resume session error:', error)
          set({ error: error.message, isLoading: false })
          throw error
        }
      },

      loadAvailableSessions: async () => {
        set({ isLoadingSessions: true })
        
        try {
          const { data, error } = await supabase
            .rpc('get_user_active_sessions')

          if (error) throw error

          set({
            availableSessions: data || [],
            isLoadingSessions: false
          })

          return data
        } catch (error) {
          console.error('Load sessions error:', error)
          set({ error: error.message, isLoadingSessions: false })
          return []
        }
      },

      pauseSession: async (reason = null) => {
        const { currentSession } = get()
        if (!currentSession) return false

        try {
          // Save current state before pausing
          await get().saveSession('pause')

          const { error } = await supabase
            .rpc('pause_runner_session', {
              p_session_id: currentSession,
              p_pause_reason: reason
            })

          if (error) throw error

          set({ isSessionActive: false })
          get().stopSessionAutoSave()

          return true
        } catch (error) {
          console.error('Pause session error:', error)
          set({ error: error.message })
          return false
        }
      },

      completeSession: async () => {
        const { currentSession } = get()
        if (!currentSession) return false

        try {
          const { error } = await supabase
            .rpc('complete_runner_session', {
              p_session_id: currentSession
            })

          if (error) throw error

          set({
            isSessionActive: false,
            currentSession: null,
            sessionKey: null
          })

          get().stopSessionAutoSave()

          return true
        } catch (error) {
          console.error('Complete session error:', error)
          set({ error: error.message })
          return false
        }
      },

      // Session auto-save management
      startSessionAutoSave: () => {
        const { autoSaveInterval } = get()
        if (autoSaveInterval) return

        const interval = setInterval(() => {
          const { hasUnsavedChanges, isSessionActive } = get()
          if (hasUnsavedChanges && isSessionActive) {
            get().saveSession('auto')
          }
        }, 15000) // Save every 15 seconds for sessions

        set({ autoSaveInterval: interval })
      },

      stopSessionAutoSave: () => {
        const { autoSaveInterval } = get()
        if (autoSaveInterval) {
          clearInterval(autoSaveInterval)
          set({ autoSaveInterval: null })
        }
      },

      // Enhanced cleanup with session management
      cleanup: () => {
        const { autoSaveInterval, currentSession } = get()
        
        if (autoSaveInterval) {
          clearInterval(autoSaveInterval)
        }

        // Pause active session on cleanup
        if (currentSession) {
          get().pauseSession('Browser close/refresh')
        }
      }
    }),
    {
      name: 'workflow-storage',
      partialize: (state) => ({
        currentRun: state.currentRun,
        steps: state.steps,
        currentStepIndex: state.currentStepIndex,
        viewMode: state.viewMode,
        expandedSteps: Array.from(state.expandedSteps), // Convert Set to Array for serialization
        sessionKey: state.sessionKey,
        currentSession: state.currentSession
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.expandedSteps)) {
          state.expandedSteps = new Set(state.expandedSteps) // Convert Array back to Set
        }
      }
    }
  )
)

export default useWorkflowStore