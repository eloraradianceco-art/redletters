import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabaseClient'
import { THEMES, ALL_PASSAGES, GOSPEL_COLORS } from './data.js'
import Settings from './components/Settings'



// ── Premium section components for passage views (RL) ─────────────────────
function SectionHeader({ label, C }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20,marginTop:4}}>
      <div style={{flex:1,height:1,background:`linear-gradient(90deg, transparent, ${C.goldB})`}}/>
      <div style={{fontSize:10,letterSpacing:'0.26em',color:C.gold,fontFamily:"'Cinzel',Georgia,serif",textTransform:'uppercase',whiteSpace:'nowrap'}}>{label}</div>
      <div style={{flex:1,height:1,background:`linear-gradient(90deg, ${C.goldB}, transparent)`}}/>
    </div>
  );
}

function ProseSection({ label, text, accent, C }) {
  if (!text) return null;
  const paras = text.split('\n\n');
  const isRed = accent === 'red';
  return (
    <div>
      <SectionHeader label={label} C={C} />
      <div style={{
        background: isRed
          ? 'linear-gradient(145deg,rgba(139,26,26,0.055),rgba(139,26,26,0.012))'
          : 'linear-gradient(145deg,rgba(139,106,46,0.07),rgba(139,106,46,0.018))',
        border:`1px solid ${isRed ? C.redB : C.goldB}`,
        borderRadius:18,
        padding:'30px 28px 26px',
        boxShadow:'0 6px 22px rgba(0,0,0,0.07)',
        position:'relative',
      }}>
        <div style={{textAlign:'center',color:C.gold,fontSize:11,opacity:0.45,marginBottom:18,letterSpacing:'1.2em',paddingLeft:'1.2em',fontFamily:'Georgia,serif'}}>✦ ✦ ✦</div>
        {paras.map((para, i) => {
          const isFirst = i === 0 && para.length > 0;
          const ch = isFirst ? para.charAt(0) : '';
          const rest = isFirst ? para.slice(1) : para;
          return (
            <p key={i} style={{
              fontSize:17.5,
              color:C.text,
              lineHeight:1.92,
              marginBottom: i < paras.length - 1 ? 16 : 0,
              fontFamily:"'EB Garamond',Georgia,serif",
              textIndent:0,
            }}>
              {isFirst && (
                <span style={{
                  float:'left',
                  fontFamily:"'Cinzel',Georgia,serif",
                  fontSize:52,
                  lineHeight:0.9,
                  color: isRed ? C.red : C.gold,
                  paddingRight:10,
                  paddingTop:6,
                  marginTop:-2,
                  fontWeight:500,
                }}>{ch}</span>
              )}
              {rest}
            </p>
          );
        })}
      </div>
    </div>
  );
}

function PrayerSection({ text, C }) {
  if (!text) return null;
  return (
    <div>
      <SectionHeader label="Pray It" C={C} />
      <div style={{
        background:'linear-gradient(145deg,rgba(139,106,46,0.11),rgba(139,106,46,0.025))',
        border:`1px solid ${C.goldB}`,
        borderRadius:18,
        padding:'34px 30px 30px',
        boxShadow:'0 6px 22px rgba(0,0,0,0.08)',
        textAlign:'center',
      }}>
        <div style={{color:C.gold,fontSize:18,opacity:0.55,marginBottom:20,fontFamily:'Georgia,serif',lineHeight:1}}>✦</div>
        <p style={{
          fontSize:18.5,
          color:C.cream,
          lineHeight:1.95,
          margin:0,
          fontStyle:'italic',
          fontFamily:"'EB Garamond',Georgia,serif",
          textAlign:'left',
        }}>{text}</p>
        <div style={{color:C.gold,fontSize:18,opacity:0.55,marginTop:22,fontFamily:'Georgia,serif',lineHeight:1}}>✦</div>
      </div>
      <p style={{fontSize:12,color:C.dim,textAlign:'center',fontStyle:'italic',marginTop:14,fontFamily:"'EB Garamond',Georgia,serif",letterSpacing:'0.02em'}}>Pray this aloud. The spoken prayer has weight.</p>
    </div>
  );
}

// ── Color tokens — warm parchment light theme ─────────────────────────────
const LIGHT_C = {
  bg:'#F7F2EA', bgCard:'rgba(139,26,26,0.04)', bgMid:'#EDE8DC',
  red:'#8B1A1A', redL:'#A52020',
  redF:'rgba(139,26,26,0.08)', redB:'rgba(139,26,26,0.22)',
  gold:'#8B6A2E', goldF:'rgba(139,106,46,0.1)', goldB:'rgba(139,106,46,0.28)',
  cream:'#2A1A0E', ink:'#1C150A', text:'#3D2E1A', muted:'#7A6248', dim:'#B09A80',
  border:'rgba(139,26,26,0.12)', borderGold:'rgba(139,106,46,0.2)',
  green:'#2E6040', greenF:'rgba(46,96,64,0.1)', greenB:'rgba(46,96,64,0.3)',
}

const DARK_C = {
  bg:'#0F0A06', bgCard:'rgba(201,64,64,0.07)', bgMid:'#1A0E08',
  red:'#C94040', redL:'#D96060',
  redF:'rgba(201,64,64,0.12)', redB:'rgba(201,64,64,0.32)',
  gold:'#B08A4E', goldF:'rgba(176,138,78,0.11)', goldB:'rgba(176,138,78,0.28)',
  cream:'#EDE6D6', ink:'#EDE6D6', text:'rgba(220,210,195,0.9)', muted:'rgba(176,160,130,0.65)', dim:'rgba(150,130,100,0.4)',
  border:'rgba(201,64,64,0.12)', borderGold:'rgba(176,138,78,0.28)',
  green:'#7C9284', greenF:'rgba(124,146,132,0.12)', greenB:'rgba(124,146,132,0.35)',
}

const TABS = [
  {id:'passage', label:'📖 The Passage'},
  {id:'context', label:'🧭 Context'},
  {id:'meaning', label:'💡 Meaning'},
  {id:'lexicon', label:'📚 Lexicon'},
  {id:'apply',   label:'⚡ Live It'},
  {id:'prayer',  label:'🙏 Pray It'},
  {id:'journal', label:'📝 Journal'},
]



// ── Share Card ──────────────────────────────────────────────────────────────
const TAGLINE = 'The complete words of Jesus — redletters.vercel.app'

