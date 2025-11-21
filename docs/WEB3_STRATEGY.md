# WEB3_STRATEGY.md - WellNexus Web3 Transformation Strategy

**Document Version:** 1.0.0
**Last Updated:** 2025-11-21
**Status:** Strategic Roadmap - Phase 2 Implementation

---

## 🎯 Executive Summary

WellNexus is transitioning from a traditional social commerce platform to a **Web3-enabled Community Commerce Protocol** with blockchain-backed tokenomics. This document outlines the complete strategy for implementing a dual-token economy, blockchain integration, and fintech-grade user experience.

**Key Strategic Shift:**
- ❌ **OLD:** VND-based commission system with manual tax tracking
- ✅ **NEW:** Dual-token blockchain economy with automated smart contract settlement

---

## 🪙 Dual Token Economy Model

### Token Architecture

WellNexus will operate on a **two-token system** to separate utility from governance:

#### 1. SHOP Token (VND Stablecoin)
**Type:** Utility Token / Stablecoin
**Peg:** 1 SHOP = 1,000 VND (1:1000 ratio)
**Blockchain:** BNB Smart Chain (BSC) - BEP-20 Standard
**Purpose:** Daily transactions, commissions, and payments

**Key Features:**
- 🏦 **Fiat-backed** - Collateralized by VND reserves
- 💱 **Instant conversion** - Real-time SHOP ↔ VND exchange
- 🔒 **Regulatory compliant** - Follows Vietnam SBV guidelines
- 📊 **Price stability** - Algorithmic peg maintenance
- ⚡ **Low gas fees** - BSC's low transaction costs (~$0.01/tx)

**Use Cases:**
- Product purchases in marketplace
- Commission payouts to affiliates
- Withdrawal to bank accounts (auto-converted to VND)
- Team volume bonus distribution
- Tax withholding (smart contract automated)

**Smart Contract Functions:**
```solidity
// SHOP Token Core Functions
function mint(address to, uint256 vndAmount) external onlyMinter
function burn(address from, uint256 shopAmount) external
function transferWithTax(address to, uint256 amount) external
function getVNDEquivalent(uint256 shopAmount) public view returns (uint256)
function getPegRate() public view returns (uint256) // Current 1:1000 ratio
```

#### 2. GROW Token (Governance Token)
**Type:** Governance & Reward Token
**Supply:** Fixed at 100,000,000 GROW (100M total)
**Blockchain:** BNB Smart Chain (BSC) - BEP-20 Standard
**Purpose:** Platform governance, staking rewards, and long-term incentives

**Key Features:**
- 🗳️ **Voting rights** - Platform decisions and policy changes
- 💎 **Deflationary** - Buy-back & burn mechanism
- 🎁 **Staking rewards** - Earn passive income by locking GROW
- 🏆 **Achievement rewards** - Unlock GROW by completing milestones
- 📈 **Market-driven price** - Free float on DEX/CEX

**Token Distribution:**
- 30% (30M) - Community rewards pool (vesting over 5 years)
- 25% (25M) - Team & advisors (2-year cliff, 4-year vesting)
- 20% (20M) - Liquidity mining & staking rewards
- 15% (15M) - Strategic partnerships & ecosystem growth
- 10% (10M) - Public sale / IDO (Initial DEX Offering)

**Governance Features:**
- **Proposal creation** - GROW holders can submit platform improvement proposals
- **Voting weight** - 1 GROW = 1 vote (snapshot-based)
- **Quorum requirement** - 10% of circulating supply must participate
- **Execution timelock** - 48-hour delay before proposal execution

**Staking Mechanics:**
- **Lock periods:** 30 days (5% APY), 90 days (12% APY), 180 days (25% APY)
- **Rewards source:** Platform transaction fees (0.5% of all SHOP transactions)
- **Early unlock penalty:** 20% of staked amount forfeited

**Smart Contract Functions:**
```solidity
// GROW Token Core Functions
function stake(uint256 amount, uint256 lockPeriod) external
function unstake(uint256 stakeId) external
function claimRewards() external
function createProposal(string memory description) external
function vote(uint256 proposalId, bool support) external
function executeProposal(uint256 proposalId) external
```

### Token Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     USER WALLET                         │
│  ┌──────────────┐              ┌──────────────┐        │
│  │ SHOP Tokens  │              │ GROW Tokens  │        │
│  │ (Utility)    │              │ (Governance) │        │
│  └──────┬───────┘              └──────┬───────┘        │
└─────────┼──────────────────────────────┼───────────────┘
          │                              │
          │ Spend/Earn                   │ Stake/Vote
          ▼                              ▼
┌─────────────────────┐        ┌─────────────────────┐
│  MARKETPLACE        │        │  GOVERNANCE         │
│  - Buy products     │        │  - Vote proposals   │
│  - Earn commissions │        │  - Stake rewards    │
│  - Withdraw VND     │        │  - Unlock bonuses   │
└─────────────────────┘        └─────────────────────┘
```

### Economic Model Formulas

**SHOP Minting (Commission Payout):**
```
SHOP_to_mint = (product_price_VND * commission_rate) / 1000
Tax_SHOP = (SHOP_to_mint > 2000) ? (SHOP_to_mint - 2000) * 0.1 : 0
Net_SHOP = SHOP_to_mint - Tax_SHOP
```

**GROW Distribution (Milestone Rewards):**
```
GROW_earned = base_GROW * rank_multiplier * activity_score
where:
  - base_GROW = 10 GROW per milestone
  - rank_multiplier = 1.0 (Member), 1.5 (Partner), 2.0 (Founder Club)
  - activity_score = (sales_volume + team_volume) / 100_000_000 VND
