import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { importApi } from '../api'
import { Upload, Clipboard, CheckCircle, AlertTriangle, Package } from 'lucide-react'

export default function ImportHub() {
  const [pasteText, setPasteText] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return
    setLoading(true)
    setError('')
    try {
      const res = await importApi.upload(files[0])
      setResult(res)
    } catch {
      setError('Upload failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/*': ['.json', '.csv', '.txt'] },
    maxFiles: 1,
  })

  const handlePaste = async () => {
    if (!pasteText.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await importApi.paste(pasteText)
      setResult(res)
    } catch {
      setError('Parse failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-import min-h-screen p-8">
      <div className="max-w-4xl">

        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-3 mb-1">
            <Package size={18} className="text-copper" />
            <h1 className="font-playfair text-2xl text-mahogany">Data Import Hub</h1>
          </div>
          <p className="text-sm font-mono text-stone-400 ml-7">
            Upload Prometheus scrape dumps, VTGate queryz output, or metric CSVs
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { name: 'Prometheus JSON', desc: 'Scrape output from /metrics endpoint', ext: '.json' },
            { name: 'VTGate queryz',   desc: 'Output from VTGate /debug/queryz',     ext: '.txt' },
            { name: 'Metric CSV',      desc: 'Time-series metrics in CSV format',     ext: '.csv' },
          ].map((f, i) => (
            <div key={f.name} className="card p-4 hover-lift animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <p className="text-xs font-mono text-copper mb-1 font-semibold">{f.ext}</p>
              <p className="text-sm font-semibold text-mahogany mb-1">{f.name}</p>
              <p className="text-xs text-stone-400">{f.desc}</p>
            </div>
          ))}
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-10 text-center mb-4 transition-colors cursor-pointer animate-fade-up ${
            isDragActive
              ? 'border-copper bg-amber-50'
              : 'border-stone-200 hover:border-copper bg-ivory'
          }`}
          style={{ animationDelay: '180ms' }}
        >
          <input {...getInputProps()} />
          <Upload size={28} className={`mx-auto mb-3 transition-colors ${isDragActive ? 'text-copper' : 'text-stone-300'}`} />
          <p className="text-sm text-mahogany mb-1 font-medium">
            {isDragActive ? 'Drop your file here' : 'Drag and drop a file here'}
          </p>
          <p className="text-xs text-stone-400 font-mono">or click to browse · JSON, CSV, TXT</p>
        </div>

        <div className="card p-5 mb-4 animate-fade-up" style={{ animationDelay: '240ms' }}>
          <div className="flex items-center gap-2 mb-3">
            <Clipboard size={13} className="text-copper" />
            <p className="text-xs font-medium text-mahogany">Or paste raw text</p>
          </div>
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder="Paste Prometheus JSON, VTGate queryz output, or CSV data here..."
            className="w-full h-32 text-xs font-mono border border-stone-200 rounded-md px-3 py-2 bg-parchment focus:outline-none focus:border-copper resize-none placeholder-stone-300"
          />
          <button
            onClick={handlePaste}
            disabled={!pasteText.trim() || loading}
            className="mt-2 bg-mahogany text-ivory text-xs px-4 py-2 rounded-md hover:bg-copper transition-colors disabled:opacity-40 font-medium tracking-wide"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md mb-4 animate-scale-in">
            <AlertTriangle size={13} className="text-alert" />
            <p className="text-xs text-alert font-mono">{error}</p>
          </div>
        )}

        {result && (
          <div className="card overflow-hidden animate-scale-in">
            <div className="px-5 py-4 border-b border-stone-200 bg-parchment flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-500" />
              <span className="text-sm font-semibold text-mahogany">Parse Result</span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Format', value: result.format_detected },
                  { label: 'Rows Parsed', value: result.rows_parsed },
                  { label: 'Valid Rows', value: result.rows_valid },
                  { label: 'Analysis ID', value: result.analysis_id },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-parchment rounded-md p-3 border border-stone-100">
                    <p className="text-xs text-stone-400 font-mono mb-1">{label}</p>
                    <p className="text-xs font-mono text-mahogany font-semibold">{value}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-stone-600 mb-3">{result.message}</p>
              {result.preview?.length > 0 && (
                <div>
                  <p className="text-xs text-stone-400 font-mono mb-2 uppercase tracking-widest">Preview (first 5 rows)</p>
                  <pre className="bg-mahogany text-amber-100 text-xs font-mono p-3 rounded-md overflow-auto max-h-40">
{JSON.stringify(result.preview, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="fixed bottom-4 right-6 font-playfair italic text-xs text-copper/25 pointer-events-none select-none">
          VitessProbe ✦ Sarthak Naikare
        </p>
      </div>
    </div>
  )
}
