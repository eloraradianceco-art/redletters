import { useState } from 'react'

const C = {
  bg: '#F7F2EA', red: '#8B1A1A', redL: '#A52020',
  redF: 'rgba(139,26,26,0.08)', redB: 'rgba(139,26,26,0.22)',
  gold: '#8B6A2E', goldF: 'rgba(139,106,46,0.1)', goldB: 'rgba(139,106,46,0.28)',
  cream: '#2A1A0E', text: '#3D2E1A', muted: '#7A6248',
  border: 'rgba(139,26,26,0.12)',
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
    isLast: true,
    color: C.redL,
  },
]

export default function Onboarding({ onComplete }) {
  const [slide, setSlide] = useState(0)
  const current = SLIDES[slide]
  const isLast = slide === SLIDES.length - 1

  const next = () => {
    if (isLast) { onComplete() } else { setSlide(s => s + 1) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: `radial-gradient(ellipse at 50% 0%, rgba(139,26,26,0.08) 0%, transparent 55%), ${C.bg}`,
      fontFamily: "'EB Garamond',Georgia,serif",
      padding: '24px 20px',
    }}>
      <div style={{
        maxWidth: 420, width: '100%',
        background: '#EDE8DC', borderRadius: 24,
        border: '1px solid rgba(139,26,26,0.15)',
        padding: '48px 32px 36px',
        boxShadow: '0 12px 40px rgba(139,26,26,0.1)',
        textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{
          fontSize: 52, marginBottom: 24, lineHeight: 1,
          color: current.color,
        }}>
          {current.icon}
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: 22, fontWeight: 700, color: C.cream,
          fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.04em',
          lineHeight: 1.25, marginBottom: 16,
        }}>
          {current.title}
        </h2>

        {/* Subtitle */}
        <p style={{
          fontSize: 16, color: C.text, lineHeight: 1.8,
          marginBottom: current.detail ? 16 : 32,
        }}>
          {current.subtitle}
        </p>

        {/* Detail */}
        {current.detail && (
          <p style={{
            fontSize: 14, color: C.muted,
            fontStyle: current.italic ? 'italic' : 'normal',
            lineHeight: 1.75, marginBottom: 32,
            background: C.redF, border: `1px solid ${C.redB}`,
            borderRadius: 10, padding: '12px 16px',
          }}>
            {current.detail}
          </p>
        )}

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
          {SLIDES.map((_, i) => (
            <div key={i} style={{
              width: i === slide ? 20 : 6, height: 6, borderRadius: 3,
              background: i === slide ? C.red : C.redB,
              transition: 'all .3s ease',
            }} />
          ))}
        </div>

        {/* Next button */}
        <button onClick={next} style={{
          width: '100%', padding: '16px', borderRadius: 14, cursor: 'pointer',
          background: `linear-gradient(135deg,rgba(139,26,26,0.35),rgba(139,26,26,0.18))`,
          border: `1px solid ${C.redB}`,
          color: C.cream, fontSize: 14,
          fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.09em',
          transition: 'all .2s', touchAction: 'manipulation',
          marginBottom: 12,
        }}>
          {isLast ? 'Begin Reading ✦' : 'Continue →'}
        </button>

        {/* Skip */}
        {!isLast && (
          <button onClick={onComplete} style={{
            background: 'transparent', border: 'none',
            color: C.muted, cursor: 'pointer', fontSize: 13,
            fontFamily: "'EB Garamond',Georgia,serif",
          }}>
            Skip intro
          </button>
        )}
      </div>
    </div>
  )
}
