import { useEffect, useState } from 'react'
import flagsmith from '@flagsmith/flagsmith'
import { FlagsmithProvider } from '@flagsmith/flagsmith/react'
import { SignupFormCard } from './components/SignupFormCard'
import { getOrCreateUserId, resetUserId } from './utils/visitor'

const TELEMETRY_ENDPOINTS = [
  { method: 'POST', path: '/v2/checkout/authorize', status: '200 OK', latency: '34ms', region: 'iad-1' },
  { method: 'GET', path: '/v2/tokens/introspect', status: '200 OK', latency: '11ms', region: 'fra-2' },
  { method: 'POST', path: '/v2/webhooks/dispatch', status: '200 OK', latency: '48ms', region: 'sin-1' },
]

const FLAGSMITH_ENV_ID = import.meta.env.VITE_FLAGSMITH_ENVIRONMENT_ID

export function App() {
  const [userId] = useState(() => getOrCreateUserId())

  useEffect(() => {
    const flushBufferedEvents = () => {
      void flagsmith.flushEvents().catch(() => {})
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushBufferedEvents()
      }
    }

    window.addEventListener('pagehide', flushBufferedEvents)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pagehide', flushBufferedEvents)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      flushBufferedEvents()
    }
  }, [])

  async function handleSimulateNewVisitor() {
    await flagsmith.flushEvents().catch(() => {})
    resetUserId()
    window.location.reload()
  }

  return (
    <FlagsmithProvider
      flagsmith={flagsmith}
      options={{
        environmentID: FLAGSMITH_ENV_ID || '',
        identity: userId,
        enableEvents: true,
      }}
    >
      <div className="page-shell">
        <div className="ambient-grid" aria-hidden="true" />
        <div className="ambient-glow" aria-hidden="true" />

        <header className="top-nav">
          <div className="container nav-inner">
            <a href="#top" className="brand-mark" aria-label="PulseFlow home">
              <span className="brand-icon" aria-hidden="true">
                <svg viewBox="0 0 28 28" fill="none">
                  <path
                    d="M3 15h4.2l2.5-6.5 3.4 10.5 3-7.5 2.1 3.5H25"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="brand-name">PulseFlow</span>
            </a>

            <div className="nav-status">
              <span className="status-dot" aria-hidden="true" />
              <span>Edge Probes Operational · 99.99% SLA</span>
            </div>
          </div>
        </header>

        <main id="top" className="hero-main">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="eyebrow-pulse" aria-hidden="true" />
                REAL-TIME API OBSERVABILITY
              </div>

              <h1 className="hero-title">
                Catch API regressions <span className="title-accent">before your users do.</span>
              </h1>

              <p className="hero-description">
                PulseFlow continuously probes your REST, GraphQL, and webhook endpoints from 28 global
                edge regions—surfacing p99 latency spikes, breaking schema drift, and silent 5xx
                anomalies in milliseconds.
              </p>

              <dl className="hero-metrics">
                <div className="metric-item">
                  <dt>Global Probe Latency</dt>
                  <dd>14 ms</dd>
                </div>
                <div className="metric-item">
                  <dt>Alert Dispatch</dt>
                  <dd>&lt; 3 sec</dd>
                </div>
                <div className="metric-item">
                  <dt>SDK Overhead</dt>
                  <dd>Zero-config</dd>
                </div>
              </dl>

              <div className="telemetry-panel" aria-label="Live synthetic probe snapshot">
                <div className="telemetry-header">
                  <span className="telemetry-title">Live Edge Telemetry</span>
                  <span className="telemetry-badge">p95 · 31ms avg</span>
                </div>

                <ul className="telemetry-list">
                  {TELEMETRY_ENDPOINTS.map((endpoint) => (
                    <li key={endpoint.path} className="telemetry-row">
                      <span className="method-tag">{endpoint.method}</span>
                      <code className="endpoint-path">{endpoint.path}</code>
                      <span className="region-tag">{endpoint.region}</span>
                      <span className="status-tag">{endpoint.status}</span>
                      <span className="latency-val">{endpoint.latency}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <ul className="trust-list" aria-label="Platform highlights">
                <li>OpenTelemetry &amp; OpenAPI native</li>
                <li>PagerDuty, Slack &amp; webhook routing</li>
                <li>SOC 2 Type II ready</li>
              </ul>
            </div>

            <div className="hero-form-column">
              <SignupFormCard userId={userId} />
            </div>
          </div>
        </main>

        <aside className="visitor-dock" aria-label="Hackathon demo visitor controls">
          <div className="visitor-meta">
            <span className="visitor-label">Visitor ID</span>
            <code className="visitor-id" title={userId}>
              {userId}
            </code>
          </div>
          <button
            type="button"
            className="visitor-reset-btn"
            onClick={handleSimulateNewVisitor}
          >
            Simulate New Visitor
          </button>
        </aside>
      </div>
    </FlagsmithProvider>
  )
}

export default App
