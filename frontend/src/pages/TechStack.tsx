import { ExternalLink, Sparkles } from 'lucide-react'

export default function TechStack() {
  const stack = [
    {
      category: 'Backend',
      items: [
        { name: 'FastAPI', desc: 'High-performance async Python web framework', reason: 'Native async support for WebSocket incident feeds and real-time metrics streaming', logo: '⚡' },
        { name: 'Neon PostgreSQL', desc: 'Serverless Postgres with branching', reason: 'Zero-config database with instant provisioning and built-in connection pooling', logo: '🐘' },
        { name: 'Pydantic', desc: 'Data validation using Python type hints', reason: 'Type-safe API contracts with automatic OpenAPI schema generation', logo: '✓' },
      ]
    },
    {
      category: 'Frontend',
      items: [
        { name: 'React 18', desc: 'Component-based UI library', reason: 'Concurrent rendering for smooth D3 graph interactions and real-time updates', logo: '⚛️' },
        { name: 'Vite', desc: 'Next-generation frontend tooling', reason: 'Sub-second HMR during development and optimized production builds', logo: '⚡' },
        { name: 'TanStack Query', desc: 'Powerful async state management', reason: 'Automatic request deduplication, caching, and background refetching', logo: '🔄' },
        { name: 'D3.js', desc: 'Data-driven document manipulation', reason: 'Force-directed causation graphs with custom physics and interactive drag', logo: '📊' },
        { name: 'Tailwind CSS', desc: 'Utility-first CSS framework', reason: 'Warm Parchment design system with custom color palette and animations', logo: '🎨' },
      ]
    },
    {
      category: 'Real-time & Data',
      items: [
        { name: 'WebSockets', desc: 'Bidirectional communication protocol', reason: 'Live incident feed with toast notifications pushed from backend', logo: '🔌' },
        { name: 'jsPDF', desc: 'Client-side PDF generation', reason: 'RCA reports generated in-browser with custom typography and branding', logo: '📄' },
      ]
    },
    {
      category: 'Deployment',
      items: [
        { name: 'Railway', desc: 'Backend deployment platform', reason: 'One-click FastAPI deployment with automatic HTTPS and health checks', logo: '🚂' },
        { name: 'Vercel', desc: 'Frontend deployment platform', reason: 'Edge CDN with automatic preview deployments for every Git push', logo: '▲' },
      ]
    }
  ]

  return (
    <div className="bg-parchment min-h-screen p-8">
      <div className="max-w-5xl mx-auto">

        <div className="mb-12 animate-fade-up">
          <div className="inline-flex items-center gap-3 mb-4 px-5 py-2 bg-gradient-to-r from-mahogany to-copper rounded-full">
            <Sparkles size={16} className="text-ivory" />
            <span className="text-ivory text-xs font-mono font-semibold tracking-widest">BUILT FOR PLANETSCALE</span>
          </div>
          <h1 className="font-playfair text-4xl text-mahogany mb-3">Tech Stack</h1>
          <p className="text-stone-500 text-sm leading-relaxed max-w-3xl">
            VitessProbe is built with modern, production-grade technologies chosen specifically for performance, 
            developer experience, and alignment with PlanetScale's engineering culture. Every tool serves a purpose.
          </p>
        </div>

        {stack.map((section, si) => (
          <div 
            key={section.category} 
            className="mb-8 animate-fade-up" 
            style={{animationDelay: `${si * 80}ms`}}
          >
            <h2 className="font-playfair text-2xl text-mahogany mb-4 flex items-center gap-2">
              {section.category}
              <span className="text-xs font-mono text-stone-400 font-normal">
                ({section.items.length} {section.items.length === 1 ? 'technology' : 'technologies'})
              </span>
            </h2>
            <div className="grid gap-3">
              {section.items.map((tech, i) => (
                <div 
                  key={tech.name}
                  className="card p-5 hover-lift group"
                  style={{animationDelay: `${si * 80 + i * 40}ms`}}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center flex-shrink-0 text-2xl border border-stone-200 group-hover:border-copper transition-colors">
                      {tech.logo}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-mahogany group-hover:text-copper transition-colors">
                          {tech.name}
                        </h3>
                      </div>
                      <p className="text-xs text-stone-500 mb-2">{tech.desc}</p>
                      <div className="flex items-start gap-2">
                        <span className="text-copper text-xs mt-0.5">→</span>
                        <p className="text-xs text-stone-600 leading-relaxed">{tech.reason}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="card p-8 bg-gradient-to-br from-mahogany/5 to-copper/5 border-copper/20 animate-fade-up" style={{animationDelay: '320ms'}}>
          <h2 className="font-playfair text-2xl text-mahogany mb-3">Why These Choices?</h2>
          <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
            <p>
              <strong className="text-mahogany">FastAPI + Neon Postgres</strong> mirrors PlanetScale's focus on developer 
              velocity — serverless database provisioning, automatic connection pooling, and async-native APIs mean zero 
              infrastructure overhead.
            </p>
            <p>
              <strong className="text-mahogany">D3 force graphs</strong> demonstrate comfort with complex data visualization, 
              a critical skill for database observability platforms where causation chains need visual clarity.
            </p>
            <p>
              <strong className="text-mahogany">WebSocket live feeds</strong> show real-time systems thinking — the same 
              architectural pattern used in production database monitoring dashboards.
            </p>
            <p>
              <strong className="text-mahogany">Railway + Vercel</strong> prove deployment fluency beyond local development. 
              The platform understands production concerns: health checks, environment variables, CORS, CDN edge caching.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-200 text-center animate-fade-up" style={{animationDelay: '400ms'}}>
          <p className="text-xs text-stone-400 font-mono flex items-center justify-center gap-2">
            <span>View source on</span>
            <a 
              href="https://github.com/sarthakNaikare/vitessprobe" 
              target="_blank" 
              rel="noreferrer"
              className="text-copper hover:underline inline-flex items-center gap-1"
            >
              GitHub <ExternalLink size={10} />
            </a>
          </p>
        </div>

        <p className="fixed bottom-4 right-6 font-playfair italic text-xs text-copper/25 pointer-events-none select-none">
          VitessProbe ✦ Sarthak Naikare
        </p>
      </div>
    </div>
  )
}
