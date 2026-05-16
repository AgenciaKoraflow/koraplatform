import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0'

interface CreateUserRequest {
  email: string
  password: string
  email_confirm?: boolean
}

const corsHeaders = {
  'Content-Type': 'application/json',
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    })
  }

  try {
    // JWT auth — validate caller is authenticated and is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { status: 500, headers: corsHeaders }
      )
    }

    // Validate the calling user's JWT
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    // Only global_admin or admin can create users
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data: membership } = await supabaseAdmin
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['global_admin', 'admin'])
      .maybeSingle()

    if (!membership) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: corsHeaders,
      })
    }

    const { email, password, email_confirm = true } = await req.json() as CreateUserRequest

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm,
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
      },
      message: email_confirm ? 'Usuário criado com email confirmado' : 'Usuário criado (confirmação pendente)',
    }), {
      status: 201,
      headers: corsHeaders,
    })
  } catch (error) {
    console.error('create-user error:', error instanceof Error ? error.message : 'unknown')
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
}
