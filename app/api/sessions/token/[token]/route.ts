import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../../../lib/supabase-server'
import { calcEstimate, DEFAULT_LOGIC, DEFAULT_QUESTIONS } from '../../../../../lib/estimator'

interface Context { params: Promise<{ token: string }> }

export async function PATCH(request: Request, { params }: Context) {
  const { token } = await params
  // Use service-role-style: anonymous read allowed by RLS on share_token
  const supabase = await createServerSupabaseClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('id, answers, activated_levers, status')
    .eq('share_token', token)
    .single()

  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (session.status === 'closed') return NextResponse.json({ error: 'This session is closed' }, { status: 403 })

  const body = await request.json()
  const answers = body.answers ?? session.answers
  const activated_levers = session.activated_levers // clients can't change levers

  const { data: questions } = await supabase.from('questions').select('*').order('sort_order')
  const { data: logic } = await supabase.from('logic_settings').select('*').eq('id', 'global').single()

  const result = calcEstimate(
    answers,
    activated_levers,
    questions ?? DEFAULT_QUESTIONS,
    logic ?? DEFAULT_LOGIC
  )

  // Use service key to bypass RLS for anonymous update (via a dedicated anon-update policy)
  // For simplicity, we update via a Supabase function or trust the client
  // In production, add a policy: allow update where share_token = token
  const { data, error } = await supabase
    .from('sessions')
    .update({
      answers,
      estimated_hours: result.expected,
      tier: result.tier.name,
      status: body.submit ? 'submitted' : 'draft',
    })
    .eq('share_token', token)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...data, estimate: result })
}

export async function GET(_: Request, { params }: Context) {
  const { token } = await params
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('sessions')
    .select('id, client_name, answers, status, tier, estimated_hours, share_token')
    .eq('share_token', token)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}
