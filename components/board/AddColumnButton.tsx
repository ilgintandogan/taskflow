'use client'

import { useState } from 'react'
import { useBoardStore } from '@/stores/boardStore'
import { keyAfter, initialKey } from '@/lib/fractional-index'

export default function AddColumnButton({ boardId }: { boardId: string }) {
  const { columns, addColumn } = useBoardStore()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    const sorted = [...columns].sort((a, b) => (a.position < b.position ? -1 : 1))
    const lastPos = sorted[sorted.length - 1]?.position ?? null
    const position = lastPos ? keyAfter(lastPos) : initialKey()

    const res = await fetch('/api/columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ board_id: boardId, title: title.trim(), position }),
    })
    const { data } = await res.json()
    if (data) addColumn(data)
    setTitle('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="min-w-[240px] h-fit bg-white/5 hover:bg-white/10 rounded-lg px-4 py-3 text-gray-400 hover:text-white text-sm transition-colors border-2 border-dashed border-gray-700 hover:border-gray-500"
      >
        + Add column
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="min-w-[280px] bg-[#1a1d27] rounded-lg p-3"
    >
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Column title"
        className="w-full bg-transparent text-white placeholder-gray-500 outline-none border-b border-gray-600 pb-1 mb-3"
        onKeyDown={e => e.key === 'Escape' && setOpen(false)}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-gray-400 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
