import { createServerSupabaseClient } from '../../../../lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import SessionEditor from '../../../../components/SessionEditor'

interface Props { params: Promise<{ id: string }> }

export default async function SessionPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: session } = await supabase.from('sessions').select('*').eq('id', id).single()
  const { data: questions } = await supabase.from('questions').select('*').order('sort_order')
  const { data: logic } = await supabase.from('logic_settings').select('*').eq('id', 'global').single()
  const { data: history } = await supabase.from('history').select('*').order('date_completed', { ascending: false })

  if (!session) notFound()

  const isOwner = session.created_by === user.id
  const isTeam = profile?.role === 'admin' || profile?.role === 'team'
  if (!isOwner && !isTeam) redirect('/dashboard')

  return (
    <SessionEditor
      session={session}
      profile={profile}
      questions={questions ?? []}
      logic={logic}
      history={history ?? []}
    />
  )
}
