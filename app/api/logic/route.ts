import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../lib/supabase'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from('logic_settings').select('*').eq('id', 'global').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'team') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { data, error } = await supabase
    .from('logic_settings')
    .update({ ...body, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq('id', 'global')
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
