import { createClient } from '@/lib/supabase/server'
import BoardList from '@/components/board/BoardList'

export default async function BoardsPage() {
  const supabase = createClient()
  const { data: boards } = await supabase
    .from('boards')
    .select('id, title, created_at, owner_id')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">My Boards</h2>
      <BoardList initialBoards={boards ?? []} />
    </div>
  )
}
