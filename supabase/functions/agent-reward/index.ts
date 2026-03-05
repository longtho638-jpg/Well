 
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { calculateOverrideCommissions } from "../_shared/commission/override-calculator.ts";
import { checkAndPerformRankUpgrade } from "../_shared/commission/rank-upgrade.ts";

// --- POLICY ENGINE v3.0 ---
const DEFAULT_POLICY = {
    RANKS: { THIEN_LONG: 1, PHUONG_HOANG: 2, DAI_SU_DIAMOND: 3, DAI_SU_GOLD: 4, DAI_SU_SILVER: 5, DAI_SU: 6, KHOI_NGHIEP: 7, CTV: 8 },
    COMMISSION_RATES: { CTV: 0.21, LEADER: 0.25 },
    F1_BONUS_RATE: 0.08,
    UPGRADE_THRESHOLD_STARTUP: 9900000,
    POINT_CONVERSION: 100000,
    rankUpgrades: [],
    OVERRIDES: {
        F2: { minRankId: 4, percent: 0.05, teamVolumeThreshold: 50000000 },
        F3: { minRankId: 3, percent: 0.03, teamVolumeThreshold: 200000000 },
        F4: { minRankId: 2, percent: 0.02, teamVolumeThreshold: 500000000 },
        F5: { minRankId: 1, percent: 0.01, teamVolumeThreshold: 1000000000 }
    }
};

async function fetchPolicyConfig(supabase: SupabaseClient) {
    try {
        const { data, error } = await supabase.from('policy_config').select('value').eq('key', 'global_policy').single();
        if (error || !data) {
            console.warn('[PolicyEngine] Using default policy:', error);
            return DEFAULT_POLICY;
        }
        const config = data.value;
        return {
            RANKS: DEFAULT_POLICY.RANKS,
            COMMISSION_RATES: {
                CTV: (config.beeAgentPolicy?.ctvCommission || 21) / 100,
                LEADER: (config.beeAgentPolicy?.startupCommission || 25) / 100
            },
            F1_BONUS_RATE: (config.beeAgentPolicy?.sponsorBonus || 8) / 100,
            UPGRADE_THRESHOLD_STARTUP: config.beeAgentPolicy?.rankUpThreshold || 9900000,
            POINT_CONVERSION: 100000,
            rankUpgrades: config.rankUpgrades || [],
            OVERRIDES: config.overrideConfig || DEFAULT_POLICY.OVERRIDES
        };
    } catch (err) {
        console.error('[PolicyEngine] Error fetching config:', err);
        return DEFAULT_POLICY;
    }
}

serve(async (req) => {
    try {
        const secret = req.headers.get("x-webhook-secret");
        const expectedSecret = Deno.env.get("WEBHOOK_SECRET");
        if (!expectedSecret) {
            console.error("[Security] WEBHOOK_SECRET not configured");
            return new Response("Server error", { status: 500 });
        }
        if (secret !== expectedSecret) {
            console.error("[Security] Invalid Webhook Secret");
            return new Response("Unauthorized", { status: 401 });
        }

        const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
        const POLICY = await fetchPolicyConfig(supabase);

        const { record, old_record } = await req.json();
        if (record.status !== "completed" || old_record?.status === "completed") {
            return new Response("Skipped", { status: 200 });
        }

        const orderId = record.id;
        const userId = record.user_id;
        const orderTotal = Number(record.total_vnd);

        if (!userId) {
            return new Response(JSON.stringify({ success: true, message: "Guest order skipped" }), { headers: { "Content-Type": "application/json" } });
        }

        const { data: existingCommissions } = await supabase.from("transactions").select("id").eq("user_id", userId).eq("type", "direct_commission").like("description", `%${orderId}%`).limit(1);
        if (existingCommissions && existingCommissions.length > 0) {
            return new Response(JSON.stringify({ success: true, message: "Already processed" }), { headers: { "Content-Type": "application/json" } });
        }

        const { data: buyer, error: profileError } = await supabase.from("profiles").select("id, role, role_id, sponsor_id").eq("id", userId).single();
        if (profileError || !buyer) {
            return new Response(JSON.stringify({ success: true, message: "Profile not ready" }), { headers: { "Content-Type": "application/json" } });
        }

        const buyerRoleId = buyer.role_id || POLICY.RANKS.CTV;
        const directRate = buyerRoleId <= POLICY.RANKS.KHOI_NGHIEP ? POLICY.COMMISSION_RATES.LEADER : POLICY.COMMISSION_RATES.CTV;
        const directCommission = orderTotal * directRate;

        await supabase.from("transactions").insert({ user_id: userId, amount: directCommission, type: "direct_commission", description: `Hoa hồng bán lẻ ${directRate * 100}% đơn hàng ${orderId}`, status: "completed" });
        await supabase.rpc("increment_pending_balance", { x_user_id: userId, x_amount: directCommission });

        const pointsEarned = Math.floor(orderTotal / POLICY.POINT_CONVERSION);
        if (pointsEarned > 0) {
            await supabase.from("transactions").insert({ user_id: userId, amount: pointsEarned, type: "earn_mining", description: `Mining reward từ đơn hàng ${orderId}`, status: "completed" });
            await supabase.rpc("increment_point_balance", { x_user_id: userId, x_amount: pointsEarned });
        }

        if (buyer.sponsor_id) {
            const { data: sponsor } = await supabase.from("profiles").select("id, role_id").eq("id", buyer.sponsor_id).single();
            if (sponsor && (sponsor.role_id || POLICY.RANKS.CTV) <= POLICY.RANKS.DAI_SU) {
                const f1Bonus = orderTotal * POLICY.F1_BONUS_RATE;
                await supabase.from("transactions").insert({ user_id: sponsor.id, amount: f1Bonus, type: "sponsor_bonus", description: `Thưởng 8% F1 từ đơn hàng của user ${userId}`, status: "completed" });
                await supabase.rpc("increment_pending_balance", { x_user_id: sponsor.id, x_amount: f1Bonus });
            }
        }

        await calculateOverrideCommissions(supabase, userId, buyer.sponsor_id, orderTotal, orderId, POLICY);
        await checkAndPerformRankUpgrade(supabase, userId, buyerRoleId, POLICY.rankUpgrades);

        return new Response(JSON.stringify({ success: true, message: "Reward processed" }), { headers: { "Content-Type": "application/json" } });
    } catch (error) {
        console.error("[TheBee Error]:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), { status: 500 });
    }
});
