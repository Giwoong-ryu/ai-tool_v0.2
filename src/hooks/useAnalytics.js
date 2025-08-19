// React Hook for Analytics Integration
// Provides easy-to-use analytics tracking for React components

import { useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'
import analyticsService from '../services/analyticsService'

// Custom hook for analytics tracking
export function useAnalytics() {
  const { user, isSignedIn } = useAuth()
  const isInitialized = useRef(false)

  // Initialize analytics when user changes
  useEffect(() => {
    if (isSignedIn && user && !isInitialized.current) {
      analyticsService.setUserId(user.id)
      isInitialized.current = true
    } else if (!isSignedIn && isInitialized.current) {
      analyticsService.setUserId(null)
      isInitialized.current = false
    }
  }, [isSignedIn, user])

  // Track page view (for SPA navigation)
  const trackPageView = useCallback((pageName, pageTitle) => {
    return analyticsService.trackPageView(pageName, pageTitle)
  }, [])

  // Track template selection
  const trackTemplateSelect = useCallback((templateId, templateType, category) => {
    return analyticsService.trackTemplateSelect(templateId, templateType, category)
  }, [])

  // Track prompt compilation
  const trackPromptCompile = useCallback((promptId, promptLength, modelType, isSuccess = true) => {
    return analyticsService.trackPromptCompile(promptId, promptLength, modelType, isSuccess)
  }, [])

  // Track workflow start
  const trackWorkflowStart = useCallback((workflowId, workflowType, stepCount) => {
    return analyticsService.trackWorkflowStart(workflowId, workflowType, stepCount)
  }, [])

  // Track workflow step completion
  const trackWorkflowStep = useCallback((workflowId, stepNumber, stepType, timeSpent) => {
    return analyticsService.trackWorkflowStep(workflowId, stepNumber, stepType, timeSpent)
  }, [])

  // Track tool interaction
  const trackToolInteraction = useCallback((toolId, toolName, actionType, category) => {
    return analyticsService.trackToolInteraction(toolId, toolName, actionType, category)
  }, [])

  // Track search
  const trackSearch = useCallback((query, resultCount, filters = {}) => {
    return analyticsService.trackSearch(query, resultCount, filters)
  }, [])

  // Track engagement
  const trackEngagement = useCallback((engagementType, duration, element) => {
    return analyticsService.trackEngagement(engagementType, duration, element)
  }, [])

  // Track subscription events
  const trackSubscription = useCallback((action, planType, amount) => {
    return analyticsService.trackSubscription(action, planType, amount)
  }, [])

  // Track errors
  const trackError = useCallback((errorType, errorMessage, context) => {
    return analyticsService.trackError(errorType, errorMessage, context)
  }, [])

  // Track conversion
  const trackConversion = useCallback((conversionName, value, currency = 'KRW') => {
    return analyticsService.trackConversion(conversionName, value, currency)
  }, [])

  // Generic event tracking
  const trackEvent = useCallback((eventName, parameters = {}) => {
    return analyticsService.trackEvent(eventName, parameters)
  }, [])

  return {
    // User info
    userId: user?.id || null,
    isSignedIn,
    
    // Tracking methods
    trackPageView,
    trackTemplateSelect,
    trackPromptCompile,
    trackWorkflowStart,
    trackWorkflowStep,
    trackToolInteraction,
    trackSearch,
    trackEngagement,
    trackSubscription,
    trackError,
    trackConversion,
    trackEvent
  }
}

// Hook for tracking page views automatically
export function usePageTracking(pageName, pageTitle) {
  const { trackPageView } = useAnalytics()

  useEffect(() => {
    trackPageView(pageName, pageTitle)
  }, [pageName, pageTitle, trackPageView])
}

// Hook for tracking element engagement (time spent, clicks, etc.)
export function useEngagementTracking(elementName, options = {}) {
  const { trackEngagement } = useAnalytics()
  const startTime = useRef(Date.now())
  const isVisible = useRef(false)
  const {
    trackVisibility = true,
    trackTimeSpent = true,
    trackClicks = true,
    minTimeSpent = 1000 // minimum 1 second
  } = options

  // Track visibility
  const onVisibilityChange = useCallback((isVisibleNow) => {
    if (trackVisibility && isVisibleNow !== isVisible.current) {
      isVisible.current = isVisibleNow
      trackEngagement(
        isVisibleNow ? 'element_visible' : 'element_hidden',
        Date.now() - startTime.current,
        elementName
      )
    }
  }, [trackEngagement, elementName, trackVisibility])

  // Track time spent when component unmounts
  useEffect(() => {
    return () => {
      if (trackTimeSpent) {
        const timeSpent = Date.now() - startTime.current
        if (timeSpent >= minTimeSpent) {
          trackEngagement('time_spent', timeSpent, elementName)
        }
      }
    }
  }, [trackEngagement, elementName, trackTimeSpent, minTimeSpent])

  // Track clicks
  const trackClick = useCallback((clickType = 'click') => {
    if (trackClicks) {
      trackEngagement(clickType, Date.now() - startTime.current, elementName)
    }
  }, [trackEngagement, elementName, trackClicks])

  return {
    trackClick,
    onVisibilityChange
  }
}

// Hook for tracking form interactions
export function useFormTracking(formName) {
  const { trackEvent } = useAnalytics()
  const startTime = useRef(Date.now())

  const trackFormStart = useCallback(() => {
    startTime.current = Date.now()
    trackEvent('form_start', {
      form_name: formName,
      event_category: 'forms'
    })
  }, [trackEvent, formName])

  const trackFormSubmit = useCallback((isSuccess = true, errorMessage = null) => {
    const timeSpent = Date.now() - startTime.current
    trackEvent('form_submit', {
      form_name: formName,
      success: isSuccess,
      time_spent: timeSpent,
      error_message: errorMessage,
      event_category: 'forms',
      value: timeSpent
    })
  }, [trackEvent, formName])

  const trackFormField = useCallback((fieldName, action = 'focus') => {
    trackEvent('form_field_interaction', {
      form_name: formName,
      field_name: fieldName,
      action: action,
      event_category: 'forms'
    })
  }, [trackEvent, formName])

  const trackFormError = useCallback((fieldName, errorType, errorMessage) => {
    trackEvent('form_error', {
      form_name: formName,
      field_name: fieldName,
      error_type: errorType,
      error_message: errorMessage,
      event_category: 'forms'
    })
  }, [trackEvent, formName])

  return {
    trackFormStart,
    trackFormSubmit,
    trackFormField,
    trackFormError
  }
}

// Hook for tracking search interactions
export function useSearchTracking() {
  const { trackSearch, trackEvent } = useAnalytics()
  const searchStartTime = useRef(null)

  const trackSearchStart = useCallback((query) => {
    searchStartTime.current = Date.now()
    trackEvent('search_start', {
      search_term: query,
      event_category: 'search'
    })
  }, [trackEvent])

  const trackSearchComplete = useCallback((query, resultCount, filters = {}) => {
    const timeSpent = searchStartTime.current ? Date.now() - searchStartTime.current : 0
    trackSearch(query, resultCount, filters)
    
    // Also track completion time
    if (timeSpent > 0) {
      trackEvent('search_complete', {
        search_term: query,
        result_count: resultCount,
        time_spent: timeSpent,
        filters: JSON.stringify(filters),
        event_category: 'search',
        value: timeSpent
      })
    }
  }, [trackSearch, trackEvent])

  const trackSearchResultClick = useCallback((query, resultId, resultPosition) => {
    trackEvent('search_result_click', {
      search_term: query,
      result_id: resultId,
      result_position: resultPosition,
      event_category: 'search'
    })
  }, [trackEvent])

  return {
    trackSearchStart,
    trackSearchComplete,
    trackSearchResultClick
  }
}

export default useAnalytics