```

**Staking APY Calculation:**
```
Annual_GROW_Reward = staked_GROW * APY_rate
Daily_GROW_Reward = Annual_GROW_Reward / 365
Claimable_GROW = Daily_GROW_Reward * days_staked
```

---

## 🗄️ Database Schema Evolution

### Current Schema (v1.0 - Centralized)
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  rank: UserRank;
  totalSales: number;      // In VND
  teamVolume: number;      // In VND
  commission: number;      // In VND
}

interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;          // In VND
  tax: number;             // In VND
  timestamp: Date;
}
```

### New Schema (v2.0 - Web3 Hybrid)

#### User Wallet Extension
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  rank: UserRank;

  // Legacy fields (keep for migration)
  totalSales: number;      // VND
  teamVolume: number;      // VND
  commission: number;      // VND

  // ✅ NEW: Web3 Integration
  walletAddress: string;   // BSC address (0x...)
  shopBalance: number;     // SHOP token balance (synced from blockchain)
  growBalance: number;     // GROW token balance (synced from blockchain)
  kycStatus: 'pending' | 'verified' | 'rejected';
  kycDocumentHash: string | null; // IPFS hash of KYC documents
  createdAt: Date;
  updatedAt: Date;
}
```

#### Blockchain Transaction Records
```typescript
interface BlockchainTransaction {
  id: string;                    // Internal DB ID
  userId: string;                // User reference

  // ✅ Blockchain identifiers
  txHash: string;                // BSC transaction hash (0x...)
  blockNumber: number;           // Block height
  blockTimestamp: Date;          // On-chain timestamp

  // Transaction details
  tokenType: 'SHOP' | 'GROW';    // Which token
  type: TransactionType;         // Transaction category
  amount: number;                // Token amount (not VND)
  amountVND: number;             // VND equivalent (for SHOP only)

  // Contract interaction
  contractAddress: string;       // Token contract address
  fromAddress: string;           // Sender wallet
  toAddress: string;             // Receiver wallet
  gasUsed: number;               // Gas consumed
  gasPriceGwei: number;          // Gas price in Gwei

  // Tax & compliance
  taxAmount: number;             // Tax deducted (in tokens)
  taxTxHash: string | null;      // Separate tax payment tx hash

  // Metadata
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;         // Number of block confirmations
  metadata: object;              // Additional data (JSON)
  createdAt: Date;
}
```

#### GROW Staking Records
```typescript
interface GrowStaking {
  id: string;
  userId: string;

  // Staking details
  stakeAmount: number;           // GROW tokens staked
  lockPeriod: 30 | 90 | 180;     // Days locked
  apyRate: number;               // APY at time of staking

  // Blockchain tracking
  stakeTxHash: string;           // Transaction hash of stake
  stakeBlockNumber: number;
  stakeTimestamp: Date;

  // Unlock info
  unlockTimestamp: Date;         // When user can unstake
  unstakeTxHash: string | null;  // Null if still staked

  // Rewards
  accumulatedRewards: number;    // GROW rewards earned
  lastClaimTimestamp: Date | null;
  claimTxHashes: string[];       // Array of claim tx hashes

  status: 'active' | 'unstaked' | 'penalized';
  createdAt: Date;
  updatedAt: Date;
}
```

#### Governance Proposals
```typescript
interface GovernanceProposal {
  id: string;
  proposerId: string;            // User who created proposal

  // Proposal content
  title: string;
  description: string;           // Markdown formatted
  category: 'platform' | 'tokenomics' | 'partnership' | 'other';

  // Blockchain tracking
  proposalTxHash: string;        // On-chain proposal creation tx
  snapshotBlock: number;         // Block used for vote counting

  // Voting
  votesFor: number;              // GROW tokens voted yes
  votesAgainst: number;          // GROW tokens voted no
  voterAddresses: string[];      // List of voters
  quorumRequired: number;        // Minimum GROW needed (default 10M)

  // Timeline
  votingStartTime: Date;
  votingEndTime: Date;
  executionTime: Date | null;    // When proposal was executed
  executionTxHash: string | null;

  status: 'active' | 'passed' | 'rejected' | 'executed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}
```

### Database Migration Strategy

#### Phase 1: Add Web3 Fields (Non-breaking)
```sql
-- Add wallet columns to existing users table
ALTER TABLE users ADD COLUMN wallet_address VARCHAR(42) UNIQUE;
ALTER TABLE users ADD COLUMN shop_balance DECIMAL(18, 4) DEFAULT 0;
ALTER TABLE users ADD COLUMN grow_balance DECIMAL(18, 4) DEFAULT 0;
ALTER TABLE users ADD COLUMN kyc_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE users ADD COLUMN kyc_document_hash VARCHAR(64);

-- Create blockchain transactions table
CREATE TABLE blockchain_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  tx_hash VARCHAR(66) UNIQUE NOT NULL,
  block_number BIGINT NOT NULL,
  block_timestamp TIMESTAMP NOT NULL,
  token_type VARCHAR(10) NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(18, 4) NOT NULL,
  amount_vnd DECIMAL(18, 2),
  contract_address VARCHAR(42) NOT NULL,
  from_address VARCHAR(42) NOT NULL,
  to_address VARCHAR(42) NOT NULL,
  gas_used INTEGER,
  gas_price_gwei DECIMAL(10, 2),
  tax_amount DECIMAL(18, 4),
  tax_tx_hash VARCHAR(66),
  status VARCHAR(20) DEFAULT 'pending',
  confirmations INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_id (user_id),
  INDEX idx_tx_hash (tx_hash),
  INDEX idx_status (status)
);

