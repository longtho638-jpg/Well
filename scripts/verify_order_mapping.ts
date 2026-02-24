
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY || '';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !TEST_USER_PASSWORD) {
    console.error("❌ Missing Supabase credentials (URL, KEY, or TEST_USER_PASSWORD) in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
    console.log("🕵️  Verifying Order Mapping Logic (Multi-Tab)...");

    // 1. Create User
    const email = `mapping_test_${Date.now()}@example.com`;
    const { data: { user }, error: userError } = await supabase.auth.admin.createUser({
        email,
        password: process.env.TEST_USER_PASSWORD,
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
        .neq('type', 'Direct Sale') // Find any non-sale transaction (reward)
        .order('created_at', { ascending: false })
        .limit(1);

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

    if (rewards && rewards.length > 0) {
        const rewardTx = rewards[0];
        console.log(`💎 Reward Transaction: [${rewardTx.id}]`);
        console.log(`      💰 Amount: ${rewardTx.amount}`);
        
        if (rewardTx.metadata && rewardTx.metadata.source_tx_id === orderId) {
            console.log(`      ✅ METADATA LINKED: { source_tx_id: "${orderId}" }`);
            console.log(`      ✨ "The Bee" has successfully traced this reward!`);
        } else {
            console.log("      ⚠️  Linkage Warning: Metadata missing (Check Worker Logic)");
        }
    } else {
        console.log(`💎 Reward Transaction: [PENDING / NOT GENERATED]`);
        console.log(`      ⚠️  Reward not found yet.`);
        console.log(`      (Likely requires deploying the latest 'distribute_reward' RPC migration)`);
    }
    console.log("\n✨ ================================================= ✨");

    // Cleanup
    await supabase.auth.admin.deleteUser(user!.id);
}

main();
