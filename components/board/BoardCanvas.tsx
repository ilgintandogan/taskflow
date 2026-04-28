'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { useBoardStore } from '@/stores/boardStore'
import type { Board, Card } from '@/lib/types'
import { keyBetween } from '@/lib/fractional-index'
import ColumnComponent from './Column'
import CardItem from './Card'
import AddColumnButton from './AddColumnButton'

interface Props {
  board: Board
  initialColumns: import('@/lib/types').Column[]
  initialCards: Card[]
}

export default function BoardCanvas({ board, initialColumns, initialCards }: Props) {
  const { columns, cards, setColumns, setCards, moveCard } = useBoardStore()
  const [activeCard, setActiveCard] = useState<Card | null>(null)

  useEffect(() => {
    setColumns(initialColumns)
    setCards(initialCards)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  const columnIds = useMemo(() => columns.map(c => c.id), [columns])

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === 'card') {
      setActiveCard(event.active.data.current.card)
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeType = active.data.current?.type
    if (activeType !== 'card') return

    const card: Card = active.data.current!.card
    const overId = String(over.id)
    const overType = over.data.current?.type

    let targetColumnId: string
    if (overType === 'column') {
      targetColumnId = overId
    } else if (overType === 'card') {
      targetColumnId = over.data.current!.card.column_id
    } else {
      return
    }

    // Farklı sütuna geçince kartı oraya taşı (anlık görsel güncelleme)
    if (card.column_id !== targetColumnId) {
      const columnCards = cards
        .filter(c => c.column_id === targetColumnId && c.id !== card.id)
        .sort((a, b) => (a.position < b.position ? -1 : 1))
      const last = columnCards[columnCards.length - 1]?.position ?? null
      const newPosition = keyBetween(last, null)
      moveCard(card.id, targetColumnId, newPosition)
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveCard(null)
    const { active, over } = event
    if (!over) return

    const activeType = active.data.current?.type
    if (activeType !== 'card') return

    const card: Card = active.data.current!.card
    const overId = String(over.id)
    const overType = over.data.current?.type

    let targetColumnId: string
    if (overType === 'column') {
      targetColumnId = overId
    } else if (overType === 'card') {
      targetColumnId = over.data.current!.card.column_id
    } else {
      return
    }

    const columnCards = cards
      .filter(c => c.column_id === targetColumnId && c.id !== card.id)
      .sort((a, b) => (a.position < b.position ? -1 : 1))

    let newPosition: string
    if (overType === 'card') {
      const overCard: Card = over.data.current!.card
      const overIndex = columnCards.findIndex(c => c.id === overCard.id)
      const prev = columnCards[overIndex - 1]?.position ?? null
      const next = columnCards[overIndex]?.position ?? null
      newPosition = keyBetween(prev, next)
    } else {
      const last = columnCards[columnCards.length - 1]?.position ?? null
      newPosition = keyBetween(last, null)
    }

    const prevColumnId = card.column_id
    const prevPosition = card.position
    moveCard(card.id, targetColumnId, newPosition)

    fetch(`/api/cards/${card.id}/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column_id: targetColumnId, position: newPosition }),
    }).catch(() => {
      moveCard(card.id, prevColumnId, prevPosition)
    })
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-6">{board.title}</h1>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {columns.map(col => (
              <ColumnComponent key={col.id} column={col} />
            ))}
          </SortableContext>
          <AddColumnButton boardId={board.id} />
        </div>

        <DragOverlay>
          {activeCard && (
            <div className="opacity-90 scale-105 rotate-2">
              <CardItem card={activeCard} overlay />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
