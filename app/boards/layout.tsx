import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/ui/LogoutButton'

export default async function BoardsLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800">
        <a href="/boards" className="font-semibold text-lg hover:text-gray-300 transition-colors">
          TaskFlow
        </a>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{user.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
