import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve as resolvePath } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const sql = readFileSync(resolvePath(__dirname, '../supabase/migrations/20260729000001_initial_schema.sql'), 'utf8')

const supabaseUrl = 'https://zzyddiydebxvqrmysjwy.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eWRkaXlkZWJ4dnFybXlzand5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTM0MDQxMCwiZXhwIjoyMTAwOTE2NDEwfQ.tBh-OYhur8Ujyyi069P7QUmKVJ1tQU8UYv0AX0-ngrM'

const supabase = createClient(supabaseUrl, serviceRoleKey)

// Execute SQL via the Supabase REST API using the sql endpoint
async function runSQL(query) {
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Prefer': 'params=single-object'
    },
    body: JSON.stringify({ query })
  })
  return response
}

async function main() {
  // Try executing SQL through the management API approach
  // Supabase supports raw SQL execution through the service role key using the /sql endpoint
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const stmt of statements) {
    console.log(`Executing: ${stmt.substring(0, 80)}...`)
    
    const res = await runSQL(stmt)
    const text = await res.text()
    if (!res.ok) {
      console.error(`  Error: ${res.status} - ${text}`)
    } else {
      console.log(`  OK (${res.status})`)
    }
  }

  // Set admin role
  const adminSQL = `INSERT INTO profiles (id, role) SELECT id, 'admin' FROM auth.users WHERE email = 'admin@mycareerdock.com' ON CONFLICT (id) DO UPDATE SET role = 'admin'`
  console.log(`\nSetting admin role...`)
  const res = await runSQL(adminSQL)
  const text = await res.text()
  if (!res.ok) {
    console.error(`  Error: ${res.status} - ${text}`)
  } else {
    console.log(`  OK (${res.status})`)
  }
}

main().catch(console.error)
