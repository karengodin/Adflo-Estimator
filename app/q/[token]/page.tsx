import { createServerSupabaseClient } from '../../../lib/supabase-server'
import { notFound } from 'next/navigation'
import ClientQuestionnaire from '../../../components/ClientQuestionnaire'

interface Props { params: Promise<{ token: string }> }

export default async function ClientPage({ params }: Props) {
  const { token } = await params
  const supabase = await createServerSupabaseClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('share_token', token)
    .single()

  if (!session) notFound()

  const { data: questions } = await supabase.from('questions').select('*').order('sort_order')
  const { data: logic } = await supabase.from('logic_settings').select('*').eq('id', 'global').single()

  return (
    <ClientQuestionnaire
      session={session}
      questions={questions ?? []}
      logic={logic}
    />
  )
}
