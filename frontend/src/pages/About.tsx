import { ExternalLink, Briefcase, Code2 } from 'lucide-react'

export default function About() {
  const projects = [
    {
      name: 'SENTINEL',
      desc: 'TimescaleDB-native threat intelligence engine with .NET 8 API, React dashboard, and Electron desktop installer',
      tech: 'TimescaleDB · .NET 8 · React · Electron',
      link: 'https://github.com/sarthakNaikare/sentinel'
    },
    {
      name: 'Stellar Observatory',
      desc: 'PostgreSQL query performance observatory with EXPLAIN ANALYZE visualization and 8s→200ms optimization workflows',
      tech: 'PostgreSQL · FastAPI · D3.js',
      link: '#'
    },
    {
      name: 'Resonance',
      desc: 'Real-time data pipeline for high-frequency event streaming with Apache Kafka and TimescaleDB continuous aggregates',
      tech: 'Kafka · TimescaleDB · FastAPI',
      link: '#'
    },
    {
      name: 'Prometheus Unbound',
      desc: 'Distributed metrics aggregation system with TimescaleDB compression and multi-tenant query routing',
      tech: 'TimescaleDB · Prometheus · Go',
      link: '#'
    }
  ]

  return (
    <div className="bg-parchment min-h-screen p-8">
      <div className="max-w-4xl mx-auto">

        <div className="mb-12 animate-fade-up">
          <h1 className="font-playfair text-4xl text-mahogany mb-3">About VitessProbe</h1>
          <p className="text-stone-500 text-sm leading-relaxed max-w-2xl">
            An autonomous Vitess cluster intelligence platform built to demonstrate production-grade database observability, 
            real-time incident detection, and root cause analysis for distributed systems.
          </p>
        </div>

        <div className="card p-8 mb-6 animate-fade-up" style={{animationDelay: '60ms'}}>
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-mahogany to-copper flex items-center justify-center flex-shrink-0">
              <Code2 size={32} className="text-ivory" />
            </div>
            <div className="flex-1">
              <h2 className="font-playfair text-2xl text-mahogany mb-2">
                <a 
                  href="https://sarthak-naikare.vercel.app" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-copper transition-colors inline-flex items-center gap-2"
                >
                  Sarthak Naikare
                  <ExternalLink size={16} />
                </a>
              </h2>
              <p className="text-sm text-stone-600 mb-4 leading-relaxed">
                Computer Science Engineering graduate (MIT ADT University, Pune, 2025) specializing in PostgreSQL, 
                TimescaleDB, Apache Kafka, and real-time data pipelines. Building a portfolio of three TimescaleDB-focused 
                projects targeting database infrastructure roles at PlanetScale.
              </p>
              <div className="flex items-center gap-3">
                <a 
                  href="https://github.com/sarthakNaikare" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs border border-stone-200 px-3 py-1.5 rounded-md hover:bg-amber-50 hover:border-copper text-stone-500 hover:text-copper transition-colors font-mono"
                >
                  <ExternalLink size={12} /> GitHub
                </a>
                <a 
                  href="https://linkedin.com/in/sarthak-naikare" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs border border-stone-200 px-3 py-1.5 rounded-md hover:bg-amber-50 hover:border-copper text-stone-500 hover:text-copper transition-colors font-mono"
                >
                  <ExternalLink size={12} /> LinkedIn
                </a>
                <a 
                  href="https://sarthak-naikare.vercel.app" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs bg-mahogany text-ivory px-3 py-1.5 rounded-md hover:bg-copper transition-colors font-mono"
                >
                  <Briefcase size={12} /> Portfolio
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 animate-fade-up" style={{animationDelay: '120ms'}}>
          <h2 className="font-playfair text-2xl text-mahogany mb-3">Why VitessProbe?</h2>
          <p className="text-sm text-stone-600 leading-relaxed mb-3">
            VitessProbe was born from a simple observation: Vitess powers some of the world's largest MySQL deployments, 
            yet observability tooling often lags behind the sophistication of the database itself. This project bridges that gap.
          </p>
          <p className="text-sm text-stone-600 leading-relaxed">
            Built as part of a three-project portfolio demonstrating deep expertise in TimescaleDB and distributed database 
            systems, VitessProbe showcases real-time incident detection, D3-powered causation graphs, WebSocket live feeds, 
            and production-grade RCA report generation — all backed by FastAPI and React.
          </p>
        </div>

        <div className="animate-fade-up" style={{animationDelay: '180ms'}}>
          <h2 className="font-playfair text-2xl text-mahogany mb-4">Other Projects</h2>
          <div className="grid gap-3">
            {projects.map((project, i) => (
              <div 
                key={project.name} 
                className="card p-5 hover-lift group"
                style={{animationDelay: `${240 + i * 60}ms`}}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-semibold text-mahogany group-hover:text-copper transition-colors">
                    {project.name}
                  </h3>
                  {project.link !== '#' && (
                    <a 
                      href={project.link} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-stone-400 hover:text-copper transition-colors"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
                <p className="text-xs text-stone-600 mb-2 leading-relaxed">{project.desc}</p>
                <p className="text-xs font-mono text-copper">{project.tech}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-200 text-center animate-fade-up" style={{animationDelay: '480ms'}}>
          <p className="text-xs text-stone-400 font-mono">
            VitessProbe · Built with FastAPI, React, Neon PostgreSQL, and D3.js
          </p>
          <p className="text-xs text-stone-400 font-mono mt-1">
            © 2025 Sarthak Naikare · MIT ADT University, Pune
          </p>
        </div>

        <p className="fixed bottom-4 right-6 font-playfair italic text-xs text-copper/25 pointer-events-none select-none">
          VitessProbe ✦ Sarthak Naikare
        </p>
      </div>
    </div>
  )
}
