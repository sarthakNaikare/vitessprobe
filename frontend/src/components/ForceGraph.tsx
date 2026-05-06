import { useEffect, useRef, useState } from 'react'

interface Node {
  id: string
  component: string
  event_type: string
  description: string
  is_root_cause: boolean
  confidence: number
  occurred_at: string
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

interface Edge {
  source: string | Node
  target: string | Node
  relationship: string
  confidence: number
}

interface Props {
  nodes: Node[]
  edges: Edge[]
  root_cause_node_id: string
  onNodeClick: (node: Node) => void
}

export default function ForceGraph({ nodes, edges, onNodeClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>()
  const stateRef = useRef<{ nodes: Node[], edges: Edge[], dragging: Node | null, pulse: number }>({
    nodes: [], edges: [], dragging: null, pulse: 0
  })

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !nodes.length) return
    const canvas = canvasRef.current
    const container = containerRef.current
    const ctx = canvas.getContext('2d')!

    // High-DPI setup
    const dpr = window.devicePixelRatio || 2
    const W = container.offsetWidth
    const H = 420
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    ctx.scale(dpr, dpr)

    // Position nodes in a nice layout
    const nodeMap = new Map<string, Node>()
    const simNodes: Node[] = nodes.map((n, i) => {
      const cols = Math.ceil(Math.sqrt(nodes.length))
      const row = Math.floor(i / cols)
      const col = i % cols
      const spacingX = W / (cols + 1)
      const spacingY = H / (Math.ceil(nodes.length / cols) + 1)
      const node: Node = {
        ...n,
        x: spacingX * (col + 1) + (Math.random() - 0.5) * 30,
        y: spacingY * (row + 1) + (Math.random() - 0.5) * 30,
        vx: 0,
        vy: 0,
        fx: null,
        fy: null,
      }
      nodeMap.set(n.id, node)
      return node
    })

    const simEdges: Edge[] = edges.map(e => ({
      ...e,
      source: nodeMap.get(e.source as string) || simNodes[0],
      target: nodeMap.get(e.target as string) || simNodes[0],
    }))

    stateRef.current = { nodes: simNodes, edges: simEdges, dragging: null, pulse: 0 }

    const NODE_R = 32

    const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + r)
      ctx.lineTo(x + w, y + h - r)
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      ctx.lineTo(x + r, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
    }

    const tick = () => {
      const { nodes: sn, edges: se } = stateRef.current
      stateRef.current.pulse += 0.05

      // Forces
      for (let i = 0; i < sn.length; i++) {
        for (let j = i + 1; j < sn.length; j++) {
          const a = sn[i], b = sn[j]
          const dx = (b.x || 0) - (a.x || 0)
          const dy = (b.y || 0) - (a.y || 0)
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const strength = Math.max(0, 5000 / (dist * dist) - 0.5)
          const fx = (dx / dist) * strength * 0.08
          const fy = (dy / dist) * strength * 0.08
          if (!a.fx) { a.vx = (a.vx || 0) - fx; a.vy = (a.vy || 0) - fy }
          if (!b.fx) { b.vx = (b.vx || 0) + fx; b.vy = (b.vy || 0) + fy }
        }
      }

      se.forEach(e => {
        const s = e.source as Node, t = e.target as Node
        const dx = (t.x || 0) - (s.x || 0)
        const dy = (t.y || 0) - (s.y || 0)
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const target = 180
        const force = (dist - target) * 0.04
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        if (!s.fx) { s.vx = (s.vx || 0) + fx; s.vy = (s.vy || 0) + fy }
        if (!t.fx) { t.vx = (t.vx || 0) - fx; t.vy = (t.vy || 0) - fy }
      })

      sn.forEach(n => {
        if (n.fx !== null && n.fx !== undefined) { n.x = n.fx; n.y = n.fy! ; return }
        n.vx = ((n.vx || 0) + (W / 2 - (n.x || 0)) * 0.008) * 0.85
        n.vy = ((n.vy || 0) + (H / 2 - (n.y || 0)) * 0.008) * 0.85
        n.x = (n.x || 0) + (n.vx || 0)
        n.y = (n.y || 0) + (n.vy || 0)
        n.x = Math.max(NODE_R + 10, Math.min(W - NODE_R - 10, n.x))
        n.y = Math.max(NODE_R + 10, Math.min(H - NODE_R - 10, n.y))
      })

      // Draw
      ctx.clearRect(0, 0, W, H)

      // Background grid (subtle)
      ctx.strokeStyle = 'rgba(0,0,0,0.03)'
      ctx.lineWidth = 1
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }

