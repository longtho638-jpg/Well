
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zumgrvmwmpstsigefuau.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bWdydm13bXBzdHNpZ2VmdWF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzAzMTIwOCwiZXhwIjoyMDc4NjA3MjA4fQ.tWjDTqi_ZUg2tbqJ3j9Ns2WKQgHZnh3k3CVKUf7Xzto';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
    console.log("🐝 Starting Local Worker...");

    // 1. Fetch Jobs
    const { data: jobs, error } = await supabase
        .from('agent_jobs')
        .select('*')
        .eq('status', 'pending')
        .limit(10);

    if (error) {
        console.error("❌ Error fetching jobs:", error.message);
        return;
    }

    console.log(`Found ${jobs.length} pending jobs.`);

    for (const job of jobs) {
        console.log(`Processing Job ${job.id}...`);

        // 2. Process
        try {
            await supabase.from('agent_jobs').update({ status: 'processing' }).eq('id', job.id);

            if (job.agent_name === 'The Bee' && job.action === 'process_reward') {
                await runTheBee(job.payload);
            }

            await supabase.from('agent_jobs').update({
                status: 'completed',
                processed_at: new Date().toISOString()
            }).eq('id', job.id);

            console.log(`✅ Job ${job.id} Completed.`);
        } catch (err: any) {
            console.error(`❌ Job ${job.id} Failed:`, err.message);
            await supabase.from('agent_jobs').update({
                status: 'failed',
                error_message: err.message
            }).eq('id', job.id);
        }
    }
}

async function runTheBee(payload: any) {
    const { user_id, amount, transaction_id } = payload;
    const rate = 0.05;
    const rewardAmount = Math.floor(amount * rate);

    console.log(`   - Distributing Reward: ${rewardAmount} to ${user_id}`);

    const { error } = await supabase.rpc('distribute_reward', {
        p_user_id: user_id,
        p_amount: rewardAmount,
        p_source_tx: transaction_id
    });

    if (error) throw new Error(error.message);
}

main();
