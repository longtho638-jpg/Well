import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- POLICY ENGINE v3.0: DYNAMIC CONFIGURATION ---
// Policies are now fetched from the database in real-time.
// Default fallback values are provided for safety.

const DEFAULT_POLICY = {
    // Cấp bậc (Mapping ID từ 1-8 theo file CSV)
    RANKS: {
        THIEN_LONG: 1,
        PHUONG_HOANG: 2,
        DAI_SU_DIAMOND: 3,
        DAI_SU_GOLD: 4,
        DAI_SU_SILVER: 5,
        DAI_SU: 6,         // Mốc bắt đầu hưởng F1 8%
        KHOI_NGHIEP: 7,    // Mốc hưởng Max hoa hồng trực tiếp 25%
        CTV: 8             // Mốc thấp nhất 21%
    },

    // Hoa hồng bán lẻ trực tiếp (Direct Commission)
    COMMISSION_RATES: {
        CTV: 0.21,         // 21% cho CTV (Row 8)
        LEADER: 0.25       // 25% cho Khởi Nghiệp trở lên (Row 7)
    },

    // Hoa hồng quản lý F1 (Sponsor Bonus)
    F1_BONUS_RATE: 0.08, // 8% trên doanh số F1 (Áp dụng từ Đại Sứ trở lên)

    // Điều kiện thăng cấp (Rank Up)
    UPGRADE_THRESHOLD_STARTUP: 9900000, // 9.9 Triệu VND (Row 7)

    // Tỷ lệ đổi điểm (Mining Point)
    POINT_CONVERSION: 100000, // 100k VND = 1 Point

    // Admin 3.1: Dynamic Rank Upgrades (fallback to empty)
    rankUpgrades: []
};

/**
 * Fetch policy configuration from database
 * Falls back to default values if fetch fails
 */
async function fetchPolicyConfig(supabase: SupabaseClient) {
    try {
        const { data, error } = await supabase
            .from('policy_config')
            .select('value')
            .eq('key', 'global_policy')
            .single();

        if (error || !data) {
            console.warn('[PolicyEngine] Using default policy (DB fetch failed):', error);
            return DEFAULT_POLICY;
        }

        const config = data.value;

        // Map database config to POLICY structure
        return {
            RANKS: DEFAULT_POLICY.RANKS, // Ranks are static
            COMMISSION_RATES: {
                CTV: (config.beeAgentPolicy?.ctvCommission || 21) / 100,
                LEADER: (config.beeAgentPolicy?.startupCommission || 25) / 100
            },
            F1_BONUS_RATE: (config.beeAgentPolicy?.sponsorBonus || 8) / 100,
            UPGRADE_THRESHOLD_STARTUP: config.beeAgentPolicy?.rankUpThreshold || 9900000,
            POINT_CONVERSION: 100000, // Fixed
            rankUpgrades: config.rankUpgrades || [] // Admin 3.1: Dynamic rank upgrades
        };
    } catch (err) {
        console.error('[PolicyEngine] Error fetching config:', err);
        return DEFAULT_POLICY;
    }
}


