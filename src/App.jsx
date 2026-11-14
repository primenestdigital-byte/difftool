import React, { useMemo, useState } from 'react'
import { diffLines, diffWordsWithSpace } from 'diff'

const OLD_SAMPLE = `function greet(name) {
  console.log("Hello, " + name)
  return "Hello, " + name
}

const users = ["alice", "bob"]
users.forEach(u => greet(u))
`

const NEW_SAMPLE = `function greet(name, punctuation = "!") {
  const msg = \`Hello, \${name}\${punctuation}\`
  console.log(msg)
  return msg
}

const users = ["alice", "bob", "carol"]
users.forEach(u => greet(u, "!!"))
`

function WordDiff({ parts, type }) {
  return (
    <>
      {parts.map((p, i) => {
        if (p.added && type === 'add') return <span key={i} className="word-add">{p.value}</span>
        if (p.removed && type === 'del') return <span key={i} className="word-del">{p.value}</span>
        if (p.added || p.removed) return null
        return <span key={i}>{p.value}</span>
      })}
    </>
  )
}

export default function App() {
  const [oldText, setOldText] = useState(OLD_SAMPLE)
  const [newText, setNewText] = useState(NEW_SAMPLE)
  const [view, setView] = useState('side') // 'side' | 'unified'

  const { rows, stats } = useMemo(() => {
    const parts = diffLines(oldText, newText)
    const rows = []
    let oldLine = 0, newLine = 0
    let adds = 0, dels = 0
    for (const part of parts) {
      const lines = part.value.replace(/\n$/, '').split('\n')
      if (part.added) {
        adds += lines.length
        for (const line of lines) {
          newLine++
          rows.push({ type: 'add', newLine, line, words: diffWordsWithSpace(oldText, line) })
        }
      } else if (part.removed) {
        dels += lines.length
        for (const line of lines) {
          oldLine++
          rows.push({ type: 'del', oldLine, line })
        }
      } else {
        for (const line of lines) {
          oldLine++; newLine++
          rows.push({ type: 'same', oldLine, newLine, line })
        }
      }
    }
    return { rows, stats: { adds, dels, same: rows.filter(r => r.type === 'same').length } }
  }, [oldText, newText])

  // word-level diff pairs for side-by-side view
  const sideRows = useMemo(() => {
    const out = []
    let i = 0
    while (i < rows.length) {
      const r = rows[i]
      if (r.type === 'del') {
        // collect run of dels followed by adds
        const dels = []
        while (i < rows.length && rows[i].type === 'del') dels.push(rows[i++])
        const adds = []
        while (i < rows.length && rows[i].type === 'add') adds.push(rows[i++])
        const n = Math.max(dels.length, adds.length)
        for (let k = 0; k < n; k++) {
          out.push({
            left: dels[k] ?? null,
            right: adds[k] ?? null,
            wordDiff: dels[k] && adds[k] ? diffWordsWithSpace(dels[k].line, adds[k].line) : null,
          })
        }
      } else if (r.type === 'add') {
        out.push({ left: null, right: r, wordDiff: null })
        i++
      } else {
        out.push({ left: r, right: r, wordDiff: null })
        i++
      }
    }
    return out
  }, [rows])

  const copyPatch = () => {
    const parts = diffLines(oldText, newText)
    let patch = ''
    for (const p of parts) {
      const prefix = p.added ? '+' : p.removed ? '-' : ' '
      for (const line of p.value.replace(/\n$/, '').split('\n')) {
        patch += prefix + line + '\n'
      }
    }
    navigator.clipboard.writeText(patch).catch(() => {})
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Diff<span style={{ color: 'var(--accent)' }}>Tool</span></h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            <span style={{ color: 'var(--add-fg)' }}>+{stats.adds}</span>
            {' · '}
            <span style={{ color: 'var(--del-fg)' }}>−{stats.dels}</span>
            {' · '}
            {stats.same} unchanged
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-lg p-1" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {[['side', 'side-by-side'], ['unified', 'unified']].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)}
                className="rounded-md px-3 py-1 text-xs"
                style={{
                  background: view === v ? 'var(--accent)' : 'transparent',
                  color: view === v ? '#101418' : 'var(--muted)',
                  fontWeight: view === v ? 600 : 400,
                }}>{label}</button>
            ))}
          </div>
          <button onClick={copyPatch} className="rounded-lg px-3 py-1.5 text-xs" style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>
            copy patch
          </button>
        </div>
      </header>

      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <label className="pane p-3">
          <span className="mb-1.5 block text-xs uppercase tracking-widest" style={{ color: 'var(--del-fg)' }}>original</span>
          <textarea value={oldText} onChange={e => setOldText(e.target.value)}
            className="mono h-44 w-full resize-y rounded-lg border bg-transparent p-2.5 text-sm outline-none"
            style={{ borderColor: 'var(--border)' }} spellCheck={false} />
        </label>
        <label className="pane p-3">
          <span className="mb-1.5 block text-xs uppercase tracking-widest" style={{ color: 'var(--add-fg)' }}>changed</span>
          <textarea value={newText} onChange={e => setNewText(e.target.value)}
            className="mono h-44 w-full resize-y rounded-lg border bg-transparent p-2.5 text-sm outline-none"
            style={{ borderColor: 'var(--border)' }} spellCheck={false} />
        </label>
      </div>

      {view === 'side' ? (
        <div className="pane overflow-hidden">
          <div className="grid grid-cols-2" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>
            <div className="border-r px-3 py-1.5 text-xs uppercase tracking-widest" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>original</div>
            <div className="px-3 py-1.5 text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>changed</div>
            {sideRows.map((r, i) => (
              <React.Fragment key={i}>
                <div className={`diff-row border-t px-3 py-1 ${r.left?.type === 'del' ? 'line-del' : ''}`}
                  style={{ borderColor: 'var(--border)', animationDelay: `${Math.min(i * 8, 400)}ms` }}>
                  <span className="mr-3 inline-block w-8 select-none text-right" style={{ color: 'var(--muted)', opacity: 0.6 }}>
                    {r.left?.oldLine ?? ''}
                  </span>
                  <span className="whitespace-pre-wrap">{r.left ? (r.wordDiff ? <WordDiff parts={r.wordDiff} type="del" /> : r.left.line) : ' '}</span>
                </div>
                <div className={`diff-row border-t px-3 py-1 ${r.right?.type === 'add' ? 'line-add' : ''}`}
                  style={{ borderColor: 'var(--border)' }}>
                  <span className="mr-3 inline-block w-8 select-none text-right" style={{ color: 'var(--muted)', opacity: 0.6 }}>
                    {r.right?.newLine ?? ''}
                  </span>
                  <span className="whitespace-pre-wrap">{r.right ? (r.wordDiff ? <WordDiff parts={r.wordDiff} type="add" /> : r.right.line) : ' '}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : (
        <div className="pane mono overflow-hidden text-[13px]">
          {rows.map((r, i) => (
            <div key={i} className={`diff-row flex border-t px-3 py-1 ${r.type === 'del' ? 'line-del' : r.type === 'add' ? 'line-add' : ''}`}
              style={{ borderColor: 'var(--border)', animationDelay: `${Math.min(i * 8, 400)}ms` }}>
              <span className="mr-3 w-14 select-none text-right" style={{ color: 'var(--muted)', opacity: 0.6 }}>
                {r.type === 'del' ? `-${r.oldLine}` : r.type === 'add' ? `+${r.newLine}` : ` ${r.oldLine}`}
              </span>
              <span className="mr-3 w-3 select-none" style={{ color: r.type === 'del' ? 'var(--del-fg)' : r.type === 'add' ? 'var(--add-fg)' : 'transparent' }}>
                {r.type === 'del' ? '−' : r.type === 'add' ? '+' : ' '}
              </span>
              <span className="whitespace-pre-wrap">{r.line || ' '}</span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-5 text-center text-xs" style={{ color: 'var(--muted)' }}>
        line diff + word-level highlights within changed pairs · "copy patch" puts a unified diff on your clipboard
      </p>
    </div>
  )
}
