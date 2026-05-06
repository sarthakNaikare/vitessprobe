import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { incidentApi, reportApi } from '../api'
import { FileText, Loader2, Download, Share2 } from 'lucide-react'
import jsPDF from 'jspdf'

function generatePDF(report: any) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const maxWidth = pageWidth - margin * 2
  let y = 20

  const addText = (text: string, size: number, bold = false, color = [30, 30, 30] as number[]) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(color[0], color[1], color[2])
    const lines = doc.splitTextToSize(text, maxWidth)
    if (y + lines.length * size * 0.5 > 270) {
      doc.addPage()
      y = 20
    }
    doc.text(lines, margin, y)
    y += lines.length * size * 0.45 + 4
  }

  const addDivider = () => {
    doc.setDrawColor(220, 220, 210)
    doc.line(margin, y, pageWidth - margin, y)
    y += 6
  }

  const addSection = (label: string) => {
    y += 4
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(150, 150, 140)
    doc.text(label.toUpperCase(), margin, y)
    y += 6
  }

  // Header
  doc.setFillColor(79, 70, 229)
  doc.rect(0, 0, pageWidth, 14, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('VITESSPROBE — ROOT CAUSE ANALYSIS REPORT', margin, 9)
  doc.text(`Generated ${new Date(report.generated_at).toLocaleString()}`, pageWidth - margin, 9, { align: 'right' })
  y = 26

  // Title
  addText(report.title, 16, true, [30, 27, 75])
  addText(`Audience: ${report.audience.toUpperCase()}  ·  Report ID: ${report.id}`, 8, false, [150, 150, 140])
  y += 2
  addDivider()

  // Executive summary
  addSection('Executive Summary')
  addText(report.executive_summary, 10, false, [50, 50, 50])
  y += 2
  addDivider()

  // Root cause
  addSection('Root Cause Analysis')
  addText(report.root_cause_explanation, 10, false, [50, 50, 50])
  y += 2
  addDivider()

  // Recommendations
  if (report.recommendations?.length > 0) {
    addSection('Recommendations')
    report.recommendations.forEach((r: any, i: number) => {
      addText(`${i + 1}. [${r.priority.toUpperCase()}] ${r.title}`, 10, true, [30, 30, 30])
      addText(r.description, 9, false, [80, 80, 80])
      if (r.vitess_command) {
        addText(`$ ${r.vitess_command}`, 8, false, [79, 70, 229])
      }
      y += 2
    })
    addDivider()
  }

  // Playbook
  if (report.playbook_steps?.length > 0) {
    addSection('Remediation Playbook')
    report.playbook_steps.forEach((s: any) => {
      addText(`Step ${s.step}: ${s.title}`, 10, true, [30, 30, 30])
      addText(s.description, 9, false, [80, 80, 80])
      y += 2
    })
    addDivider()
  }

  // Affected systems
  if (report.affected_systems?.length > 0) {
    addSection('Affected Systems')
    addText(report.affected_systems.join(' · '), 9, false, [80, 80, 80])
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(180, 180, 170)
    doc.text(
      `VitessProbe RCA Report · Page ${i} of ${pageCount} · vitessprobe.vercel.app`,
      pageWidth / 2, 290, { align: 'center' }
    )
  }

  doc.save(`rca-report-${report.id}.pdf`)
}

function generateMarkdown(report: any): string {
  let md = `# ${report.title}\n\n`
  md += `**Generated:** ${new Date(report.generated_at).toLocaleString()}  \n`
  md += `**Audience:** ${report.audience}  \n`
  md += `**Report ID:** ${report.id}\n\n---\n\n`
  md += `## Executive Summary\n\n${report.executive_summary}\n\n---\n\n`
  md += `## Root Cause Analysis\n\n${report.root_cause_explanation}\n\n---\n\n`
  if (report.recommendations?.length > 0) {
    md += `## Recommendations\n\n`
    report.recommendations.forEach((r: any, i: number) => {
      md += `### ${i + 1}. [${r.priority.toUpperCase()}] ${r.title}\n\n`
      md += `${r.description}\n\n`
      if (r.vitess_command) md += `\`\`\`bash\n${r.vitess_command}\n\`\`\`\n\n`
    })
    md += `---\n\n`
  }
  if (report.playbook_steps?.length > 0) {
    md += `## Remediation Playbook\n\n`
    report.playbook_steps.forEach((s: any) => {
      md += `**Step ${s.step}: ${s.title}**\n\n${s.description}\n\n`
    })
  }
  return md
}

