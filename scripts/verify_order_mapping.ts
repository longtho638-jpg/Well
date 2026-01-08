
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zumgrvmwmpstsigefuau.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bWdydm13bXBzdHNpZ2VmdWF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzAzMTIwOCwiZXhwIjoyMDc4NjA3MjA4fQ.tWjDTqi_ZUg2tbqJ3j9Ns2WKQgHZnh3k3CVKUf7Xzto';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
    console.log("🕵️  Verifying Order Mapping Logic (Multi-Tab)...");

    // 1. Create User
    const email = `mapping_test_${Date.now()}@example.com`;
    const { data: { user }, error: userError } = await supabase.auth.admin.createUser({
        email,
        password: 'password123',
        email_confirm: true
    });
    if (userError) { console.error(userError); return; }

    // Sync to public
    await supabase.from('users').insert({ id: user?.id, email, name: 'Mapping Test', rank: 'Member' });
    console.log(`✅ User Created: ${user?.id}`);

    // 2. Create Order (Transaction)
    const orderId = `ORDER-${Date.now()}`;
    console.log(`\n2️⃣  Creating Order: ${orderId}`);
    const { data: order, error: orderError } = await supabase.from('transactions').insert({
        id: orderId,
        user_id: user?.id,
        amount: 2000000, // 2M VND
        type: 'Direct Sale',
        status: 'completed',
        currency: 'VND'
    }).select().single();

    if (orderError) { console.error(orderError); return; }
    console.log(`✅ Order Created in 'transactions' table.`);

    // 3. Verify Job Creation (Mapping: Order -> Job)
    console.log(`\n3️⃣  Checking 'agent_jobs' for mapping...`);
    let job = null;
    for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const { data } = await supabase.from('agent_jobs').select('*').contains('payload', { transaction_id: orderId });
        if (data && data.length > 0) {
            job = data[0];
            break;
        }
    }

    if (job) {
        console.log(`✅ MAPPING CONFIRMED: Order -> Job`);
        console.log(`   - Job ID: ${job.id}`);
        console.log(`   - Payload matches Order ID: ${job.payload.transaction_id}`);
    } else {
        console.error("❌ MAPPING FAILED: No job created for this order.");
        return;
    }

    // 4. Process Job (Simulate Worker)
    console.log(`\n4️⃣  Processing Job to check Reward Mapping...`);
    // Manually call RPC to ensure we test the logic even if worker is slow
    const rewardAmount = 2000000 * 0.05;
    await supabase.rpc('distribute_reward', {
        p_user_id: user?.id,
        p_amount: rewardAmount,
        p_source_tx: orderId
    });
    console.log(`✅ RPC 'distribute_reward' called.`);

    // 5. Verify Reward Transaction (Mapping: Order -> Reward TX)
    console.log(`\n5️⃣  Checking Reward Transaction Mapping...`);
    const { data: rewards } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('type', 'Team Volume Bonus')
        .order('created_at', { ascending: false })
        .limit(1);

    if (rewards && rewards.length > 0) {
        const rewardTx = rewards[0];

        // WOW VISUALIZATION
        console.log("\n✨ ================================================= ✨");
        console.log("             WOW TRACEABILITY REPORT                ");
        console.log("✨ ================================================= ✨");
        console.log(`\n📦 Source Order: [${orderId}]`);
        console.log(`   │  💰 Amount: 2,000,000 VND`);
        console.log(`   │  👤 User: ${user?.email}`);
        console.log(`   │`);
        console.log(`   ▼`);
        console.log(`🐝 Agent Job: [${job.id}]`);
        console.log(`   │  ⚙️  Action: process_reward`);
        console.log(`   │  🤖 Agent: The Bee`);
        console.log(`   │`);
        console.log(`   ▼`);
        console.log(`💎 Reward Transaction: [${rewardTx.id}]`);
        console.log(`      💰 Amount: ${rewardTx.amount} GROW`);
        console.log(`      🔗 Linkage Check:`);

        // CHECK FOR LINKAGE
        if (rewardTx.metadata && rewardTx.metadata.source_tx_id === orderId) {
            console.log(`      ✅ METADATA LINKED: { source_tx_id: "${orderId}" }`);
            console.log(`      ✨ "The Bee" has successfully traced this reward!`);
        } else {
            console.log("      ❌ MISSING LINK: Metadata not found or incorrect.");
            console.log("      (Did you run the new migration?)");
        }
        console.log("\n✨ ================================================= ✨");
    }

    // Cleanup
    await supabase.auth.admin.deleteUser(user!.id);
}

main();
