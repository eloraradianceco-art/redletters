import { useState } from 'react'

const C = {
  bg: '#F7F2EA', red: '#8B1A1A', redL: '#A52020',
  redF: 'rgba(139,26,26,0.08)', redB: 'rgba(139,26,26,0.22)',
  gold: '#8B6A2E', goldF: 'rgba(139,106,46,0.1)', goldB: 'rgba(139,106,46,0.28)',
  cream: '#2A1A0E', text: '#3D2E1A', muted: '#7A6248',
  dim: '#B09A80', border: 'rgba(139,26,26,0.12)',
}

const SLIDES = [
  {
    icon: '✦',
    title: 'Welcome to The Red Letters',
    subtitle: 'The complete words of Jesus — every passage He spoke, organized by theme, with full context and study tools.',
    detail: 'Not individual verses. Complete passages, exactly as He said them.',
    color: C.redL,
  },
  {
    icon: '📖',
    title: '10 Themes, 24 Complete Passages',
    subtitle: 'Prayer. The Kingdom. Love. The Cross. Discipleship. Peace. Anxiety. Truth. The Holy Spirit. Resurrection.',
    detail: 'Each theme contains the full red-letter passages — everything Jesus said on that subject.',
    color: C.gold,
  },
  {
    icon: '🧭',
    title: 'Six Layers of Study',
    subtitle: 'Every passage opens into six study tabs: The Passage · Context · Meaning · Live It · Pray It · Journal.',
    detail: 'Context tells you when and why He said it. Meaning unpacks what He meant. Live It shows you how to apply it today.',
    color: C.redL,
  },
  {
    icon: '🙏',
    title: 'Pray It Back',
    subtitle: 'Every passage has a prayer written directly from the text — not generic devotional language, but the specific content of what Jesus taught.',
    detail: 'Read it aloud. The spoken prayer carries weight.',
    color: C.gold,
  },
  {
    icon: '📝',
    title: 'Your Study Journal',
    subtitle: 'Write your responses, questions, and reflections on every passage. Saved to your account — accessible on any device.',
    detail: 'Your entries are private and backed up securely.',
    color: C.redL,
  },
  {
    icon: '🧠',
    title: 'Memorize His Words',
    subtitle: 'Every passage has a built-in memorization tool with three methods — Read & Recall, Fill the Gaps, and Write it Out.',
    detail: '"Your word I have hidden in my heart, that I might not sin against You." — Psalm 119:11',
    italic: true,
    color: C.gold,
  },
  {
    icon: '✝️',
    title: 'You\'re Ready.',
    subtitle: 'The words of Jesus are living and active. They are not ancient history. They are addressed to you, right now.',
    detail: null,
    color: C.redL,
    isLast: true,
  },
]

export default function Onboarding({ onComplete }) {
  const [slide, setSlide] = useState(0)
  const [fadingOut, setFadingOut] = useState(false)
  const current = SLIDES[slide]
  const isLast = slide === SLIDES.length - 1

  const finish = () => {
    setFadingOut(true)
    setTimeout(() => onComplete(), 400)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: `radial-gradient(ellipse at 50% 0%, rgba(139,26,26,0.07) 0%, transparent 55%), ${C.bg}`,
      fontFamily: "'EB Garamond',Georgia,serif",
      padding: '32px 24px', textAlign: 'center',
      opacity: fadingOut ? 0 : 1,
      transition: 'opacity 0.4s ease',
    }}>
      <div style={{ maxWidth: 440, width: '100%' }}>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 40 }}>
          {SLIDES.map((_, i) => (
            <div key={i} style={{
              width: i === slide ? 20 : 6, height: 6, borderRadius: 3,
              background: i === slide ? C.red : C.redB,
              transition: 'all .3s ease',
            }} />
          ))}
        </div>

        <div style={{ fontSize: 52, marginBottom: 24, lineHeight: 1, color: current.color }}>
          {current.icon}
        </div>

        <h2 style={{
          fontSize: 24, fontWeight: 700, color: C.cream,
          fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.04em',
          lineHeight: 1.25, marginBottom: 16,
        }}>{current.title}</h2>

        <p style={{
          fontSize: 17, color: C.text, lineHeight: 1.85,
          marginBottom: current.detail ? 20 : 40,
        }}>{current.subtitle}</p>

        {current.detail && (
          <div style={{
            background: current.color === C.gold
              ? 'linear-gradient(145deg,rgba(139,106,46,0.1),rgba(139,106,46,0.03))'
              : 'linear-gradient(145deg,rgba(139,26,26,0.08),rgba(139,26,26,0.02))',
            border: `1px solid ${current.color === C.gold ? C.goldB : C.redB}`,
            borderRadius: 12, padding: '14px 18px', marginBottom: 40,
          }}>
            <p style={{
              fontSize: 15,
              color: current.color === C.gold ? C.gold : C.redL,
              fontStyle: current.italic ? 'italic' : 'normal',
              lineHeight: 1.75,
            }}>{current.detail}</p>
          </div>
        )}

        {isLast ? (
          <button onClick={finish} style={{
            width: '100%',
            background: 'linear-gradient(135deg,rgba(139,26,26,0.35),rgba(139,26,26,0.15))',
            border: `1px solid ${C.redB}`, color: C.cream,
            padding: '18px', borderRadius: 14, cursor: 'pointer',
            fontSize: 16, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.1em',
            marginBottom: 16, touchAction: 'manipulation',
          }}>
            Begin Reading ✦
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            {slide > 0 && (
              <button onClick={() => setSlide(s => s - 1)} style={{
                flex: 1, background: 'transparent', border: `1px solid ${C.border}`,
                color: C.muted, padding: '14px', borderRadius: 12,
                cursor: 'pointer', fontSize: 14, fontFamily: "'Cinzel',Georgia,serif",
              }}>‹ Back</button>
            )}
            <button onClick={() => setSlide(s => s + 1)} style={{
              flex: 2,
              background: 'linear-gradient(135deg,rgba(139,26,26,0.28),rgba(139,26,26,0.1))',
              border: `1px solid ${C.redB}`, color: C.cream,
              padding: '14px', borderRadius: 12, cursor: 'pointer',
              fontSize: 14, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.07em',
              touchAction: 'manipulation',
            }}>Next ›</button>
          </div>
        )}

        {!isLast && (
          <button onClick={finish} style={{
            background: 'none', border: 'none', color: C.dim,
            cursor: 'pointer', fontSize: 12, marginTop: 16,
            fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.08em',
          }}>Skip intro</button>
        )}
      </div>
    </div>
  )
}