export default function ReportGenerator() {
  const [selectedIncident, setSelectedIncident] = useState<string>('')
  const [audience, setAudience] = useState<'technical' | 'executive' | 'mixed'>('technical')
  const [report, setReport] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  const { data: incidents } = useQuery({
    queryKey: ['incidents-all'],
    queryFn: () => incidentApi.list({ limit: 50 }),
  })

  const { mutate: generate, isPending } = useMutation({
    mutationFn: () => reportApi.generate(selectedIncident, audience),
    onSuccess: setReport,
  })

  const copyShareLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/share/report/${report.share_token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `rca-report-${report.id}.json`
    a.click()
  }

  const downloadMarkdown = () => {
    const blob = new Blob([generateMarkdown(report)], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `rca-report-${report.id}.md`
    a.click()
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-stone-800">RCA Report Generator</h1>
        <p className="text-sm text-stone-400 font-mono mt-0.5">
          Generate structured post-mortems from any incident
        </p>
      </div>

      {/* Config */}
      <div className="card p-5 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs font-mono text-stone-400 uppercase tracking-wide mb-2">Select Incident</p>
            <select
              value={selectedIncident}
              onChange={e => setSelectedIncident(e.target.value)}
              className="w-full text-xs border border-stone-200 rounded-md px-3 py-2 text-stone-600 bg-white focus:outline-none focus:border-indigo-300"
            >
              <option value="">Choose an incident...</option>
              {(incidents || []).map(i => (
                <option key={i.id} value={i.id}>
                  [{i.severity.toUpperCase()}] {i.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs font-mono text-stone-400 uppercase tracking-wide mb-2">Audience</p>
            <div className="flex gap-2">
              {(['technical', 'executive', 'mixed'] as const).map(a => (
                <button
                  key={a}
                  onClick={() => setAudience(a)}
                  className={`flex-1 text-xs py-2 rounded-md border capitalize transition-colors ${
                    audience === a
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={() => generate()}
          disabled={!selectedIncident || isPending}
          className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-40"
        >
          {isPending
            ? <><Loader2 size={13} className="animate-spin" /> Generating...</>
            : <><FileText size={13} /> Generate Report</>
          }
        </button>
      </div>

      {/* Report preview */}
      {report && (
        <div className="card overflow-hidden">
          <div className="px-6 py-5 border-b border-stone-100 flex items-start justify-between">
            <div>
              <p className="text-2xs font-mono text-stone-400 mb-1">
                RCA REPORT · {report.audience.toUpperCase()} · {new Date(report.generated_at).toLocaleString()}
              </p>
              <h2 className="text-lg font-semibold text-stone-800">{report.title}</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                onClick={copyShareLink}
                className="flex items-center gap-1.5 text-xs border border-stone-200 px-3 py-1.5 rounded-md hover:bg-stone-50 text-stone-500"
              >
                <Share2 size={11} /> {copied ? 'Copied!' : 'Share'}
              </button>
              <button
                onClick={() => generatePDF(report)}
                className="flex items-center gap-1.5 text-xs bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700"
              >
                <Download size={11} /> PDF
              </button>
              <button
                onClick={downloadMarkdown}
                className="flex items-center gap-1.5 text-xs bg-stone-700 text-white px-3 py-1.5 rounded-md hover:bg-stone-800"
              >
                <Download size={11} /> Markdown
              </button>
              <button
                onClick={downloadJson}
                className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700"
              >
                <Download size={11} /> JSON
              </button>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-6">
            <div>
              <h3 className="text-xs font-mono text-stone-400 uppercase tracking-wide mb-2">Executive Summary</h3>
              <p className="text-sm text-stone-700 leading-relaxed bg-stone-50 rounded-lg p-4 border border-stone-100">
                {report.executive_summary}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-mono text-stone-400 uppercase tracking-wide mb-2">Root Cause</h3>
              <p className="text-sm text-stone-700 leading-relaxed bg-red-50 rounded-lg p-4 border border-red-100">
                {report.root_cause_explanation}
              </p>
            </div>
            {report.recommendations?.length > 0 && (
              <div>
                <h3 className="text-xs font-mono text-stone-400 uppercase tracking-wide mb-2">Recommendations</h3>
                <div className="flex flex-col gap-2">
                  {report.recommendations.map((r: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg border border-stone-100">
                      <span className={`text-2xs font-mono px-1.5 py-0.5 rounded border flex-shrink-0 mt-0.5 ${
                        r.priority === 'immediate' ? 'bg-red-50 text-red-600 border-red-200' :
                        r.priority === 'short_term' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                        'bg-blue-50 text-blue-600 border-blue-200'
                      }`}>{r.priority}</span>
                      <div>
                        <p className="text-xs font-medium text-stone-700 mb-0.5">{r.title}</p>
                        <p className="text-xs text-stone-500">{r.description}</p>
                        {r.vitess_command && (
                          <code className="text-2xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-1 block">
                            {r.vitess_command}
                          </code>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {report.playbook_steps?.length > 0 && (
              <div>
                <h3 className="text-xs font-mono text-stone-400 uppercase tracking-wide mb-2">Remediation Playbook</h3>
                <div className="flex flex-col gap-2">
                  {report.playbook_steps.map((s: any) => (
                    <div key={s.step} className="flex gap-3 p-3 bg-stone-50 rounded-lg border border-stone-100">
                      <span className="text-xs font-mono text-indigo-600 font-medium flex-shrink-0">
                        {String(s.step).padStart(2, '0')}
                      </span>
                      <div>
                        <p className="text-xs font-medium text-stone-700 mb-0.5">{s.title}</p>
                        <p className="text-xs text-stone-500">{s.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