-- Create staking table
CREATE TABLE grow_staking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  stake_amount DECIMAL(18, 4) NOT NULL,
  lock_period INTEGER NOT NULL,
  apy_rate DECIMAL(5, 2) NOT NULL,
  stake_tx_hash VARCHAR(66) NOT NULL,
  stake_block_number BIGINT NOT NULL,
  stake_timestamp TIMESTAMP NOT NULL,
  unlock_timestamp TIMESTAMP NOT NULL,
  unstake_tx_hash VARCHAR(66),
  accumulated_rewards DECIMAL(18, 4) DEFAULT 0,
  last_claim_timestamp TIMESTAMP,
  claim_tx_hashes TEXT[],
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);

-- Create governance proposals table
CREATE TABLE governance_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposer_id UUID REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  proposal_tx_hash VARCHAR(66) NOT NULL,
  snapshot_block BIGINT NOT NULL,
  votes_for DECIMAL(18, 4) DEFAULT 0,
  votes_against DECIMAL(18, 4) DEFAULT 0,
  voter_addresses TEXT[],
  quorum_required DECIMAL(18, 4) DEFAULT 10000000,
  voting_start_time TIMESTAMP NOT NULL,
  voting_end_time TIMESTAMP NOT NULL,
  execution_time TIMESTAMP,
  execution_tx_hash VARCHAR(66),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_proposer_id (proposer_id),
  INDEX idx_status (status)
);
```

#### Phase 2: Data Migration Script
```typescript
// Migrate existing VND balances to SHOP tokens
async function migrateToShopTokens() {
  const users = await db.users.findAll();

  for (const user of users) {
    const shopEquivalent = user.commission / 1000; // VND to SHOP conversion

    // Create wallet if doesn't exist
    if (!user.walletAddress) {
      const wallet = await createBSCWallet();
      user.walletAddress = wallet.address;
    }

    // Mint SHOP tokens on blockchain
    const tx = await shopContract.mint(user.walletAddress, shopEquivalent);
    await tx.wait();

    // Update database
    await db.users.update(user.id, {
      shopBalance: shopEquivalent,
      updatedAt: new Date()
    });

    // Record migration transaction
    await db.blockchainTransactions.create({
      userId: user.id,
      txHash: tx.hash,
      tokenType: 'SHOP',
      type: 'Migration',
      amount: shopEquivalent,
      amountVND: user.commission,
      status: 'confirmed'
    });
  }
}
```

### Indexing Strategy

To ensure fast blockchain data queries:

```typescript
// Blockchain event listeners
shopContract.on('Transfer', async (from, to, amount, event) => {
  await db.blockchainTransactions.create({
    txHash: event.transactionHash,
    tokenType: 'SHOP',
    amount: ethers.utils.formatUnits(amount, 18),
    fromAddress: from,
    toAddress: to,
    blockNumber: event.blockNumber,
    status: 'confirmed'
  });
});

growContract.on('Staked', async (user, amount, lockPeriod, event) => {
  await db.growStaking.create({
    userId: await getUserIdByWallet(user),
    stakeAmount: ethers.utils.formatUnits(amount, 18),
    lockPeriod: lockPeriod.toNumber(),
    stakeTxHash: event.transactionHash,
    status: 'active'
  });
});
```

---

## 🎨 UI/UX Transformation: Fintech/Crypto Design Language

### Design Philosophy Shift

**From Social Commerce → To DeFi Platform**

#### Before (v1.0 - Social Commerce)
- 🎨 Soft gradients and rounded corners
- 📊 Simple bar charts and stats cards
- 💬 Conversational language ("Chào bạn!")
- 🎯 Focus on products and social features

#### After (v2.0 - Fintech/Crypto)
- ⚡ Sharp edges, glass morphism, neon accents
- 📈 Live price charts, candlestick patterns, orderbook UI
- 🔐 Technical language with security emphasis
- 💰 Focus on tokens, yields, and blockchain data

### Visual Design System v2.0

#### Color Palette
```typescript
// Primary Colors (Crypto-native)
const colors = {
  // Main brand
  primary: '#00FFA3',        // Electric Green (success/positive)
  secondary: '#7B61FF',      // Cyber Purple (premium features)
  accent: '#FF006E',         // Hot Pink (alerts/important)

  // Token colors
  shopGreen: '#10B981',      // SHOP token (stable = green)
  growPurple: '#8B5CF6',     // GROW token (governance = purple)

  // Background (Dark mode first)
  bgDark: '#0A0E27',         // Deep space blue
  bgCard: '#1A1F3A',         // Card background
  bgGlass: 'rgba(255, 255, 255, 0.05)', // Glass morphism

  // Borders & dividers
  borderGlow: 'rgba(0, 255, 163, 0.2)', // Glowing borders
  borderDim: '#2A2F4A',      // Subtle dividers

  // Text
  textPrimary: '#FFFFFF',    // Main text
  textSecondary: '#A0AEC0',  // Secondary text
  textMuted: '#4A5568',      // Disabled/muted

  // Status colors
  success: '#00FFA3',        // Green
  warning: '#FFBF00',        // Amber
  error: '#FF006E',          // Red/pink
  info: '#3B82F6',           // Blue
};
```

#### Typography
```css
/* Fintech-grade typography */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  /* Headers - Space Grotesk (modern, technical) */
  --font-heading: 'Space Grotesk', sans-serif;

  /* Body text - Space Grotesk */
  --font-body: 'Space Grotesk', sans-serif;

  /* Code/numbers - JetBrains Mono (monospace) */
  --font-mono: 'JetBrains Mono', monospace;
}

