'use client'

import { useState } from 'react'
import { useBoardStore } from '@/stores/boardStore'
import { keyAfter } from '@/lib/fractional-index'
import { initialKey } from '@/lib/fractional-index'

export default function AddCardButton({ columnId }: { columnId: string }) {
  const { cards, addCard } = useBoardStore()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    const columnCards = cards
      .filter(c => c.column_id === columnId)
      .sort((a, b) => (a.position < b.position ? -1 : 1))

    const lastPos = columnCards[columnCards.length - 1]?.position ?? null
    const position = lastPos ? keyAfter(lastPos) : initialKey()

    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column_id: columnId, title: title.trim(), position }),
    })
    const { data } = await res.json()
    if (data) addCard(data)
    setTitle('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mx-2 mb-2 mt-1 text-sm text-gray-500 hover:text-white hover:bg-white/5 rounded px-2 py-1 text-left transition-colors"
      >
        + Add card
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="px-2 pb-2">
      <textarea
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Card title"
        rows={2}
        className="w-full bg-white text-gray-900 text-sm rounded px-2 py-1 resize-none outline-none"
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e as unknown as React.FormEvent)
          }
          if (e.key === 'Escape') setOpen(false)
        }}
      />
      <div className="flex gap-2 mt-1">
        <button
          type="submit"
          className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-gray-400 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
