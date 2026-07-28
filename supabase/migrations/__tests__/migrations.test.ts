import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const migrationsDir = path.resolve(__dirname, '..')
const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort()

describe('Supabase Migrations', () => {
  it('every table has RLS enabled somewhere across migrations', () => {
    const allTables: string[] = []
    const tablesWithRls: string[] = []

    for (const file of migrationFiles) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
      const createMatches = sql.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/gi)
      for (const m of createMatches) {
        if (!allTables.includes(m[1])) allTables.push(m[1])
      }
      const rlsMatches = sql.matchAll(/ALTER TABLE\s+(\w+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi)
      for (const m of rlsMatches) {
        if (!tablesWithRls.includes(m[1])) tablesWithRls.push(m[1])
      }
    }

    const withoutRls = allTables.filter(t => !tablesWithRls.includes(t))
    expect(withoutRls).toEqual([])
  })

  it('all SQL files are non-empty', () => {
    for (const file of migrationFiles) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
      expect(sql.trim().length).toBeGreaterThan(0)
    }
  })

  it('025_enable_referrals_rls.sql enables RLS on referrals table', () => {
    const sql = fs.readFileSync(path.join(migrationsDir, '025_enable_referrals_rls.sql'), 'utf-8')
    expect(sql).toContain('ALTER TABLE referrals ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain('CREATE POLICY "Users can view own referrals"')
    expect(sql).toContain('CREATE POLICY "Users can insert own referrals"')
    expect(sql).toContain('CREATE POLICY "Admins can view all referrals"')
    expect(sql).toContain('CREATE POLICY "Admins can update all referrals"')
  })
})