serve(async (req) => {
    try {
        // SECURITY: Verify Webhook Secret (mandatory — reject if not configured)
        const secret = req.headers.get("x-webhook-secret");
        const expectedSecret = Deno.env.get("WEBHOOK_SECRET");

        if (!expectedSecret) {
            console.error("[Security] WEBHOOK_SECRET is not configured");
            return new Response("Server configuration error", { status: 500 });
        }

        if (secret !== expectedSecret) {
            console.error("[Security] Invalid Webhook Secret");
            return new Response("Unauthorized", { status: 401 });
        }

        // 1. Khởi tạo Supabase Admin Client (Bypass RLS)
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 🆕 1.5. Fetch Dynamic Policy from Database (Policy Engine v3.0)
        const POLICY = await fetchPolicyConfig(supabase);
        console.log('[PolicyEngine] Loaded policy:', {
            CTV: POLICY.COMMISSION_RATES.CTV,
            LEADER: POLICY.COMMISSION_RATES.LEADER,
            F1: POLICY.F1_BONUS_RATE,
            UPGRADE: POLICY.UPGRADE_THRESHOLD_STARTUP
        });

        // 2. Nhận dữ liệu từ Webhook (Khi Order Status -> 'completed')
        const { record, old_record } = await req.json();

        // Chỉ chạy khi đơn hàng mới chuyển sang 'completed'
        if (record.status !== "completed" || old_record?.status === "completed") {
            return new Response("Skipped: Not a new completion", { status: 200 });
        }

        const orderId = record.id;
        const userId = record.user_id;
        const orderTotal = Number(record.total_vnd);

        // IDEMPOTENCY GUARD: Check if commission already paid for this order
        // Use .limit(1) without .single() to avoid PGRST116 when multiple rows exist
        const { data: existingCommissions } = await supabase
            .from("transactions")
            .select("id")
            .eq("user_id", userId)
            .eq("type", "direct_commission")
            .like("description", `%${orderId}%`)
            .limit(1);

        if (existingCommissions && existingCommissions.length > 0) {
            console.warn(`[TheBee] Commission already paid for order ${orderId}. Skipping duplicate.`);
            return new Response(JSON.stringify({ success: true, message: "Already processed" }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        console.log(`[TheBee] Processing Order: ${orderId} - Total: ${orderTotal}`);

        // 3. Lấy thông tin người mua (Buyer) và Người bảo trợ (Sponsor)
        // Note: Using 'users' table directly or 'profiles' view if created.
        // The migration created a 'profiles' view mapping to 'users'.
        const { data: buyer, error: profileError } = await supabase
            .from("profiles")
            .select("id, role, role_id, sponsor_id") // role_id là số 1-8
            .eq("id", userId)
            .single();

        if (profileError || !buyer) {
            console.error("Buyer profile error:", profileError);
            throw new Error("Buyer profile not found");
        }

        // --- LOGIC 1: TÍNH HOA HỒNG TRỰC TIẾP (DIRECT SALES) ---
        // Rule: CTV (8) = 21%, Khởi Nghiệp (7) trở lên = 25%
        let directRate = POLICY.COMMISSION_RATES.CTV;
        // Default to CTV if role_id is missing or null
        const buyerRoleId = buyer.role_id || POLICY.RANKS.CTV;

        if (buyerRoleId <= POLICY.RANKS.KHOI_NGHIEP) {
            directRate = POLICY.COMMISSION_RATES.LEADER;
        }

        const directCommission = orderTotal * directRate;

        // Ghi nhận giao dịch hoa hồng cho chính người mua (Cashback/Discount)
        await supabase.from("transactions").insert({
            user_id: userId,
            amount: directCommission,
            type: "direct_commission", // Loại: Bán hàng trực tiếp
            description: `Hoa hồng bán lẻ ${directRate * 100}% đơn hàng ${orderId}`,
            status: "completed"
        });

        // Cộng tiền vào ví pending của Buyer
        await supabase.rpc("increment_pending_balance", {
            x_user_id: userId,
            x_amount: directCommission
        });

        // Send commission earned email (direct commission)
        try {
            const { data: userData } = await supabase
                .from('users')
                .select('email, full_name, pending_cashback')
                .eq('id', userId)
                .single();

            if (userData?.email) {
                await supabase.functions.invoke('send-email', {
                    body: {
                        to: userData.email,
                        subject: `💰 Bạn vừa nhận ${(directCommission).toLocaleString('vi-VN')} VND hoa hồng!`,
                        templateType: 'commission-earned',
                        data: {
                            userName: userData.full_name || 'Bạn',
                            commissionAmount: `${directCommission.toLocaleString('vi-VN')} VND`,
                            commissionType: 'direct',
                            orderId: orderId,
                            currentBalance: `${(userData.pending_cashback || 0).toLocaleString('vi-VN')} VND`,
                            commissionRate: `${(directRate * 100).toFixed(0)}%`
                        }
                    }
                });
                console.log(`[Email] Direct commission email sent to ${userData.email}`);
            }
        } catch (emailError) {
            console.error('[Email] Failed to send direct commission email:', emailError);
        }

        // --- LOGIC 2: TÍNH ĐIỂM THƯỞNG (NEXUS POINTS) ---
        // Rule: 100k = 1 Point
        const pointsEarned = Math.floor(orderTotal / POLICY.POINT_CONVERSION);
        if (pointsEarned > 0) {
            await supabase.from("transactions").insert({
                user_id: userId,
                amount: pointsEarned,
                type: "earn_mining",
                description: `Mining reward từ đơn hàng ${orderId}`,
                status: "completed"
            });

            // Update ví Point
            await supabase.rpc("increment_point_balance", {
                x_user_id: userId,
                x_amount: pointsEarned
            });
        }

        // --- LOGIC 3: TÍNH THƯỞNG F1 (SPONSOR BONUS) ---
        // Rule: Sponsor phải từ Đại Sứ (Rank 6) trở lên mới được 8%
        if (buyer.sponsor_id) {
            const { data: sponsor } = await supabase
                .from("profiles")
                .select("id, role_id")
                .eq("id", buyer.sponsor_id)
                .single();

            if (sponsor) {
                const sponsorRoleId = sponsor.role_id || POLICY.RANKS.CTV;
                // Kiểm tra điều kiện Rank của Sponsor (<= 6)
                if (sponsorRoleId <= POLICY.RANKS.DAI_SU) {
                    const f1Bonus = orderTotal * POLICY.F1_BONUS_RATE;

                    await supabase.from("transactions").insert({
                        user_id: sponsor.id,
                        amount: f1Bonus,
                        type: "sponsor_bonus", // Loại: Thưởng quản lý
                        description: `Thưởng 8% F1 từ đơn hàng của user ${userId}`,
                        status: "completed"
                    });

                    // Cộng tiền vào ví pending của Sponsor
                    await supabase.rpc("increment_pending_balance", {
                        x_user_id: sponsor.id,
                        x_amount: f1Bonus
                    });

                    console.log(`[Bonus] Paid ${f1Bonus} to Sponsor ${sponsor.id}`);

                    // Send F1 bonus email to sponsor
                    try {
                        const { data: sponsorData } = await supabase
                            .from('users')
                            .select('email, full_name, pending_cashback')
                            .eq('id', sponsor.id)
                            .single();

                        const { data: buyerData } = await supabase
                            .from('users')
                            .select('full_name')
                            .eq('id', userId)
                            .single();

                        if (sponsorData?.email) {
                            await supabase.functions.invoke('send-email', {
                                body: {
                                    to: sponsorData.email,
                                    subject: `🎁 Thưởng F1: ${f1Bonus.toLocaleString('vi-VN')} VND từ ${buyerData?.full_name || 'thành viên'}`,
                                    templateType: 'commission-earned',
                                    data: {
                                        userName: sponsorData.full_name || 'Bạn',
                                        commissionAmount: `${f1Bonus.toLocaleString('vi-VN')} VND`,
                                        commissionType: 'sponsor',
                                        orderId: orderId,
                                        fromUserName: buyerData?.full_name || 'Thành viên F1',
                                        currentBalance: `${(sponsorData.pending_cashback || 0).toLocaleString('vi-VN')} VND`,
                                        commissionRate: '8%'
                                    }
                                }
                            });
                            console.log(`[Email] F1 bonus email sent to ${sponsorData.email}`);
                        }
                    } catch (emailError) {
                        console.error('[Email] Failed to send F1 bonus email:', emailError);
                    }
                } else {
                    console.log(`[Bonus] Sponsor ${sponsor.id} rank ${sponsorRoleId} too low for F1 bonus (Requires <= 6)`);
                }
            }
        }


        // --- LOGIC 4: KIỂM TRA THĂNG CẤP (RANK UP) - ADMIN 3.1: DYNAMIC ---
        //Check ALL possible rank upgrades based on dynamic policy
        interface RankUpgrade {
            fromRank: number;
            name: string;
            conditions: {
                salesRequired?: number;
                teamVolumeRequired?: number;
                directDownlinesRequired?: number;
                minDownlineRank?: number;
            };
            toRank: number;
        }
        const rankUpgrades = (POLICY.rankUpgrades || []) as RankUpgrade[];

        // Find applicable upgrade for current user rank
        const applicableUpgrade = rankUpgrades.find(
            (upgrade) => upgrade.fromRank === buyerRoleId
        );

        if (applicableUpgrade) {
            console.log(`[RankUp] Checking upgrade: ${applicableUpgrade.name}`);

            // Calculate lifetime sales
            const { data: orders } = await supabase
                .from('orders')
                .select('total_vnd')
                .eq('user_id', userId)
                .eq('status', 'completed');

            const lifetimeSales = orders?.reduce((sum: number, o: { total_vnd: string | number }) => sum + Number(o.total_vnd), 0) || 0;

            // Get user's team volume
            const { data: userData } = await supabase
                .from('users')
                .select('team_volume')
                .eq('id', userId)
                .single();

            const teamVolume = userData?.team_volume || 0;

            // Count direct downlines
            const { data: downlines } = await supabase
                .from('users')
                .select('id, role_id')
                .eq('sponsor_id', userId);

            const directDownlinesCount = downlines?.length || 0;

            // Check if downlines meet minimum rank requirement
            let meetsDownlineRankRequirement = true;
            if (applicableUpgrade.conditions.minDownlineRank) {
                const qualifiedDownlines = downlines?.filter(
                    (d: { id: string; role_id: number }) => d.role_id <= applicableUpgrade.conditions.minDownlineRank!
                ) || [];
                meetsDownlineRankRequirement = qualifiedDownlines.length >= (applicableUpgrade.conditions.directDownlinesRequired || 0);
            }

            // Multi-condition check (AND logic)
            const conditions = applicableUpgrade.conditions;
            const meetsSales = !conditions.salesRequired || lifetimeSales >= conditions.salesRequired;
            const meetsTeamVolume = !conditions.teamVolumeRequired || teamVolume >= conditions.teamVolumeRequired;
            const meetsDownlines = !conditions.directDownlinesRequired || directDownlinesCount >= conditions.directDownlinesRequired;

            console.log(`[RankUp] Conditions Check:`, {
                sales: `${lifetimeSales} >= ${conditions.salesRequired || 0} (${meetsSales})`,
                teamVolume: `${teamVolume} >= ${conditions.teamVolumeRequired || 0} (${meetsTeamVolume})`,
                downlines: `${directDownlinesCount} >= ${conditions.directDownlinesRequired || 0} (${meetsDownlines})`,
                downlineRank: meetsDownlineRankRequirement
            });

            if (meetsSales && meetsTeamVolume && meetsDownlines && meetsDownlineRankRequirement) {
                // Perform upgrade
                const rankNames = {
                    7: 'Khởi Nghiệp',
                    6: 'Đại Sứ',
                    5: 'Đại Sứ Silver',
                    4: 'Đại Sứ Gold',
                    3: 'Đại Sứ Diamond',
                    2: 'Phượng Hoàng',
                    1: 'Thiên Long'
                };

                await supabase
                    .from('users')
                    .update({
                        rank: rankNames[applicableUpgrade.toRank as keyof typeof rankNames] || 'Unknown',
                        role_id: applicableUpgrade.toRank
                    })
                    .eq('id', userId);

                console.log(`[RankUp] ✅ User ${userId} upgraded: ${applicableUpgrade.name} (${buyerRoleId} → ${applicableUpgrade.toRank})`);

                // Send rank upgrade celebration email
                try {
                    const oldRankName = rankNames[buyerRoleId as keyof typeof rankNames] || 'CTV';
                    const newRankName = rankNames[applicableUpgrade.toRank as keyof typeof rankNames] || 'Unknown';

                    const { data: userEmail } = await supabase
                        .from('users')
                        .select('email, full_name')
                        .eq('id', userId)
                        .single();

                    if (userEmail?.email) {
                        const emailPayload = {
                            to: userEmail.email,
                            subject: `🎉 Chúc mừng! Bạn đã thăng hạng lên ${newRankName}!`,
                            userName: userEmail.full_name || 'Bạn',
                            oldRank: oldRankName,
                            newRank: newRankName,
                            newRankId: applicableUpgrade.toRank,
                            achievementDate: new Date().toLocaleDateString('vi-VN'),
                            newCommissionRate: applicableUpgrade.toRank <= 7 ? '25%' : '21%',
                            newBenefits: applicableUpgrade.toRank <= 6
                                ? ['Nhận 8% thưởng quản lý F1', 'Ưu tiên hỗ trợ VIP', 'Tham gia chương trình đào tạo cao cấp']
                                : ['Hoa hồng cao hơn', 'Công cụ hỗ trợ bán hàng'],
                            lifetimeSales: lifetimeSales ? `${lifetimeSales.toLocaleString('vi-VN')} VND` : undefined,
                            teamVolume: teamVolume ? `${teamVolume.toLocaleString('vi-VN')} VND` : undefined
                        };

                        await supabase.functions.invoke('send-email', {
                            body: {
                                to: emailPayload.to,
                                subject: emailPayload.subject,
                                templateType: 'rank-upgrade',
                                data: emailPayload
                            }
                        });

                        console.log(`[Email] Rank upgrade email sent to ${userEmail.email}`);
                    }
                } catch (emailError) {
                    console.error('[Email] Failed to send rank upgrade email:', emailError);
                    // Don't fail the whole request if email fails
                }
            } else {
                console.log(`[RankUp] User ${userId} not ready for upgrade yet`);
            }
        }


        return new Response(JSON.stringify({ success: true, message: "Reward processed" }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("[TheBee Error]:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
