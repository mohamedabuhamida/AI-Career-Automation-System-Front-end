import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/dashboard/DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // ✅ Use getUser instead of getSession
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Check if user has uploaded CV
  const { data: cv } = await supabase
    .from('cvs')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'processed')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav 
        user={user} 
        hasCV={!!cv}
      />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
