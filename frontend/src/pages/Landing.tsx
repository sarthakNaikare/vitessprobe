import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Zap, GitBranch, FileText, Upload, Activity, ChevronDown } from 'lucide-react'

function AnimatedLogo() {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1400),
      setTimeout(() => setPhase(4), 2000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:20,marginBottom:48}}>
      {/* Logo mark */}
      <div style={{position:'relative',width:80,height:80}}>
        {/* Outer ring */}
        <div style={{
          position:'absolute', inset:0,
          border:'1.5px solid rgba(184,115,51,0.3)',
          borderRadius:'50%',
          transform: phase >= 1 ? 'scale(1)' : 'scale(0)',
          opacity: phase >= 1 ? 1 : 0,
          transition:'all 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        }} />
        {/* Inner ring */}
        <div style={{
          position:'absolute', inset:10,
          border:'1px solid rgba(184,115,51,0.5)',
          borderRadius:'50%',
          transform: phase >= 2 ? 'scale(1) rotate(45deg)' : 'scale(0) rotate(0deg)',
          opacity: phase >= 2 ? 1 : 0,
          transition:'all 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s',
        }} />
        {/* Center diamond */}
        <div style={{
          position:'absolute', inset:0,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <div style={{
            width:28, height:28,
            background:'linear-gradient(135deg,#B87333,#D4924A)',
            borderRadius:6,
            transform: phase >= 3 ? 'scale(1) rotate(45deg)' : 'scale(0) rotate(0deg)',
            opacity: phase >= 3 ? 1 : 0,
            transition:'all 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow:'0 4px 16px rgba(184,115,51,0.4)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Activity size={14} color="#FFF7ED" style={{transform:'rotate(-45deg)'}} />
          </div>
        </div>
        {/* Pulse */}
        {phase >= 4 && (
          <div style={{
            position:'absolute', inset:-8,
            border:'1px solid rgba(184,115,51,0.2)',
            borderRadius:'50%',
            animation:'ping 2s cubic-bezier(0,0,0.2,1) infinite',
          }} />
        )}
      </div>

      {/* Wordmark */}
      <div style={{textAlign:'center'}}>
        <div style={{
          fontFamily:'"Playfair Display",serif',
          fontSize:36,
          fontWeight:600,
          color:'#2C1810',
          letterSpacing:'-0.02em',
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? 'translateY(0)' : 'translateY(12px)',
          transition:'all 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s',
        }}>
          Vitess<span style={{color:'#B87333'}}>Probe</span>
        </div>
        <div style={{
          fontFamily:'"JetBrains Mono",monospace',
          fontSize:11,
          color:'#A89880',
          letterSpacing:'0.15em',
          marginTop:4,
          opacity: phase >= 4 ? 1 : 0,
          transition:'opacity 0.5s ease 0.3s',
        }}>
          AUTONOMOUS VITESS INTELLIGENCE
        </div>
      </div>
    </div>
  )
}

const features = [
  { icon: Activity,  title: 'Live Incident Detection',  desc: 'VTTablet failovers, scatter storms, replication lag spikes detected in real time.' },
  { icon: GitBranch, title: 'Causation Graph Engine',   desc: 'Traces exact causal chains across VTGate, VTTablet, MySQL, and etcd.' },
  { icon: FileText,  title: 'RCA Report Generator',     desc: 'Structured post-mortems as PDF, Markdown, or JSON. Technical or executive audience.' },
  { icon: Zap,       title: 'Incident Simulator',       desc: 'Inject synthetic failures and watch VitessProbe diagnose them live.' },
  { icon: Upload,    title: 'Data Import',              desc: 'Upload Prometheus dumps or VTGate queryz output for offline analysis.' },
]

const failureModes = ['Tablet Failover','Scatter Query Storm','Replication Lag','VReplication Error','Online DDL Stall','VTGate Overload','Connection Pool Exhaustion']

export default function Landing() {
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100)
  }, [])

  return (
    <div style={{minHeight:'100vh',background:'#F7F3ED',fontFamily:'Inter,system-ui,sans-serif'}}>
      {/* Subtle background */}
      <div style={{
        position:'fixed', inset:0, pointerEvents:'none',
        background:'radial-gradient(ellipse at 20% 10%, rgba(184,115,51,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(44,24,16,0.04) 0%, transparent 50%)',
      }} />

      {/* Header */}
      <header style={{
        borderBottom:'0.5px solid #E8DDD0', background:'rgba(247,243,237,0.8)',
        backdropFilter:'blur(12px)', position:'sticky', top:0, zIndex:50,
        padding:'0 40px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:28,height:28,background:'linear-gradient(135deg,#B87333,#D4924A)',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Activity size={14} color="#FFF7ED" />
          </div>
          <span style={{fontFamily:'"Playfair Display",serif',fontWeight:600,color:'#2C1810',fontSize:16}}>VitessProbe</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <button onClick={() => navigate('/about')}
            style={{fontSize:13,color:'#8B7355',background:'none',border:'none',padding:'6px 12px',borderRadius:6,cursor:'inherit'}}>
            About
          </button>
          <button onClick={() => navigate('/stack')}
            style={{fontSize:13,color:'#8B7355',background:'none',border:'none',padding:'6px 12px',borderRadius:6,cursor:'inherit'}}>
            Tech Stack
          </button>
          <button onClick={() => navigate('/dashboard')}
            style={{fontSize:13,color:'#F7F3ED',background:'#2C1810',border:'none',padding:'6px 16px',borderRadius:6,cursor:'inherit',fontWeight:500}}>
            Launch App
          </button>
        </div>
      </header>

      {/* Hero */}
      <section style={{maxWidth:760,margin:'0 auto',padding:'80px 40px 60px',textAlign:'center'}}>
        <AnimatedLogo />

        <div style={{
          display:'inline-flex',alignItems:'center',gap:8,
          background:'rgba(184,115,51,0.08)',border:'0.5px solid rgba(184,115,51,0.2)',
          borderRadius:99,padding:'6px 16px',marginBottom:32,
          opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(10px)',
          transition:'all 0.6s ease 0.5s',
        }}>
          <span style={{width:7,height:7,background:'#27AE60',borderRadius:'50%',animation:'pulse 2s infinite'}} />
          <span style={{fontSize:12,fontFamily:'JetBrains Mono',color:'#B87333',letterSpacing:'0.04em'}}>
            Demo cluster running · 3 shards · 6 tablets
          </span>
        </div>

        <p style={{
          fontSize:17,color:'#6B5540',lineHeight:1.8,maxWidth:560,margin:'0 auto 40px',
          opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(10px)',
          transition:'all 0.6s ease 0.6s',
        }}>
          VitessProbe detects incidents, traces causation chains across every Vitess component,
          and generates RCA reports — before your support ticket is even filed.
        </p>

        <div style={{
          display:'flex',alignItems:'center',justifyContent:'center',gap:12,
          opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(10px)',
          transition:'all 0.6s ease 0.7s',
        }}>
          <button onClick={() => navigate('/dashboard')}
            className="hover-lift"
            style={{
              display:'flex',alignItems:'center',gap:8,
              background:'#2C1810',color:'#F7F3ED',
              border:'none',padding:'12px 24px',borderRadius:8,
              fontSize:14,fontWeight:600,cursor:'inherit',
            }}>
            Try Demo <ArrowRight size={15} />
          </button>
          <button onClick={() => navigate('/simulator')}
            className="hover-lift"
            style={{
              display:'flex',alignItems:'center',gap:8,
              background:'#FFFFFF',color:'#2C1810',
              border:'1px solid #E8DDD0',padding:'12px 24px',borderRadius:8,
              fontSize:14,fontWeight:500,cursor:'inherit',
            }}>
            <Zap size={15} style={{color:'#B87333'}} /> Inject a Failure
          </button>
        </div>

        <div style={{marginTop:48,opacity: loaded ? 1 : 0, transition:'opacity 0.6s ease 1s'}}>
          <ChevronDown size={18} style={{color:'#D4C4B0',margin:'0 auto',animation:'bounce 2s infinite'}} />
        </div>
      </section>

      {/* Features */}
      <section style={{maxWidth:900,margin:'0 auto',padding:'40px 40px 60px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:16}}>
          {features.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="card hover-lift animate-fade-up p-5"
              style={{animationDelay:`${0.1+i*0.08}s`}}>
              <div style={{
                width:36,height:36,background:'rgba(184,115,51,0.1)',
                border:'0.5px solid rgba(184,115,51,0.2)',
                borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14,
              }}>
                <Icon size={16} style={{color:'#B87333'}} />
              </div>
              <h3 style={{fontSize:14,fontWeight:600,color:'#2C1810',marginBottom:6}}>{title}</h3>
              <p style={{fontSize:12,color:'#8B7355',lineHeight:1.6}}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Failure modes */}
      <section style={{borderTop:'0.5px solid #E8DDD0',background:'#FFFFFF',padding:'48px 40px'}}>
        <div style={{maxWidth:760,margin:'0 auto',textAlign:'center'}}>
          <p style={{fontSize:10,fontFamily:'JetBrains Mono',color:'#A89880',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:20}}>
            Monitors these Vitess failure modes
          </p>
          <div style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:8}}>
            {failureModes.map(f => (
              <span key={f} className="hover-emboss"
                style={{
                  fontSize:12,fontFamily:'JetBrains Mono',
                  background:'#F7F3ED',border:'0.5px solid #E8DDD0',
                  color:'#6B5540',padding:'6px 14px',borderRadius:99,
                  transition:'all 0.2s ease',
                }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{borderTop:'0.5px solid #E8DDD0',padding:'24px 40px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontSize:11,fontFamily:'JetBrains Mono',color:'#A89880'}}>VitessProbe v1.0.0</span>
        <div style={{display:'flex',gap:20}}>
          <button onClick={() => navigate('/about')} style={{fontSize:12,color:'#A89880',background:'none',border:'none',cursor:'inherit'}}>About</button>
          <button onClick={() => navigate('/stack')}  style={{fontSize:12,color:'#A89880',background:'none',border:'none',cursor:'inherit'}}>Tech Stack</button>
          <a href="https://github.com/sarthakNaikare/vitessprobe" target="_blank" rel="noreferrer"
            style={{fontSize:12,color:'#A89880',textDecoration:'none'}}>GitHub</a>
        </div>
      </footer>

      <style>{`
        @keyframes ping { 75%,100%{transform:scale(1.5);opacity:0} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }
      `}</style>
    </div>
  )
}
