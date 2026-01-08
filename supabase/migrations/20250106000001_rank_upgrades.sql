-- ============================================================================
-- Admin 3.1: Dynamic Rank Upgrades
-- ============================================================================
-- Add default rank upgrade rules to policy_config
-- This enables admins to configure ALL rank upgrades (not just CTV -> Khởi Nghiệp)
-- ============================================================================

-- Update existing policy_config to include rankUpgrades array
UPDATE policy_config
SET value = jsonb_set(
  value,
  '{rankUpgrades}',
  '[
    {
      "fromRank": 8,
      "toRank": 7,
      "name": "CTV → Khởi Nghiệp",
      "conditions": {
        "salesRequired": 9900000
      }
    },
    {
      "fromRank": 7,
      "toRank": 6,
      "name": "Khởi Nghiệp → Đại Sứ",
      "conditions": {
        "salesRequired": 50000000,
        "teamVolumeRequired": 100000000,
        "directDownlinesRequired": 3
      }
    },
    {
      "fromRank": 6,
      "toRank": 5,
      "name": "Đại Sứ → Đại Sứ Silver",
      "conditions": {
        "salesRequired": 100000000,
        "teamVolumeRequired": 300000000,
        "directDownlinesRequired": 5,
        "minDownlineRank": 7
      }
    },
    {
      "fromRank": 5,
      "toRank": 4,
      "name": "Đại Sứ Silver → Đại Sứ Gold",
      "conditions": {
        "salesRequired": 300000000,
        "teamVolumeRequired": 1000000000,
        "directDownlinesRequired": 10,
        "minDownlineRank": 6
      }
    },
    {
      "fromRank": 4,
      "toRank": 3,
      "name": "Đại Sứ Gold → Đại Sứ Diamond",
      "conditions": {
        "salesRequired": 1000000000,
        "teamVolumeRequired": 5000000000,
        "directDownlinesRequired": 20,
        "minDownlineRank": 5
      }
    },
    {
      "fromRank": 3,
      "toRank": 2,
      "name": "Đại Sứ Diamond → Phượng Hoàng",
      "conditions": {
        "salesRequired": 5000000000,
        "teamVolumeRequired": 20000000000,
        "directDownlinesRequired": 50,
        "minDownlineRank": 4
      }
    },
    {
      "fromRank": 2,
      "toRank": 1,
      "name": "Phượng Hoàng → Thiên Long",
      "conditions": {
        "salesRequired": 10000000000,
        "teamVolumeRequired": 50000000000,
        "directDownlinesRequired": 100,
        "minDownlineRank": 3
      }
    }
  ]'::jsonb
)
WHERE key = 'global_policy';

-- Comment on the new structure
COMMENT ON TABLE policy_config IS 'Stores dynamic policy configurations for Bee 3.0 (commission rates, thresholds, rank upgrades, etc.)';
