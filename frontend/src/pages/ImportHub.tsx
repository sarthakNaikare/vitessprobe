import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { importApi } from '../api'
import { Upload, FileText, Clipboard, CheckCircle, AlertTriangle } from 'lucide-react'

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
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-stone-800">Data Import Hub</h1>
        <p className="text-sm text-stone-400 font-mono mt-0.5">
          Upload Prometheus scrape dumps, VTGate queryz output, or metric CSVs
        </p>
      </div>

      {/* Supported formats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { name: 'Prometheus JSON', desc: 'Scrape output from /metrics endpoint', ext: '.json' },
          { name: 'VTGate queryz',   desc: 'Output from VTGate /debug/queryz',     ext: '.txt' },
          { name: 'Metric CSV',      desc: 'Time-series metrics in CSV format',     ext: '.csv' },
        ].map(f => (
          <div key={f.name} className="card p-4">
            <p className="text-xs font-mono text-indigo-600 mb-1">{f.ext}</p>
            <p className="text-sm font-medium text-stone-700 mb-1">{f.name}</p>
            <p className="text-xs text-stone-400">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center mb-4 transition-colors cursor-pointer ${
          isDragActive
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-stone-200 hover:border-stone-300 bg-white'
        }`}
      >
        <input {...getInputProps()} />
        <Upload size={28} className="mx-auto text-stone-300 mb-3" />
        <p className="text-sm text-stone-600 mb-1">
          {isDragActive ? 'Drop your file here' : 'Drag and drop a file here'}
        </p>
        <p className="text-xs text-stone-400">or click to browse · JSON, CSV, TXT</p>
      </div>

      {/* Paste input */}
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Clipboard size={13} className="text-stone-400" />
          <p className="text-xs font-medium text-stone-600">Or paste raw text</p>
        </div>
        <textarea
          value={pasteText}
          onChange={e => setPasteText(e.target.value)}
          placeholder="Paste Prometheus JSON, VTGate queryz output, or CSV data here..."
          className="w-full h-32 text-xs font-mono border border-stone-200 rounded-md px-3 py-2 bg-stone-50 focus:outline-none focus:border-indigo-300 resize-none"
        />
        <button
          onClick={handlePaste}
          disabled={!pasteText.trim() || loading}
          className="mt-2 bg-indigo-600 text-white text-xs px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-40"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md mb-4">
          <AlertTriangle size={13} className="text-red-500" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
            <CheckCircle size={14} className="text-green-500" />
            <span className="text-sm font-medium text-stone-700">Parse Result</span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Format', value: result.format_detected },
                { label: 'Rows Parsed', value: result.rows_parsed },
                { label: 'Valid Rows', value: result.rows_valid },
                { label: 'Analysis ID', value: result.analysis_id },
              ].map(({ label, value }) => (
                <div key={label} className="bg-stone-50 rounded-md p-3">
                  <p className="text-2xs text-stone-400 font-mono mb-1">{label}</p>
                  <p className="text-xs font-mono text-stone-700">{value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-600 mb-3">{result.message}</p>
            {result.preview?.length > 0 && (
              <div>
                <p className="text-2xs text-stone-400 font-mono mb-2">PREVIEW (first 5 rows)</p>
                <pre className="bg-stone-900 text-green-400 text-2xs font-mono p-3 rounded-md overflow-auto max-h-40">
                  {JSON.stringify(result.preview, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
