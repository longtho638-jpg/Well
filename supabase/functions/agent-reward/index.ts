// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

// --- CẤU HÌNH CHÍNH SÁCH (POLICY CONFIG) ---
// Dựa trên file: CHÍNH SÁCH CODE - WELL NEXUS.xlsx
const POLICY = {
    RANKS: {
        AMBASSADOR: { id: 'ambassador', level: 6 }, // Đại Sứ
        STARTUP: { id: 'startup', level: 7 }, // Khởi Nghiệp
        CTV: { id: 'ctv', level: 8 }  // Cộng tác viên
    },
    COMMISSION: {
        DIRECT_CTV: 0.21,      // 21% cho CTV
        DIRECT_STARTUP: 0.25,  // 25% cho Khởi Nghiệp trở lên
        SPONSOR_BONUS: 0.08    // 8% cho Bảo trợ (ĐK: Bảo trợ >= Đại Sứ)
    },
    THRESHOLDS: {
        RANK_UP_STARTUP: 9900000, // 9.9 Triệu để lên Khởi Nghiệp
        POINT_RATIO: 100000       // 100k VNĐ = 1 Nexus Point
    }
};

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. KHỞI TẠO SUPABASE ADMIN (Service Role)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 2. NHẬN WEBHOOK PAYLOAD
        const payload = await req.json();
        console.log("🐝 The Bee Woke Up! Payload:", payload);

        // Chỉ chạy khi Order chuyển sang 'completed' (Đã thanh toán)
        const record = payload.record; // Dữ liệu dòng 'orders'
        const oldRecord = payload.old_record;

        // Chặn trùng lặp & kiểm tra trạng thái
        if (record.status !== 'completed') {
            return new Response(JSON.stringify({ message: "Order not completed yet." }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Nếu đơn hàng đã hoàn thành trước đó rồi thì bỏ qua (Idempotency)
        if (oldRecord && oldRecord.status === 'completed') {
            return new Response(JSON.stringify({ message: "Already processed." }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const orderId = record.id;
        const userId = record.user_id;
        const orderTotal = Number(record.total_vnd);

        // 3. LẤY THÔNG TIN NGƯỜI MUA (BUYER)
        const { data: buyer, error: buyerError } = await supabaseAdmin
            .from('profiles')
            .select('id, role, rank_level, sponsor_id, email, full_name')
            .eq('id', userId)
            .single();

        if (buyerError || !buyer) throw new Error("Buyer profile not found");

        // --- LOGIC A: TÍNH HOA HỒNG TRỰC TIẾP (DIRECT COMMISSION) ---
        // Luật: CTV -> 21%, Khởi Nghiệp trở lên -> 25%
        let commissionRate = POLICY.COMMISSION.DIRECT_CTV;
        if (buyer.rank_level <= POLICY.RANKS.STARTUP.level) {
            commissionRate = POLICY.COMMISSION.DIRECT_STARTUP;
        }

        const directCommissionAmount = orderTotal * commissionRate;

        // Ghi nhận giao dịch Hoa hồng
        await supabaseAdmin.from('transactions').insert({
            user_id: buyer.id,
            amount: directCommissionAmount,
            type: 'cashback', // Hoặc 'commission'
            description: `Hoa hồng bán lẻ (${commissionRate * 100}%) đơn hàng #${orderId.slice(0, 8)}`,
            metadata: { order_id: orderId, rate: commissionRate }
        });

        // Cộng tiền vào Ví (Pending Cashback)
        await supabaseAdmin.rpc('increment_wallet_cashback', {
            user_uuid: buyer.id,
            amount_add: directCommissionAmount
        });

        // --- LOGIC B: ĐÀO POINT (NEXUS POINTS) ---
        // Luật: 100k = 1 Point
        const pointsEarned = Math.floor(orderTotal / POLICY.THRESHOLDS.POINT_RATIO);
        if (pointsEarned > 0) {
            await supabaseAdmin.from('transactions').insert({
                user_id: buyer.id,
                amount: pointsEarned,
                type: 'earn_mining',
                description: `Thưởng Point mua hàng đơn #${orderId.slice(0, 8)}`,
                metadata: { order_id: orderId }
            });

            // Cộng Point vào Ví
            await supabaseAdmin.rpc('increment_wallet_point', {
                user_uuid: buyer.id,
                amount_add: pointsEarned
            });
        }

        // --- LOGIC C: THĂNG CẤP TỰ ĐỘNG (RANK UP) ---
        // Luật: Tổng doanh thu >= 9.9tr và đang là CTV -> Lên Khởi Nghiệp
        if (buyer.role === 'ctv' || buyer.rank_level === 8) {
            // Tính tổng doanh thu trọn đời (bao gồm đơn vừa xong)
            const { data: orders } = await supabaseAdmin
                .from('orders')
                .select('total_vnd')
                .eq('user_id', buyer.id)
                .eq('status', 'completed');

            const lifetimeSales = orders?.reduce((sum, o) => sum + Number(o.total_vnd), 0) || 0;

            if (lifetimeSales >= POLICY.THRESHOLDS.RANK_UP_STARTUP) {
                // Cập nhật lên Khởi Nghiệp
                await supabaseAdmin.from('profiles').update({
                    role: 'startup',
                    rank_level: POLICY.RANKS.STARTUP.level
                }).eq('id', buyer.id);

                console.log(`🚀 User ${buyer.email} upgraded to STARTUP!`);

                // Gửi thông báo (Giả lập hoặc dùng Resend ở đây)
                // await sendEmail(buyer.email, "Chúc mừng thăng hạng Khởi Nghiệp!");
            }
        }

        // --- LOGIC D: HOA HỒNG QUẢN LÝ (SPONSOR BONUS) ---
        // Luật: Người bảo trợ >= Đại Sứ (Level 6) nhận 8% doanh thu F1
        if (buyer.sponsor_id) {
            const { data: sponsor } = await supabaseAdmin
                .from('profiles')
                .select('id, role, rank_level')
                .eq('id', buyer.sponsor_id)
                .single();

            if (sponsor) {
                // Chỉ Đại Sứ (Level 6) trở lên (số càng nhỏ level càng cao) mới được nhận
                if (sponsor.rank_level <= POLICY.RANKS.AMBASSADOR.level) {
                    const sponsorBonus = orderTotal * POLICY.COMMISSION.SPONSOR_BONUS;

                    await supabaseAdmin.from('transactions').insert({
                        user_id: sponsor.id,
                        amount: sponsorBonus,
                        type: 'referral_bonus',
                        description: `Thưởng quản lý 8% từ F1 (${buyer.full_name}) đơn #${orderId.slice(0, 8)}`,
                        metadata: { order_id: orderId, source_user_id: buyer.id }
                    });

                    // Cộng tiền vào Ví Sponsor
                    await supabaseAdmin.rpc('increment_wallet_cashback', {
                        user_uuid: sponsor.id,
                        amount_add: sponsorBonus
                    });

                    console.log(`💰 Sponsor ${sponsor.id} received bonus: ${sponsorBonus}`);
                }
            }
        }

        return new Response(JSON.stringify({ success: true, points: pointsEarned }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("❌ Agent The Bee Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
