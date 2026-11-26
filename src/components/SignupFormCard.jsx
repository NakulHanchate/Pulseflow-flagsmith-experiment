import { useId, useRef, useState } from 'react'
import { useExperiment, useFlagsmithLoading } from '@flagsmith/flagsmith/react'
import { useFormAccessibility } from '../hooks/useFormAccessibility'
import { trackSignupCompleted } from '../utils/visitor'

const ROLE_OPTIONS = [
  { value: 'backend-engineer', label: 'Backend / API Engineer' },
  { value: 'platform-sre', label: 'Platform / SRE' },
  { value: 'devops-engineer', label: 'DevOps / Infrastructure' },
  { value: 'fullstack-engineer', label: 'Full-Stack Engineer' },
  { value: 'engineering-manager', label: 'Engineering Manager' },
  { value: 'cto-vp', label: 'CTO / VP of Engineering' },
  { value: 'security-engineer', label: 'Security Engineer' },
  { value: 'other', label: 'Other' },
]

const TEAM_SIZE_OPTIONS = [
  { value: '1-5', label: '1–5 engineers' },
  { value: '6-20', label: '6–20 engineers' },
  { value: '21-50', label: '21–50 engineers' },
  { value: '51-200', label: '51–200 engineers' },
  { value: '200+', label: '200+ engineers' },
]

const INITIAL_FORM_VALUES = {
  fullName: '',
  workEmail: '',
  password: '',
  companyName: '',
  role: '',
  teamSize: '',
}

function ErrorIcon() {
  return (
    <svg
      className="error-icon"
      viewBox="0 0 16 16"
      fill="none"
      role="img"
      aria-label="Error"
    >
      <circle cx="8" cy="8" r="6.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.75v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11.25" r="0.85" fill="currentColor" />
    </svg>
  )
}

