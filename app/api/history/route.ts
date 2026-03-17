import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../lib/supabase-server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isTeam = profile?.role === 'admin' || profile?.role === 'team'

  const query = supabase.from('history').select('*').order('date_completed', { ascending: false })
  if (!isTeam) query.eq('created_by', user.id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { client_name, rep_name, date_completed, estimated_hours, actual_hours, tier, timeline, answers, session_id } = body

  if (!client_name || !date_completed || !estimated_hours || !actual_hours || !tier) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('history')
    .insert({
      client_name,
      rep_name: rep_name ?? null,
      date_completed,
      estimated_hours: Number(estimated_hours),
      actual_hours: Number(actual_hours),
      tier,
      timeline: timeline ?? '',
      answers: answers ?? {},
      session_id: session_id ?? null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'team') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await request.json()
  const { error } = await supabase.from('history').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
