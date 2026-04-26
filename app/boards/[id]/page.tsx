import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BoardCanvas from '@/components/board/BoardCanvas'

export default async function BoardPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: board } = await supabase
    .from('boards')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!board) notFound()

  const { data: columns } = await supabase
    .from('columns')
    .select('*')
    .eq('board_id', params.id)
    .order('position', { ascending: true })

  const { data: cards } = await supabase
    .from('cards')
    .select('*')
    .in('column_id', (columns ?? []).map(c => c.id))
    .order('position', { ascending: true })

  return (
    <BoardCanvas
      board={board}
      initialColumns={columns ?? []}
      initialCards={cards ?? []}
    />
  )
}