function EyeIcon({ visible }) {
  if (visible) {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="eye-icon">
        <path
          d="M3 3l14 14M8.5 8.6a2.25 2.25 0 0 0 2.9 2.9M6.2 6.3C4.4 7.5 3.1 9.2 2.5 10c1.4 2.1 4.2 5 7.5 5 1.3 0 2.5-.4 3.5-1M9.5 5c3.5-.3 6.5 2.5 8 5-.5.8-1.2 1.8-2.2 2.7"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="eye-icon">
      <path
        d="M2.5 10c1.5-2.6 4.4-5 7.5-5s6 2.4 7.5 5c-1.5 2.6-4.4 5-7.5 5s-6-2.4-7.5-5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export function SignupFormCard({ userId }) {
  const loadingState = useFlagsmithLoading()
  const experimentFlag = useExperiment('signup_form_length')
  const isLoadingExperiment = !experimentFlag && Boolean(loadingState?.isLoading)
  const variant = experimentFlag?.value === 'short_form' ? 'short_form' : 'control'

  const [formData, setFormData] = useState(INITIAL_FORM_VALUES)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const formRef = useRef(null)
  const headingId = useId()
  const isShortForm = variant === 'short_form'

  useFormAccessibility(formRef, `${variant}-${isSubmitted}-${isLoadingExperiment}`)

  function handleFieldChange(event) {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    // Ensure trimmed non-empty text for fullName and companyName
    if (!formData.fullName.trim()) {
      const nameInput = formRef.current?.elements.namedItem('fullName')
      if (nameInput) {
        nameInput.setCustomValidity('Please enter your full name.')
        nameInput.reportValidity()
      }
      return
    }

    if (!isShortForm && !formData.companyName.trim()) {
      const companyInput = formRef.current?.elements.namedItem('companyName')
      if (companyInput) {
        companyInput.setCustomValidity('Please enter your company name.')
        companyInput.reportValidity()
      }
      return
    }

    trackSignupCompleted(userId)
    setIsSubmitted(true)
  }

  function handleResetDemo() {
    setFormData(INITIAL_FORM_VALUES)
    setShowPassword(false)
    setIsSubmitted(false)
  }

  if (isLoadingExperiment) {
    return (
      <section className="signup-card" aria-labelledby={headingId} aria-busy="true">
        <div className="card-header">
          <div className="card-header-top">
            <span className="plan-pill">Developer Free Tier</span>
            <span className="variant-pill">resolving experiment...</span>
          </div>
          <h2 id={headingId} className="card-title">
            Start monitoring in 60 seconds
          </h2>
          <p className="card-subtitle">
            1M free API checks per month. No credit card required.
          </p>
        </div>

        <div className="form-skeleton" role="status" aria-label="Loading signup form">
          <div className="skeleton-field" />
          <div className="skeleton-field" />
          <div className="skeleton-field" />
          <div className="skeleton-button" />
        </div>
      </section>
    )
  }

  if (isSubmitted) {
    return (
      <section className="signup-card" aria-labelledby={headingId}>
        <div className="confirmation-state" role="status" aria-live="polite">
          <div className="confirmation-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" className="check-icon">
              <path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h2 id={headingId} className="confirmation-title">
            Account Created!
          </h2>

          <p className="confirmation-copy">
            Welcome to PulseFlow, <strong>{formData.fullName.trim()}</strong>. Your API monitoring
            workspace is provisioned for <span className="mono-inline">{formData.workEmail}</span>.
          </p>

          <dl className="confirmation-meta">
            <div>
              <dt>Visitor ID</dt>
              <dd className="mono-inline">{userId}</dd>
            </div>
            <div>
              <dt>Experiment Variant</dt>
              <dd className="mono-inline">{variant}</dd>
            </div>
            <div>
              <dt>Conversion Event</dt>
              <dd className="mono-inline">signup_completed</dd>
            </div>
          </dl>

          <button type="button" className="secondary-btn" onClick={handleResetDemo}>
            Create another account
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="signup-card" aria-labelledby={headingId}>
      <div className="card-header">
        <div className="card-header-top">
          <span className="plan-pill">Developer Free Tier</span>
          <span className="variant-pill" title="Active Flagsmith signup_form_length variant">
            {variant} · {isShortForm ? '3-field flow' : '6-field flow'}
          </span>
        </div>
        <h2 id={headingId} className="card-title">
          Start monitoring in 60 seconds
        </h2>
        <p className="card-subtitle">
          1M free API checks per month. No credit card required.
        </p>
      </div>

      <form ref={formRef} className="signup-form" onSubmit={handleSubmit} method="post">
        <div className="field">
          <label htmlFor="full-name">
            Full Name <span className="required-mark" aria-hidden="true">*</span>
          </label>
          <input
            id="full-name"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => {
              e.target.setCustomValidity('')
              handleFieldChange(e)
            }}
            autoComplete="name"
            enterKeyHint="next"
            required
            placeholder="Alex Rivera"
            data-error="full-name-error"
          />
          <div id="full-name-error" className="error-msg">
            <ErrorIcon />
            <span>Please enter your full name.</span>
          </div>
        </div>

        <div className="field">
          <label htmlFor="work-email">
            Work Email <span className="required-mark" aria-hidden="true">*</span>
          </label>
          <span id="work-email-hint" className="field-hint">
            Format: name@company.com
          </span>
          <input
            id="work-email"
            name="workEmail"
            type="email"
            value={formData.workEmail}
            onChange={handleFieldChange}
            autoComplete="username"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            enterKeyHint="next"
            required
            placeholder="alex@acme.dev"
            aria-describedby="work-email-hint"
            data-error="work-email-error"
          />
          <div id="work-email-error" className="error-msg">
            <ErrorIcon />
            <span>Enter a valid work email in the format name@company.com.</span>
          </div>
        </div>

        <div className="field">
          <label htmlFor="password">
            Password <span className="required-mark" aria-hidden="true">*</span>
          </label>
          <span id="password-hint" className="field-hint">
            Minimum 8 characters
          </span>
          <div className="password-wrapper">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleFieldChange}
              autoComplete="new-password"
              minLength={8}
              enterKeyHint={isShortForm ? 'done' : 'next'}
              required
              placeholder="Create a strong password"
              aria-describedby="password-hint"
              data-error="password-error"
            />
            <button
              type="button"
              className="password-toggle"
              aria-pressed={showPassword}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-describedby="password-toggle-warning"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              <EyeIcon visible={showPassword} />
            </button>
            <div id="password-error" className="error-msg">
              <ErrorIcon />
              <span>Password must be at least 8 characters long.</span>
            </div>
          </div>
          <span id="password-toggle-warning" className="visually-hidden">
            Warning: this will display your password on the screen.
          </span>
        </div>

        {!isShortForm && (
          <>
            <div className="field">
              <label htmlFor="company-name">
                Company Name <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <input
                id="company-name"
                name="companyName"
                type="text"
                value={formData.companyName}
                onChange={(e) => {
                  e.target.setCustomValidity('')
                  handleFieldChange(e)
                }}
                autoComplete="organization"
                enterKeyHint="next"
                required
                placeholder="Acme Cloud Inc."
                data-error="company-name-error"
              />
              <div id="company-name-error" className="error-msg">
                <ErrorIcon />
                <span>Please enter your company name.</span>
              </div>
            </div>

            <div className="field">
              <label htmlFor="role">
                Role <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <div className="select-shell">
                <select
                  id="role"
                  name="role"
                  className="brand-select"
                  value={formData.role}
                  onChange={handleFieldChange}
                  autoComplete="organization-title"
                  required
                  data-error="role-error"
                >
                  <option value="" disabled>
                    Select your role...
                  </option>
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div id="role-error" className="error-msg">
                  <ErrorIcon />
                  <span>Please choose your role.</span>
                </div>
              </div>
            </div>

            <div className="field">
              <label htmlFor="team-size">
                Team Size <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <div className="select-shell">
                <select
                  id="team-size"
                  name="teamSize"
                  className="brand-select"
                  value={formData.teamSize}
                  onChange={handleFieldChange}
                  required
                  data-error="team-size-error"
                >
                  <option value="" disabled>
                    Select team size...
                  </option>
                  {TEAM_SIZE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div id="team-size-error" className="error-msg">
                  <ErrorIcon />
                  <span>Please select your engineering team size.</span>
                </div>
              </div>
            </div>
          </>
        )}

        <button type="submit" className="submit-btn">
          Create Free Account
        </button>

        <p className="legal-note">
          Instant API key provisioned on signup. Cancel or export anytime.
        </p>
      </form>
    </section>
  )
}
