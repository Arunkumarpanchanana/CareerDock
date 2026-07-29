import { readFileSync } from 'fs'

const ref = 'zzyddiydebxvqrmysjwy'
const svcKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eWRkaXlkZWJ4dnFybXlzand5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTM0MDQxMCwiZXhwIjoyMTAwOTE2NDEwfQ.tBh-OYhur8Ujyyi069P7QUmKVJ1tQU8UYv0AX0-ngrM'
const baseUrl = `https://${ref}.supabase.co`

const headers = {
  'apikey': svcKey,
  'Authorization': `Bearer ${svcKey}`,
  'Content-Type': 'application/json'
}

async function tryEndpoints() {
  // Try various endpoints for raw SQL execution
  const endpoints = [
    { url: '/rest/v1/', method: 'GET', desc: 'REST API root' },
    { url: '/rest/v1/rpc/', method: 'GET', desc: 'Available RPCs' },
    { url: '/graphql/v1', method: 'POST', desc: 'GraphQL endpoint', body: { query: 'query { __typename }' } },
  ]

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${baseUrl}${ep.url}`, {
        method: ep.method,
        headers,
        body: ep.body ? JSON.stringify(ep.body) : undefined
      })
      const text = await res.text()
      console.log(`${ep.desc} (${ep.url}): ${res.status} - ${text.substring(0, 200)}`)
    } catch (e) {
      console.log(`${ep.desc} (${ep.url}): ERROR - ${e.message}`)
    }
  }

  // Check OpenAPI for available functions
  console.log('\n--- Checking OpenAPI spec ---')
  const oaRes = await fetch(`${baseUrl}/rest/v1/`, { headers: { ...headers, Accept: 'application/openapi+json' } })
  const oaText = await oaText()
  
  // Check for any exec or query functions
  const rpcs = await fetch(`${baseUrl}/rest/v1/rpc/`, { method: 'GET', headers })
  console.log(`RPC list: ${rpcs.status}`)
  const rpcText = rpcs.ok ? await rpcs.text() : rpcs.statusText
  console.log(rpcText.substring(0, 500))

  // Try pg_query if it exists
  console.log('\n--- Trying pg_query RPC ---')
  const pgqRes = await fetch(`${baseUrl}/rest/v1/rpc/pg_query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query_text: 'SELECT 1' })
  })
  console.log(`pg_query: ${pgqRes.status}`)
  if (pgqRes.ok) {
    console.log(await pgqRes.text())
  }

  // Try exec_sql
  console.log('\n--- Trying exec_sql RPC ---')
  const execRes = await fetch(`${baseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sql: 'SELECT 1' })
  })
  console.log(`exec_sql: ${execRes.status}`)
  if (execRes.ok) {
    console.log(await execRes.text())
  }
}

tryEndpoints().catch(console.error)
