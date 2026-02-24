
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
const testUserPassword = process.env.TEST_USER_PASSWORD;

if (!supabaseUrl || !supabaseKey || !testUserPassword) {
    console.error('Missing Supabase credentials or TEST_USER_PASSWORD');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyBee2Logic() {
    console.log('🐝 Verifying Bee 2.0 Logic...');

    // 1. Create Test User
    const email = `bee2_test_${Date.now()}@example.com`;
    const { data: user, error: userError } = await supabase.auth.signUp({
        email,
        password: process.env.TEST_USER_PASSWORD,
        options: {
            data: {
                name: 'Bee Tester',
                rank: 'Member'
            }
        }
    });

    if (userError || !user.user) {
        console.error('Failed to create user:', userError);
        return;
    }
    const userId = user.user.id;
    console.log(`✅ Created User: ${userId} (Rank: Member)`);

    // 2. Simulate Transaction for ANIMA 119 (Price: 1.868M, Bonus: 990k)
    // We insert directly into transactions with metadata to simulate a purchase
    const txId = `TX-TEST-${Date.now()}`;
    const { error: txError } = await supabase.from('transactions').insert({
        id: txId,
        user_id: userId,
        amount: 1868000,
        type: 'Direct Sale',
        status: 'completed',
        metadata: {
            product_id: 'PROD-119', // This links to the product with 990k bonus revenue
            product_name: 'Combo ANIMA 119'
        }
    });

    if (txError) {
        console.error('Failed to create transaction:', txError);
        return;
    }
    console.log(`✅ Created Transaction: ${txId} for PROD-119`);

    // 3. Trigger The Bee (Call RPC distribute_reward)
    // In production, this is called by agent-worker. Here we call it directly.
    console.log('🐝 Triggering distribute_reward...');
    const { error: rpcError } = await supabase.rpc('distribute_reward', {
        p_user_id: userId,
        p_amount: 1868000, // This should be ignored in favor of bonus_revenue
        p_source_tx: txId
    });

    if (rpcError) {
        console.error('RPC Failed:', rpcError);
        return;
    }
    console.log('✅ RPC executed successfully');

    // 4. Verify Results
    const { data: userData } = await supabase
        .from('users')
        .select('grow_balance, accumulated_bonus_revenue, rank')
        .eq('id', userId)
        .single();

    if (!userData) {
        console.error('Failed to fetch user data');
        return;
    }

    // Expected: 
    // Bonus Revenue = 990,000
    // Commission (Member 21%) = 990,000 * 0.21 = 207,900
    console.log('📊 Verification Results:');
    console.log(`   - Rank: ${userData.rank} (Expected: Member)`);
    console.log(`   - Accumulated Bonus: ${userData.accumulated_bonus_revenue} (Expected: 990000)`);
    console.log(`   - GROW Balance: ${userData.grow_balance} (Expected: 207900)`);

    if (userData.accumulated_bonus_revenue === 990000 && userData.grow_balance === 207900) {
        console.log('✅ Commission Logic PASSED');
    } else {
        console.error('❌ Commission Logic FAILED');
    }

    // 5. Test Auto-Rank Upgrade
    console.log('\n🚀 Testing Auto-Rank Upgrade...');
    // We need to push accumulation to 9.9M. Currently 990k. Need 8,910,000 more.
    // Let's manually update accumulation to 9,000,000 to be close.
    await supabase.from('users').update({ accumulated_bonus_revenue: 9000000 }).eq('id', userId);

    // Trigger another transaction for ANIMA 119 (990k bonus)
    // Total will be 9,000,000 + 990,000 = 9,990,000 (> 9.9M) -> Should upgrade
    const txId2 = `TX-TEST-UPGRADE-${Date.now()}`;
    await supabase.from('transactions').insert({
        id: txId2,
        user_id: userId,
        amount: 1868000,
        type: 'Direct Sale',
        status: 'completed',
        metadata: { product_id: 'PROD-119' }
    });

    await supabase.rpc('distribute_reward', {
        p_user_id: userId,
        p_amount: 1868000,
        p_source_tx: txId2
    });

    const { data: upgradedUser } = await supabase
        .from('users')
        .select('rank, accumulated_bonus_revenue')
        .eq('id', userId)
        .single();

    console.log(`   - New Rank: ${upgradedUser?.rank} (Expected: Startup)`);
    console.log(`   - New Accumulation: ${upgradedUser?.accumulated_bonus_revenue}`);

    if (upgradedUser?.rank === 'Startup') {
        console.log('✅ Auto-Rank Upgrade PASSED');
    } else {
        console.error('❌ Auto-Rank Upgrade FAILED');
    }

    // Clean up
    // await supabase.from('users').delete().eq('id', userId);
}

verifyBee2Logic();
