import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { calcEstimate, DEFAULT_LOGIC, DEFAULT_QUESTIONS } from '@/lib/estimator'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isTeam = profile?.role === 'admin' || profile?.role === 'team'

  const query = supabase
    .from('sessions')
    .select('*, created_by_profile:profiles!sessions_created_by_fkey(full_name,email)')
    .order('updated_at', { ascending: false })

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
  const { client_name, notes } = body

  if (!client_name?.trim()) {
    return NextResponse.json({ error: 'client_name is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      client_name: client_name.trim(),
      created_by: user.id,
      notes: notes ?? null,
      estimated_hours: DEFAULT_LOGIC.base_hours,
      tier: DEFAULT_LOGIC.tiers[0].name,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
