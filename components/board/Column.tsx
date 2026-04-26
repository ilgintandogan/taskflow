'use client'

import { useMemo, useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { useBoardStore } from '@/stores/boardStore'
import type { Column as ColumnType } from '@/lib/types'
import CardItem from './Card'
import AddCardButton from './AddCardButton'

interface Props {
  column: ColumnType
}

export default function Column({ column }: Props) {
  const { cards, updateColumn, removeColumn } = useBoardStore()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(column.title)

  const columnCards = useMemo(
    () =>
      cards
        .filter(c => c.column_id === column.id)
        .sort((a, b) => (a.position < b.position ? -1 : 1)),
    [cards, column.id]
  )

  const cardIds = useMemo(() => columnCards.map(c => c.id), [columnCards])

  const { setNodeRef } = useDroppable({
    id: column.id,
    data: { type: 'column', column },
  })

  async function saveTitle() {
    setEditing(false)
    if (title === column.title) return
    updateColumn(column.id, { title })
    await fetch('/api/columns', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: column.id, title }),
    })
  }

  async function handleDelete() {
    removeColumn(column.id)
    await fetch(`/api/columns?id=${column.id}`, { method: 'DELETE' })
  }

  return (
    <div className="min-w-[280px] max-w-[280px] flex flex-col bg-[#1a1d27] rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => e.key === 'Enter' && saveTitle()}
            className="bg-transparent text-white font-medium outline-none border-b border-gray-500 w-full"
          />
        ) : (
          <h3
            className="font-medium text-white cursor-pointer hover:text-gray-300"
            onClick={() => setEditing(true)}
          >
            {column.title}
          </h3>
        )}
        <button
          onClick={handleDelete}
          className="text-gray-600 hover:text-red-400 ml-2 text-lg leading-none"
          aria-label="Delete column"
        >
          ×
        </button>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className="flex flex-col gap-2 px-2 py-1 min-h-[4rem] flex-1"
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {columnCards.map(card => (
            <CardItem key={card.id} card={card} />
          ))}
        </SortableContext>
      </div>

      <AddCardButton columnId={column.id} />
    </div>
  )
}
