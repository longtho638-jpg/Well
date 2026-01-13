
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("❌ Missing Supabase credentials in .env (VITE_SUPABASE_URL, SERVICE_ROLE_KEY)");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
    console.log("🕵️  Bắt đầu kiểm tra hệ thống Production...");

    // 1. Tạo User Test
    const email = `test_probe_${Date.now()}@example.com`;
    console.log(`\n1️⃣  Tạo User Test: ${email}`);
    const { data: { user }, error: userError } = await supabase.auth.admin.createUser({
        email,
        password: process.env.TEST_USER_PASSWORD || 'password123',
        email_confirm: true
    });

    if (userError) {
        console.error("❌ Lỗi tạo user:", userError.message);
        return;
    }
    console.log("✅ User ID:", user?.id);

    // 1.5. Sync User to Public Table (Manual Sync if Trigger missing)
    const { error: syncError } = await supabase.from('users').insert({
        id: user?.id,
        email: email,
        name: 'Test Probe User',
        rank: 'Member'
    });
    if (syncError) {
        console.log("⚠️  Sync User Warning (User might exist):", syncError.message);
    } else {
        console.log("✅ Synced user to public table.");
    }

    // 2. Tạo Giao dịch Mua hàng (Trigger The Bee)
    console.log("\n2️⃣  Giả lập Giao dịch Mua hàng (1.000.000 VNĐ)...");
    const { data: tx, error: txError } = await supabase.from('transactions').insert({
        id: `TX-TEST-${Date.now()}`,
        user_id: user?.id,
        amount: 1000000,
        type: 'Direct Sale',
        status: 'completed',
        currency: 'VND'
    }).select().single();

    if (txError) {
        console.error("❌ Lỗi tạo giao dịch:", txError.message);
        return;
    }
    console.log("✅ Transaction ID:", tx.id);
    console.log("👉 Database Trigger sẽ tự động tạo Job trong bảng 'agent_jobs'...");

    // 3. Chờ Agent Worker xử lý (Polling)
    console.log("\n3️⃣  Đang chờ 'The Bee' Agent xử lý (Polling 70s)...");
    let jobFound = false;
    for (let i = 0; i < 70; i++) {
        process.stdout.write(".");
        await new Promise(r => setTimeout(r, 1000)); // Chờ 1s

        const { data: jobs } = await supabase
            .from('agent_jobs')
            .select('*')
            .contains('payload', { transaction_id: tx.id });

        if (jobs && jobs.length > 0) {
            const job = jobs[0];
            if (job.status === 'completed') {
                console.log("\n✅ Job Found & Completed!");
                console.log("   - Job ID:", job.id);
                console.log("   - Status:", job.status);
                console.log("   - Processed At:", job.processed_at);
                jobFound = true;
                break;
            } else if (job.status === 'failed') {
                console.log("\n❌ Job Failed:", job.error_message);
                break;
            } else {
                // Log status if it changes or just once every 10s
                if (i % 10 === 0) console.log(`\n   [${i}s] Job Status: ${job.status}`);
            }
        } else {
            if (i % 10 === 0) console.log(`\n   [${i}s] Job not found yet...`);
        }
    }

    if (!jobFound) {
        console.log("\n⚠️  Timeout: Agent chưa xử lý xong hoặc Cron chưa chạy.");
        console.log("💡 Gợi ý: Hãy kiểm tra xem pg_cron đã được bật chưa.");
    }

    // 4. Kiểm tra Số dư (Reward)
    console.log("\n4️⃣  Kiểm tra Ví thưởng của User...");
    const { data: userData } = await supabase.from('users').select('grow_balance').eq('id', user?.id).single();

    if (userData?.grow_balance === 50000) {
        console.log("✅ THÀNH CÔNG! Số dư đã tăng lên 50,000 (5% của 1M).");
        console.log("🎉 Hệ thống hoạt động hoàn hảo: Transaction -> Trigger -> Job -> Worker -> Reward.");
    } else {
        console.log(`❌ Thất bại. Số dư hiện tại: ${userData?.grow_balance}`);
    }

    // 5. Dọn dẹp
    console.log("\n5️⃣  Dọn dẹp dữ liệu test...");
    await supabase.auth.admin.deleteUser(user!.id);
    console.log("✅ Đã xóa User test.");
}

main();
