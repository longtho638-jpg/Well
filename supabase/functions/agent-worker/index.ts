// Supabase Edge Function: The Core Agent Worker
// Deno Runtime - High Performance, Low Latency

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Fixed: was SERVICE_ROLE_KEY (wrong key name)
)

const MAX_ATTEMPTS = 3 // Dead letter: stop retrying after this many failures

Deno.serve(async (req) => {
  // 1. Worker nhận tín hiệu (Cron hoặc Webhook gọi định kỳ)
  // Trong thực tế, ta dùng pg_net hoặc cron để gọi function này mỗi giây

  // 2. Lấy 100 jobs (pending HOẶC processing quá 10 phút)
  // Tính thời điểm 10 phút trước
  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

  const { data: jobs, error } = await supabase
    .from('agent_jobs')
    .select('*')
    .or(`status.eq.pending,and(status.eq.processing,updated_at.lt.${tenMinsAgo})`)
    .lt('attempts', MAX_ATTEMPTS) // Dead letter guard: skip jobs that exceeded max retries
    .limit(100)

  if (!jobs || jobs.length === 0) {
    return new Response(JSON.stringify({ message: 'No jobs' }), { headers: { 'Content-Type': 'application/json' } })
  }

  const results = []

  // 3. Xử lý song song (Parallel Processing)
  await Promise.all(jobs.map(async (job) => {
    try {
      // Mark as processing with optimistic lock: only claim if still pending/timed-out-processing
      const { count } = await supabase
        .from('agent_jobs')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', job.id)
        .in('status', ['pending', 'processing']) // Atomic claim guard
        .select('id', { count: 'exact', head: true })

      if (!count || count === 0) {
        // Another worker claimed this job concurrently — skip
        return
      }

      // --- ROUTING AGENT ---
      if (job.agent_name === 'The Bee' && job.action === 'process_reward') {
        await runTheBee(job.payload)
      }
      // ---------------------

      // Mark as completed
      await supabase.from('agent_jobs').update({
        status: 'completed',
        processed_at: new Date().toISOString()
      }).eq('id', job.id)

      results.push({ id: job.id, status: 'ok' })

    } catch (err) {
      console.error(`Job ${job.id} failed:`, err)
      const newAttempts = job.attempts + 1
      // Move to dead_letter if max attempts exceeded, else mark failed for retry
      await supabase.from('agent_jobs').update({
        status: newAttempts >= MAX_ATTEMPTS ? 'dead_letter' : 'failed',
        error_message: err.message,
        attempts: newAttempts
      }).eq('id', job.id)
    }
  }))

  return new Response(JSON.stringify({ processed: results.length }), { headers: { 'Content-Type': 'application/json' } })
})

// --- AGENT LOGIC: THE BEE ---
async function runTheBee(payload: any) {
  const { user_id, amount, transaction_id } = payload

  // 1. Delegate Logic to Database (Bee 2.0)
  // The RPC 'distribute_reward' now handles:
  // - Looking up Bonus Revenue (DTTT) from Product
  // - Applying correct rate (21% vs 25%) based on User Rank
  // - Auto-Rank Upgrade

  const { error } = await supabase.rpc('distribute_reward', {
    p_user_id: user_id,
    p_amount: amount, // Pass full amount as fallback base
    p_source_tx: transaction_id
  })

  if (error) throw new Error(error.message)
}
