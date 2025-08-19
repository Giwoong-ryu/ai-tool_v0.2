// Analytics Service - GA4 Event Tracking with Edge Function Integration
// Handles frontend event tracking and server-side analytics pipeline

import { createClient } from '@supabase/supabase-js'

// Supabase client for Edge Function calls
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// GA4 Configuration
const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID
const DEBUG_MODE = import.meta.env.DEV

class AnalyticsService {
  constructor() {
    this.isInitialized = false
    this.userId = null
    this.sessionId = this.generateSessionId()
    this.eventQueue = []
    this.isOnline = navigator.onLine
    
    // Initialize GA4 gtag if measurement ID is available
    if (GA4_MEASUREMENT_ID) {
      this.initializeGTag()
    }
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true
      this.flushEventQueue()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  // Initialize Google Analytics gtag
  initializeGTag() {
    if (typeof window === 'undefined') return

    // Load gtag script
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`
    document.head.appendChild(script)

    // Initialize gtag
    window.dataLayer = window.dataLayer || []
    window.gtag = function() {
      window.dataLayer.push(arguments)
    }

    window.gtag('js', new Date())
    window.gtag('config', GA4_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
      custom_map: {
        'custom_user_id': 'user_id'
      }
    })

    this.isInitialized = true

    if (DEBUG_MODE) {
      console.log('GA4 Analytics initialized:', GA4_MEASUREMENT_ID)
    }
  }

  // Set user ID for tracking
  setUserId(userId) {
    this.userId = userId

    if (this.isInitialized && window.gtag) {
      window.gtag('config', GA4_MEASUREMENT_ID, {
        user_id: userId,
        custom_user_id: userId
      })
    }

    if (DEBUG_MODE) {
      console.log('Analytics User ID set:', userId)
    }
  }

  // Generate unique session ID
  generateSessionId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Core event tracking method
  async trackEvent(eventName, parameters = {}) {
    const eventData = {
      event_name: eventName,
      user_id: this.userId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      page_url: window.location.href,
      page_title: document.title,
      user_agent: navigator.userAgent,
      ...parameters
    }

    try {
      // Track via gtag for immediate GA4 reporting
      if (this.isInitialized && window.gtag) {
        const gtagParams = {
          user_id: this.userId,
          session_id: this.sessionId,
          ...parameters
        }
        
        window.gtag('event', eventName, gtagParams)
        
        if (DEBUG_MODE) {
          console.log('GA4 Event tracked via gtag:', eventName, gtagParams)
        }
      }

      // Send to Edge Function for server-side processing and database logging
      if (this.isOnline) {
        await this.sendToEdgeFunction(eventData)
      } else {
        // Queue for later if offline
        this.eventQueue.push(eventData)
      }

    } catch (error) {
      console.error('Analytics tracking error:', error)
      
      // Store in localStorage as fallback
      this.storeEventLocally(eventData)
    }
  }

  // Send event to Supabase Edge Function (/api/events)
  async sendToEdgeFunction(eventData) {
    try {
      const { data, error } = await supabase.functions.invoke('events', {
        body: {
          name: eventData.event_name,
          params: {
            ...eventData,
            // Remove name to avoid duplication
            event_name: undefined
          },
          ts: eventData.timestamp
        }
      })

      if (error) throw error

      if (DEBUG_MODE) {
        console.log('Event sent to /api/events:', eventData.event_name, data)
      }

      return data

    } catch (error) {
      console.error('Edge Function call failed:', error)
      // Store locally for retry
      this.storeEventLocally(eventData)
    }
  }

  // Store event in localStorage for retry
  storeEventLocally(eventData) {
    try {
      const storedEvents = JSON.parse(localStorage.getItem('analytics_queue') || '[]')
      storedEvents.push(eventData)
      
      // Keep only last 100 events
      if (storedEvents.length > 100) {
        storedEvents.splice(0, storedEvents.length - 100)
      }
      
      localStorage.setItem('analytics_queue', JSON.stringify(storedEvents))
    } catch (error) {
      console.error('Failed to store event locally:', error)
    }
  }

  // Flush queued events when back online
  async flushEventQueue() {
    // Flush in-memory queue
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()
      try {
        await this.sendToEdgeFunction(event)
      } catch (error) {
        console.error('Failed to flush event:', error)
        break
      }
    }

    // Flush localStorage queue
    try {
      const storedEvents = JSON.parse(localStorage.getItem('analytics_queue') || '[]')
      
      for (const event of storedEvents) {
        try {
          await this.sendToEdgeFunction(event)
        } catch (error) {
          console.error('Failed to flush stored event:', error)
          break
        }
      }
      
      // Clear localStorage after successful flush
      localStorage.removeItem('analytics_queue')
      
    } catch (error) {
      console.error('Failed to flush stored events:', error)
    }
  }

  // EasyPick specific event tracking methods

  // Template selection tracking
  trackTemplateSelect(templateId, templateType, category) {
    return this.trackEvent('select_template', {
      template_id: templateId,
      template_type: templateType,
      category: category,
      event_category: 'prompt_tools',
      event_label: `${templateType}_${category}`
    })
  }

  // Prompt compilation tracking
  trackPromptCompile(promptId, promptLength, modelType, isSuccess = true) {
    return this.trackEvent('compile_prompt', {
      prompt_id: promptId,
      prompt_length: promptLength,
      model_type: modelType,
      success: isSuccess,
      event_category: 'prompt_tools',
      event_label: modelType,
      value: promptLength
    })
  }

  // Workflow start tracking
  trackWorkflowStart(workflowId, workflowType, stepCount) {
    return this.trackEvent('start_workflow', {
      workflow_id: workflowId,
      workflow_type: workflowType,
      step_count: stepCount,
      event_category: 'workflows',
      event_label: workflowType,
      value: stepCount
    })
  }

  // Workflow step completion
  trackWorkflowStep(workflowId, stepNumber, stepType, timeSpent) {
    return this.trackEvent('complete_step', {
      workflow_id: workflowId,
      step_number: stepNumber,
      step_type: stepType,
      time_spent: timeSpent,
      event_category: 'workflows',
      event_label: `${stepType}_step_${stepNumber}`,
      value: timeSpent
    })
  }

  // AI tool interaction tracking
  trackToolInteraction(toolId, toolName, actionType, category) {
    return this.trackEvent('tool_interaction', {
      tool_id: toolId,
      tool_name: toolName,
      action_type: actionType,
      category: category,
      event_category: 'ai_tools',
      event_label: `${actionType}_${toolName}`
    })
  }

  // Search tracking
  trackSearch(query, resultCount, filters = {}) {
    return this.trackEvent('search', {
      search_term: query,
      result_count: resultCount,
      filters: JSON.stringify(filters),
      event_category: 'search',
      event_label: query
    })
  }

  // User engagement tracking
  trackEngagement(engagementType, duration, element) {
    return this.trackEvent('engagement', {
      engagement_type: engagementType,
      engagement_time: duration,
      element: element,
      event_category: 'engagement',
      event_label: engagementType,
      value: duration
    })
  }

  // Subscription events
  trackSubscription(action, planType, amount) {
    return this.trackEvent('subscription', {
      action: action,
      plan_type: planType,
      amount: amount,
      event_category: 'subscription',
      event_label: `${action}_${planType}`,
      value: amount
    })
  }

  // Error tracking
  trackError(errorType, errorMessage, context) {
    return this.trackEvent('error', {
      error_type: errorType,
      error_message: errorMessage,
      error_context: context,
      event_category: 'errors',
      event_label: errorType
    })
  }

  // Page view tracking (for SPA navigation)
  trackPageView(pageName, pageTitle = document.title) {
    if (this.isInitialized && window.gtag) {
      window.gtag('config', GA4_MEASUREMENT_ID, {
        page_title: pageTitle,
        page_location: window.location.href
      })
    }

    return this.trackEvent('page_view', {
      page_name: pageName,
      page_title: pageTitle,
      page_path: window.location.pathname,
      event_category: 'navigation'
    })
  }

  // Conversion tracking
  trackConversion(conversionName, value, currency = 'KRW') {
    return this.trackEvent('conversion', {
      conversion_name: conversionName,
      value: value,
      currency: currency,
      event_category: 'conversions',
      event_label: conversionName
    })
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService()

export default analyticsService

// Convenience exports for common tracking methods
export const {
  setUserId,
  trackEvent,
  trackTemplateSelect,
  trackPromptCompile,
  trackWorkflowStart,
  trackWorkflowStep,
  trackToolInteraction,
  trackSearch,
  trackEngagement,
  trackSubscription,
  trackError,
  trackPageView,
  trackConversion
} = analyticsService