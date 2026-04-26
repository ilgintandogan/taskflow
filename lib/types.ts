export interface Board {
  id: string
  owner_id: string
  title: string
  created_at: string
}

export interface Column {
  id: string
  board_id: string
  title: string
  position: string
  created_at: string
}

export interface Card {
  id: string
  column_id: string
  title: string
  description: string | null
  position: string
  created_at: string
  updated_at: string
}
