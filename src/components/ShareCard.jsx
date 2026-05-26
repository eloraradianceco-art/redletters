import { useState, useRef } from 'react'
import { toPng } from 'html-to-image'

const TAGLINE = 'The complete words of Jesus — redletters.vercel.app'

export default function ShareCard({ passage, theme, onClose }) {
  const cardRef = useRef(null)
  const [cardType, setCardType] = useState('passage')
  const [lightCard, setLightCard] = useState(true) // RL defaults to light
  const [sharing, setSharing] = useState(false)
  const [copiedCaption, setCopiedCaption] = useState(false)

  const p = passage

  const TYPES = [
    { id: 'passage',  label: '📖 The Passage' },
    { id: 'context',  label: '🧭 Context' },
    { id: 'meaning',  label: '💡 Meaning' },
    { id: 'apply',    label: '⚡ Live It' },
    { id: 'prayer',   label: '🙏 Pray It' },
  ]

  const getContent = (type) => {
    const firstPara = (txt) => { const p = txt.split('\n\n')[0]; return p.length > 300 ? p.slice(0, 300) + '…' : p }
    if (type === 'passage') return {
      label: p.ref,
      sublabel: `${theme?.icon || ''} ${theme?.title || ''}`,
      main: p.text.split('\n\n')[0].length > 280 ? p.text.split('\n\n')[0].slice(0, 280) + '…' : p.text.split('\n\n')[0],
      caption: `"${p.text.slice(0, 280)}…"\n\n— ${p.ref}\n\nThe Red Letters · ${theme?.title}\nredletters.vercel.app`,
    }
    if (type === 'context') return {
      label: 'Setting & Context',
      sublabel: p.ref,
      main: firstPara(p.context),
      caption: `${p.title} — Context\n\n${firstPara(p.context)}\n\nThe Red Letters · redletters.vercel.app`,
    }
    if (type === 'meaning') return {
      label: 'What Jesus Meant',
      sublabel: p.ref,
      main: firstPara(p.meaning),
      caption: `${p.title} — Meaning\n\n${firstPara(p.meaning)}\n\nThe Red Letters · redletters.vercel.app`,
    }
    if (type === 'apply') return {
      label: 'Live It Out',
      sublabel: p.ref,
      main: p.apply,
      caption: `${p.title} — Live It Out\n\n${p.apply}\n\nThe Red Letters · redletters.vercel.app`,
    }
    if (type === 'prayer') return {
      label: 'Pray It',
      sublabel: p.ref,
      main: p.prayer,
      caption: `${p.title} — Prayer\n\n${p.prayer}\n\nThe Red Letters · redletters.vercel.app`,
    }
    return { label: '', sublabel: '', main: '', caption: '' }
  }

  const content = getContent(cardType)

  // Light theme — parchment (default for RL)
  const th = lightCard ? {
    bg: '#F7F2EA',
    bgGrad: 'linear-gradient(155deg, #F7F2EA 0%, #EDE6D6 100%)',
    border: 'rgba(139,26,26,0.3)',
    borderInner: 'rgba(139,26,26,0.12)',
    brand: 'rgba(139,26,26,0.7)',
    title: '#1C0A06',
    sublabel: 'rgba(139,106,46,0.85)',
    divider: 'rgba(139,26,26,0.25)',
    label: 'rgba(139,26,26,0.6)',
    body: '#2A1A0E',
    ref: '#8B6A2E',
    footer: 'rgba(139,26,26,0.8)',
    tagline: 'rgba(80,60,40,0.5)',
    quote: 'rgba(139,26,26,0.15)',
  } : {
    bg: '#1A0C06',
    bgGrad: 'linear-gradient(155deg, #1A0C06 0%, #0D0604 60%, #1A0C06 100%)',
    border: 'rgba(201,100,100,0.3)',
    borderInner: 'rgba(139,26,26,0.2)',
    brand: 'rgba(201,100,100,0.8)',
    title: '#EDE6D6',
    sublabel: 'rgba(176,138,78,0.85)',
    divider: 'rgba(201,100,100,0.3)',
    label: 'rgba(201,100,100,0.7)',
    body: '#EDE6D6',
    ref: '#B08A4E',
    footer: 'rgba(201,100,100,0.85)',
    tagline: 'rgba(160,140,120,0.5)',
    quote: 'rgba(201,100,100,0.12)',
  }

  const isPassage = cardType === 'passage'

  const handleShare = async () => {
    if (!cardRef.current || sharing) return
    setSharing(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: lightCard ? '#F7F2EA' : '#1A0C06',
      })
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], 'red-letters.png', { type: 'image/png' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'The Red Letters' })
      } else {
        const a = document.createElement('a')
        a.href = dataUrl; a.download = 'red-letters.png'; a.click()
      }
    } catch (err) { console.error(err) }
    setSharing(false)
  }

  const UI = {
    bg: '#1A0C06', red: '#8B1A1A', redL: '#C04040',
    redF: 'rgba(139,26,26,0.1)', redB: 'rgba(139,26,26,0.3)',
    gold: '#8B6A2E', goldF: 'rgba(139,106,46,0.1)', goldB: 'rgba(139,106,46,0.28)',
    cream: '#EDE6D6', muted: '#9A8268', border: 'rgba(255,255,255,0.1)',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 600,
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
      padding: '16px 16px 40px',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        maxWidth: 440, width: '100%', margin: '0 auto',
        background: '#1A0C06', borderRadius: 20,
        border: '1px solid rgba(139,26,26,0.3)',
        padding: '20px 16px',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: "'Cinzel',Georgia,serif", fontSize: 11, color: UI.redL, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            Share This Card
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: UI.muted, cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {/* Card Type Selector */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 12, flexWrap: 'wrap' }}>
          {TYPES.map(t => (
            <button key={t.id} onClick={() => setCardType(t.id)} style={{
              flex: '1 1 auto', minWidth: 0,
              padding: '7px 4px', borderRadius: 8, cursor: 'pointer', fontSize: 10,
              fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.03em',
              background: cardType === t.id ? UI.redF : 'rgba(255,255,255,0.04)',
              border: `1px solid ${cardType === t.id ? UI.redB : UI.border}`,
              color: cardType === t.id ? UI.redL : UI.muted, transition: 'all .2s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Light / Dark toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: UI.muted, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.06em', flexShrink: 0 }}>Style:</span>
          {[['☀️ Light', true], ['🌙 Dark', false]].map(([label, val]) => (
            <button key={label} onClick={() => setLightCard(val)} style={{
              flex: 1, padding: '7px', borderRadius: 8, cursor: 'pointer', fontSize: 11,
              fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.06em',
              background: lightCard === val ? UI.redF : 'rgba(255,255,255,0.04)',
              border: `1px solid ${lightCard === val ? UI.redB : UI.border}`,
              color: lightCard === val ? UI.redL : UI.muted, transition: 'all .2s',
            }}>{label}</button>
          ))}
        </div>

        {/* ── THE CARD ─────────────────────────────────────────────── */}
        <div ref={cardRef} style={{
          background: th.bgGrad,
          borderRadius: 18,
          padding: '22px 22px 18px',
          textAlign: 'center',
          fontFamily: "'EB Garamond', Georgia, serif",
          border: `2px solid ${th.border}`,
          boxShadow: `inset 0 0 0 1px ${th.borderInner}`,
          marginBottom: 16,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: `radial-gradient(ellipse at 20% 0%, ${th.quote} 0%, transparent 60%)`,
            pointerEvents: 'none',
          }}/>

          {/* Icon */}
          <img src="/icon.png" alt="" style={{ width: 40, height: 40, borderRadius: 10, display: 'block', margin: '0 auto 8px' }} />

          {/* Elora Radiance Co. */}
          <div style={{ fontSize: 10, color: th.brand, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: "'Cinzel',Georgia,serif", marginBottom: 5 }}>
            Elora Radiance Co.
          </div>

          {/* The Red Letters */}
          <div style={{ fontSize: 19, fontWeight: 700, color: th.title, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.03em', marginBottom: 4 }}>
            The Red Letters
          </div>

          {/* Theme */}
          <div style={{ fontSize: 11, color: th.sublabel, letterSpacing: '0.09em', textTransform: 'uppercase', fontFamily: "'Cinzel',Georgia,serif", marginBottom: 14 }}>
            {theme?.icon}&nbsp;&nbsp;{theme?.title}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: th.divider, marginBottom: 12 }} />

          {/* Label */}
          <div style={{ fontSize: 10, color: th.label, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: "'Cinzel',Georgia,serif", marginBottom: 10 }}>
            {content.label}
          </div>

          {/* Opening quote for passage */}
          {isPassage && (
            <div style={{ fontSize: 28, color: th.divider, lineHeight: 1, marginBottom: 4, fontFamily: 'Georgia,serif', opacity: 0.6 }}>"</div>
          )}

          {/* Main text */}
          <p style={{
            fontSize: isPassage ? 15 : 15,
            color: isPassage ? th.brand.replace('0.7','0.9').replace('0.8','0.95') : th.body,
            lineHeight: 1.85, marginBottom: 12,
            fontStyle: 'italic', letterSpacing: '0.01em',
            textAlign: isPassage ? 'left' : 'center',
            whiteSpace: 'pre-line',
          }}>
            {content.main}
          </p>

          {/* Reference */}
          <div style={{ height: 1, background: th.divider, opacity: 0.5, margin: '8px 40px 10px' }} />
          <div style={{ fontSize: 11, color: th.ref, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            {content.sublabel}
          </div>

          {/* Footer */}
          <div style={{ height: 1, background: th.divider, opacity: 0.4, marginBottom: 10 }} />
          <div style={{ fontSize: 13, color: th.footer, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.05em', marginBottom: 3 }}>
            ✦ The Red Letters ✦
          </div>
          <div style={{ fontSize: 10, color: th.tagline, letterSpacing: '0.05em' }}>
            {TAGLINE}
          </div>
        </div>

        {/* Share / Copy */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <button onClick={handleShare} disabled={sharing} style={{
            background: 'linear-gradient(135deg, rgba(139,26,26,0.4), rgba(139,26,26,0.2))',
            border: '1px solid rgba(139,26,26,0.4)', color: UI.redL,
            padding: '13px', borderRadius: 12, cursor: 'pointer', fontSize: 12,
            fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.08em',
            opacity: sharing ? 0.6 : 1,
          }}>
            {sharing ? 'Preparing…' : '🔗 Share Image'}
          </button>
          <button onClick={() => navigator.clipboard.writeText(content.main)} style={{
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${UI.border}`,
            color: UI.muted, padding: '13px', borderRadius: 12, cursor: 'pointer',
            fontSize: 12, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.08em',
          }}>
            Copy Text
          </button>
        </div>

        {/* Suggested Caption */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${UI.border}`, borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, color: UI.gold, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
            Suggested Caption
          </div>
          <p style={{ fontSize: 13, color: UI.muted, lineHeight: 1.7, margin: '0 0 12px', fontStyle: 'italic', whiteSpace: 'pre-line' }}>
            {content.caption}
          </p>
          <button onClick={() => { navigator.clipboard.writeText(content.caption); setCopiedCaption(true); setTimeout(() => setCopiedCaption(false), 2000) }} style={{
            width: '100%',
            background: copiedCaption ? 'rgba(46,96,64,0.15)' : 'transparent',
            border: `1px solid ${copiedCaption ? 'rgba(46,96,64,0.4)' : 'rgba(139,106,46,0.3)'}`,
            color: copiedCaption ? '#2E6040' : UI.gold,
            padding: '9px', borderRadius: 8, cursor: 'pointer', fontSize: 11,
            fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.08em', transition: 'all .25s',
          }}>
            {copiedCaption ? '✓ Copied' : 'Copy Caption'}
          </button>
        </div>

      </div>
    </div>
  )
}
