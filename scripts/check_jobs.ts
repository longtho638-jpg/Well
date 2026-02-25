
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jcbahdioqoepvoliplqy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bWdydm13bXBzdHNpZ2VmdWF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzAzMTIwOCwiZXhwIjoyMDc4NjA3MjA4fQ.tWjDTqi_ZUg2tbqJ3j9Ns2WKQgHZnh3k3CVKUf7Xzto';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
    console.log("🕵️  Checking Pending Jobs...");

    const { data: jobs, error } = await supabase
        .from('agent_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error("❌ Error:", error.message);
        return;
    }

    console.log(`Found ${jobs.length} jobs (Recent):`);
    jobs.forEach(job => {
        console.log(`- [${job.id}] Status: ${job.status} | ${job.agent_name} : ${job.action}`);
        console.log(`  Payload:`, JSON.stringify(job.payload));
    });
}

main();
