// ============================================================================
// SUPABASE CLIENT CONFIGURATION
// GrantFlow Vault Connection
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qmhqewbagjyfjbwobsfl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtaHFld2JhZ2p5Zmpid29ic2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyOTc3OTgsImV4cCI6MjA4Mjg3Mzc5OH0.JxgFOTV3AOR5TDpIyJVBou44RFsi3RXxU7Yi8nr4iU4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database types for type safety
export interface Deal {
    id?: number;
    created_at?: string;
    company: string;
    value: number;
    status: string;
    packet_id?: string;
    risk_score?: number;
    anomaly_count?: number;
}
