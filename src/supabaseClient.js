import { createClient } from '@supabase/supabase-js'

// Red Letters shares the Elora Radiance database with Anchored Steps and
// Armed & Anchored, so one account works across every app. These are the
// public (anon) values; access is enforced by row-level security.
const SUPABASE_URL = 'https://cvtukqamaqrhjtdvmslb.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2dHVrcWFtYXFyaGp0ZHZtc2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDU1MjQsImV4cCI6MjA5MTQyMTUyNH0.gSksF5jV-UpuaUL7x7vhHHOB6Z7Qq0iehtbc2PoSAxw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
