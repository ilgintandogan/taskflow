import { create } from 'zustand'
import type { Column, Card } from '@/lib/types'

interface BoardState {
  columns: Column[]
  cards: Card[]
  setColumns: (columns: Column[]) => void
  setCards: (cards: Card[]) => void
  addColumn: (column: Column) => void
  updateColumn: (id: string, patch: Partial<Column>) => void
  removeColumn: (id: string) => void
  addCard: (card: Card) => void
  updateCard: (id: string, patch: Partial<Card>) => void
  removeCard: (id: string) => void
  moveCard: (cardId: string, newColumnId: string, newPosition: string) => void
}

export const useBoardStore = create<BoardState>((set) => ({
  columns: [],
  cards: [],

  setColumns: (columns) => set({ columns }),
  setCards: (cards) => set({ cards }),

  addColumn: (column) =>
    set(state => ({ columns: [...state.columns, column] })),

  updateColumn: (id, patch) =>
    set(state => ({
      columns: state.columns.map(c => (c.id === id ? { ...c, ...patch } : c)),
    })),

  removeColumn: (id) =>
    set(state => ({
      columns: state.columns.filter(c => c.id !== id),
      cards: state.cards.filter(c => c.column_id !== id),
    })),

  addCard: (card) =>
    set(state => ({ cards: [...state.cards, card] })),

  updateCard: (id, patch) =>
    set(state => ({
      cards: state.cards.map(c => (c.id === id ? { ...c, ...patch } : c)),
    })),

  removeCard: (id) =>
    set(state => ({ cards: state.cards.filter(c => c.id !== id) })),

  moveCard: (cardId, newColumnId, newPosition) =>
    set(state => ({
      cards: state.cards.map(c =>
        c.id === cardId
          ? { ...c, column_id: newColumnId, position: newPosition }
          : c
      ),
    })),
}))