      // Edges
      se.forEach(e => {
        const s = e.source as Node, t = e.target as Node
        if (!s.x || !t.x) return
        const angle = Math.atan2((t.y || 0) - (s.y || 0), (t.x || 0) - (s.x || 0))
        const startX = (s.x || 0) + Math.cos(angle) * NODE_R
        const startY = (s.y || 0) + Math.sin(angle) * NODE_R
        const endX = (t.x || 0) - Math.cos(angle) * (NODE_R + 8)
        const endY = (t.y || 0) - Math.sin(angle) * (NODE_R + 8)

        // Gradient line
        const grad = ctx.createLinearGradient(startX, startY, endX, endY)
        grad.addColorStop(0, 'rgba(99,102,241,0.3)')
        grad.addColorStop(1, 'rgba(99,102,241,0.6)')
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5 + (e.confidence as number) * 1.5
        if ((e.relationship as string) === 'amplified') ctx.setLineDash([6, 4])
        else ctx.setLineDash([])
        ctx.stroke()
        ctx.setLineDash([])

        // Arrowhead
        ctx.beginPath()
        ctx.moveTo(endX, endY)
        ctx.lineTo(endX - 10 * Math.cos(angle - 0.4), endY - 10 * Math.sin(angle - 0.4))
        ctx.lineTo(endX - 10 * Math.cos(angle + 0.4), endY - 10 * Math.sin(angle + 0.4))
        ctx.closePath()
        ctx.fillStyle = 'rgba(99,102,241,0.7)'
        ctx.fill()

        // Relationship label
        const mx = (startX + endX) / 2, my = (startY + endY) / 2
        ctx.save()
        ctx.translate(mx, my)
        const labelAngle = Math.abs(angle) > Math.PI / 2 ? angle + Math.PI : angle
        ctx.rotate(labelAngle)
        ctx.font = '600 9px Inter, system-ui, sans-serif'
        ctx.fillStyle = '#6366F1'
        ctx.textAlign = 'center'
        ctx.fillText(e.relationship as string, 0, -6)
        ctx.restore()
      })

      // Nodes
      sn.forEach(n => {
        if (!n.x || !n.y) return
        const isRoot = n.is_root_cause
        const pulse = stateRef.current.pulse

        // Outer pulse ring for root cause
        if (isRoot) {
          const pulseR = NODE_R + 8 + Math.sin(pulse) * 6
          ctx.beginPath()
          ctx.arc(n.x, n.y, pulseR, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(220,38,38,${0.15 + Math.sin(pulse) * 0.1})`
          ctx.lineWidth = 2
          ctx.stroke()
        }

        // Shadow
        ctx.shadowColor = isRoot ? 'rgba(220,38,38,0.2)' : 'rgba(0,0,0,0.08)'
        ctx.shadowBlur = 12
        ctx.shadowOffsetY = 4

        // Node circle
        ctx.beginPath()
        ctx.arc(n.x, n.y, NODE_R, 0, Math.PI * 2)
        if (isRoot) {
          const grad = ctx.createRadialGradient(n.x, n.y - 8, 2, n.x, n.y, NODE_R)
          grad.addColorStop(0, '#FFF5F5')
          grad.addColorStop(1, '#FEE2E2')
          ctx.fillStyle = grad
        } else {
          const grad = ctx.createRadialGradient(n.x, n.y - 8, 2, n.x, n.y, NODE_R)
          grad.addColorStop(0, '#FFFFFF')
          grad.addColorStop(1, '#F5F5F0')
          ctx.fillStyle = grad
        }
        ctx.fill()
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetY = 0

        ctx.strokeStyle = isRoot ? '#DC2626' : '#D4D3CB'
        ctx.lineWidth = isRoot ? 2 : 1.5
        ctx.stroke()

        // Icon area (top colored strip)
        ctx.beginPath()
        ctx.arc(n.x, n.y, NODE_R, Math.PI, 0)
        ctx.fillStyle = isRoot ? 'rgba(220,38,38,0.08)' : 'rgba(99,102,241,0.05)'
        ctx.fill()

        // Component text
        const label = n.component.replace('vttablet-zone1-', '').replace('zone1-', '').replace('mysql-', '')
        const shortLabel = label.length > 11 ? label.slice(0, 11) + '…' : label
        ctx.font = `600 9px Inter, system-ui, sans-serif`
        ctx.fillStyle = isRoot ? '#DC2626' : '#3D3D37'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(shortLabel, n.x, n.y - 8)

        // Event type
        ctx.font = `400 7.5px Inter, system-ui, sans-serif`
        ctx.fillStyle = '#79786F'
        ctx.fillText(n.event_type.replace(/_/g, ' '), n.x, n.y + 5)

        // Confidence badge
        ctx.font = `500 7px Inter, system-ui, sans-serif`
        ctx.fillStyle = isRoot ? '#DC2626' : '#A8A79F'
        ctx.fillText(`${Math.round(n.confidence * 100)}%`, n.x, n.y + 17)
      })

      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)

    // Stop simulation after 4s but keep last frame
    setTimeout(() => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }, 4000)

    // Events
    const getPos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const findNode = (mx: number, my: number) =>
      stateRef.current.nodes.find(n => {
        const dx = mx - (n.x || 0), dy = my - (n.y || 0)
        return Math.sqrt(dx * dx + dy * dy) < NODE_R
      })

    canvas.addEventListener('click', e => {
      const { x, y } = getPos(e)
      const n = findNode(x, y)
      if (n) onNodeClick(n)
    })

    canvas.addEventListener('mousedown', e => {
      const { x, y } = getPos(e)
      const n = findNode(x, y)
      if (n) { stateRef.current.dragging = n; n.fx = n.x; n.fy = n.y }
    })

    canvas.addEventListener('mousemove', e => {
      const { x, y } = getPos(e)
      const n = findNode(x, y)
      canvas.style.cursor = n ? 'pointer' : 'default'
      const d = stateRef.current.dragging
      if (d) { d.fx = x; d.fy = y; d.x = x; d.y = y }
    })

    canvas.addEventListener('mouseup', () => {
      const d = stateRef.current.dragging
      if (d) { d.fx = null; d.fy = null }
      stateRef.current.dragging = null
    })

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [nodes, edges])

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
}
