const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: (...args) =>
        fetch(...args, {
          signal: AbortSignal.timeout(30000), // 30 detik
        }),
    },
  }
)

module.exports = supabase