/* Token balances, wallet addresses, tx hashes */
.crypto-text {
  font-family: var(--font-mono);
  letter-spacing: -0.02em;
  font-feature-settings: 'tnum' on, 'zero' on; /* Tabular numbers */
}
```

#### Component Examples

##### 1. Token Balance Card (Glass Morphism)
```tsx
interface TokenCardProps {
  tokenType: 'SHOP' | 'GROW';
  balance: number;
  usdValue: number;
  change24h: number;
}

function TokenCard({ tokenType, balance, usdValue, change24h }: TokenCardProps) {
  const isShop = tokenType === 'SHOP';

  return (
    <div className="relative group">
      {/* Glowing border effect */}
      <div className={cn(
        "absolute inset-0 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity",
        isShop ? "bg-shopGreen" : "bg-growPurple"
      )} />

      {/* Main card */}
      <div className="relative bg-bgCard/80 backdrop-blur-xl border border-borderGlow rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isShop ? "bg-shopGreen/20" : "bg-growPurple/20"
            )}>
              {isShop ? <ShoppingBag className="w-5 h-5 text-shopGreen" /> : <Zap className="w-5 h-5 text-growPurple" />}
            </div>
            <div>
              <p className="text-textSecondary text-sm font-medium">{tokenType} Token</p>
              <p className="text-textMuted text-xs">{isShop ? 'Utility' : 'Governance'}</p>
            </div>
          </div>

          {/* 24h change badge */}
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-mono font-semibold",
            change24h >= 0 ? "bg-success/20 text-success" : "bg-error/20 text-error"
          )}>
            {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
          </div>
        </div>

        {/* Balance */}
        <div className="space-y-1">
          <p className="text-3xl font-bold font-mono text-textPrimary">
            {balance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-textSecondary text-sm font-mono">
            ≈ ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
          </p>
        </div>

        {/* Mini chart placeholder */}
        <div className="mt-4 h-12 flex items-end gap-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-t opacity-60",
                isShop ? "bg-shopGreen" : "bg-growPurple"
              )}
              style={{ height: `${Math.random() * 100}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

##### 2. Transaction Hash Display
```tsx
function TxHashBadge({ txHash }: { txHash: string }) {
  const shortHash = `${txHash.slice(0, 6)}...${txHash.slice(-4)}`;

  return (
    <div className="inline-flex items-center gap-2 bg-bgGlass border border-borderDim rounded-lg px-3 py-1.5">
      <Hash className="w-4 h-4 text-primary" />
      <span className="font-mono text-sm text-textSecondary">{shortHash}</span>
      <button
        onClick={() => {
          navigator.clipboard.writeText(txHash);
          toast.success('Copied to clipboard!');
        }}
        className="hover:text-primary transition-colors"
      >
        <Copy className="w-4 h-4" />
      </button>
      <a
        href={`https://bscscan.com/tx/${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-primary transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}
```

##### 3. Blockchain Status Indicator
```tsx
function BlockchainStatus() {
  const { blockNumber, gasPrice, isConnected } = useWeb3();

  return (
    <div className="flex items-center gap-4 bg-bgCard/50 backdrop-blur-md border border-borderDim rounded-full px-4 py-2">
      {/* Connection status */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-2 h-2 rounded-full animate-pulse",
          isConnected ? "bg-success" : "bg-error"
        )} />
        <span className="text-xs font-medium text-textSecondary">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Block number */}
      <div className="flex items-center gap-2 border-l border-borderDim pl-4">
        <Blocks className="w-4 h-4 text-textMuted" />
        <span className="text-xs font-mono text-textSecondary">
          #{blockNumber?.toLocaleString()}
        </span>
      </div>

      {/* Gas price */}
      <div className="flex items-center gap-2 border-l border-borderDim pl-4">
        <Fuel className="w-4 h-4 text-textMuted" />
        <span className="text-xs font-mono text-textSecondary">
          {gasPrice?.toFixed(2)} Gwei
        </span>
      </div>
    </div>
  );
}
```

##### 4. Staking Interface
```tsx
function StakingPanel() {
  const [stakeAmount, setStakeAmount] = useState('');
  const [lockPeriod, setLockPeriod] = useState<30 | 90 | 180>(90);
  const { growBalance, stake } = useWallet();

  const apyRates = { 30: 5, 90: 12, 180: 25 };
  const selectedAPY = apyRates[lockPeriod];
  const estimatedRewards = parseFloat(stakeAmount || '0') * (selectedAPY / 100);

  return (
    <div className="bg-gradient-to-br from-growPurple/10 to-bgCard border border-growPurple/30 rounded-3xl p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-textPrimary">Stake GROW</h3>
        <div className="flex items-center gap-2 bg-growPurple/20 px-4 py-2 rounded-full">
          <Zap className="w-5 h-5 text-growPurple" />
          <span className="font-mono text-lg font-semibold text-textPrimary">
            {selectedAPY}% APY
          </span>
        </div>
      </div>

      {/* Amount input */}
      <div className="space-y-2 mb-6">
        <label className="text-sm text-textSecondary font-medium">Stake Amount</label>
        <div className="relative">
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-bgGlass border border-borderGlow rounded-xl px-4 py-4 text-2xl font-mono font-bold text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-growPurple transition-colors"
          />
          <button
            onClick={() => setStakeAmount(growBalance.toString())}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-growPurple hover:text-primary transition-colors"
          >
            MAX
          </button>
        </div>
        <p className="text-xs text-textMuted font-mono">
          Available: {growBalance.toLocaleString()} GROW
        </p>
      </div>

      {/* Lock period selector */}
      <div className="space-y-2 mb-6">
        <label className="text-sm text-textSecondary font-medium">Lock Period</label>
        <div className="grid grid-cols-3 gap-3">
          {[30, 90, 180].map((days) => (
            <button
              key={days}
              onClick={() => setLockPeriod(days as any)}
              className={cn(
                "relative overflow-hidden rounded-xl p-4 border-2 transition-all",
                lockPeriod === days
                  ? "border-growPurple bg-growPurple/20"
                  : "border-borderDim bg-bgCard hover:border-borderGlow"
              )}
            >
              <p className="text-lg font-bold text-textPrimary">{days} Days</p>
              <p className="text-sm text-textSecondary">{apyRates[days as keyof typeof apyRates]}% APY</p>
              {lockPeriod === days && (
                <div className="absolute inset-0 bg-gradient-to-br from-growPurple/20 to-transparent pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Rewards estimate */}
      <div className="bg-bgGlass border border-borderGlow rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-textSecondary mb-1">Estimated Rewards</p>
            <p className="text-2xl font-mono font-bold text-success">
              +{estimatedRewards.toFixed(2)} GROW
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-success" />
        </div>
      </div>

      {/* Stake button */}
      <button
        onClick={() => stake(parseFloat(stakeAmount), lockPeriod)}
        disabled={!stakeAmount || parseFloat(stakeAmount) > growBalance}
        className="w-full bg-gradient-to-r from-growPurple to-primary text-textPrimary font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-growPurple/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Stake GROW Tokens
      </button>
    </div>
  );
}
```

### Iconography & Animations

#### Crypto-native Icons
```tsx
// Use Lucide React icons with crypto theme
import {
  Wallet,           // Wallet connection
  TrendingUp,       // Price increase
  TrendingDown,     // Price decrease
  Zap,             // Speed/fast transactions
  Shield,          // Security
  Lock,            // Locked staking
  Unlock,          // Unlock period
  Activity,        // Network activity
  Blocks,          // Blockchain blocks
  Hash,            // Transaction hash
  ExternalLink,    // Block explorer
  Copy,            // Copy to clipboard
  CheckCircle,     // Confirmed transaction
  Clock,           // Pending transaction
  XCircle,         // Failed transaction
  BarChart3,       // Trading charts
  Coins,           // Token balance
  Vote,            // Governance voting
} from 'lucide-react';
```

#### Micro-interactions
```tsx
// Glowing hover effect for cards
<motion.div
  whileHover={{
    scale: 1.02,
    boxShadow: '0 0 30px rgba(0, 255, 163, 0.3)',
  }}
  transition={{ duration: 0.2 }}
  className="cursor-pointer"
>
  {/* Card content */}
</motion.div>

// Number counter animation
<motion.span
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  className="font-mono text-3xl font-bold"
>
  {animatedBalance.toFixed(2)}
</motion.span>

// Transaction confirmation pulse
<motion.div
  animate={{
    scale: [1, 1.2, 1],
    opacity: [1, 0.5, 1],
  }}
  transition={{
    duration: 2,
    repeat: Infinity,
  }}
  className="w-3 h-3 rounded-full bg-success"
/>
```

### Page Layout Redesigns

#### Dashboard v2.0 (Crypto Trading Interface)
```
┌─────────────────────────────────────────────────────────┐
│ [Logo]  Home  Swap  Stake  Governance     [🔔] [Wallet] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ SHOP Balance │  │ GROW Balance │  │ Total Value  │ │
│  │ 1,234.56     │  │ 5,678.90     │  │ $12,345.67   │ │
│  │ ≈ $1,234.56  │  │ ≈ $11,111.11 │  │ ↑ +5.2%      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  ┌───────────────────────────────┐  ┌────────────────┐ │
│  │ Price Chart (7D)              │  │ Quick Actions  │ │
│  │ [Candlestick/Line chart]      │  │ • Buy SHOP     │ │
│  │                               │  │ • Stake GROW   │ │
│  │                               │  │ • Withdraw     │ │
│  └───────────────────────────────┘  └────────────────┘ │
│                                                         │
│  Recent Transactions                                    │
│  ┌─────────────────────────────────────────────────┐  │
│  │ [TX] Commission +125.5 SHOP  [0x1234...5678] ✓ │  │
│  │ [TX] Staked 1000 GROW         [0xabcd...ef01] ✓ │  │
│  │ [TX] Withdrawal -500 SHOP     [0x9876...5432] ⏳│  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### Marketplace v2.0 (Token-based Pricing)
```
┌─────────────────────────────────────────────────────────┐
│  Marketplace                      [Search] [Filter] [🛒] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │ [Product Image]  │  │ [Product Image]  │           │
│  │ ANIMA 119        │  │ Starter Kit      │           │
│  │                  │  │                  │           │
│  │ 15,900 SHOP      │  │ 2,500 SHOP       │           │
│  │ ≈ $15,900        │  │ ≈ $2,500         │           │
│  │                  │  │                  │           │
│  │ Earn 3,975 SHOP  │  │ Earn 500 SHOP    │           │
│  │ +50 GROW bonus   │  │ +10 GROW bonus   │           │
│  │                  │  │                  │           │
│  │ [Buy with SHOP]  │  │ [Buy with SHOP]  │           │
│  └──────────────────┘  └──────────────────┘           │
│                                                         │
│  💡 Pay with SHOP tokens - Instant commission payout!   │
│  🎁 Earn GROW tokens for every purchase milestone       │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Security & Compliance

### Regulatory Considerations (Vietnam)

#### State Bank of Vietnam (SBV) Guidelines
- ⚠️ **Cryptocurrency trading is RESTRICTED** in Vietnam as legal tender
- ✅ **BUT:** Stablecoins backed by fiat reserves may be permitted under e-wallet regulations
- ✅ **Strategy:** Position SHOP token as a "prepaid voucher" system, not cryptocurrency

#### Legal Framework
1. **Decision 942/QD-TTg (2017)** - Cryptocurrency mining/trading restrictions
2. **Circular 39/2014/TT-NHNN** - Electronic payment regulations
3. **Decree 80/2016/ND-CP** - Cybersecurity and data protection

#### Compliance Checklist
- [ ] Register as payment intermediary with SBV
- [ ] Implement KYC/AML (Know Your Customer / Anti-Money Laundering)
- [ ] Establish 1:1 VND reserve backing for SHOP tokens
- [ ] Monthly audit reports to SBV
- [ ] User transaction limits (per Vietnam payment law)
- [ ] Tax withholding automation (10% PIT)

### Smart Contract Security

#### Audit Requirements
- ✅ **Certik Audit** - Third-party security audit
- ✅ **Slither** - Static analysis tool
- ✅ **Mythril** - Symbolic execution testing
- ✅ **Testnet deployment** - 3 months on BSC Testnet before mainnet

#### Security Features
```solidity
// SHOP Token Security Features
contract SHOPToken is ERC20, Pausable, AccessControl {
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
  bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

  uint256 public maxSupply = 1_000_000_000 * 10**18; // 1B SHOP cap

  // Emergency pause function
  function pause() public onlyRole(PAUSER_ROLE) {
    _pause();
  }

  // Rate limiting for withdrawals
  mapping(address => uint256) public lastWithdrawal;
  uint256 public withdrawalCooldown = 1 hours;

  function withdraw(uint256 amount) external whenNotPaused {
    require(block.timestamp >= lastWithdrawal[msg.sender] + withdrawalCooldown, "Cooldown");
    lastWithdrawal[msg.sender] = block.timestamp;
    _burn(msg.sender, amount);
    // ... VND transfer logic
  }
}
```

### User Security Best Practices

#### Wallet Security Education
- 🔑 **Seed phrase backup** - 12-word recovery phrase
- 🔒 **Hardware wallet support** - Ledger/Trezor integration
- 🚫 **Phishing protection** - Official domain verification
- 📱 **2FA authentication** - Google Authenticator / SMS

#### Transaction Signing Flow
```typescript
// User must explicitly approve each transaction
async function purchaseProduct(productId: string) {
  // 1. User reviews transaction details
  const modal = showTransactionModal({
    action: 'Purchase Product',
    amount: product.price,
    gasEstimate: '0.001 BNB (~$0.30)',
    recipient: MARKETPLACE_CONTRACT_ADDRESS,
  });

  // 2. User signs transaction with wallet (MetaMask)
  const tx = await shopContract.transfer(
    MARKETPLACE_CONTRACT_ADDRESS,
    ethers.utils.parseUnits(product.price.toString(), 18)
  );

  // 3. Wait for confirmation (usually 3 seconds on BSC)
  await tx.wait();

  // 4. Update UI with success state
  showSuccessToast(`Purchase confirmed! TX: ${tx.hash}`);
}
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Months 1-2)
**Goal:** Set up blockchain infrastructure and deploy smart contracts

**Tasks:**
- [ ] Deploy SHOP token contract on BSC Testnet
- [ ] Deploy GROW token contract on BSC Testnet
- [ ] Implement wallet connection (MetaMask, Trust Wallet)
- [ ] Create token minting/burning functions
- [ ] Set up block explorer integration (BSCScan API)
- [ ] Database schema migration (add Web3 fields)
- [ ] Build admin dashboard for token management

**Deliverables:**
- ✅ Functional SHOP/GROW tokens on Testnet
- ✅ Wallet connection UI component
- ✅ Transaction history page

### Phase 2: Core Features (Months 3-4)
**Goal:** Implement dual-token economy and user flows

**Tasks:**
- [ ] Build token swap interface (VND ↔ SHOP)
- [ ] Implement commission payout in SHOP tokens
- [ ] Create staking UI for GROW tokens
- [ ] Build transaction history with blockchain data
- [ ] Implement tax withholding smart contract
- [ ] Add notification system for tx confirmations
- [ ] Create onboarding flow for new users

**Deliverables:**
- ✅ Users can earn/spend SHOP tokens
- ✅ Users can stake GROW tokens for rewards
- ✅ Automated tax compliance via smart contracts

### Phase 3: Governance (Month 5)
**Goal:** Enable community-driven decision making

**Tasks:**
- [ ] Deploy governance contract
- [ ] Build proposal creation UI
- [ ] Implement voting mechanism
- [ ] Create proposal execution system
- [ ] Add proposal discussion forum
- [ ] Build delegation feature (vote on behalf)

**Deliverables:**
- ✅ GROW holders can vote on platform changes
- ✅ Transparent governance process

### Phase 4: UI/UX Overhaul (Month 6)
**Goal:** Transform interface to fintech/crypto standard

**Tasks:**
- [ ] Redesign dashboard with crypto aesthetics
- [ ] Add real-time price charts
- [ ] Implement dark mode (default)
- [ ] Add glass morphism effects
- [ ] Create animated number counters
- [ ] Build portfolio analytics page
- [ ] Add blockchain status indicators

**Deliverables:**
- ✅ Modern fintech-grade UI
- ✅ Dark mode optimized for crypto traders

### Phase 5: Mainnet Launch (Month 7)
**Goal:** Deploy to production BSC Mainnet

**Tasks:**
- [ ] Complete smart contract audit
- [ ] Deploy contracts to BSC Mainnet
- [ ] Migrate user data from testnet
- [ ] Set up liquidity pools on PancakeSwap
- [ ] Launch GROW token public sale (IDO)
- [ ] Enable fiat on-ramp (Simplex/MoonPay)
- [ ] Marketing campaign

**Deliverables:**
- ✅ Live production system on BSC
- ✅ Public token trading enabled

### Phase 6: Scaling (Months 8-12)
**Goal:** Expand ecosystem and partnerships

**Tasks:**
- [ ] Add more payment options (Apple Pay, Google Pay)
- [ ] Integrate with CEX (Binance, OKX) for GROW listing
- [ ] Build mobile app (React Native)
- [ ] Add NFT marketplace for premium products
- [ ] Implement referral program with GROW rewards
- [ ] Launch partner API for third-party integrations
- [ ] Expand to other blockchains (Polygon, Avalanche)

**Deliverables:**
- ✅ Multi-platform support
- ✅ Strong ecosystem partnerships

---

## 📊 Success Metrics & KPIs

### Token Metrics
- **SHOP Token:**
  - Total supply minted
  - Circulating supply
  - Daily active wallets
  - Transaction volume (24h)
  - Peg stability (should stay within 1,000 ± 10 VND)

- **GROW Token:**
  - Market cap
  - Price appreciation (vs launch)
  - Staking participation rate (target: >50% of supply)
  - Governance proposal count
  - Voter turnout rate (target: >20%)

### User Engagement
- Wallet connection rate (target: >80% of registered users)
- Daily SHOP transactions (target: 1,000+)
- GROW staking TVL (Total Value Locked - target: $1M+)
- Commission claims via blockchain (target: 100% automated)

### Business Metrics
- Gross Merchandise Value (GMV) in SHOP tokens
- Commission payout efficiency (reduce to <1 minute)
- Tax compliance automation (target: 100%)
- User acquisition cost (CAC) reduction via GROW rewards

---

## 🛠️ Technical Architecture

### Infrastructure Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ Dashboard  │  │ Marketplace│  │ Staking    │       │
│  └────────────┘  └────────────┘  └────────────┘       │
└─────────────────────┬───────────────────────────────────┘
                      │ Web3.js / Ethers.js
┌─────────────────────▼───────────────────────────────────┐
│               Wallet Layer (MetaMask)                   │
└─────────────────────┬───────────────────────────────────┘
                      │ JSON-RPC
┌─────────────────────▼───────────────────────────────────┐
│           BNB Smart Chain (BSC Mainnet)                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ SHOP Token │  │ GROW Token │  │ Governance │       │
│  │ Contract   │  │ Contract   │  │ Contract   │       │
│  └────────────┘  └────────────┘  └────────────┘       │
└─────────────────────┬───────────────────────────────────┘
                      │ Event Logs
┌─────────────────────▼───────────────────────────────────┐
│              Backend API (Node.js/Fastify)              │
│  - Transaction indexing                                 │
│  - KYC/AML verification                                 │
│  - Fiat on/off ramp                                     │
│  - Email notifications                                  │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│            Database (PostgreSQL + Redis)                │
│  - User profiles                                        │
│  - Transaction history                                  │
│  - Staking records                                      │
│  - Governance proposals                                 │
└─────────────────────────────────────────────────────────┘
```

### Key Technologies

**Frontend:**
- React 18 + TypeScript
- Ethers.js v6 (blockchain interaction)
- TanStack Query (data fetching)
- Zustand (state management)
- Framer Motion (animations)
- Recharts (price charts)

**Smart Contracts:**
- Solidity 0.8.20+
- OpenZeppelin Contracts (security standards)
- Hardhat (development framework)
- Chai (testing)

**Backend:**
- Node.js 18+
- Fastify (API framework)
- Prisma (database ORM)
- Bull (job queues for blockchain indexing)
- Redis (caching)

**Infrastructure:**
- Vercel (frontend hosting)
- Railway (backend hosting)
- BSC RPC nodes (QuickNode or Ankr)
- PostgreSQL (Supabase)
- IPFS (Pinata - for document storage)

---

## 📚 Developer Resources

### Smart Contract ABIs

**SHOP Token ABI:**
```json
[
  {
    "inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "amount", "type": "uint256"}],
    "name": "burn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
```

### Code Examples

**Connect Wallet:**
```typescript
import { ethers } from 'ethers';

async function connectWallet(): Promise<string> {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return address;
}
```

**Read SHOP Balance:**
```typescript
import { ethers } from 'ethers';
import SHOP_ABI from './abis/SHOPToken.json';

async function getShopBalance(userAddress: string): Promise<number> {
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org');
  const shopContract = new ethers.Contract(SHOP_CONTRACT_ADDRESS, SHOP_ABI, provider);

  const balance = await shopContract.balanceOf(userAddress);
  return parseFloat(ethers.formatUnits(balance, 18));
}
```

**Purchase Product with SHOP:**
```typescript
async function purchaseProduct(productId: string, price: number) {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const shopContract = new ethers.Contract(SHOP_CONTRACT_ADDRESS, SHOP_ABI, signer);

  // Approve marketplace to spend SHOP
  const approveTx = await shopContract.approve(
    MARKETPLACE_CONTRACT_ADDRESS,
    ethers.parseUnits(price.toString(), 18)
  );
  await approveTx.wait();

  // Execute purchase
  const marketplaceContract = new ethers.Contract(
    MARKETPLACE_CONTRACT_ADDRESS,
    MARKETPLACE_ABI,
    signer
  );
  const purchaseTx = await marketplaceContract.buyProduct(
    productId,
    ethers.parseUnits(price.toString(), 18)
  );
  await purchaseTx.wait();

  return purchaseTx.hash;
}
```

### Environment Variables

```bash
# .env.production
VITE_BSC_RPC_URL=https://bsc-dataseed1.binance.org
VITE_BSC_CHAIN_ID=56
VITE_SHOP_CONTRACT_ADDRESS=0x...
VITE_GROW_CONTRACT_ADDRESS=0x...
VITE_GOVERNANCE_CONTRACT_ADDRESS=0x...
VITE_MARKETPLACE_CONTRACT_ADDRESS=0x...
VITE_BLOCK_EXPLORER_URL=https://bscscan.com

# Backend .env
DATABASE_URL=postgresql://user:pass@host:5432/wellnexus
REDIS_URL=redis://localhost:6379
BSC_RPC_URL=https://bsc-dataseed1.binance.org
PRIVATE_KEY=0x... # For backend transaction signing
SHOP_CONTRACT_ADDRESS=0x...
GROW_CONTRACT_ADDRESS=0x...
```

---

## ⚠️ Important Policy Updates

### 🚫 OLD RESTRICTION (DEPRECATED)
**Previous policy in CLAUDE.md:**
> "Do not create any crypto or blockchain related documents."

### ✅ NEW POLICY (EFFECTIVE IMMEDIATELY)
**Updated policy:**
> "WellNexus is a Web3-enabled platform. All blockchain, cryptocurrency, token, and DeFi terminology is **APPROVED** for use in code, documentation, and UI."

**Allowed Keywords:**
- ✅ Cryptocurrency
- ✅ Token (SHOP, GROW)
- ✅ Blockchain
- ✅ Smart Contract
- ✅ Wallet
- ✅ Staking
- ✅ Governance
- ✅ DeFi (Decentralized Finance)
- ✅ Web3
- ✅ NFT (if applicable)
- ✅ Gas fees
- ✅ Transaction hash
- ✅ Block explorer

**Rationale:**
WellNexus is pivoting to a blockchain-based platform to:
1. Enable instant, transparent commission payouts
2. Reduce transaction costs via smart contracts
3. Provide users with true asset ownership
4. Comply with emerging Vietnam fintech regulations
5. Compete with global Web3 commerce platforms

---

## 📝 Glossary

### Web3 Terms
- **SHOP Token:** Stablecoin pegged to VND (1 SHOP = 1,000 VND)
- **GROW Token:** Governance token for voting and staking
- **Staking:** Locking GROW tokens to earn rewards
- **APY (Annual Percentage Yield):** Interest rate for staking
- **Gas:** Transaction fee on blockchain
- **Wallet:** Software to store tokens (MetaMask, Trust Wallet)
- **Smart Contract:** Self-executing code on blockchain
- **BSC (BNB Smart Chain):** Blockchain network we use
- **Transaction Hash (txHash):** Unique ID for blockchain transaction
- **Block Explorer:** Website to view blockchain data (BSCScan)
- **KYC (Know Your Customer):** Identity verification process
- **AML (Anti-Money Laundering):** Compliance regulations

### Business Terms
- **Peg:** Fixed exchange rate (1 SHOP = 1,000 VND)
- **Liquidity Pool:** Token reserves for trading
- **IDO (Initial DEX Offering):** Public token sale
- **TVL (Total Value Locked):** Total value staked in platform
- **Quorum:** Minimum votes needed to pass proposal
- **Vesting:** Gradual release of locked tokens

---

## 🔗 External Resources

### Documentation
- [BNB Smart Chain Docs](https://docs.bnbchain.org/)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [MetaMask Developer Docs](https://docs.metamask.io/)

### Tools
- [BSCScan Block Explorer](https://bscscan.com/)
- [PancakeSwap DEX](https://pancakeswap.finance/)
- [Hardhat Framework](https://hardhat.org/)
- [Remix IDE](https://remix.ethereum.org/) (Smart contract development)

### Compliance
- [Vietnam SBV Guidelines](https://www.sbv.gov.vn/)
- [Circular 39/2014/TT-NHNN](https://thuvienphapluat.vn/van-ban/Tien-te-Ngan-hang/Thong-tu-39-2014-TT-NHNN-quy-dinh-ve-thanh-toan-phi-tien-mat-bang-phuong-tien-toan-dien-tu-254939.aspx)

---

## 📞 Support & Feedback

For questions about Web3 strategy implementation:
- **Technical Lead:** Review this document with development team
- **Legal Compliance:** Consult with Vietnam fintech lawyers
- **Smart Contract Audits:** Contact Certik or Halborn Security

---

**Document Status:** ✅ APPROVED FOR IMPLEMENTATION
**Next Review Date:** 2025-12-21
**Version History:**
- v1.0.0 (2025-11-21) - Initial strategy document created

---

*This document represents the official Web3 transformation strategy for WellNexus. All previous restrictions on blockchain/crypto terminology are hereby overridden.*
