import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * NoInternet — shown when the user navigates while offline.
 * Accepts an optional `checkConnected` async function (injected by App)
 * so the same probe logic is reused everywhere.
 */
export default function NoInternet({ checkConnected }) {
  const navigate = useNavigate()
  const [isOnline, setIsOnline] = useState(false)
  const [dots, setDots] = useState('')
  const [checking, setChecking] = useState(false)

  /* Animate dots while checking */
  useEffect(() => {
    const timer = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.')
    }, 500)
    return () => clearInterval(timer)
  }, [])

  /* Poll every 4 seconds to detect when connection is restored */
  useEffect(() => {
    const probe = async () => {
      if (!checkConnected) return
      const online = await checkConnected()
      if (online) {
        setIsOnline(true)
        // Wait a moment for user to see "Back Online" then go back
        setTimeout(() => navigate(-1), 1200)
      }
    }

    probe() // run immediately on mount
    const interval = setInterval(probe, 4000)
    return () => clearInterval(interval)
  }, [checkConnected, navigate])

  /* Manual "Try Again" check */
  const handleTryAgain = useCallback(async () => {
    setChecking(true)
    const online = checkConnected ? await checkConnected() : navigator.onLine
    setChecking(false)
    if (online) {
      setIsOnline(true)
      setTimeout(() => navigate(-1), 1200)
    } else {
      // Briefly flash the icon to indicate checked
      window.location.reload()
    }
  }, [checkConnected, navigate])

  return (
    <div className="no-internet-page">
      {/* Animated background orbs */}
      <div className="ni-orb ni-orb-1" />
      <div className="ni-orb ni-orb-2" />
      <div className="ni-orb ni-orb-3" />

      <div className="ni-card">
        {/* Animated wifi icon */}
        <div className={`ni-icon-wrapper${isOnline ? ' ni-icon-online' : ''}`}>
          <svg
            className="ni-wifi-icon"
            viewBox="0 0 88 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer arc */}
            <path
              className="ni-arc ni-arc-1"
              d="M10 32C19.6 22.4 32.6 17 46 17C59.4 17 72.4 22.4 82 32"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Middle arc */}
            <path
              className="ni-arc ni-arc-2"
              d="M21 44C27.6 37.4 35.6 34 44 34C52.4 34 60.4 37.4 67 44"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Inner arc */}
            <path
              className="ni-arc ni-arc-3"
              d="M32 56C35.6 52.4 39.6 51 44 51C48.4 51 52.4 52.4 56 56"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Dot */}
            <circle className="ni-dot" cx="44" cy="66" r="5" fill="currentColor" />
            {/* Cross overlay — hidden when online */}
            {!isOnline && (
              <line
                className="ni-cross"
                x1="14" y1="14"
                x2="74" y2="74"
                stroke="#e05555"
                strokeWidth="5"
                strokeLinecap="round"
              />
            )}
          </svg>
        </div>

        {isOnline ? (
          <>
            <div className="ni-badge ni-badge-online">✓ Connection Restored!</div>
            <h1 className="ni-title">Back Online</h1>
            <p className="ni-sub">Redirecting you back{dots}</p>
          </>
        ) : (
          <>
            <div className="ni-badge">No Connection</div>
            <h1 className="ni-title">You're Offline</h1>
            <p className="ni-sub">
              Looks like you've lost your internet connection.<br />
              Please turn on your internet and try again.
            </p>

            <div className="ni-steps">
              <div className="ni-step">
                <span className="ni-step-icon">📶</span>
                <span>Check your Wi-Fi or mobile data</span>
              </div>
              <div className="ni-step">
                <span className="ni-step-icon">🔄</span>
                <span>Toggle Airplane mode off</span>
              </div>
              <div className="ni-step">
                <span className="ni-step-icon">📡</span>
                <span>Move closer to your router</span>
              </div>
            </div>

            <div className="ni-actions">
              <button
                className="ni-btn ni-btn-primary"
                onClick={handleTryAgain}
                disabled={checking}
              >
                {checking ? 'Checking…' : 'Try Again'}
              </button>
              <button
                className="ni-btn ni-btn-ghost"
                onClick={() => navigate('/')}
              >
                Go Home
              </button>
            </div>

            <p className="ni-checking">
              <span className="ni-pulse" />
              Checking for connection{dots}
            </p>
          </>
        )}
      </div>

      {/* Error code */}
      <div className="ni-error-code">503</div>
    </div>
  )
}