function ShareCard({ passage, theme, onClose, C }) {
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
    const firstPara = (txt) => txt
    if (type === 'passage') return {
      label: p.ref,
      sublabel: `${theme?.icon || ''} ${theme?.title || ''}`,
      main: p.text,
      caption: `"${p.text}"\n\n— ${p.ref}\n\nThe Red Letters · ${theme?.title}\nredletters.vercel.app`,
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
      const { toPng } = await import('html-to-image')
      // Wait for fonts + 2 RAFs so the first share captures aligned layout
      try { await document.fonts.ready } catch {}
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
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

          {/* Header — icon + app name (matches AS1/AS2 pattern) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid ' + th.divider }}>
            <img src="/icon.png" alt="" style={{ width: 42, height: 42, borderRadius: 8 }}/>
            <div>
              <div style={{ fontSize: 15, color: th.brand, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.06em' }}>The Red Letters</div>
              <div style={{ fontSize: 12, color: th.sublabel }}>{theme?.icon} {theme?.title}</div>
            </div>
          </div>

          {/* Label */}
          <div style={{ fontSize: 12, color: th.label, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: "'Cinzel',Georgia,serif", marginBottom: 10 }}>
            {content.label}
          </div>

          {/* Opening quote for passage */}
          {isPassage && (
            <div style={{ fontSize: 28, color: th.divider, lineHeight: 1, marginBottom: 4, fontFamily: 'Georgia,serif', opacity: 0.6 }}>"</div>
          )}

          {/* Main text */}
          <p style={{
            fontSize: (content.main||'').length > 200 ? 20 : 23,
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
          <div style={{ fontSize: 13, color: th.ref, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            {content.sublabel}
          </div>

          {/* Footer */}
          <div style={{ height: 1, background: th.divider, opacity: 0.4, marginBottom: 10 }} />
          <div style={{ fontSize: 13, color: th.footer, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.05em', marginBottom: 3 }}>
            ✦ The Red Letters ✦
          </div>
          <div style={{ fontSize: 11, color: th.tagline, letterSpacing: '0.05em' }}>
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
// ── Memorize Modal ─────────────────────────────────────────────────────────
function MemorizeModal({text, ref, onClose, isMemorized, onMark, C}) {
  const [mode,setMode]=useState(null)
  const [revealed,setRevealed]=useState(false)
  const [typed,setTyped]=useState('')
  const [score,setScore]=useState(null)
  const words=text.split(' ')
  const blanked=words.map((w,i)=>(i+1)%3===0?'___':w)
  const checkScore=()=>{
    const norm=s=>s.toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim()
    const tw=norm(typed).split(' '),ow=norm(text).split(' ')
    const pct=Math.round(tw.filter(w=>ow.includes(w)).length/ow.length*100)
    setScore(pct); if(pct>=70) onMark()
  }
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:700,display:'flex',alignItems:'center',justifyContent:'center',padding:16,overflowY:'auto'}} onClick={()=>{if(!mode)onClose()}}>
      <div onClick={e=>e.stopPropagation()} style={{background:`linear-gradient(145deg,${C.bg},#EDE8DC)`,border:`1px solid ${C.goldB}`,borderRadius:16,padding:24,maxWidth:420,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <div style={{fontSize:11,color:C.gold,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.14em',textTransform:'uppercase'}}>✦ Memorize</div>
          <button onClick={onClose} style={{background:'transparent',border:'none',color:C.muted,cursor:'pointer',fontSize:20}}>×</button>
        </div>
        <div style={{fontSize:12,color:C.gold,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.1em',marginBottom:14,paddingBottom:12,borderBottom:`1px solid ${C.goldB}`,textAlign:'center'}}>{ref}{isMemorized&&<span style={{display:'block',fontSize:10,color:C.green,marginTop:3}}>✓ Memorized</span>}</div>
        {!mode?(
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[{id:'recall',icon:'🧠',title:'Read & Recall',desc:'Recite aloud, then reveal'},{id:'blanks',icon:'✏️',title:'Fill the Gaps',desc:'Every 3rd word blanked'},{id:'write',icon:'✍️',title:'Write it Out',desc:'Type from memory, get a score'}].map(m=>(
              <button key={m.id} onClick={()=>setMode(m.id)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:10,cursor:'pointer',textAlign:'left',background:C.redF,border:`1px solid ${C.redB}`}}>
                <span style={{fontSize:20}}>{m.icon}</span>
                <span><span style={{display:'block',fontSize:12,color:C.cream,fontFamily:"'Cinzel',Georgia,serif",marginBottom:1}}>{m.title}</span><span style={{fontSize:11,color:C.muted}}>{m.desc}</span></span>
              </button>
            ))}
          </div>
        ):mode==='recall'?(
          !revealed?(<div style={{textAlign:'center'}}><p style={{fontSize:13,color:C.muted,marginBottom:16,fontStyle:'italic',lineHeight:1.7}}>Say the passage aloud from memory, then reveal to check.</p><button onClick={()=>setRevealed(true)} style={{background:C.goldF,border:`1px solid ${C.goldB}`,color:C.gold,padding:'10px 24px',borderRadius:50,cursor:'pointer',fontSize:12,fontFamily:"'Cinzel',Georgia,serif"}}>Reveal</button></div>)
          :(<div><p style={{fontSize:16,color:C.red,fontStyle:'italic',lineHeight:1.8,marginBottom:16}}>"{text}"</p><button onClick={onMark} style={{width:'100%',background:C.greenF,border:`1px solid ${C.greenB}`,color:C.green,padding:'12px',borderRadius:10,cursor:'pointer',fontSize:12,fontFamily:"'Cinzel',Georgia,serif",marginBottom:8}}>✓ Mark Memorized</button><button onClick={()=>setRevealed(false)} style={{width:'100%',background:'transparent',border:'none',color:C.muted,cursor:'pointer',fontSize:13}}>Try Again</button></div>)
        ):mode==='blanks'?(
          <div><div style={{background:'rgba(0,0,0,0.04)',borderRadius:10,padding:14,marginBottom:12}}><p style={{fontSize:15,lineHeight:2,margin:0}}>{blanked.map((w,i)=><span key={i} style={{color:w==='___'?C.gold:C.text,borderBottom:w==='___'?`1px solid ${C.gold}`:undefined}}>{w}{i<blanked.length-1?' ':''}</span>)}</p></div>
          {!revealed?<button onClick={()=>setRevealed(true)} style={{width:'100%',background:C.goldF,border:`1px solid ${C.goldB}`,color:C.gold,padding:'11px',borderRadius:10,cursor:'pointer',fontSize:12,fontFamily:"'Cinzel',Georgia,serif",marginBottom:8}}>Reveal Missing Words</button>:<div style={{background:C.greenF,border:`1px solid ${C.greenB}`,borderRadius:10,padding:12,marginBottom:10}}><p style={{fontSize:13,lineHeight:1.8,margin:0}}>{words.map((w,i)=><span key={i} style={{color:(i+1)%3===0?C.green:C.text,fontWeight:(i+1)%3===0?600:400}}>{w}{i<words.length-1?' ':''}</span>)}</p></div>}
          <button onClick={onMark} style={{width:'100%',background:C.greenF,border:`1px solid ${C.greenB}`,color:C.green,padding:'11px',borderRadius:10,cursor:'pointer',fontSize:12,fontFamily:"'Cinzel',Georgia,serif"}}>✓ Mark Memorized</button></div>
        ):mode==='write'?(
          score===null?(<div><textarea rows={5} value={typed} onChange={e=>setTyped(e.target.value)} placeholder="Type the passage from memory..." style={{width:'100%',background:'rgba(0,0,0,0.04)',border:`1px solid ${C.border}`,borderRadius:10,color:C.cream,fontSize:15,padding:'12px',fontFamily:"'EB Garamond',Georgia,serif",outline:'none',resize:'none',boxSizing:'border-box',marginBottom:10,lineHeight:1.7}}/><button onClick={checkScore} disabled={!typed.trim()} style={{width:'100%',background:C.goldF,border:`1px solid ${C.goldB}`,color:C.gold,padding:'11px',borderRadius:10,cursor:'pointer',fontSize:12,fontFamily:"'Cinzel',Georgia,serif",opacity:typed.trim()?1:0.4}}>Check My Score</button></div>)
          :(<div style={{textAlign:'center'}}><div style={{fontSize:48,fontWeight:700,color:score>=80?C.green:score>=50?C.gold:C.red,fontFamily:"'Cinzel',Georgia,serif",marginBottom:4}}>{score}%</div><div style={{fontSize:13,color:C.muted,marginBottom:14}}>{score>=90?'Nearly perfect!':score>=70?'Great progress!':score>=50?'Good start!':'Keep practicing!'}</div>{score>=70&&<button onClick={onMark} style={{width:'100%',background:C.greenF,border:`1px solid ${C.greenB}`,color:C.green,padding:'11px',borderRadius:10,cursor:'pointer',fontSize:12,fontFamily:"'Cinzel',Georgia,serif",marginBottom:8}}>✓ Mark Memorized</button>}<button onClick={()=>{setTyped('');setScore(null)}} style={{width:'100%',background:'transparent',border:'none',color:C.muted,cursor:'pointer',fontSize:13}}>Try Again</button></div>)
        ):(null)}
      </div>
    </div>
  )
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function RedLetters({ session, profile }) {
  const userId = session?.user?.id
  const isPremium = true // All content free

  const [darkMode,setDarkMode]=useState(()=>{try{return localStorage.getItem('rl_dark')==='1'}catch{return false}})
  const C = darkMode ? DARK_C : LIGHT_C
  const LBL = {fontSize:9,color:C.gold,letterSpacing:'0.16em',textTransform:'uppercase',fontFamily:"'Cinzel',Georgia,serif",marginBottom:12,display:'block'}
  const [view,setView]=useState('home')     // 'home'|'theme'|'passage'
  const [selTheme,setSelTheme]=useState(null)
  const [selPassage,setSelPassage]=useState(null)
  const [tab,setTab]=useState('passage')
  const [entries,setEntries]=useState([])
  const [savedIds,setSavedIds]=useState(()=>{try{return JSON.parse(localStorage.getItem('rl_saved')||'[]')}catch{return[]}})
  const [showSaved,setShowSaved]=useState(false)
  const [showSearch,setShowSearch]=useState(false)
  const [searchQ,setSearchQ]=useState('')
  const [searchResults,setSearchResults]=useState([])
  const [sharePassage,setSharePassage]=useState(null)
  const [showThemeJump,setShowThemeJump]=useState(false)
  const [showSettings,setShowSettings]=useState(false)
  const [showProgress,setShowProgress]=useState(false)
  const [journalSaved,setJournalSaved]=useState(false)
  const [speaking,setSpeaking]=useState(false)
  const speak = entry => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    let text = entry.transliteration || "";
    if (!text && entry.original) {
      const m = entry.original.match(/\(([^)]+)\)/);
      text = m ? m[1].trim() : entry.original;
    }
    if (!text) return;
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.72;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  };
  const saveTimers=useRef({})

  useEffect(()=>{
    if(!userId) return
    supabase.from('rl_entries').select('*').eq('user_id',userId).then(({data})=>{
      if(!data) return
      setEntries(data)
      // Cross-device sync: hydrate savedIds from entries where field_key='saved' and field_value='true'
      const serverSaved = data.filter(e=>e.field_key==='saved'&&e.field_value==='true').map(e=>e.saying_id)
      if (serverSaved.length > 0) {
        setSavedIds(serverSaved)
        try { localStorage.setItem('rl_saved', JSON.stringify(serverSaved)) } catch {}
      }
      // Cross-device sync: dark mode preference (stored as saying_id='__user_prefs__', field_key='dark_mode')
      const dm = data.find(e=>e.saying_id==='__user_prefs__'&&e.field_key==='dark_mode')
      if (dm) {
        const isDark = dm.field_value === '1'
        setDarkMode(isDark)
        try { localStorage.setItem('rl_dark', isDark?'1':'0') } catch {}
      }
    })
  },[userId])

  const get=(pid,key)=>entries.find(e=>e.saying_id===pid&&e.field_key===key)?.field_value||''
  const set=useCallback((pid,key,val)=>{
    if(!userId) return
    setEntries(prev=>{const i=prev.findIndex(e=>e.saying_id===pid&&e.field_key===key);if(i>=0){const u=[...prev];u[i]={...u[i],field_value:val};return u;}return[...prev,{user_id:userId,saying_id:pid,field_key:key,field_value:val}]})
    const tk=`${pid}__${key}`;clearTimeout(saveTimers.current[tk])
    saveTimers.current[tk]=setTimeout(()=>{supabase.from('rl_entries').upsert({user_id:userId,saying_id:pid,field_key:key,field_value:val,updated_at:new Date().toISOString()},{onConflict:'user_id,saying_id,field_key'})},1000)
  },[userId])

  const toggleSave=(pid)=>{const wasIn=savedIds.includes(pid);const next=wasIn?savedIds.filter(x=>x!==pid):[...savedIds,pid];setSavedIds(next);try{localStorage.setItem('rl_saved',JSON.stringify(next))}catch{};if(userId)set(pid,'saved',wasIn?'':'true')}
  const isSaved=(pid)=>savedIds.includes(pid)
  const isMemorized=(pid)=>get(pid,'mem')==='true'

  const openPassage=(p,t)=>{setSelPassage(p);setSelTheme(t);setTab('passage');setView('passage');window.scrollTo(0,0);if(userId)set(p.id,'read','true')}
  const goBack=()=>{if(view==='passage'){setView('theme');window.scrollTo(0,0)}else{setView('home');window.scrollTo(0,0)}}

  const doSearch=(q)=>{
    setSearchQ(q);if(!q.trim()){setSearchResults([]);return}
    const term=q.toLowerCase()
    setSearchResults(ALL_PASSAGES.filter(p=>p.text.toLowerCase().includes(term)||p.title.toLowerCase().includes(term)||p.ref.toLowerCase().includes(term)||p.themeTitle.toLowerCase().includes(term)||p.context.toLowerCase().includes(term)).map(p=>({passage:p,theme:THEMES.find(t=>t.id===p.themeId)})))
  }

  // ── Compact header (same structure as AS1) ─────────────────────────────
  const Header = ({showBack=false}) => (
    <div style={{position:'sticky',top:0,zIndex:200,background:darkMode?'rgba(15,10,6,0.97)':'rgba(247,242,234,0.97)',backdropFilter:'blur(12px)',borderBottom:`1px solid ${C.border}`}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 18px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <img src="/icon.png" alt="" style={{width:36,height:36,borderRadius:9,boxShadow:'0 2px 8px rgba(0,0,0,0.2)'}}/>
          <div>
            <div style={{fontSize:15,fontWeight:600,color:C.cream,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.04em',lineHeight:1.1}}>The Red Letters</div>
            <div style={{fontSize:9,color:C.muted,letterSpacing:'0.12em',textTransform:'uppercase',fontFamily:"'Cinzel',Georgia,serif"}}>The Words of Jesus</div>
          </div>
        </div>
        <span style={{fontSize:10,color:C.muted,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.06em'}}>{session?.user?.email?.split('@')[0]}</span>
      </div>
      <div style={{display:'flex',justifyContent:'center',gap:2,padding:'4px 12px 7px',flexWrap:'nowrap',overflowX:'auto'}}>
        {(showBack?[['back','← Themes'],['search','🔍 Search'],['saved','★ Saved'],['settings','⚙️ Settings']]:[['search','🔍 Search'],['saved','★ Saved'],['progress','📊 Progress'],['settings','⚙️ Settings']]).map(([v,l])=>(
          <button key={v} onClick={()=>{
            if(v==='back')goBack()
            else if(v==='search'){setShowSearch(true);setSearchQ('');setSearchResults([])}
            else if(v==='saved')setShowSaved(true)
            else if(v==='settings')setShowSettings(true)
            else if(v==='progress')setShowProgress(true)
          }} style={{background:'transparent',border:'1px solid transparent',color:C.muted,padding:'4px 8px',borderRadius:6,cursor:'pointer',fontSize:10,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.04em',whiteSpace:'nowrap',flexShrink:0,touchAction:'manipulation',transition:'all .2s'}}>
            {l}
          </button>
        ))}
      </div>
    </div>
  )


  // ── Settings — must be before view checks ──────────────────────────────
  if (showProgress) {
    const passagesRead  = ALL_PASSAGES.filter(p => get(p.id,'read')==='true').length
    const passagesMem   = ALL_PASSAGES.filter(p => get(p.id,'mem')==='true').length
    const passagesSaved = savedIds.length
    const journalCount  = entries.filter(e => e.field_key==='journal' && (e.field_value||'').trim()).length
    const themesExplored= THEMES.filter(t => t.passages.some(p => get(p.id,'read')==='true')).length
    const total = ALL_PASSAGES.length
    const pct   = Math.round((passagesRead/total)*100)
    return (
      <div style={{position:'fixed',inset:0,zIndex:400,background:C.bg,fontFamily:"'EB Garamond',Georgia,serif",overflowY:'auto'}}>
        <div style={{maxWidth:560,margin:'0 auto',padding:'0 0 80px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:`1px solid ${C.border}`,position:'sticky',top:0,zIndex:10,background:C.bg}}>
            <div>
              <div style={{fontSize:9,color:C.red,letterSpacing:'0.16em',textTransform:'uppercase',fontFamily:"'Cinzel',Georgia,serif"}}>The Red Letters</div>
              <div style={{fontSize:18,fontWeight:700,color:C.ink||C.cream,fontFamily:"'Cinzel',Georgia,serif"}}>Your Progress</div>
            </div>
            <button onClick={()=>setShowProgress(false)} style={{background:C.redF,border:`1px solid ${C.redB}`,color:C.muted,width:36,height:36,borderRadius:9,cursor:'pointer',fontSize:18}}>←</button>
          </div>
          <div style={{padding:'8px 20px'}}>
            <div style={{marginTop:24,marginBottom:8}}><div style={{fontSize:9,color:C.muted,letterSpacing:'0.14em',textTransform:'uppercase',fontFamily:"'Cinzel',Georgia,serif"}}>Overall</div></div>
            <div style={{background:C.redF,border:`1px solid ${C.redB}`,borderRadius:14,padding:'18px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:10}}>
                <div style={{fontSize:14,color:C.ink||C.cream,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.04em'}}>Passages Studied</div>
                <div style={{fontSize:22,fontWeight:700,color:C.red,fontFamily:"'Cinzel',Georgia,serif"}}>{passagesRead}<span style={{fontSize:13,color:C.muted,fontWeight:400}}> / {total}</span></div>
              </div>
              <div style={{height:6,background:C.redB,borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',background:`linear-gradient(90deg,${C.red},${C.redL})`,width:`${pct}%`,transition:'width .4s ease'}}/></div>
              <div style={{fontSize:12,color:C.muted,textAlign:'center',marginTop:8}}>{pct}% complete</div>
            </div>
            <div style={{marginTop:24,marginBottom:8}}><div style={{fontSize:9,color:C.muted,letterSpacing:'0.14em',textTransform:'uppercase',fontFamily:"'Cinzel',Georgia,serif"}}>Stats</div></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
              {[['📖',passagesRead,'Passages Read'],['🧠',passagesMem,'Memorized'],['📝',journalCount,'Journal Entries'],['★',passagesSaved,'Saved'],['🏛',themesExplored,'Themes Explored'],[' ',total-passagesRead,'Remaining']].map(([icon,val,label])=>(
                <div key={label} style={{background:C.redF,border:`1px solid ${C.redB}`,borderRadius:12,padding:'16px 14px',textAlign:'center'}}>
                  <div style={{fontSize:22,marginBottom:6}}>{icon}</div>
                  <div style={{fontSize:28,fontWeight:700,color:C.red,fontFamily:"'Cinzel',Georgia,serif",lineHeight:1}}>{val}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:4}}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:24,marginBottom:8}}><div style={{fontSize:9,color:C.muted,letterSpacing:'0.14em',textTransform:'uppercase',fontFamily:"'Cinzel',Georgia,serif"}}>By Theme</div></div>
            <div style={{background:C.redF,border:`1px solid ${C.redB}`,borderRadius:14,overflow:'hidden'}}>
              {THEMES.map((t,ti)=>{
                const done=t.passages.filter(p=>get(p.id,'read')==='true').length
                const pct=Math.round((done/t.passages.length)*100)
                return (<div key={t.id} style={{padding:'14px 18px',borderBottom:ti<THEMES.length-1?`1px solid ${C.border}`:'none'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
                    <span style={{fontSize:18,flexShrink:0}}>{t.icon}</span>
                    <span style={{flex:1,fontSize:14,color:C.ink||C.cream,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.04em'}}>{t.title}</span>
                    <span style={{fontSize:12,color:done===t.passages.length?C.red:C.muted,fontFamily:"'Cinzel',Georgia,serif"}}>{done}/{t.passages.length}</span>
                  </div>
                  <div style={{height:4,background:C.border,borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',background:`linear-gradient(90deg,${C.red},${C.redL})`,width:`${pct}%`,transition:'width .4s'}}/></div>
                </div>)
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showSettings) return (
    <Settings
      profile={profile}
      userId={userId}
      entries={entries}
      passages={ALL_PASSAGES}
      darkMode={darkMode}
      onToggleDarkMode={()=>{const n=!darkMode;setDarkMode(n);try{localStorage.setItem('rl_dark',n?'1':'0')}catch{};if(userId)set('__user_prefs__','dark_mode',n?'1':'0')}}
      onClose={()=>setShowSettings(false)}
    />
  )

  // ── HOME ────────────────────────────────────────────────────────────────
  if (view==='home') return (
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:"'EB Garamond',Georgia,serif",color:C.text}}>
      <Header/>
      <div style={{maxWidth:860,margin:'0 auto',padding:'26px 18px 130px'}}>
        <div style={{fontSize:9,color:C.muted,letterSpacing:'0.16em',textTransform:'uppercase',fontFamily:"'Cinzel',Georgia,serif",marginBottom:14}}>Browse by Theme</div>
        {THEMES.map((t,i)=>{
          const read=t.passages.filter(p=>get(p.id,'read')==='true').length
          return (
            <div key={t.id} onClick={()=>{setSelTheme(t);setView('theme');window.scrollTo(0,0)}} style={{background:i===0?'linear-gradient(145deg,rgba(139,26,26,0.08),rgba(139,26,26,0.03))':'linear-gradient(145deg,rgba(139,26,26,0.04),rgba(139,26,26,0.01))',border:`1px solid ${C.redB}`,borderRadius:14,padding:'16px 20px',marginBottom:10,cursor:'pointer',display:'flex',alignItems:'center',gap:14,transition:'all .2s'}}>
              <span style={{fontSize:26,flexShrink:0}}>{t.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,color:C.cream,fontFamily:"'Cinzel',Georgia,serif",fontWeight:600,marginBottom:2}}>{t.title}</div>
                <div style={{fontSize:12,color:C.muted,fontStyle:'italic'}}>{t.subtitle}</div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:10,color:C.muted,fontFamily:"'Cinzel',Georgia,serif"}}>{read}/{t.passages.length}</div>
                <span style={{color:C.muted,fontSize:14}}>›</span>
              </div>
            </div>
          )
        })}
      </div>
      {showSearch&&<SearchModal/>}
      {showSaved&&<SavedModal/>}
    </div>
  )

  // ── THEME VIEW ──────────────────────────────────────────────────────────
  if (view==='theme'&&selTheme) return (
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:"'EB Garamond',Georgia,serif",color:C.text}}>
      <Header showBack/>

      {/* Floating prev/next theme */}
      {(() => {
        const idx = THEMES.findIndex(t => t.id === selTheme.id)
        const prev = THEMES[idx-1], next = THEMES[idx+1]
        const s = {position:'fixed',bottom:32,zIndex:250,background:'rgba(247,242,234,0.93)',backdropFilter:'blur(12px)',border:`1px solid ${C.redB}`,color:C.red,borderRadius:50,padding:'10px 14px',cursor:'pointer',fontSize:12,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.04em',boxShadow:'0 4px 16px rgba(139,26,26,0.15)',touchAction:'manipulation',transition:'all .2s',display:'flex',alignItems:'center',gap:6}
        return (<>
          {prev && <button onClick={()=>{setSelTheme(prev);window.scrollTo(0,0)}} style={{...s,left:16}}>‹ <span style={{maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:10}}>{prev.title}</span></button>}
          {next && <button onClick={()=>{setSelTheme(next);window.scrollTo(0,0)}} style={{...s,right:16}}><span style={{maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:10}}>{next.title}</span> ›</button>}
        </>)
      })()}

      <div style={{maxWidth:860,margin:'0 auto',padding:'20px 18px 0'}}>
        {/* Theme nav — AS1 week nav style */}
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
          <button onClick={()=>{const i=THEMES.findIndex(t=>t.id===selTheme.id);const prev=THEMES[i-1];if(prev)setSelTheme(prev)}} disabled={THEMES.findIndex(t=>t.id===selTheme.id)===0} style={{background:C.bgCard,border:`1px solid ${C.border}`,color:C.muted,width:34,height:34,borderRadius:8,cursor:'pointer',fontSize:16,opacity:THEMES.findIndex(t=>t.id===selTheme.id)===0?0.3:1,display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
          <div style={{flex:1,textAlign:'center',position:'relative'}}>
            <div style={{fontSize:10,color:C.red,letterSpacing:'0.16em',textTransform:'uppercase',fontFamily:"'Cinzel',Georgia,serif",marginBottom:3}}>{selTheme.icon} Theme {THEMES.findIndex(t=>t.id===selTheme.id)+1} of {THEMES.length}</div>
            <button onClick={()=>setShowThemeJump(v=>!v)} style={{background:'transparent',border:'none',cursor:'pointer',padding:0,touchAction:'manipulation'}}>
              <h2 style={{fontSize:22,fontWeight:700,color:C.cream,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.03em',lineHeight:1.1,margin:0}}>{selTheme.title} <span style={{fontSize:12,color:C.muted}}>{showThemeJump?'▲':'▼'}</span></h2>
            </button>
            <p style={{fontSize:13,color:C.muted,fontStyle:'italic',marginTop:2}}>{selTheme.subtitle}</p>
          </div>
          <button onClick={()=>{const i=THEMES.findIndex(t=>t.id===selTheme.id);const next=THEMES[i+1];if(next)setSelTheme(next)}} disabled={THEMES.findIndex(t=>t.id===selTheme.id)===THEMES.length-1} style={{background:C.bgCard,border:`1px solid ${C.border}`,color:C.muted,width:34,height:34,borderRadius:8,cursor:'pointer',fontSize:16,opacity:THEMES.findIndex(t=>t.id===selTheme.id)===THEMES.length-1?0.3:1,display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
        </div>
        {showThemeJump&&(
          <div onClick={()=>setShowThemeJump(false)} style={{position:'fixed',inset:0,zIndex:800}}>
            <div onClick={e=>e.stopPropagation()} style={{position:'fixed',top:140,left:10,right:10,background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,padding:12,maxHeight:260,overflowY:'auto',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,zIndex:900,boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
              {THEMES.map(t=><button key={t.id} onClick={()=>{setSelTheme(t);setShowThemeJump(false)}} style={{background:t.id===selTheme.id?C.redF:'transparent',border:`1px solid ${t.id===selTheme.id?C.redB:C.border}`,color:t.id===selTheme.id?C.red:C.muted,borderRadius:10,padding:'10px 6px',cursor:'pointer',fontSize:9,fontFamily:"'Cinzel',Georgia,serif",textAlign:'center',lineHeight:1.4,touchAction:'manipulation'}}><div style={{fontSize:18,marginBottom:2}}>{t.icon}</div><div>{t.title}</div></button>)}
            </div>
          </div>
        )}
        {/* Progress bar */}
        <div style={{height:3,background:`${C.border}`,borderRadius:3,margin:'10px 0 18px',overflow:'hidden'}}>
          <div style={{height:'100%',background:`linear-gradient(90deg,${C.red},${C.redL})`,width:`${(selTheme.passages.filter(p=>get(p.id,'read')==='true').length/selTheme.passages.length)*100}%`,transition:'width .4s ease'}}/>
        </div>
      </div>
      {/* Passage cards */}
      <div style={{maxWidth:860,margin:'0 auto',padding:'0 18px 130px'}}>
        <label style={LBL}>Passages — {selTheme.title}</label>
        {selTheme.passages.map((p,i)=>{
          const gc=GOSPEL_COLORS[p.gospel]||C.red
          const isRead=get(p.id,'read')==='true'
          const isMem=isMemorized(p.id)
          return (
            <div key={p.id} style={{background:i===0?'linear-gradient(145deg,rgba(139,26,26,0.1),rgba(139,26,26,0.04))':'linear-gradient(145deg,rgba(139,26,26,0.05),rgba(139,26,26,0.01))',border:`1px solid ${C.redB}`,borderRadius:16,padding:'22px 24px',marginBottom:14,boxShadow:'0 8px 24px rgba(0,0,0,0.06)',cursor:'pointer'}} onClick={()=>openPassage(p,selTheme)}>
              <div style={{display:'flex',gap:10}}>
                <span style={{color:C.gold,fontSize:32,lineHeight:1,opacity:.25,flexShrink:0,fontFamily:'Georgia,serif'}}>"</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.cream,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.04em',marginBottom:8}}>{p.title}</div>
                  <p style={{fontSize:16,lineHeight:1.85,color:C.red,fontStyle:'italic',marginBottom:12,letterSpacing:'0.01em'}}>{p.text.split('\n')[0].slice(0,180)}{p.text.length>180?'…':''}</p>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:11,color:C.gold,fontFamily:"'Cinzel',Georgia,serif",fontWeight:500,letterSpacing:'0.08em',textTransform:'uppercase'}}>{p.ref}</span>
                      <span style={{fontSize:9,color:gc,background:`${gc}18`,border:`1px solid ${gc}40`,borderRadius:6,padding:'1px 7px',fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.1em',textTransform:'uppercase'}}>{p.translation}</span>
                    </div>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      {isMem&&<span style={{fontSize:9,color:C.green,fontFamily:"'Cinzel',Georgia,serif"}}>✦ Mem</span>}
                      {isRead&&<span style={{fontSize:9,color:C.muted}}>✓</span>}
                      <button onClick={e=>{e.stopPropagation();toggleSave(p.id)}} style={{background:'transparent',border:`1px solid ${isSaved(p.id)?C.goldB:C.border}`,color:isSaved(p.id)?C.gold:C.muted,padding:'2px 8px',borderRadius:12,cursor:'pointer',fontSize:13,touchAction:'manipulation'}}>{isSaved(p.id)?'★':'☆'}</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {showSearch&&<SearchModal/>}
      {showSaved&&<SavedModal/>}
    </div>
  )

  // ── PASSAGE VIEW ────────────────────────────────────────────────────────
  if (view==='passage'&&selPassage&&selTheme) {
    const p=selPassage, t=selTheme
    const gc=GOSPEL_COLORS[p.gospel]||C.red
    const passageIdx=t.passages.findIndex(x=>x.id===p.id)
    const prevP=t.passages[passageIdx-1], nextP=t.passages[passageIdx+1]
    const journalVal=get(p.id,'journal')
    const navBtn={background:C.bgCard,border:`1px solid ${C.border}`,color:C.muted,width:34,height:34,borderRadius:8,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',touchAction:'manipulation',flexShrink:0}

    return (
      <div style={{minHeight:'100vh',background:C.bg,fontFamily:"'EB Garamond',Georgia,serif",color:C.text}}>
        <Header showBack/>

        {/* Floating prev/next + share FAB — FAB stacks above next pill, shares its horizontal center */}
        {(() => {
          const passIdx = selTheme.passages.findIndex(x => x.id === p.id)
          const prevPass = selTheme.passages[passIdx-1]
          const nextPass = selTheme.passages[passIdx+1]
          const visibleTabs = TABS
          const tabIdx = visibleTabs.findIndex(tb => tb.id === tab)
          const prevTab = visibleTabs[tabIdx-1]
          const nextTab = visibleTabs[tabIdx+1]
          const showPrev = prevTab || prevPass
          const showNext = nextTab || nextPass
          const pillStatic = {background:'rgba(247,242,234,0.93)',backdropFilter:'blur(12px)',border:`1px solid ${C.redB}`,color:C.red,borderRadius:50,padding:'10px 14px',cursor:'pointer',fontSize:11,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.04em',boxShadow:'0 4px 16px rgba(139,26,26,0.15)',touchAction:'manipulation',transition:'all .2s',display:'flex',alignItems:'center',gap:5,maxWidth:160}
          const pillFixed = (extra) => ({...pillStatic,position:'fixed',bottom:32,zIndex:250,...extra})
          const fabBtn = (
            <button
              onClick={()=>setSharePassage(p)}
              aria-label="Share this passage"
              style={{
                width:48,height:48,borderRadius:'50%',
                background:`linear-gradient(135deg, ${C.red}, ${C.gold})`,
                border:'none',color:'#fff',fontSize:20,cursor:'pointer',
                boxShadow:'0 6px 18px rgba(139,26,26,0.4), 0 2px 6px rgba(0,0,0,0.2)',
                display:'flex',alignItems:'center',justifyContent:'center',
                touchAction:'manipulation',transition:'transform .15s ease',
                flexShrink:0,
              }}
              onMouseDown={e=>e.currentTarget.style.transform='scale(0.92)'}
              onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}
              onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
            >↗</button>
          )
          return (<>
            {showPrev && <button onClick={()=>{
              if(prevTab){setTab(prevTab.id);window.scrollTo(0,0)}
              else if(prevPass){openPassage(prevPass,selTheme)}
            }} style={pillFixed({left:16})}>
              <span>‹</span>
              <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{prevTab?prevTab.label:prevPass?.title.split(' ').slice(0,3).join(' ')}</span>
            </button>}
            {/* Right-side column: FAB on top, next pill below, both centered horizontally */}
            <div style={{position:'fixed',bottom:32,right:16,zIndex:250,display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
              {fabBtn}
              {showNext && <button onClick={()=>{
                if(nextTab){setTab(nextTab.id);window.scrollTo(0,0)}
                else if(nextPass){openPassage(nextPass,selTheme)}
              }} style={pillStatic}>
                <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nextTab?nextTab.label:nextPass?.title.split(' ').slice(0,3).join(' ')}</span>
                <span>›</span>
              </button>}
            </div>
          </>)
        })()}

        {/* Passage nav — AS1 week nav style */}
        <div style={{maxWidth:860,margin:'0 auto',padding:'18px 18px 0'}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
            <button onClick={()=>{if(prevP)openPassage(prevP,t)}} disabled={!prevP} style={{...navBtn,opacity:prevP?1:0.3}}>‹</button>
            <div style={{flex:1,textAlign:'center'}}>
              <div style={{fontSize:10,color:C.red,letterSpacing:'0.16em',textTransform:'uppercase',fontFamily:"'Cinzel',Georgia,serif",marginBottom:3}}>
                {t.icon} {t.title} — Passage {passageIdx+1} of {t.passages.length}
              </div>
              <h2 style={{fontSize:20,fontWeight:700,color:C.cream,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.03em',lineHeight:1.2,margin:'0 0 4px'}}>{p.title}</h2>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                <span style={{fontSize:11,color:C.gold,fontFamily:"'Cinzel',Georgia,serif",fontWeight:500,letterSpacing:'0.08em',textTransform:'uppercase'}}>{p.ref}</span>
                <span style={{fontSize:9,color:gc,background:`${gc}18`,border:`1px solid ${gc}40`,borderRadius:6,padding:'1px 7px',fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.1em',textTransform:'uppercase'}}>{p.translation}</span>
              </div>
            </div>
            <button onClick={()=>{if(nextP)openPassage(nextP,t)}} disabled={!nextP} style={{...navBtn,opacity:nextP?1:0.3}}>›</button>
          </div>
          {/* Progress bar */}
          <div style={{height:3,background:C.border,borderRadius:3,margin:'10px 0 14px',overflow:'hidden'}}>
            <div style={{height:'100%',background:`linear-gradient(90deg,${C.red},${C.redL})`,width:`${((passageIdx+1)/t.passages.length)*100}%`,transition:'width .4s ease'}}/>
          </div>
          {/* Section tabs — AS1 pill style */}
          <div style={{display:'flex',gap:3,flexWrap:'wrap',paddingBottom:2}}>
            {TABS.map(tb=>{
              return (
                <button key={tb.id} onClick={()=>setTab(tb.id)} style={{background:tab===tb.id?'linear-gradient(135deg,rgba(139,26,26,0.15),rgba(139,26,26,0.06))':'transparent',border:`1px solid ${tab===tb.id?C.redB:C.border}`,color:tab===tb.id?C.red:C.muted,padding:'6px 10px',borderRadius:8,cursor:'pointer',fontSize:11,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.04em',transition:'all .18s',whiteSpace:'nowrap',flexShrink:0,touchAction:'manipulation'}}>
                  {tb.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Save + Share pills — Passage tab only (share remains accessible from floating FAB on other tabs) */}
        {tab==='passage' && (
          <div style={{maxWidth:860,margin:'0 auto',padding:'10px 18px 0',display:'flex',justifyContent:'flex-end',gap:8}}>
            <button onClick={()=>toggleSave(p.id)} aria-label={isSaved(p.id)?'Unsave passage':'Save passage'} style={{background:isSaved(p.id)?`linear-gradient(135deg,rgba(139,106,46,0.18),rgba(139,106,46,0.05))`:'transparent',border:`1px solid ${isSaved(p.id)?C.goldB:C.border}`,color:isSaved(p.id)?C.gold:C.muted,padding:'5px 12px',borderRadius:12,cursor:'pointer',fontSize:13,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.04em',touchAction:'manipulation',display:'flex',alignItems:'center',gap:5}}>
              <span style={{fontSize:14,lineHeight:1}}>{isSaved(p.id)?'★':'☆'}</span>
              <span style={{fontSize:10}}>{isSaved(p.id)?'Saved':'Save'}</span>
            </button>
            <button onClick={()=>setSharePassage(p)} aria-label="Share passage" style={{background:'transparent',border:`1px solid ${C.border}`,color:C.muted,padding:'5px 12px',borderRadius:12,cursor:'pointer',fontSize:12,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.04em',touchAction:'manipulation',display:'flex',alignItems:'center',gap:5}}>
              <span style={{fontSize:13,lineHeight:1}}>↗</span>
              <span style={{fontSize:10}}>Share</span>
            </button>
          </div>
        )}

        {/* Tab content */}
        <div style={{maxWidth:860,margin:'0 auto',padding:'20px 18px 140px'}}>

          {tab==='passage'&&(
            <div>
              <label style={LBL}>{p.ref} — {p.translation}</label>
              <div style={{background:'linear-gradient(145deg,rgba(139,26,26,0.1),rgba(139,26,26,0.04))',border:`1px solid ${C.redB}`,borderRadius:16,padding:'24px 26px',marginBottom:16,boxShadow:'0 8px 24px rgba(0,0,0,0.08)'}}>
                <div style={{display:'flex',gap:12}}>
                  <span style={{color:C.gold,fontSize:32,lineHeight:1,opacity:.25,flexShrink:0,fontFamily:'Georgia,serif'}}>"</span>
                  <div style={{flex:1}}>
                    {p.text.split('\n\n').map((para,i)=>(
                      <p key={i} style={{fontSize:19,lineHeight:1.95,color:C.red,fontStyle:'italic',marginBottom:i<p.text.split('\n\n').length-1?18:0,letterSpacing:'0.01em',whiteSpace:'pre-line'}}>{para}</p>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {tab==='context'&&(<ProseSection label="Setting & Context" text={p.context} accent="gold" C={C} />)}

          {tab==='meaning'&&(<ProseSection label="What Jesus Meant" text={p.meaning} accent="gold" C={C} />)}

          {tab==='lexicon'&&(
            <div>
              <label style={LBL}>Word Study — Original Language</label>
              <p style={{fontSize:13,color:C.muted,fontStyle:'italic',marginBottom:14,lineHeight:1.7}}>Key Greek (or Aramaic) words from Jesus&apos; teaching. The original behind the English.</p>
              {(p.lexicon || []).map((entry, i) => (
                <div key={i} style={{background:'linear-gradient(145deg,rgba(139,106,46,0.08),rgba(139,106,46,0.02))',border:`1px solid ${C.goldB}`,borderRadius:14,padding:'20px 22px 18px',marginBottom:14}}>
                  <div style={{fontSize:18,fontFamily:"'Cinzel',Georgia,serif",color:C.cream,letterSpacing:'0.04em',marginBottom:6}}>{entry.word}</div>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:2}}>
                    <div style={{fontSize:15,color:C.gold,fontFamily:"'EB Garamond',Georgia,serif",fontStyle:'italic',flex:1}}>{entry.original}</div>
                    <button onClick={() => speak(entry)} aria-label="Hear pronunciation" style={{background:speaking?"rgba(139,26,26,0.35)":"rgba(139,26,26,0.12)",border:`1px solid ${C.goldB}`,color:C.gold,width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,padding:0,touchAction:"manipulation"}}>{speaking?"▶":"🔊"}</button>
                  </div>
                  <div style={{fontSize:10,color:C.muted,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:12}}>{entry.language}</div>
                  <div style={{height:1,background:'rgba(139,106,46,0.2)',marginBottom:12}} />
                  <p style={{fontSize:15,color:C.text,lineHeight:1.85,marginBottom:12,fontFamily:"'EB Garamond',Georgia,serif"}}>{entry.meaning}</p>
                  {entry.note && <p style={{fontSize:13,color:C.muted,lineHeight:1.85,fontStyle:'italic',fontFamily:"'EB Garamond',Georgia,serif"}}>{entry.note}</p>}
                </div>
              ))}
              {(!p.lexicon || p.lexicon.length === 0) && (
                <p style={{fontSize:14,color:C.muted,fontStyle:'italic',textAlign:'center',padding:'24px 0'}}>Lexicon entries coming soon for this passage.</p>
              )}
            </div>
          )}

          {tab==='apply'&&(<ProseSection label="Live It Out" text={p.apply} accent="red" C={C} />)}

          {tab==='prayer'&&(<PrayerSection text={p.prayer} C={C} />)}

          {tab==='journal'&&(
            <div>
              <label style={LBL}>Journal</label>
              <p style={{fontSize:13,color:C.muted,fontStyle:'italic',lineHeight:1.7,marginBottom:12}}>What is Jesus saying to you through this passage? What do you notice? What does it ask of you?</p>
              <textarea rows={10} value={journalVal} onChange={e=>set(p.id,'journal',e.target.value)} placeholder="Write your reflection here..."
                style={{width:'100%',background:'rgba(0,0,0,0.03)',border:`1px solid ${C.borderGold}`,borderRadius:14,color:C.cream,fontSize:17,lineHeight:1.9,padding:'16px 18px',fontFamily:"'EB Garamond',Georgia,serif",outline:'none',resize:'vertical',boxSizing:'border-box',minHeight:220}}/>
              <button onClick={async()=>{if(userId){await supabase.from('rl_entries').upsert({user_id:userId,saying_id:p.id,field_key:'journal',field_value:journalVal,updated_at:new Date().toISOString()},{onConflict:'user_id,saying_id,field_key'})}setJournalSaved(true);setTimeout(()=>setJournalSaved(false),2000)}}
                style={{width:'100%',marginTop:12,background:journalSaved?C.greenF:'linear-gradient(135deg,rgba(139,26,26,0.1),rgba(255,255,255,0.01))',border:`1px solid ${journalSaved?C.greenB:C.redB}`,color:journalSaved?C.green:C.red,padding:'13px',borderRadius:12,cursor:'pointer',fontSize:12,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.08em',transition:'all .25s'}}>
                {journalSaved?'✓ Saved':'Save Entry'}
              </button>
            </div>
          )}
        </div>


        {sharePassage&&<ShareCard passage={sharePassage} theme={selTheme} onClose={()=>setSharePassage(null)} C={C}/>}
        {showSearch&&<SearchModal/>}
        {showSaved&&<SavedModal/>}
        </div>
    )
  }

  // ── Sub-components ─────────────────────────────────────────────────────



  function SearchModal() {
    return (
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:700,display:'flex',alignItems:'flex-start',justifyContent:'center',overflowY:'auto',padding:'16px 16px 48px'}} onClick={()=>setShowSearch(false)}>
        <div onClick={e=>e.stopPropagation()} style={{background:C.bg,border:`1px solid ${C.redB}`,borderRadius:18,padding:20,width:'100%',maxWidth:500,marginTop:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div style={{fontSize:10,color:C.red,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.16em',textTransform:'uppercase'}}>🔍 Search</div>
            <button onClick={()=>setShowSearch(false)} style={{background:'transparent',border:'none',color:C.muted,cursor:'pointer',fontSize:20,lineHeight:1}}>×</button>
          </div>
          <input autoFocus value={searchQ} onChange={e=>doSearch(e.target.value)} placeholder="Search passages, themes, references..."
            style={{width:'100%',background:'rgba(0,0,0,0.05)',border:`1px solid ${C.redB}`,borderRadius:10,color:C.cream,fontSize:16,padding:'12px 14px',fontFamily:"'EB Garamond',Georgia,serif",outline:'none',boxSizing:'border-box',marginBottom:14}}/>
          {searchQ&&(
            <div>
              <div style={{fontSize:10,color:C.muted,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:10}}>{searchResults.length} results</div>
              {searchResults.length===0&&<p style={{fontSize:14,color:C.muted,fontStyle:'italic',textAlign:'center',padding:'16px 0'}}>No results. Try a different word.</p>}
              {searchResults.map(({passage:ps,theme:th})=>(
                <button key={ps.id} onClick={()=>{openPassage(ps,th);setShowSearch(false)}} style={{width:'100%',display:'flex',alignItems:'flex-start',gap:10,padding:'12px 14px',borderRadius:10,marginBottom:8,cursor:'pointer',textAlign:'left',background:C.redF,border:`1px solid ${C.redB}`,transition:'all .2s'}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:10,color:C.muted,fontFamily:"'Cinzel',Georgia,serif",marginBottom:2}}>{th?.icon} {th?.title}</div>
                    <div style={{fontSize:13,color:C.cream,fontFamily:"'Cinzel',Georgia,serif",marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ps.title}</div>
                    <div style={{fontSize:11,color:C.gold,fontFamily:"'Cinzel',Georgia,serif"}}>{ps.ref}</div>
                  </div>
                  <span style={{color:C.red,fontSize:14,marginTop:2}}>›</span>
                </button>
              ))}
            </div>
          )}
          {!searchQ&&<div style={{textAlign:'center',padding:'24px 0'}}><div style={{fontSize:28,marginBottom:8}}>✦</div><p style={{fontSize:14,color:C.muted,fontStyle:'italic'}}>Search the words of Jesus.</p></div>}
        </div>
      </div>
    )
  }

  function SavedModal() {
    return (
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:700,display:'flex',alignItems:'flex-start',justifyContent:'center',overflowY:'auto',padding:'16px 16px 48px'}} onClick={()=>setShowSaved(false)}>
        <div onClick={e=>e.stopPropagation()} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:18,padding:20,width:'100%',maxWidth:500,marginTop:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
            <div style={{fontSize:10,color:C.gold,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.16em',textTransform:'uppercase'}}>★ Saved Passages</div>
            <button onClick={()=>setShowSaved(false)} style={{background:'transparent',border:'none',color:C.muted,cursor:'pointer',fontSize:20}}>×</button>
          </div>
          {savedIds.length===0?(<div style={{textAlign:'center',padding:'32px 0'}}><div style={{fontSize:32,marginBottom:10}}>☆</div><p style={{fontSize:14,color:C.muted,fontStyle:'italic'}}>No saved passages yet. Tap ☆ on any passage to save it here.</p></div>):(
            savedIds.map(sid=>{
              const found=ALL_PASSAGES.find(p=>p.id===sid);if(!found)return null
              const th=THEMES.find(t=>t.id===found.themeId)
              return (
                <button key={sid} onClick={()=>{openPassage(found,th);setShowSaved(false)}} style={{width:'100%',display:'flex',alignItems:'flex-start',gap:10,padding:'13px 14px',borderRadius:12,marginBottom:8,cursor:'pointer',textAlign:'left',background:C.redF,border:`1px solid ${C.redB}`}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:10,color:C.muted,fontFamily:"'Cinzel',Georgia,serif",marginBottom:2}}>{th?.icon} {th?.title}</div>
                    <div style={{fontSize:13,color:C.cream,fontFamily:"'Cinzel',Georgia,serif",marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{found.title}</div>
                    <div style={{fontSize:11,color:C.gold,fontFamily:"'Cinzel',Georgia,serif"}}>{found.ref}</div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();toggleSave(sid)}} style={{background:'transparent',border:'none',color:C.gold,cursor:'pointer',fontSize:16,flexShrink:0,touchAction:'manipulation'}}>★</button>
                </button>
              )
            })
          )}
        </div>
      </div>
    )
  }

  return null
}
