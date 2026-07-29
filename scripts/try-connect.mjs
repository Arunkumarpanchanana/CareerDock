import pkg from 'pg'
const { Client } = pkg
import { readFileSync } from 'fs'

const password = 'XDD1pFxopTurPJvgIW7bt'
const ref = 'zzyddiydebxvqrmysjwy'

async function tryConnect(name, url) {
  console.log(`\n[${name}]`)
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000
  })
  try {
    await client.connect()
    console.log('  CONNECTED!')
    const res = await client.query('SELECT 1 AS test')
    console.log('  Query result:', res.rows)
    return client
  } catch (e) {
    console.log(`  FAILED: ${e.message || e}`)
    return null
  }
}

async function run() {
  let client = null

  // Try direct IPv6 connection (Node.js sometimes handles this better than psql)
  client = await tryConnect('Direct IPv6', 
    `postgresql://postgres:${password}@db.${ref}.supabase.co:5432/postgres?sslmode=require`)

  if (!client) {
    // Try with IPv6 literal
    const dns = await import('dns')
    const addrs = await new Promise((resolve) => {
      dns.resolve6(`db.${ref}.supabase.co`, (err, res) => {
        resolve(err ? [] : res)
      })
    })
    console.log(`\nIPv6 addresses: ${addrs.join(', ') || 'none'}`)
    
    if (addrs.length > 0) {
      client = await tryConnect('Direct IPv6 literal',
        `postgresql://postgres:${password}@[${addrs[0]}]:5432/postgres?sslmode=require`)
    }
  }

  if (!client) {
    // Try the Supabase data API with the service role key to execute queries
    console.log('\n[Trying Supabase data API with service_role...]')
    
    const svcKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eWRkaXlkZWJ4dnFybXlzand5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTM0MDQxMCwiZXhwIjoyMTAwOTE2NDEwfQ.tBh-OYhur8Ujyyi069P7QUmKVJ1tQU8UYv0AX0-ngrM'
    
    // Try to use the data API to create a function, then call it
    // First, let's see if we can use the table endpoint
    const testRes = await fetch(`https://${ref}.supabase.co/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': svcKey,
        'Authorization': `Bearer ${svcKey}`
      }
    })
    console.log(`  API root: ${testRes.status}`)
    
    // Try the OpenAPI description
    const openapiRes = await fetch(`https://${ref}.supabase.co/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': svcKey,
        'Authorization': `Bearer ${svcKey}`,
        'Accept': 'application/openapi+json'
      }
    })
    console.log(`  OpenAPI: ${openapiRes.status}`)
  }

  if (client) {
    console.log('\n=== Connection successful! Now running migration... ===')
    const sql = readFileSync('/Users/arunkumarpanchanana/Documents/GitHub/CareerDock/supabase/migrations/20260729000001_initial_schema.sql', 'utf8')
    
    try {
      await client.query(sql)
      console.log('Migration SQL executed successfully!')
      
      await client.query(`INSERT INTO profiles (id, role) SELECT id, 'admin' FROM auth.users WHERE email = 'admin@mycareerdock.com' ON CONFLICT (id) DO UPDATE SET role = 'admin'`)
      console.log('Admin role set!')
    } catch (e) {
      console.error(`SQL Error: ${e.message}`)
    }
    
    await client.end()
  } else {
    console.log('\nAll database connection methods failed.')
    console.log('Please paste the actual connection string from https://supabase.com/dashboard/project/zzyddiydebxvqrmysjwy/settings/database')
    console.log('Click "Connect" button → "Session pooler" tab → copy the connection string')
  }
}

run().catch(console.error)
