import flagsmith from '@flagsmith/flagsmith'

const USER_ID_STORAGE_KEY = 'pulseflow_user_id'

function generateVisitorId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `pf_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
  }

  const randomSegment = Math.random().toString(36).slice(2, 10)
  const timeSegment = Date.now().toString(36).slice(-4)
  return `pf_${randomSegment}${timeSegment}`
}

/**
 * Returns the persistent anonymous visitor userId stored in localStorage,
 * generating and saving a new one on first visit.
 */
export function getOrCreateUserId() {
  try {
    const existing = window.localStorage.getItem(USER_ID_STORAGE_KEY)
    if (existing) {
      return existing
    }

    const nextId = generateVisitorId()
    window.localStorage.setItem(USER_ID_STORAGE_KEY, nextId)
    return nextId
  } catch {
    return generateVisitorId()
  }
}

/**
 * Clears the stored visitor userId so a fresh identity is created on reload.
 */
export function resetUserId() {
  try {
    window.localStorage.removeItem(USER_ID_STORAGE_KEY)
  } catch {
    // Ignore storage access errors in restricted environments
  }
}

/**
 * Tracks the Flagsmith conversion event for signup completion and flushes
 * buffered events promptly for the identified visitor.
 */
export function trackSignupCompleted(userId) {
  flagsmith.trackEvent('signup_completed', { identifier: userId })
  void flagsmith.flushEvents().catch(() => {})
  console.info('[PulseFlow Analytics] signup_completed tracked for userId:', userId)
}
