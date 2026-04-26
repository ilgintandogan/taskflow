'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Board } from '@/lib/types'

export default function BoardList({ initialBoards }: { initialBoards: Board[] }) {
  const [boards, setBoards] = useState<Board[]>(initialBoards)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function createBoard(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('boards')
      .insert({ title: newTitle.trim(), owner_id: user!.id })
      .select()
      .single()

    if (!error && data) {
      setBoards(prev => [data, ...prev])
      setNewTitle('')
      setShowForm(false)
    }
    setCreating(false)
  }

  async function deleteBoard(id: string) {
    const supabase = createClient()
    await supabase.from('boards').delete().eq('id', id)
    setBoards(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {boards.map(board => (
          <div key={board.id} className="relative group bg-[#1a1d27] rounded-lg p-4 hover:bg-[#20243a] transition-colors">
            <Link href={`/boards/${board.id}`} className="block">
              <h3 className="font-medium text-white">{board.title}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(board.created_at).toLocaleDateString()}
              </p>
            </Link>
            <button
              onClick={() => deleteBoard(board.id)}
              className="absolute top-2 right-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none"
              aria-label="Delete board"
            >
              ×
            </button>
          </div>
        ))}

        {showForm ? (
          <form onSubmit={createBoard} className="bg-[#1a1d27] rounded-lg p-4">
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Board title"
              className="w-full bg-transparent text-white placeholder-gray-500 outline-none border-b border-gray-600 pb-1 mb-3"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white disabled:opacity-50"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm px-3 py-1 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#1a1d27] rounded-lg p-4 text-gray-500 hover:text-white hover:bg-[#20243a] transition-colors text-left border-2 border-dashed border-gray-700 hover:border-gray-500"
          >
            + New board
          </button>
        )}
      </div>
    </div>
  )
}
