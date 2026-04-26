'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card } from '@/lib/types'
import { useBoardStore } from '@/stores/boardStore'
import CardDetailModal from '../modals/CardDetailModal'

interface Props {
  card: Card
  overlay?: boolean
}

export default function CardItem({ card, overlay = false }: Props) {
  const { removeCard } = useBoardStore()
  const [showModal, setShowModal] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: 'card', card },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    removeCard(card.id)
    await fetch(`/api/cards?id=${card.id}`, { method: 'DELETE' })
  }

  if (overlay) {
    return (
      <div className="bg-white text-gray-900 rounded-md px-3 py-2 shadow-lg ring-2 ring-blue-500 text-sm font-medium">
        {card.title}
      </div>
    )
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setShowModal(true)}
        className="group bg-white text-gray-900 rounded-md px-3 py-2 shadow-sm hover:ring-2 hover:ring-blue-500 cursor-grab active:cursor-grabbing relative"
      >
        <p className="text-sm font-medium pr-5">{card.title}</p>
        {card.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{card.description}</p>
        )}
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={handleDelete}
          className="absolute top-1 right-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-base leading-none"
          aria-label="Delete card"
        >
          ×
        </button>
      </div>

      {showModal && (
        <CardDetailModal card={card} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
