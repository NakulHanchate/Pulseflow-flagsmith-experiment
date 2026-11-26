import { useEffect } from 'react'

function linkError(el, shown) {
  const errorId = el.dataset.error
  if (!errorId) return

  const ids = (el.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter((id) => id && id !== errorId)

  if (shown) {
    ids.push(errorId)
  }

  if (ids.length > 0) {
    el.setAttribute('aria-describedby', ids.join(' '))
  } else {
    el.removeAttribute('aria-describedby')
  }
}

function spokenText(node) {
  const copy = node.cloneNode(true)
  copy.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove())
  copy.querySelectorAll('[role="img"][aria-label]').forEach((n) => {
    n.replaceWith(`${n.getAttribute('aria-label')}: `)
  })
  return copy.textContent.replace(/\s+/g, ' ').trim()
}

/**
 * Keeps aria-invalid, aria-describedby error links, and polite live-region
 * announcements synced with native :user-invalid validation (plus a WeakMap
 * interaction fallback where :user-invalid is unsupported).
 */
export function useFormAccessibility(formRef, dependencyKey) {
  useEffect(() => {
    const form = formRef.current
    if (!form) return undefined

    const supportsUserInvalid =
      typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      CSS.supports('selector(:user-invalid)')

    const dirtyState = new WeakMap()
    const flagged = new WeakSet()
    const announced = new WeakSet()

    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', 'polite')
    announcer.className = 'visually-hidden'
    document.body.append(announcer)

    let announceTimer
    let announcedField

    const announceError = (el) => {
      const errorId = el.dataset.error
      const error = errorId ? document.getElementById(errorId) : null
      if (!error) return

      const label = el.labels?.[0] ? `${spokenText(el.labels[0])}: ` : ''
      clearTimeout(announceTimer)
      announcer.textContent = ''
      announcedField = el
      announceTimer = setTimeout(() => {
        announcer.textContent = label + spokenText(error)
      }, 500)
    }

    const isFieldUserInvalid = (el) => {
      if (supportsUserInvalid) {
        return el.matches(':user-invalid')
      }
      return el.classList.contains('user-invalid-fallback')
    }

    const syncAria = (el, announce = false) => {
      if (!el?.matches?.('input, select, textarea')) return

      const invalid = isFieldUserInvalid(el)
      if (invalid) {
        if (announce && !announced.has(el)) {
          announceError(el)
          announced.add(el)
        }
        el.setAttribute('aria-invalid', 'true')
        linkError(el, true)
        flagged.add(el)
      } else if (flagged.has(el) || el.getAttribute('aria-invalid') !== 'true') {
        el.setAttribute('aria-invalid', 'false')
        linkError(el, false)
        flagged.delete(el)
        announced.delete(el)
        if (announcedField === el) {
          clearTimeout(announceTimer)
          announcer.textContent = ''
        }
      }
    }

    const updateFallbackState = (el) => {
      if (supportsUserInvalid || !el.validity) return
      const isValid = el.validity.valid
      el.classList.toggle('user-invalid-fallback', !isValid)
      el.classList.toggle('user-valid-fallback', isValid)
    }

    form.querySelectorAll('input, select, textarea').forEach((el) => {
      syncAria(el)
    })

    const handleBlur = (e) => {
      const el = e.target
      if (!el?.matches?.('input, select, textarea')) return

      if (!supportsUserInvalid) {
        const state = dirtyState.get(el) || { hasInteracted: false, hasBlurred: false }
        state.hasBlurred = true
        dirtyState.set(el, state)
        if (state.hasInteracted) {
          updateFallbackState(el)
        }
      }

      syncAria(el, true)
    }

    const handleInput = (e) => {
      const el = e.target
      if (!el?.matches?.('input, select, textarea')) return

      if (!supportsUserInvalid) {
        const state = dirtyState.get(el) || { hasInteracted: false, hasBlurred: false }
        state.hasInteracted = true
        dirtyState.set(el, state)
        if (state.hasBlurred) {
          updateFallbackState(el)
        }
      }

      if (el.hasAttribute('aria-invalid')) {
        syncAria(el)
      }
    }

    const handleChange = (e) => {
      const el = e.target
      if (!el?.matches?.('input, select, textarea')) return

      if (!supportsUserInvalid) {
        const state = dirtyState.get(el) || { hasInteracted: false, hasBlurred: false }
        state.hasInteracted = true
        dirtyState.set(el, state)
        if (state.hasBlurred) {
          updateFallbackState(el)
        }
      }

      syncAria(el, true)
    }

    const handleInvalid = (e) => {
      const el = e.target
      if (!el?.matches?.('input, select, textarea')) return

      if (!supportsUserInvalid) {
        dirtyState.set(el, { hasInteracted: true, hasBlurred: true })
        updateFallbackState(el)
      }

      announced.add(el)
      syncAria(el)
    }

    const handleReset = () => {
      setTimeout(() => {
        form.querySelectorAll('input, select, textarea').forEach((el) => {
          dirtyState.delete(el)
          el.classList.remove('user-invalid-fallback', 'user-valid-fallback')
          syncAria(el)
        })
      })
    }

    form.addEventListener('blur', handleBlur, true)
    form.addEventListener('input', handleInput)
    form.addEventListener('change', handleChange, true)
    form.addEventListener('invalid', handleInvalid, true)
    form.addEventListener('reset', handleReset, true)

    return () => {
      clearTimeout(announceTimer)
      announcer.remove()
      form.removeEventListener('blur', handleBlur, true)
      form.removeEventListener('input', handleInput)
      form.removeEventListener('change', handleChange, true)
      form.removeEventListener('invalid', handleInvalid, true)
      form.removeEventListener('reset', handleReset, true)
    }
  }, [formRef, dependencyKey])
}
