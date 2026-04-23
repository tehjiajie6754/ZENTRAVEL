'use client'

import { useState, useRef, useCallback } from 'react'
import '../../../voiceassistant.css'

interface VoiceOrbProps {
  onToggle?: (isActive: boolean) => void
}

export default function VoiceOrb({ onToggle }: VoiceOrbProps) {
  const [isActive, setIsActive] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = () => {
    const next = !isActive
    setIsActive(next)
    onToggle?.(next)
  }

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current
    const card = cardRef.current
    if (!container || !card) return
    const rect = container.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) / (rect.width / 2)
    const dy = (e.clientY - cy) / (rect.height / 2)
    const rY = dx * 18
    const rX = -dy * 18
    card.style.transform = `perspective(1200px) rotateX(${rX}deg) rotateY(${rY}deg) scale3d(1.02,1.02,1.02)`
  }, [])

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = ''
  }, [])

  /* Build the "orb-toggle:checked + orb-label *" behaviour via a
     hidden real checkbox whose `checked` state is React-controlled.
     The CSS in voiceassistant.css targets `.orb-toggle:checked + .orb-label ...`
     so we keep a real <input> + <label> linked by id. */
  const checkboxId = 'voice-orb-checkbox'

  return (
    <div
      ref={containerRef}
      className="voice-orb-container"
      style={{ background: 'transparent', overflow: 'visible' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hidden checkbox — React controls checked state */}
      <input
        type="checkbox"
        className="orb-toggle"
        id={checkboxId}
        checked={isActive}
        onChange={handleClick}
      />

      {/* Label acts as the clickable orb */}
      <label className="orb-label" htmlFor={checkboxId}>
        <div className="orb-card" ref={cardRef}>

          {/* ── Cosmic rings ── */}
          <div className="cosmic-rings">
            <div className="ring-orbit orbit-1" />
            <div className="ring-orbit orbit-2" />
            <div className="ring-orbit orbit-3" />
          </div>

          {/* ── Aura ── */}
          <div
            className="orb-aura"
            style={{
              background: isActive
                ? 'radial-gradient(circle at 50% 50%, rgba(34,211,238,0.75), rgba(6,182,212,0.55) 45%, transparent 75%)'
                : 'radial-gradient(circle at 50% 50%, rgba(167,139,250,0.6), rgba(192,132,252,0.4) 45%, transparent 75%)',
            }}
          />

          {/* ── Sphere ── */}
          <div className="orb-sphere">
            <div className="sphere-body" />
            <div className="sphere-gradient" />
            <div className="sphere-light" />
            <div className="sphere-specular" />
            <div className="sphere-shadow-inner" />
            <div className="sphere-rim" />
          </div>

          {/* ── Core energy ── */}
          <div className="core-energy">
            <div className="core-outer-glow" />
            <div className="core-radiance" />
            <div className="core-center" />
            <div className="core-bright-spot" />
          </div>

          {/* ── Icon holder: mic (idle) ↔ wave bars (active) ── */}
          <div className="icon-holder">
            {/* Mic icon */}
            <div className="mic-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="9" y="2" width="6" height="11" rx="3" fill="white" />
                <path
                  d="M5 11a7 7 0 0 0 14 0"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line x1="12" y1="18" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <line x1="8" y1="22" x2="16" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            {/* Wave bars */}
            <div className="wave-icon">
              <div className="wave-bar bar-1" />
              <div className="wave-bar bar-2" />
              <div className="wave-bar bar-3" />
              <div className="wave-bar bar-4" />
              <div className="wave-bar bar-5" />
            </div>
          </div>

          {/* ── Particles ── */}
          <div className="particles-field">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className={`particle p-${i}`} />
            ))}
          </div>

          {/* ── "LISTENING" text ── */}
          <div className="listening-text">
            {'LISTENING'.split('').map((char, i) => (
              <span key={i} className="letter" data-char={char}>
                {char}
              </span>
            ))}
          </div>
        </div>
      </label>
    </div>
  )
}
