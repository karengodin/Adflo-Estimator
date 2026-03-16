import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../../lib/supabase'
import { calcEstimate, DEFAULT_LOGIC, DEFAULT_QUESTIONS } from '../../../../lib/estimator'

interface Context { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Context) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase.from('sessions').select('*').eq('id', id).single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isTeam = profile?.role === 'admin' || profile?.role === 'team'
  if (!isTeam && data.created_by !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase.from('sessions').select('*').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isTeam = profile?.role === 'admin' || profile?.role === 'team'
  if (!isTeam && existing.created_by !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()

  // Re-calc estimate if answers or levers changed
  let estimated_hours = existing.estimated_hours
  let tier = existing.tier

  const answers = body.answers ?? existing.answers
  const activated_levers = body.activated_levers ?? existing.activated_levers

  const { data: questions } = await supabase.from('questions').select('*').order('sort_order')
  const { data: logic } = await supabase.from('logic_settings').select('*').eq('id', 'global').single()

  const qs = questions ?? DEFAULT_QUESTIONS
  const lg = logic ?? DEFAULT_LOGIC

  const result = calcEstimate(answers, activated_levers, qs, lg)
  estimated_hours = result.expected
  tier = result.tier.name

  const { data, error } = await supabase
    .from('sessions')
    .update({
      ...body,
      estimated_hours,
      tier,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: Context) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isTeam = profile?.role === 'admin' || profile?.role === 'team'
  if (!isTeam) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
