/**
 * English Translation Dictionary for WellNexus
 * Full English locale for SEA expansion
 */

export const en = {
    // Common/Shared Text
    common: {
        loading: 'Loading...',
        error: 'An error occurred',
        success: 'Success',
        failed: 'Failed',
        save: 'Save',
        cancel: 'Cancel',
        close: 'Close',
        confirm: 'Confirm',
        back: 'Back',
        next: 'Next',
        submit: 'Submit',
        search: 'Search',
        filter: 'Filter',
        copy: 'Copy',
        sort: 'Sort',
        viewAll: 'View All',
        viewDetails: 'View Details',
        notSupportedYet: 'Feature coming soon',
        currency: {
            vnd: '₫',
            grow: 'Token',
            shop: 'SHOP',
        },
        location: {
            vietnam: 'Vietnam',
        },
        rank: {
            daisu: 'Ambassador',
            ctv: 'Collaborator',
        }
    },

    // Navigation
    nav: {
        dashboard: 'Dashboard',
        products: 'Products',
        partner: 'Partner',
        ventureDescription: 'Join the team of 200+ Co-Founders',
        marketplace: 'Marketplace',
        wallet: 'Wallet',
        team: 'Team',
        copilot: 'AI Copilot',
        referral: 'Referral',
        healthCoach: 'Health Coach',
        leaderboard: 'Leaderboard',
        marketingTools: 'Marketing Tools',
        healthCheck: 'Health Check',
        admin: 'Admin',
        settings: 'Settings',
        logout: 'Logout',
        darkMode: 'Dark Mode',
        lightMode: 'Light Mode',
        company: 'Company',
        aboutUs: 'About Us',
        careers: 'Careers',
        ventureProgram: 'Venture Program',
    },

    eastasiabrand: {
        wellnexus: 'WellNexus',
        v_ch_ng_t_i: 'About Us',
        s_n_ph_m: 'Products',
        i_t_c: 'Partners',
        b_t_u: 'Start Now',
        awards: {
            top10: { title: 'Top 10 Startup', subtitle: 'Vietnam 2025' },
            sea: { title: 'SEA Expansion', subtitle: '4 Countries' },
            partner: { title: 'Premium Partner', subtitle: 'Grade A+' },
            iso: { title: 'ISO 27001', subtitle: 'Security Certified' },
        }
    },

    // Dashboard Page
    dashboard: {
        title: 'Dashboard',
        system_online: 'System Online',
        welcome: 'Welcome back, {name}!',
        serverTime: 'Server Time',

        // Hero Card
        hero: {
            greeting: 'Hello, {name}!',
            roadToFounder: 'Road to Founder Club',
            ipoPathway: 'IPO Pathway',
            currentProgress: 'Current Progress',
            teamVolume: 'Team Volume',
            portfolioValue: 'Portfolio Value',
            target: 'Target',
            remaining: 'remaining',
            daysLeft: '{days} days',
            onTrack: 'On Track',
            needsBoost: 'Needs Boost',
        },

        // Business Valuation (WEALTH OS)
        valuation: {
            title: 'Business Valuation',
            subtitle: 'Business Valuation (PE Ratio 5x)',
            formula: 'Valuation Formula',
            assetBreakdown: 'Asset Breakdown',
            cashflow: 'Cashflow',
            equity: 'Equity',
            projectedAnnual: 'Projected Annual Profit',
            upgradePortfolio: 'Upgrade Portfolio',
            peRatio: 'PE Ratio',
            monthlyProfit: 'Monthly Profit',
            annualizedRevenue: 'Annualized Revenue',
            assetGrowth: 'Asset Growth',
            valuationMethod: 'Valuation Method: DCF & Comparable',
            sub: {
                shop_token_liquidity: 'SHOP Token Liquidity',
                grow_token_yield: 'GROW Token Yield',
                annualized_revenue_rate: 'Annualized Revenue Rate',
            },
        },

        // Stats Grid (WEALTH OS)
        stats: {
            totalSales: 'Total Cashflow',
            teamVolume: 'Portfolio Volume',
            commission: 'Net Profit',
            rank: 'Investor Tier',
            growth: 'Asset Growth',
            thisMonth: 'This Month',
            vsLastMonth: 'MoM Growth',
            totalNodeYield: 'Total Node Yield',
            liquidCapital: 'Liquid Capital',
            ecosystemVolume: 'Ecosystem Volume',
        },

        // Commission Widget
        commission: {
            title: 'Commission Earnings',
            subtitle: 'Real-time earnings tracker',
            today: 'Today',
            thisWeek: 'This Week',
            thisMonth: 'This Month',
            breakdown: 'Earnings Breakdown',
            directSales: 'Direct Sales',
            teamVolume: 'Team Volume',
            total: 'Total Earnings',
            withdraw: 'Withdraw',
            viewDetails: 'View Details',
        },

        // Revenue Chart
        revenue: {
            title: '7-Day Asset Performance',
            subtitle: 'Asset Growth Chart',
            total: 'Total',
            average: 'Average',
            peak: 'Peak',
            tooltip_label: 'Revenue',
        },

        // Revenue Chart Component
    revenuechart: {
        revenue_growth: 'Revenue Growth',
        last_7_days_performance: 'Last 7 Days Performance',
        last_7_days: 'Last 7 Days',
        last_30_days: 'Last 30 Days',
        revenue: 'Revenue',
    },

    // Revenue Breakdown
        revenueBreakdown: {
            title: 'Income Streams',
            directSales: 'Direct Income',
            teamBonus: 'Portfolio Bonus',
            referral: 'Referral Income',
        },

        // Top Products
        topProducts: {
            title: 'Top Products',
            sales: '{count} sold',
            commission: 'Commission',
            stock: '{count} in stock',
            outOfStock: 'Out of Stock',
            buyNow: 'Buy Now',
        },

        // Quick Actions
        quickActions: {
            title: 'Quick Actions',
            shareProduct: 'Share Product',
            shareProductDesc: 'Send link to customers',
            inviteTeam: 'Invite Team',
            inviteTeamDesc: 'Expand your team',
            viewStats: 'View Stats',
            viewStatsDesc: 'Detailed analytics',
            withdraw: 'Withdraw',
            withdrawDesc: 'Transfer to bank',
            shareAchievement: 'Share Achievement',
            shareAchievementDesc: 'Show your success',
        },

        // Daily Quest Hub
        dailyQuest: {
            title: 'Daily Quests',
            subtitle: 'Complete to earn GROW Token',
            progress: 'Progress',
            completed: '{count}/{total} completed',
            completedAll: 'COMPLETED',
            questsProgress: '{completed}/{total} quests',
            tokensEarned: '{amount} GROW earned',
            tokensToday: 'GROW Today',
            startQuest: 'Start',
            claiming: 'Claiming...',
            claim: 'Claim Reward',
            claimedSuccess: 'Claimed {amount} GROW Token!',
            questCompleted: 'Completed',
            types: {
                onboarding: 'Onboarding',
                sales: 'Sales',
                learning: 'Learning',
            },
            quests: {
                dailyCheckIn: {
                    title: 'Daily Check-in',
                    description: 'Check in daily',
                },
                shareHealthCheck: {
                    title: 'Share Value',
                    description: 'Share 1 Health Check link',
                },
                watchTraining: {
                    title: 'Learn',
                    description: 'Watch 1 training video',
                }
            }
        },

        // Live Activities
        liveActivities: {
            title: 'Live Activities',
            subtitle: 'Real-time system activities',
            live: 'LIVE',
            updateContinuously: 'Continuously updating',
            recent: '{count} recent activities',
            systemActive: 'System is active!',
            new: 'NEW',
            loading: 'Loading activities...',
            in: 'in',
            just_now: 'Just now',
            vnd: 'VND',
            activities: {
                earnedGrow: 'just earned {amount} GROW tokens',
                rewardedGrow: 'rewarded {amount} GROW',
                teamBonusGrow: 'earned {amount} GROW from team bonus',
                completedOrder: 'closed order {amount}',
                soldSuccess: 'sold successfully {amount}',
                finishedOrder: 'completed order {amount}',
                rankedUpGold: 'ranked up to Gold',
                rankedUpPartner: 'achieved Partner rank',
                rankedUpFounder: 'promoted to Founder Club',
                rankedUpSilver: 'ranked up to Silver',
                withdrew: 'withdrew {amount} to account',
                transferredSuccess: 'transferred {amount} successfully',
                referredPartner: 'successfully referred 1 new Partner',
                referralBonus: 'received referral bonus {amount}',
                teamExpanded: 'team expanded by 1 member',
            }
        },

        // Recent Activity
        recentActivity: {
            title: 'Recent Activity',
            completedQuest: 'Completed quest: First Sale',
            newTeamMember: 'New team member joined',
            productShipped: 'Product shipped to customer',
            reachedRank: 'Reached Partner rank',
            hoursAgo: '{hours} hours ago',
            daysAgo: '{days} days ago',
        },

        // Achievements
        achievements: {
            title: 'Achievements',
            topSeller: 'Top Seller',
            goalCrusher: 'Goal Crusher',
            teamLeader: 'Team Leader',
            speedDemon: 'Speed Demon',
            unlocked: '{count} / {total} unlocked',
            locked: 'Locked',
        },

        // Quick Stats
        quickStats: {
            title: 'Quick Stats',
            totalTransactions: 'Total Transactions',
            activeProducts: 'Active Products',
            currentRank: 'Current Rank',
        }
    },

    // Cart/Checkout
    cart: {
        empty: 'Cart is empty',
        yourOrder: 'Your Order',
        quantity: 'Qty',
        subtotal: 'Subtotal',
        shipping: 'Shipping',
        shippingFree: 'Free',
        total: 'Total',
        viewCart: 'View Cart',
        checkout: 'Checkout',
        removeItem: 'Remove item',
    },

    // Wallet Page
    wallet: {
        title: 'Asset Management',
        subtitle: 'Manage your asset portfolio',

        balance: {
            total_assets: 'Total Assets',
            this_month: 'This Month',
            available: 'Liquid Assets',
            locked: 'Locked Assets',
            staked: 'Staked for Yield',
            total: 'Total Portfolio Value',
            shopToken: 'SHOP Token - Cashflow',
            growToken: 'GROW Token - Equity',
            vnd_stablecoin: 'VND Stablecoin 1:1',
            governance_token: 'Governance Token',
            currency: 'Currency',
        },

        stats: {
            growth_12_5: '+12.5%',
            apy_12_0: '12.0%',
            apy_12_percent: '12%',
            days_90: '90 Days'
        },

        actions: {
            deposit_shop: 'Deposit SHOP',
            withdraw: 'Withdraw',
            stake: 'Stake',
            unstake: 'Unstake',
            transfer: 'Transfer',
            history: 'Transaction History',
        },

        staking: {
            title: 'Staking',
            subtitle: 'Lock GROW Token for interest',
            apy: 'Annual APY',
            minimumAmount: 'Minimum Amount',
            lockPeriod: 'Lock Period',
            estimatedReward: 'Estimated Reward',
            days: '{count} days',
            enterAmount: 'Enter Amount',
            stakeNow: 'Stake Now',
            unstakeNow: 'Unstake Now',
            stakingInfo: 'Staking Info',
            stakedAmount: 'Staked Amount',
            rewards: 'Rewards',
        },

        transactions: {
            title: 'Transaction History',
            explorer: 'Blockchain Explorer',
            noTransactions: 'No transactions yet',
            id: 'Transaction ID',
            date: 'Date',
            amount: 'Amount',
            type: 'Type',
            status: 'Status',
            hash: 'Hash',
            tax: 'Tax',
            viewOnBscScan: 'View on BSCScan',
            emptyState: 'Your transaction history will appear here',
            emptyStateFilter: 'No {filter} transactions yet',
            types: {
                directSale: 'Direct Sale',
                teamBonus: 'Team Bonus',
                withdrawal: 'Withdrawal',
                quest: 'Quest',
                staking: 'Staking',
                unstaking: 'Unstaking',
            },
            statusValues: {
                pending: 'Pending',
                completed: 'Completed',
                failed: 'Failed',
                cancelled: 'Cancelled',
            }
        },

        withdrawal: {
            title: 'Withdraw',
            subtitle: 'Transfer SHOP Token to bank account',
            amount: 'Amount to withdraw',
            bankAccount: 'Bank Account',
            bankName: 'Bank Name',
            accountNumber: 'Account Number',
            accountName: 'Account Holder Name',
            fee: 'Transaction Fee',
            tax: 'Income Tax',
            netAmount: 'Net Amount',
            minWithdrawal: 'Minimum withdrawal {amount}',
            maxWithdrawal: 'Maximum withdrawal {amount}',
            processingTime: 'Processing time: 1-3 business days',
            withdrawNow: 'Withdraw Now',
            withdrawSuccess: 'Withdrawal request successful!',
        }
    },

    checkout: {
        title: 'Checkout',
        backToShop: 'Back to Shop',
        guestInfo: 'Guest Information',
        shippingAddress: 'Shipping Address',
        placeOrder: 'Place Order',
        processing: 'Processing...',
        terms: 'By placing an order, you agree to WellNexus Terms of Service and Privacy Policy.',
        success: 'Order placed successfully! Your order has been received.',
        error: 'An error occurred while processing your order. Please try again.',
        guestForm: {
            fullName: {
                label: 'Full Name',
                placeholder: 'John Doe'
            },
            phone: {
                label: 'Phone Number',
                placeholder: '0901234567'
            },
            email: {
                label: 'Email (For order notifications)',
                placeholder: 'example@email.com'
            },
            address: {
                city: {
                    label: 'City / Province',
                    placeholder: 'Ho Chi Minh City'
                },
                district: {
                    label: 'District',
                    placeholder: 'District 1'
                },
                ward: {
                    label: 'Ward / Commune',
                    placeholder: 'Ben Nghe Ward'
                },
                street: {
                    label: 'Detailed Address',
                    placeholder: '123 Nguyen Hue Street'
                }
            },
            note: {
                label: 'Note (Optional)',
                placeholder: 'Delivery during office hours...'
            }
        },
        validation: {
            fullNameRequired: 'Full name must be at least 2 characters',
            emailInvalid: 'Invalid email',
            phoneInvalid: 'Invalid phone number',
            streetRequired: 'Address must be more detailed (house number, street name)',
            wardRequired: 'Ward/Commune is required',
            districtRequired: 'District is required',
            cityRequired: 'City/Province is required',
        },
        successPage: {
            title: 'Order Successful!',
            message: 'Thank you for purchasing at WellNexus. We will contact you shortly to confirm your order.',
            continueShopping: 'Continue Shopping',
            backToHome: 'Back to Home',
        }
    },

    // Marketplace Page
    marketplace: {
        title: 'Marketplace',
        subtitle: 'Premium quality products',
        searchPlaceholder: 'Search products...',
        filterBy: 'Filter by',
        sortBy: 'Sort by',
        noProductsFound: 'No products found',
        aiRecommended: 'AI Recommended',
        categories: {
            all: 'All',
            supplements: 'Supplements',
            wellness: 'Wellness',
            beauty: 'Beauty',
            starter: 'Starter Kit',
        },
        sort: {
            popular: 'Most Popular',
            newest: 'Newest',
            priceLow: 'Price: Low to High',
            priceHigh: 'Price: High to Low',
            commission: 'Highest Commission',
        },
        aiRecommendation: {
            title: 'AI Opportunity Radar',
            loading: 'Analyzing {count} market signals...',
            live: 'Live',
            suggestion: 'Based on current market trends and your sales history, **{productName}** is the hottest product! Commission up to {commission}%.',
        },
        product: {
            commission: 'Commission',
            sales: '{count} sold',
            stock: '{count} left',
            outOfStock: 'Out of Stock',
            addToCart: 'Add to Cart',
            buyNow: 'Buy Now',
            shareProduct: 'Share',
            viewDetails: 'View Details',
        },
        productDetail: {
            description: 'Product Description',
            features: 'Features',
            ingredients: 'Ingredients',
            usage: 'How to Use',
            benefits: 'Benefits',
            reviews: 'Reviews',
            rating: '{score} / 5',
            reviewCount: '{count} reviews',
        },
        // Quick Purchase Modal
        quickBuy: {
            title: 'Quick Purchase',
            subtitle: 'Express checkout for your essentials',
            recent: 'Recent',
            favorites: 'Favorites',
            noItems: 'No {tab} items found',
            noRecent: 'Your purchase history will appear here',
            noFavorites: 'Mark items as favorite to access them quickly',
            vatIncluded: 'Prices include VAT where applicable',
            viewFullMarketplace: 'View full marketplace →',
            buyNow: 'Buy Now',
            purchased: 'Purchased!',
            commission: 'Comm: {rate}%',
        },
    },

    // Team Dashboard
    team: {
        title: 'Portfolio Management',
        subtitle: 'Manage partner network & scale assets',
        leaderDashboard: 'Partner Network Dashboard',
        description: 'Track partner performance, expand market share, and optimize portfolio growth.',

        metrics: {
            totalMembers: 'Active Partners',
            teamVolume: 'Network Portfolio Value',
            averageSales: 'Avg. Profit / Partner',
            topPerformers: 'Top Earners',
            active: 'Active',
        },

        charts: {
            teamPerformance: 'Team Performance (Top 5)',
            rankDistribution: 'Rank Distribution',
            personalSales: 'Personal Sales',
            teamVolumeChart: 'Team Volume',
        },

        overview: {
            title: 'Team Overview',
            totalMembers: 'Total Members',
            activeMembers: 'Active Members',
            totalTeamVolume: 'Total Team Volume',
            monthlyGrowth: 'Monthly Growth',
            averageSales: 'Avg Sales/Person',
        },

        members: {
            title: 'Members',
            teamMembers: 'Team Members',
            search: 'Search...',
            searchPlaceholder: 'Search members...',
            name: 'Name',
            member: 'Member',
            rank: 'Rank',
            personalSales: 'Personal Sales',
            teamVolume: 'Team Volume',
            downlines: 'Downlines',
            growth: 'Growth',
            actions: 'Actions',
            lastActive: 'Last Active',
            viewProfile: 'View Profile',
            sendMessage: 'Send Message',
        },

        filters: {
            allRanks: 'All Ranks',
            sortSales: 'Sort: Sales',
            sortGrowth: 'Sort: Growth',
            sortTeam: 'Sort: Team Volume',
            export: 'Export',
        },

        actions: {
            sendEmail: 'Send email',
            call: 'Call',
            moreActions: 'More actions',
        },

        topPerformers: {
            title: 'Top Performers',
            thisMonth: 'This Month',
            allTime: 'All Time',
        },

        analytics: {
            title: 'Team Analytics',
            recruitmentTrend: 'Recruitment Trend',
            salesTrend: 'Sales Trend',
            rankDistribution: 'Rank Distribution',
            activityHeatmap: 'Activity Heatmap',
        }
    },

    // Referral Page
    referral: {
        title: 'Refer & Earn',
        subtitle: 'Referral Tracking System',
        description: 'Share your referral link and earn commission from every successful referral!',

        tabs: {
            overview: 'Overview',
            referrals: 'Referrals',
            network: 'Network Topology',
            propagation: 'Propagation Analytics',
        },

        stats: {
            totalReferrals: 'Total Referrals',
            activeReferrals: 'Active Referrals',
            active: 'Active',
            conversionRate: 'Conversion Rate',
            optimized: 'Optimized 🎯',
            totalRevenue: 'Total Revenue',
            totalBonus: 'Total Bonus',
            monthlyReferrals: 'Monthly Referrals',
            growth_spike: 'Growth Spike 🎉',
        },

        link: {
            title: 'Your Referral Link',
            description: 'Share this link with friends to join WellNexus',
            copy: 'Copy',
            copied: 'Copied!',
            share: 'Share',
            shareVia: 'Share via',
            email: 'Email',
            sms: 'SMS',
            facebook: 'Facebook',
            twitter: 'Twitter',
            more: 'More',
            qrCode: 'QR Code',
            generate_visual_key: 'Generate Visual Key',
            dismiss_visual_key: 'Dismiss Visual Key',
        },

        qrcode: {
            visual_id_key: 'Visual Identity Key',
            wellnexus_network: 'WELLNEXUS NETWORK',
            scanning_initiates_sync: 'Scanning initiates secure identity sync',
            commit_to_local_storage: 'Commit to Local Storage',
            recommended_for_high_conversio: 'Recommended for high-conversion physical touchpoints',
        },

        chart: {
            title: 'Referral Trend',
            referrals: 'Referrals',
            revenue: 'Revenue',
            propagation_velocity: 'Propagation Velocity',
            growth_yield_trajectory: 'Growth & Yield Trajectory',
            nodes: 'Nodes',
            yield: 'Yield'
        },

        network: {
            network_architecture: 'Network Architecture',
            tier_1_tier_2_visualization: 'Tier 1 & Tier 2 Visualization',
            f1_sentinel_nodes: 'F1 Sentinel Nodes',
            nodes: 'Nodes',
            f2_secondary_propagation: 'F2 Secondary Propagation',
            node_val: 'Node Val',
            yield: 'Yield',
            status: {
                active: 'Active Sync',
                registered: 'Identity Auth',
                pending: 'Awaiting Handshake',
                expired: 'Link Severed',
                unknown: 'Unknown'
            }
        },

        list: {
            title: 'Referral List',
            name: 'Name',
            email: 'Email',
            status: 'Status',
            revenue: 'Revenue',
            bonus: 'Bonus',
            registeredAt: 'Registered At',
            statuses: {
                pending: 'Pending',
                registered: 'Registered',
                active: 'Active',
                expired: 'Expired',
            }
        },

        rewards: {
            title: 'Referral Rewards',
            signupBonus: 'Signup Bonus',
            firstPurchase: 'First Purchase Bonus',
            milestone: 'Milestone Bonus',
            description: {
                signup: 'Receive immediately when referral signs up',
                firstPurchase: 'Receive when referral makes first purchase',
                milestone: 'Receive when revenue milestone is reached',
            },
            yield_mechanics: 'Yield Mechanics',
            incentive_algorithm: 'Incentive Algorithm',
            activation: {
                title: 'Activation Milestone',
                desc: 'Instant liquidity on successful identity sync',
                sub: 'per node'
            },
            revenue: {
                title: 'Revenue Override',
                desc: 'Secondary yield on ecosystem commerce',
                sub: 'override'
            },
            expansion: {
                title: 'Expansion Bonus',
                desc: 'Achieved at 10 active sentinel nodes',
                sub: 'one-time'
            }
        },
        analytics: {
            propagation: 'Propagation Analytics',
            node_topology: 'Node Topology'
        },
        hero: {
            accumulated_revenue: 'Accumulated Revenue',
            this_month: 'This Month'
        }
    },

    // Copilot (AI Sales Assistant)
    copilot: {
        title: 'The Copilot',
        subtitle: 'Your AI Sales Assistant',
        description: 'Powered by advanced AI to help you handle customer objections, create sales scripts, and improve your sales skills daily.',

        features: {
            objectionHandling: {
                title: 'Objection Handling',
                description: 'AI detects and suggests smart objection handling',
            },
            salesScript: {
                title: 'Sales Scripts',
                description: 'Create professional sales scripts in seconds',
            },
            realtimeCoaching: {
                title: 'Realtime Coaching',
                description: 'Get instant feedback and improvement suggestions',
            }
        },

        stats: {
            title: 'Today\'s Stats',
            objectionsHandled: 'Objections Handled',
            scriptsCreated: 'Scripts Created',
            conversionRate: 'Conversion Rate',
        },

        tips: {
            title: 'Tips for Effective Use',
            tip1: 'Enter real customer objections for the most accurate suggestions',
            tip2: 'Use "Script" feature to have ready scripts for each product',
            tip3: 'After each conversation, press "Coach" for improvement feedback',
            tip4: 'Copy quick suggestions and adjust to match your style',
        },

        startConversation: 'Start Conversation',
        placeholder: 'Enter your question...',
        send: 'Send',
        typing: 'Typing...',
        objectionDetected: 'Objection Detected',
        suggestion: 'Suggested Response',
        useSuggestion: 'Use this suggestion',
        objectionTypes: {
            price: 'Price',
            skepticism: 'Skepticism',
            competition: 'Competition',
            timing: 'Timing',
            need: 'Need',
            general: 'General',
        },

        input: {
            placeholder: 'Enter customer objection...',
        },

        suggestions: {
            price: 'Product price is too high!',
            trust: 'I don\'t trust this product yet',
            competitor: 'Product X is cheaper',
            script: 'Write a sales script for me',
        }
    },

    // Leaderboard
    leaderboard: {
        title: 'Leaderboard',
        subtitle: 'Top 10 Partners this month',

        highestSales: 'Highest Sales',
        yourPosition: 'Your Position',
        yourGrowTokens: 'Your GROW Tokens',
        topHundredPlus: 'Top 100+',

        rank: 'Rank',
        partner: 'Partner',
        shopSales: 'SHOP (Sales)',
        growToken: 'GROW (Token)',

        you: 'You',
        challenge: 'Challenge',
        partnerIdLabel: 'Partner ID: {id}',
        rankLabel: 'Rank #{rank}',
        toTop10: '{count} more positions to reach Top 10!',
        keepPushing: 'Keep pushing! 💪',

        noteLabel: '💡 Note:',
        noteText: 'Leaderboard updates in real-time. SHOP tokens based on total sales, GROW tokens are performance rewards.',
        lastUpdate: 'Last updated: {time}',

        challengeTitle: 'Challenge!',
        challengeSubtitle: 'Beat your competitor',
        yourGoal: 'Your Goal:',
        goalText: 'Achieve {amount} more sales to beat {name}!',
        motivation1: '💪 You can do this!',
        motivation2: '🔥 Every order brings you closer to your goal',
        motivation3: '🚀 Keep pushing to climb the ranks!',
        readyToFight: 'Ready to fight! 💪',
    },

    // Marketing Tools
    marketing: {
        title: 'Marketing Tools',
        subtitle: 'Professional sales and marketing tools',

        stats: {
            giftCards: 'Gift Cards',
            contentTemplates: 'Content Templates',
            affiliateLink: 'Affiliate Link',
            active: 'Active',
        },

        giftCards: {
            title: 'Gift Cards',
            subtitle: 'Create discount codes for customers',
            createNew: 'Create New',
            createTitle: 'Create New Gift Card',
            codeLabel: 'Discount Code',
            codePlaceholder: 'e.g. AN-200K',
            valueLabel: 'Discount Value',
            typeLabel: 'Type',
            typeFixed: 'Fixed Amount (VND)',
            typePercentage: 'Percentage (%)',
            createButton: 'Create Now',
            cancel: 'Cancel',
            usageCount: 'Usage Count:',
            createdDate: 'Created:',
        },

        contentLibrary: {
            title: 'Content Library',
            subtitle: 'Template content library for sharing',
            categories: {
                product: '📦 Product',
                testimonial: '⭐ Review',
                tips: '💡 Tips',
                promotion: '🎉 Promotion',
            },
            copyText: 'Copy text',
            copied: 'Copied',
            downloadImage: 'Download Image',
        },

        affiliate: {
            title: 'Affiliate Link & QR Code',
            subtitle: 'Your personal referral link',
            linkLabel: 'Your Referral Link',
            stats: {
                title: 'Statistics',
                clicks: 'Clicks:',
                signups: 'Signups:',
                conversion: 'Conversion Rate:',
                conversionValue: '4.9%',
            },
            tip: '💡 Tip: Share this link on Facebook, Zalo, or your personal website to earn commission from every order!',
            partnerLabel: 'WellNexus Partner',
            downloadQR: 'Download QR Code',
            share: 'Share',
            qrTip: 'Print this QR code and display at your store, or share online for easy customer access!',
            shareTitle: 'My QR Code - WellNexus',
            shareText: 'Scan this QR code to access my referral link!',
        },
        templates: {
            t1: {
                title: 'Introducing ANIMA 119',
                content: '🌿 ANIMA 119 - The golden solution for good sleep!\n\n✨ Are you struggling with sleep?\n✨ Often anxious or stressed?\n✨ Want to improve neurological health?\n\n💊 ANIMA 119 is the perfect answer:\n✅ Helps sleep deep and well\n✅ Reduces stress, anxiety\n✅ Balances emotions\n✅ 100% natural ingredients\n\n💰 Price: 15,900,000₫\n🎁 Special offer for new customers!\n\n📱 Contact now for free consultation!',
            },
            t2: {
                title: 'Success Story',
                content: '💪 Mai\'s Success Story - 35 years old\n\n"Previously, I often suffered from insomnia and fatigue all day. After 2 weeks of using ANIMA 119, I have had much better sleep. Thank you ANIMA for helping me regain my health!"\n\n🌟 You can also change your life like Mai!\n\n📞 Inbox for consultation and special offers!',
            },
            t3: {
                title: 'Health Tips',
                content: '🌙 5 Tips for a good night\'s sleep:\n\n1️⃣ Turn off phone 30 mins before bed\n2️⃣ Drink herbal tea\n3️⃣ Create comfortable sleep environment\n4️⃣ Yoga or meditation before sleep\n5️⃣ Use ANIMA 119 to support deep sleep\n\n💚 Caring for health is caring for yourself!\n\n#Health #GoodSleep #ANIMA',
            },
            t4: {
                title: 'Special Promotion',
                content: '🎉 FLASH SALE - 3 Days Only!\n\n🔥 20% OFF all ANIMA products\n🎁 Free gift worth 500,000₫\n🚚 Free shipping nationwide\n\n⏰ Ends in:\n📅 72 hours!\n\n💰 Order Now:\n👉 Message for support\n👉 Limited quantity!\n\n#FlashSale #Promotion #ANIMA',
            },
        }
    },

    // Marketing Tools (AI Landing Builder)
    marketingtools: {
        ai_landing_builder: 'AI Landing Builder',
        new: 'New',
        t_o_trang_tuy_n_d_ng_chuy_n_ng: 'Create professional recruiting pages in seconds',
        ch_n_template: 'Select Template',
        upload_nh_ch_n_dung: 'Upload Portrait',
        nh_t_i_l_n: 'Uploaded Image',
        click_thay_i: 'Click to change',
        click_t_i_nh_l_n: 'Click to upload image',
        jpg_png_t_i_a_5mb: 'JPG, PNG (Max 5MB)',
        ai_ang_vi_t_c_u_chuy_n: 'AI is writing your story...',
        ai_vi_t_c_u_chuy_n_c_a_t_i: 'AI, write my story',
        preview_landing_page: 'Preview Landing Page',
        link_landing_page: 'Landing Page Link:',
        l_t_xem: 'Views',
        chuy_n_i: 'Conversions',
        t_l: 'Rate',
        xu_t_b_n_ngay: 'Publish Now',
        landing_page_xu_t_b_n: 'Landing Page Published!',
        link_s_n_s_ng_chia_s: 'Link is ready to share with candidates',
        ch_n_template_v_click_ai_vi: 'Select a template and click "AI write my story" to start',
        ai_s_t_o_landing_page_chuy_n: 'AI will create a professional Landing Page based on your profile',
        landing_pages_t_o: 'Created Landing Pages (',
        live: 'LIVE',
        views: 'Views',
        conversions: 'Conversions',
    },

    // Health Coach
    healthCoach: {
        title: 'Health Coach AI',
        subtitle: 'Smart health assistant - Personalized product consultation',

        greeting: 'Hello! I am **WellNexus Health Coach** 🌿\n\nShare with me your health conditions or symptoms. I will recommend the best product combo for you.\n\n**Example:** "I have trouble sleeping and headaches" or "I often feel tired".',

        greetingResponse: 'Hello! I am **WellNexus Health Coach** - your AI health assistant. 🌿\n\nDescribe your symptoms or health issues, and I will recommend the most suitable products.\n\n**Example:** "I have trouble sleeping, headaches" or "I feel tired, often get sick".',

        fallbackResponse: 'Thank you for sharing. For more accurate advice, can you describe your symptoms in more detail?\n\n**Suggestion:** Tell me what problems you\'re experiencing (e.g.: insomnia, headaches, fatigue, getting sick often...)',

        sleepStressResponse: 'Based on your symptoms (insomnia, headaches, stress), I recommend the **ANIMA Relaxation Combo**. This combo is specially designed to improve sleep and reduce nervous tension.',

        fatigueResponse: 'Fatigue and weak immunity may be due to nutritional deficiency. I suggest the **Energy & Immunity Combo** to restore your health.',

        comboRelaxation: 'ANIMA Relaxation Combo',
        comboEnergy: 'Energy & Immunity Combo',

        reasonRelaxation: 'ANIMA 119 helps stabilize the nervous system and improve sleep. Immune Boost provides energy and increases resistance.',
        reasonEnergy: 'Starter Kit provides comprehensive nutrition, Immune Boost strengthens immunity and reduces fatigue.',

        totalLabel: 'Total:',
        orderNow: 'Order Now',
        orderSuccess: '✅ Order created successfully!\n\n**{comboName}** ({totalPrice}) has been added to your transaction history.\n\nYou can check it in the **Commission Wallet**. Thank you for choosing ANIMA! 🎉',

        placeholder: 'Describe your symptoms... (e.g. I have trouble sleeping, headaches)',
        send: 'Send',

        quickSuggestionsLabel: 'Quick suggestions:',
        suggestions: {
            sleep: 'I have trouble sleeping',
            fatigue: 'I feel tired',
            immunity: 'Boost immunity',
        },

        disclaimerTech: '💡 Health Coach AI uses symptom analysis technology to recommend suitable products.',
        disclaimerMedical: 'Note: This is a support tool, not a replacement for professional medical advice.',
        analyzing: 'Analyzing symptoms...',
    },

    chatmessage: {
        verified_advice: 'Verified Advice',
    },

    sharebuttons: {
        zalo: 'Zalo',
        facebook: 'Facebook',
        telegram: 'Telegram',
        email: 'Email',
        showQR: 'Show QR Code',
        hideQR: 'Hide QR Code',
    },

    chatsidebar: {
        l_ch_s: 'History',
        c_c_cu_c_h_i_tho_i: 'Recent Conversations',
        t_o_cu_c_h_i_tho_i_m_i: 'New Conversation',
    },

    // Health Check (Health Quiz)
    healthCheck: {
        dimensions: {
            sleep: 'Sleep Quality',
            stress: 'Stress Level',
            energy: 'Energy Level',
            exercise: 'Physical Activity',
            goal: 'Health Goal',
        },
        questions: {
            sleep: {
                question: 'How many hours do you usually sleep each night?',
                options: {
                    under5: 'Under 5 hours',
                    _5to6: '5-6 hours',
                    _6to7: '6-7 hours',
                    _7to8: '7-8 hours',
                    over8: 'Over 8 hours',
                }
            },
            stress: {
                question: 'Do you often feel stressed or anxious?',
                options: {
                    veryOften: 'Very often',
                    often: 'Often',
                    sometimes: 'Sometimes',
                    rarely: 'Rarely',
                    never: 'Never',
                }
            },
            energy: {
                question: 'What is your energy level throughout the day?',
                options: {
                    veryTired: 'Very tired',
                    tired: 'Often tired',
                    normal: 'Normal',
                    energetic: 'Full of energy',
                    veryEnergetic: 'Always energetic',
                }
            },
            exercise: {
                question: 'How often do you exercise each week?',
                options: {
                    never: 'Never',
                    _1to2: '1-2 times/week',
                    _3to4: '3-4 times/week',
                    _5plus: '5+ times/week',
                }
            },
            goal: {
                question: 'What is your main health goal?',
                options: {
                    betterSleep: 'Better sleep',
                    reduceStress: 'Reduce stress',
                    increaseEnergy: 'Increase energy',
                    boostImmunity: 'Boost immunity',
                    overallHealth: 'Overall health',
                }
            }
        },

        questionProgress: 'Question {current} / {total}',
        back: 'Back',
        next: 'Next',
        viewResults: 'View Results',
        timeInfo: '⏱️ Only takes 2 minutes to complete • 🔒 Your information is secure',

        resultsTitle: 'Assessment Results',
        yourHealthScore: 'Your Health Score',

        scoreLabels: {
            excellent: 'Excellent',
            good: 'Good',
            average: 'Average',
            needsImprovement: 'Needs Improvement',
        },

        scoreDescriptions: {
            excellent: 'Excellent! You are maintaining a very healthy lifestyle. Keep it up!',
            good: 'Your health is good, but there\'s still room for improvement.',
            average: 'Your health needs more attention. Start making changes now!',
            poor: 'Your health needs urgent improvement. Check the solutions below!',
        },
        zaloMessage: 'Hello! I just finished the health assessment and would like more advice on suitable ANIMA products. My health score is {score}.',
        radarTitle: 'Health Score',

        recommendationsTitle: 'Recommended Products',
        priceLabel: 'Price',
        orderNow: 'Order Now',

        products: {
            anima119: {
                name: 'ANIMA Relaxation Combo',
                reason: 'Supports nervous system stability, improves sleep and reduces stress',
                benefits: {
                    sleep: 'Helps sleep deeper and better',
                    stress: 'Reduces anxiety and stress',
                    emotion: 'Balances emotions',
                    memory: 'Enhances memory',
                }
            },
            immuneBoost: {
                name: 'Energy & Immunity Combo',
                reason: 'Strengthens immune system and body energy',
                benefits: {
                    immunity: 'Increases resistance',
                    fatigue: 'Reduces fatigue',
                    antioxidant: 'Antioxidant properties',
                    recovery: 'Fast health recovery',
                }
            },
            starterKit: {
                name: 'Starter Kit',
                reason: 'Comprehensive nutrition combo for overall health',
                benefits: {
                    nutrition: 'Complete nutrition supplement',
                    balance: 'Body balance',
                    health: 'Health enhancement',
                    allAges: 'Suitable for all ages',
                }
            }
        },

        consultationTitle: 'Need more in-depth advice?',
        consultationDescription: 'Connect with your Partner via Zalo for free 1-1 consultation',
        chatNow: 'Chat on Zalo Now',

        restartQuiz: 'Retake Assessment →',
    },

    // Admin Panel
    admin: {
        title: 'System Administration',
        subtitle: 'Configure and manage the entire system',

        sidebarTitle: 'Mission Control',
        nav: {
            overview: 'Overview',
            content: 'Content',
            partners: 'Partners',
            finance: 'Finance',
            orders: 'Orders',
            products: 'Products',
            strategy: 'Strategy',
            auditLog: 'Audit Log',
        },
        adminLabel: 'Admin',
        superUser: 'Super User',
        control_center: 'Control Center',
        ai_sentinel_active: 'AI Sentinel Active',
        monitoring_2_4k_identity_nodes: 'Monitoring 2.4K Identity Nodes',
        b_ng_i_u_khi_n: 'Dashboard',
        administrator: 'Administrator',
        superuser_node: 'Superuser Node',
        administration: 'Administration',
        secure_session: 'Secure Session',

        tabs: {
            overview: 'Overview',
            cms: 'CMS',
            partners: 'Partners',
            finance: 'Finance',
            strategy: 'Strategy',
        },

        overview: {
            title: 'System Overview',
            subtitle: 'Real-time platform metrics and health status',
            totalRevenue: 'Total Revenue',
            activePartners: 'Active Partners',
            pendingPayouts: 'Pending Payouts',
            systemHealth: 'System Health',
            chartTitle: '7-Day Revenue Trend',
        },

        cms: {
            title: 'Content Management',
            subtitle: 'Edit landing page content and marketing copy',
            heroHeadline: 'Hero Headline',
            heroSubheadline: 'Hero Subheadline',
            ctaButtonText: 'CTA Button Text',
            saveChanges: 'Save Changes',
            saveSuccess: 'CMS Content saved successfully!',
            preview: 'Preview',
        },

        partners: {
            title: 'Partner Operations',
            subtitle: 'Manage partner accounts and KYC verification',
            tableHeaders: {
                id: 'ID',
                name: 'Name',
                rank: 'Rank',
                sales: 'Sales',
                status: 'Status',
                actions: 'Actions',
            }
        },

        finance: {
            title: 'Finance Operations',
            subtitle: 'Manage withdrawal requests and tax compliance',
            gross: 'Gross:',
            tax: 'Tax (10%):',
            net: 'Net:',
            approve: 'Approve',
            reject: 'Reject',
            noRequests: 'No withdrawal requests at this time',
        },

        users: {
            title: 'User Management',
            totalUsers: 'Total Users',
            activeUsers: 'Active Users',
            verifiedUsers: 'Verified Users',
            bannedUsers: 'Banned Users',
            actions: {
                view: 'View',
                edit: 'Edit',
                ban: 'Ban',
                unban: 'Unban',
                verify: 'Verify',
                delete: 'Delete',
            }
        },

        products: {
            title: 'Product Management',
            addProduct: 'Add Product',
            editProduct: 'Edit Product',
            deleteProduct: 'Delete Product',
            activeProducts: 'Active Products',
            draftProducts: 'Draft Products',
        },

        policy: {
            title: 'Policy Engine',
            subtitle: 'Manage rules and policies',
            commission: 'Commission Policy',
            tax: 'Tax Policy',
            rank: 'Rank Policy',
            referral: 'Referral Policy',
            rules: 'Rules',
            active: 'Active',
            inactive: 'Inactive',
            createRule: 'Create Rule',
            editRule: 'Edit Rule',
        },

        settings: {
            title: 'System Settings',
            general: 'General',
            security: 'Security',
            notifications: 'Notifications',
            integrations: 'Integrations',
            backup: 'Backup',
        }
    },

    // Auth Pages
    auth: {
        login: {
            title: 'Login',
            subtitle: 'Welcome back to WellNexus',
            email: 'Email',
            password: 'Password',
            rememberMe: 'Remember me',
            forgotPassword: 'Forgot password?',
            loginButton: 'Login',
            noAccount: 'Don\'t have an account?',
            signUp: 'Sign up now',
            demo: 'Try Demo',
        },
        register: {
            title: 'Register',
            subtitle: 'Join the WellNexus community',
            earlyAccess: 'Early Access 2.0',
            fullName: 'Full Name',
            email: 'Email',
            emailBusiness: 'Business Email',
            phone: 'Phone Number',
            password: 'Password',
            confirmPassword: 'Confirm Password',
            referralCode: 'Referral Code (optional)',
            agree: 'I agree to the',
            terms: 'Terms of Service',
            and: 'and',
            privacy: 'Privacy Policy',
            registerButton: 'Register Now',
            processing: 'Creating account...',
            haveAccount: 'Already have an account?',
            login: 'Login',
            placeholders: {
                name: 'Enter your full name',
                email: 'name@company.com'
            }
        },
        forgotPassword: {
            title: 'Forgot Password',
            subtitle: 'Enter your email to reset password',
            email: 'Email',
            sendReset: 'Send Reset Link',
            backToLogin: 'Back to Login',
        },
        password: {
            strength: {
                weak: 'Weak',
                fair: 'Fair',
                good: 'Good',
                strong: 'Strong',
            },
            requirements: {
                length: 'At least 8 characters',
                uppercase: 'At least one uppercase letter',
                lowercase: 'At least one lowercase letter',
                number: 'At least one number',
                special: 'At least one special character',
            }
        }
    },

    // Landing Page
    landing: {
        hero: {
            title: 'Build Your Career with WellNexus',
            badge: 'Journey to Prosperity',
            badge_ultimate: 'ULTIMATE LEVEL WELLNESS',
            headlineAccent: 'With WellNexus',
            subtitle: 'Smart business platform combining AI, Tokenomics, and community',
            cta: 'Get Started',
            learnMore: 'Learn More',
        },
        bento: {
            ai_coach: {
                title: 'AI Coach',
                description: 'Personalized guidance by Gemini',
            },
            passive_income: {
                title: 'Passive Income',
                description: 'Track commissions in real-time',
                amount: '12,450,000₫',
                label: 'Avg. Income/Partner',
            },
            community: {
                title: 'Community',
                description: 'Join 1,000+ successful Founders',
            },
            global: {
                title: 'Global Expansion',
                description: 'Ready to conquer Southeast Asia market',
            }
        },
        socialProof: {
            actions: {
                joined: 'joined WellNexus',
                silver: 'reached Silver Rank',
                withdraw: 'withdrew 5,000,000₫',
                team: 'expanded team',
                order: 'received order',
            },
            times: {
                min2: '2 mins ago',
                min5: '5 mins ago',
                min8: '8 mins ago',
                min12: '12 mins ago',
                min15: '15 mins ago',
            }
        },
        featured: {
            badge: 'Featured',
            title: 'Comprehensive Health Solutions',
            subtitle: 'Trusted by over 5,000+ customers and healthcare professionals',
            viewAll: 'View all products',
            addToCart: 'Add to cart',
            price: 'Price',
        },
        features: {
            title: 'Key Features',
            ai: {
                title: 'Smart AI Assistant',
                description: '24/7 sales support with advanced AI technology',
            },
            token: {
                title: 'Dual Token System',
                description: 'SHOP and GROW tokens with staking for passive income',
            },
            compliance: {
                title: 'Automatic Tax Compliance',
                description: 'Automatic calculation and reporting according to Vietnam regulations',
            },
            community: {
                title: 'Strong Community',
                description: 'Connect with thousands of sellers nationwide',
            }
        },
        testimonials: {
            badge: 'Success Stories',
            title: 'What Partners Say About WellNexus',
            subtitle: 'Thousands of Partners have transformed their lives with WellNexus',
            items: {
                item1: {
                    name: 'Mai Anh',
                    role: 'Pharmacist',
                    content: 'WellNexus helped me utilize my free time to earn extra income. The AI technology is very supportive for sales.',
                },
                item2: {
                    name: 'Tuan Hung',
                    role: 'Office Worker',
                    content: 'I am impressed with the transparency of the system. Tax reporting is automatic so I don\'t have to worry about anything.',
                },
                item3: {
                    name: 'Lan Huong',
                    role: 'Housewife',
                    content: 'The community is very supportive. I learned a lot of sales skills from other partners.',
                }
            }
        },
        cta: {
            title: 'Ready to Start?',
            subtitle: 'Join WellNexus today and build passive income',
            button: 'Sign Up Free',
        },
        roadmap: {
            sectionBadge: 'Development Roadmap',
            sectionTitle: 'The Evolution Map',
            subheadline: 'Journey from Partner to Empire Builder',
            unlock_at: 'Unlock at ',
            view_vision: 'See Vision',
            current_stage: 'Current Stage',
            stages: {
                seed: {
                    name: 'SEED',
                    description: 'Recruiting 200 Founders Club, Building Trust',
                    mission: 'Retail & Community Building',
                    status: 'Active',
                    benefits: {
                        income: 'Active income from sales',
                        founder: 'Founder Club Commission',
                        ai: 'Basic AI Tools',
                        support: '1-1 Training & Support',
                    }
                },
                tree: {
                    name: 'TREE',
                    description: 'Sales Automation with AI',
                    mission: 'Scale team & Automation',
                    status: 'Unlock Soon',
                    benefits: {
                        copilot: 'Advanced AI Copilot',
                        marketing: 'Marketing Automation',
                        dashboard: 'Leader Dashboard',
                        passive: 'Passive income from team',
                    }
                },
                forest: {
                    name: 'FOREST',
                    description: 'Marketplace & Ecosystem',
                    mission: 'Build ecosystem products',
                    status: 'Future',
                    benefits: {
                        platform: 'Health Coach Platform',
                        market: 'Marketplace ownership',
                        data: 'Data monetization',
                        equity: 'Equity participation',
                    }
                },
                empire: {
                    name: 'LAND',
                    description: 'Venture Builder & IPO',
                    mission: 'Build the empire',
                    status: 'Vision 2028',
                    benefits: {
                        venture: 'Venture Builder platform',
                        ipo: 'IPO preparation',
                        holdings: 'Holdings structure',
                        expansion: 'SEA expansion',
                    }
                }
            }
        },
        whyNow: {
            sectionBadge: 'First Mover Advantage',
            sectionTitle: 'Why Join Now?',
            subheadline: 'Special benefits for early adopters in the Seed stage',
            cta: 'Join Now - Only 157 slots left',
            benefits: {
                founders: {
                    title: 'Founders Club Bonus',
                    description: 'Special commission and equity allocation for first 200 Partners',
                    highlight: 'Only 157 slots left',
                },
                growth: {
                    title: 'Early Growth',
                    description: 'Build team from scratch, benefit from network effect when system scales',
                    highlight: '+320% YoY',
                },
                tech: {
                    title: 'Exclusive AI Tech',
                    description: 'Early access to Agentic OS and AI tools only for Founders',
                    highlight: 'Early Access',
                },
                market: {
                    title: 'SEA Market First-Mover',
                    description: 'Lead the $12B market, expanding to 4 SEA countries',
                    highlight: 'First-Mover',
                }
            }
        },
        heroStats: {
            partnersActive: 'Active Partners',
            gmvTotal: 'Total GMV',
            yoyGrowth: 'YoY Growth',
            slotsRemaining: 'Slots Remaining',
        },
        footer: {
            tagline: 'Pioneering Social Commerce ecosystem in SEA with AI-driven technology, equity ownership, and a clear roadmap from Seed to Empire.',
        }
    },

    // Network Tree
    networktree: {
        nh_p_c_y_add_member: 'Input Tree / Add Member',
        sponsor: 'Sponsor: ',
        full_name: 'Full Name',
        email: 'Email',
        phone: 'Phone Number',
        password: 'Password',
        rank: 'Rank',
        c_ng_t_c_vi_n_ctv: 'Collaborator (CTV)',
        kh_i_nghi_p: 'Startup',
        i_s: 'Ambassador',
        add_member: 'Add Member',
        sales: 'Sales',
        team: 'Team',
        s_h_th_ng_network_tree: 'Network Tree System',
        visual_representation_of_your: 'Visual representation of your downline structure',
        loading_network_data: 'Loading network data...',
        no_data_available: 'No data available',
        name_placeholder: 'John Doe',
        email_placeholder: 'email@example.com',
        phone_placeholder: '0912345678',
        password_placeholder: '••••••••',
        toast: {
            added_success: 'Added {name} to the team!',
            add_failed: 'Failed to add member',
        },
    },

    // Premium Navigation
    premiumnavigation: {
        newsletter: 'Newsletter',
        nh_n_th_ng_tin: 'Get information ',
        c_quy_n: 'exclusive',
        ng_k_nh_n_tin_t_c_u: 'Subscribe to receive the latest news, offers, and business tips from WellNexus.',
        ng_k: 'Subscribed',
        ng_k_1: 'Subscribe',
        email_placeholder: 'email@example.com',
        wellnexus: 'WellNexus',
        social_commerce_2_0: 'Social Commerce 2.0',
        premium_member: 'Premium Member',
        hot: 'HOT',
        premium_member_1: 'Premium Member',
        dashboard: 'Dashboard',
        ng_xu_t: 'Logout',
        b_t_u_ngay: 'Start Now',
        wellnexus_1: 'WellNexus',
        social_commerce_2_0_1: 'Social Commerce 2.0',
        h_sinh_th_i_social_commerce_t: 'Vietnam\'s most advanced Social Commerce ecosystem',
        hello_wellnexus_vn: 'hello@wellnexus.vn',
        '84_901_234_567': '+84 901 234 567',
        q1_tp_hcm_vietnam: 'D1, HCMC, Vietnam',
        wellnexus_all_rights_reserved: 'WellNexus. All rights reserved.',
        made_with_in_vietnam: 'Made with ❤️ in Vietnam',
        ssl_secured: 'SSL Secured',
        top_10_east_asia: 'Top 10 East Asia',
    },

    // Withdrawal Modal
    withdrawalmodal: {
        request_submitted: 'Request Submitted!',
        your_withdrawal_request_has_be: 'Your withdrawal request has been submitted successfully.',
        processing_time_1_3_business: 'Processing time: 1-3 business days',
        available_balance: 'Available Balance',
        '25': '25%',
        '50': '50%',
        '75': '75%',
        max: 'Max',
        bank_account_details: 'Bank Account Details',
        processing_time: 'Processing Time',
        withdrawal_requests_are_proces: 'Withdrawal requests are processed within 1-3 business days.',
        cancel: 'Cancel',
        submit_request: 'Submit Request',
        enter_amount: 'Enter amount',
        bank_placeholder: 'e.g., Vietcombank, Techcombank',
        account_number_placeholder: 'Enter account number',
        account_name_placeholder: 'Account holder name',
        validation: {
            amount_required: 'Please enter an amount',
            min_withdrawal: 'Minimum withdrawal is {amount}',
            exceeds_balance: 'Amount exceeds available balance',
            bank_name_required: 'Please enter bank name',
            account_number_required: 'Please enter account number',
            account_number_numeric: 'Account number must contain only numbers',
            account_name_required: 'Please enter account holder name',
        },
    },

    // Error Messages
    errors: {
        passwordsDoNotMatch: 'Passwords do not match',
        signupFailed: 'Signup failed. Please try again.',
        invalidCredentials: 'Invalid email or password.',
        timeout: 'Login timed out. Please check your network connection.',
        emailNotConfirmed: 'Email not confirmed. Please check your inbox.',
        network: 'Network error. Please try again.',
        unauthorized: 'You are not authorized.',
        notFound: 'Page not found.',
        serverError: 'Server error. Please try again later.',
        validation: {
            required: 'This field is required',
            email: 'Invalid email',
            phone: 'Invalid phone number',
            minLength: 'Minimum {min} characters',
            maxLength: 'Maximum {max} characters',
            passwordMatch: 'Passwords do not match',
            minAmount: 'Minimum amount {amount}',
            maxAmount: 'Maximum amount {amount}',
            insufficientBalance: 'Insufficient balance',
        }
    },

    // Success Messages
    success: {
        saved: 'Saved successfully!',
        updated: 'Updated successfully!',
        deleted: 'Deleted successfully!',
        sent: 'Sent successfully!',
        copied: 'Copied!',
        questCompleted: 'Quest completed!',
        purchaseSuccess: 'Purchase successful!',
        withdrawalSuccess: 'Withdrawal request successful!',
        stakingSuccess: 'Staking successful!',
        unstakingSuccess: 'Unstaking successful!',
    },

    // Hero Enhancements
    heroenhancements: {
        c_tin_t_ng_b_i: 'Trusted by',
    },

    // Agent Dashboard
    agentDashboard: {
        title: 'Agent Command Center',
        subtitle: 'Orchestrate your AI workforce',
        establishingNodeSync: 'Establishing node sync...',
        intelligenceGridOptimal: 'Intelligence Grid: Optimal',
        operationalTier: 'Operational Tier: ',
        version: 'v1.2.0 Stable',
        registry: 'Registry',
        nodes: 'Nodes',
        strategicSimulatorOffline: 'Strategic Simulator Offline',
        connectToPolicyEngine: 'Connect to the Policy Engine to run real-time market simulations.',
        active_node: 'Active Node',
        strategic_objectives: 'Strategic Objectives',
        operational_policies: 'Operational Policies',
        operational_telemetry: 'Operational Telemetry',
        inputs_data_streams: 'Inputs / Data Streams',
        stats: {
            totalAgents: 'Total Agents',
            activeFunctions: 'Active Functions',
            customAgents: 'Expert Agents',
        },
        grid: {
            neuralSync: 'Neural Link Sync...',
            statusActive: 'Active',
            statusTraining: 'Training',
            statusStandby: 'Standby',
        },
        details: {
            efficiency: 'Efficiency',
            accuracy: 'Accuracy',
            latency: 'Latency',
            capabilities: 'Capabilities',
            trainingHistory: 'Training History',
        }
    },

    // Policy Engine
    policyEngine: {
        title: 'Policy Engine',
        version: 'v3.1',
        synchronizingPolicyCore: 'Synchronizing Policy Core',
        strategicIntegrityConfirmed: 'Strategic Integrity Confirmed',
        sync: 'Sync:',
        projectionSimulator: 'Projection Simulator',
        realTime: 'Real-time',
        policyChangesAreCryptographicallySigned: 'Policy changes are cryptographically signed',
    },

    // Admin Security Settings
    adminsecuritysettings: {
        '100': '/100',
        '15_ph_t': '15 minutes',
        '1_gi': '1 hour',
        '2_gi': '2 hours',
        '30_ph_t': '30 minutes',
        b_o_m_t_t_i_kho_n: 'Account Security',
        b_t_2fa_t_ng_i_m: 'Enable 2FA to boost score',
        c_nh_b_o_ng_nh_p: 'Login Alerts',
        h_y: 'Cancel',
        ho_t_ng: 'Activities',
        i_l_n_cu_i: 'last changed ',
        i_m_b_o_m_t: 'Security Score',
        i_m_t_kh_u: 'Change Password',
        l_ch_s_ng_nh_p: 'Login History',
        m_t_kh_u: 'Password',
        nh_n_th_ng_b_o_khi_c_ng_nh: 'Receive alerts on new logins',
        ph_t: 'minutes',
        qu_n_l_c_i_t_b_o_m_t_c_a_b: 'Manage your security settings',
        qu_t_m_qr_v_i_ng_d_ng_x_c_th: 'Scan QR code with authenticator app',
        t_ng_ng_xu_t_sau: 'Auto logout after ',
        th_i_gian_phi_n: 'Session Timeout',
        thi_t_l_p_2fa: 'Setup 2FA',
        x_c_nh_n: 'Confirm',
        x_c_th_c_2_y_u_t: 'Two-Factor Authentication',
        b_t_2fa_b_o_v: 'Enabled - Account protected',
        th_m_l_p_b_o_m_t: 'Add extra security layer',
    },

    // AgencyOS
    agencyos: {
        categories: {
            marketing: 'Marketing',
            sales: 'Sales',
            finance: 'Finance',
            operations: 'Operations',
            strategy: 'Strategy (Art of War)',
            agents: 'AI Agents'
        },
        commands: {
            marketing: {
                plan: 'Create comprehensive marketing plan',
                calendar: 'Weekly/Monthly content calendar',
                social: 'Create social media post',
                email: 'Design email marketing campaign',
                seo: 'SEO audit and optimization'
            },
            sales: {
                proposal: 'Create professional proposal',
                pitch: 'Customer pitch deck',
                crm: 'Sync CRM data',
                followup: 'Automated follow-up email',
                quote: 'Quick customer quote'
            },
            finance: {
                invoice: 'Create professional invoice',
                runway: 'Calculate runway and burn rate',
                expense: 'Detailed expense report',
                budget: 'Project/Monthly budget planning',
                pnl: 'P&L Report (Profit/Loss)'
            },
            operations: {
                sop: 'Generate SOP (Standard Operating Procedures)',
                workflow: 'Design automated workflow',
                notes: 'Meeting notes and summary',
                task: 'Assign team tasks',
                checklist: 'Create task checklist'
            },
            strategy: {
                binhphap: 'Art of War Strategy Analysis',
                swot: 'SWOT Analysis',
                competitor: 'Competitor Analysis',
                market: 'Market Research',
                okr: 'Set OKRs'
            },
            agents: {
                researcher: 'AI Research Agent',
                writer: 'AI Content Writer',
                analyst: 'AI Data Analyst',
                designer: 'AI UI/UX Designer',
                developer: 'AI Developer'
            }
        }
    },

    // Command Palette
    commandpalette: {
        agencyos_85_commands: 'AgencyOS: 85 Commands',
        all: 'All',
        error: 'Error',
        executing_command: 'Executing Command',
        no_commands_found: 'No Commands Found',
        to_open: 'to open',
    },

    // Context Sidebar
    contextsidebar: {
        '15': '15',
        c_i_thi_n_s_c_kh_e: 'Health Improvements',
        h_s_kh_ch_h_ng: 'Customer Profile',
        i_m_s_c_kh_e: 'Health Score',
        i_m_s_t_t_ti_p_t_c_duy_tr: 'Good score, keep it up',
        l_ch_s_mua_h_ng: 'Purchase History',
        l_n_t_v_n_g_n_nh_t: 'Last Consultation',
        t_v_n_ho_n_th_nh: 'Consultations Completed',
        th_ng_tin_t_v_n: 'Consultation Info',
        tu_i: 'Age',
        tu_i_1: 'years old',
        v_n_ch_nh: 'Main Concerns',
    },

    // Copilot Components
    copilotheader: {
        ai_sales_assistant_powered_b: 'AI Sales Assistant powered by Gemini',
        coach: 'Coach',
        script: 'Script',
        the_copilot: 'The Copilot',
    },
    copilotmessageitem: {
        g_i_nhanh: 'Quick Copy',
    },
    copilotcoaching: {
        coaching_tips: 'Coaching Tips',
        ng: 'Got it',
    },
    copilotsuggestions: {
        g_i: 'Suggestion ',
        g_i_c_u_h_i: 'Suggested Questions',
    },

    // Commission Wallet
    commissionwallet: {
        withdrawable_balance: 'Withdrawable Balance',
        total_earnings_gross: 'Total Earnings (Gross)',
        withheld_tax_pit_10: 'Withheld Tax (PIT 10%)',
        tax_compliance_mode: 'Tax Compliance Mode',
        wellnexus_automatically_deduct: 'WellNexus automatically deducts ',
        '10_pit': '10% PIT',
        for_income_exceeding_2_000_000: ' for income exceeding 2,000,000 VND/month',
        request_withdrawal: 'Request Withdrawal',
        earnings_history: 'Earnings History',
        export_statement: 'Export Statement',
        date_ref: 'Date / Ref',
        type: 'Type',
        gross_amount: 'Gross Amount',
        pit_10: 'PIT (10%)',
        net_received: 'Net Received',
        status: 'Status',
        the_bee: 'THE BEE',
        source: 'Source',
        commission_calculation: 'Commission Calculation',
        bonus_revenue: 'Bonus Revenue: ',
        rate: 'Rate (',
    },

    // Audit Log
    auditlog: {
        all_administrators: 'All Administrators',
        analyze_all_actions: 'Analyze All Actions',
        audit_trail: 'Audit Trail',
        browser_api_gateway_node: 'Browser API Gateway Node',
        classification: 'Classification',
        close_inspection: 'Close Inspection',
        detailed_forensics_for_trace: 'Detailed Forensics For Trace',
        event_inspection: 'Event Inspection',
        export_dataset: 'Export Dataset',
        immutable_ledger_of_administra: 'Immutable Ledger of Administration',
        network_origin: 'Network Origin',
        no_telemetry_signals_detected: 'No Telemetry Signals Detected',
        operator: 'Operator',
        payload_metadata: 'Payload Metadata',
        resource_node: 'Resource Node',
        temporal_signature: 'Temporal Signature',
        timeline: 'Timeline',
        tracing: 'Tracing',
        utc_synchronization_active: 'UTC Synchronization Active',
    },

    // transactioncard
    transactioncard: {
        commit_approval: 'Commit Approval',
        flagged_for_behavioral_anomaly: 'Flagged for Behavioral Anomaly',
        gross: 'Gross',
        internal_ledger_net: 'Internal Ledger (Net)',
        latency: 'Latency',
        optimal: 'Optimal',
        retention: 'Retention',
        security_engine_quarantine: 'Security Engine Quarantine',
        system_yield_injected: 'System Yield Injected',
        uid: 'UID',
    },

    // rankprogressbar
    rankprogressbar: {
        rank_upgrade_progress: 'Rank Upgrade Progress',
        upgrade_to: 'Upgrade to ',
        kh_i_nghi_p: 'Startup',
        '25_commission': '- 25% Commission',
        complete: 'Complete',
        remaining: 'Remaining',
        after_upgrade: 'After Upgrade',
        '25_rate': '25% Commission',
        almost_there_just: 'Almost there! Just ',
        more_to_kh_i_nghi_p_rank: ' more to Startup rank!',
    },

    // products
    products: {
        add_product: 'Add Product',
        bonus_revenue_dttt_represent: 'Bonus Revenue DTTT Represents',
        commit: 'Commit',
        dttt_basis: 'DTTT Basis',
        dttt_commission_logic: 'DTTT Commission Logic',
        edit_config: 'Edit Config',
        global_catalog: 'Global Catalog',
        in_stock: 'In Stock',
        inventory_management_dttt_st: 'Inventory Management DTTT Stock',
        low_stock: 'Low Stock',
        member_21_startup_25: 'Member 21% / Startup 25%',
        member_comm: 'Member Comm',
        partner_comm: 'Partner Comm',
        retail_msrp: 'Retail (MSRP)',
        sku: 'SKU',
    },

    // overview
    overview: {
        active_nodes: 'Active Nodes',
        agent_cluster: 'Agent Cluster',
        ai_action_center: 'AI Action Center',
        ai_agent_has_autonomously_reso: 'AI Agent has autonomously resolved all pending actions.',
        autonomous_ecosystem_orchestra: 'Autonomous Ecosystem Orchestra',
        autonomous_recommendations: 'Autonomous Recommendations',
        confident: '% Confident',
        ecosystem_online: 'Ecosystem Online',
        ecosystem_scale: 'Ecosystem Scale',
        growth_trajectory: 'Growth Trajectory',
        live_pulse: 'Live Pulse',
        mission_control: 'Mission Control',
        queue_exhausted: 'Queue Exhausted',
        resolve: 'Resolve',
    },

    // finance
    finance: {
        treasury_control: 'Treasury Control',
        platform_liquidity_verificatio: 'Platform Liquidity Verification',
        automated_fraud_detection: 'Automated Fraud Detection',
        export_ledger: 'Export Ledger',
        analyze_all: 'Analyze All',
        security_passed: 'Security Passed',
        quarantined_items: 'Quarantined Items',
        security_batch_commit: 'Security Batch Commit',
        verifying_digital_ledgers: 'Verifying Digital Ledgers',
        ledger_synchronized: 'Ledger Synchronized',
        no_items_in_the_current_filter: 'No items in the current filter',
    },

    // agencyosdemo
    agencyosdemo: {
        '85_ai_powered_automation_comm': '85% AI Powered Automation',
        agencyos_integration: 'AgencyOS Integration',
        agent_kpis: 'Agent KPIs',
        all_commands: 'All Commands',
        command_categories: 'Command Categories',
        commands: 'Commands',
        execution_history: 'Execution History',
        no_commands_executed_yet_clic: 'No commands executed yet. Click to run.',
        open_command_palette_k: 'Open Command Palette (⌘K)',
    },

    // liveconsole
    liveconsole: {
        autonomous_agents_real_time_l: 'Autonomous Agents Real-time Log',
        bee_agent_core_v4_2_0_stable: 'BEE Agent Core v4.2.0 Stable',
        bps: 'bps',
        encrypted: 'Encrypted',
        intelligence_console: 'Intelligence Console',
        lat_4ms: 'Lat: 4ms',
        live: 'LIVE',
        live_operations_node_agent: 'Live Operations Node Agent',
        sync_active: 'Sync Active',
        tx: 'Tx',
        wellnexus_bee: 'WellNexus BEE',
    },

    // ordermanagement
    ordermanagement: {
        actions: 'Actions',
        activate_commissions: 'Activate Commissions',
        all: 'All',
        all_pending_orders_have_been_p: 'All pending orders have been processed',
        all_synced: 'All Synced',
        cashflow_hub: 'Cashflow Hub',
        customer: 'Customer',
        date: 'Date',
        filters: 'Filters',
        fraud_check: 'Fraud Check',
        never_approve: 'Never Approve',
        operational_risk_protocol: 'Operational Risk Protocol',
        order: 'Order',
        order_id: 'Order ID',
        order_orchestrator: 'Order Orchestrator',
        orders: 'Orders',
        queue_synchronized: 'Queue Synchronized',
        real_time_order_pipeline_manag: 'Real-time Order Pipeline Management',
        status: 'Status',
        strict_compliance_rule: 'Strict Compliance Rule',
        sync: 'Sync',
        syncing_global_ledgers: 'Syncing Global Ledgers',
        verify_transactions_and: 'Verify Transactions and',
        without_verified_bank_clearanc: 'Without Verified Bank Clearance',
    },

    // loginactivitylog
    loginactivitylog: {
        detected: 'Detected',
        device: 'Device',
        failed_login_attempt: 'Failed Login Attempt',
        if_you_don_t_recognize_these_a: "If you don't recognize these activities, secure your account immediately.",
        location: 'Location',
        login_activity: 'Login Activity',
        no_login_attempts_found: 'No login attempts found',
        recent_sign_in_attempts_to_you: 'Recent sign-in attempts to your account',
        status: 'Status',
        time: 'Time',
    },

    // partnerstable
    partnerstable: {
        auth_pending: 'Auth Pending',
        auth_status: 'Auth Status',
        direct_yield: 'Direct Yield',
        ecosystem_rank: 'Ecosystem Rank',
        ghost_network_detected: 'Ghost Network Detected',
        identity_node: 'Identity Node',
        no_partner_nodes_matching_curr: 'No partner nodes matching current filter',
        ops: 'Ops',
        points_buffer: 'Points Buffer',
        synchronizing_crm_ledger: 'Synchronizing CRM Ledger',
    },

    // dailyquesthub
    dailyquesthub: {
        accumulated_today: 'Accumulated Today',
        claim_reward: 'Claim Reward',
        completed: 'Completed',
        completed_1: 'Completed',
        grow: 'GROW',
        grow_1: 'GROW',
        mastered: 'Mastered',
        start_quest: 'Start Quest',
        yield: 'Yield',
    },

    // founderrevenuegoal
    founderrevenuegoal: {
        '1m_founder_journey': '$1M Founder Journey',
        '1_000_000_usd': '$1,000,000 USD',
        ai_xu_t_h_nh_ng: 'AI Recommended Actions',
        c_n_t_ng_t_c: 'Need Acceleration',
        current_stage: 'Current Stage',
        doanh_thu_hi_n_t_i: 'Current Revenue',
        m_c_ti_u_2026: 'Target 2026',
        of_goal: 'of Goal',
        projected_yoy_growth: 'Projected YoY Growth',
        revenue_milestone: 'Revenue Milestone',
        v_t_ti_n: 'Ahead of Schedule',
    },

    // sessionmanager
    sessionmanager: {
        active_now: 'Active Now',
        active_sessions: 'Active Sessions',
        connected: 'Connected',
        device: 'Device',
        if_you_don_t_recognize_a_sessi: "If you don't recognize a session, revoke it immediately.",
        last_active: 'Last Active',
        security_note: 'Security Note',
        this_device: 'This Device',
    },

    // simulationpanel
    simulationpanel: {
        active_distribution_node: 'Active Distribution Node',
        margin: 'Margin',
        monthly_fixed: 'Monthly Fixed',
        nodes: 'Nodes',
        projected_ebitda: 'Projected EBITDA',
        projected_gmv: 'Projected GMV',
        system_payout: 'System Payout',
        target_aov: 'Target AOV',
        vc_simulation_engine: 'VC Simulation Engine',
    },

    // onboardingquest
    onboardingquest: {
        ai_strategy: 'AI Strategy',
        day_3_30: 'Day 3/30',
        powered_by_gemini_ai: 'Powered by Gemini AI',
        stuck_ask_your_ai_coach_for_a: 'Stuck? Ask your AI Coach for a tip!',
        the_coach: 'The Coach',
        xp: 'XP',
    },

    // sidebar
    sidebar: {
        wellnexus: 'WellNexus',
        social_commerce: 'Social Commerce',
        the_coach: 'The Coach',
        day_3_30: 'Day 3/30',
        xp: 'XP',
        get_ai_advice: 'Get AI Advice',
    },

    // errorboundary
    errorboundary: {
        oops_something_went_wrong: 'Oops! Something went wrong',
        we_ve_encountered_an_unexpecte: "We've encountered an unexpected error. Please try again.",
        error_details_dev_only: 'Error Details (Dev Only)',
        reload_page: 'Reload Page',
        go_home: 'Go Home',
    },

    // herocard
    herocard: {
        commission: 'Commission',
        h_ng_n_m: 'Annual',
        live_commission: 'Live Commission',
        partner_id: 'Partner ID',
        t_ng_tr_ng: 'Growth',
        th_ng: 'Month',
        total_yield: 'Total Yield',
        welcome: 'Welcome',
        '100m_vnd_revenue': '100M VND Revenue',
        access_secured: 'Access Secured',
        achievement_logic: 'Achievement Logic',
        ecosystem_scaling: 'Ecosystem Scaling',
        founders_pathway: 'Founders Pathway',
        live: 'LIVE',
        reach: 'Reach ',
        to_hit_next_milestone: 'to hit next milestone',
        to_unlock: ' to unlock ',
        venture_partner_status: 'Venture Partner Status',
    },

    // statsgrid
    statsgrid: {
        '10_pit': '10% PIT',
        next_cycle: 'Next Cycle',
        reserved_tier_gt_2m: 'Reserved Tier >2M',
    },

    // Copilot Page
    copilotpage: {
        chat_m_i: 'New Chat',
        l_ch_s_chat: 'Chat History',
        xem_l_ch_s_chat: 'View chat history',
        g_i_prompt_click_d_ng_n: 'Prompt Suggestions - Click to use',
        '85': '85%',
        time: {
            justNow: 'Just now',
            hoursAgo: '{{count}} hours ago',
            yesterday: 'Yesterday',
        },
        mock: {
            session1: { title: 'Customer consultation for ANIMA 119', preview: 'Customer asking about price and benefits...' },
            session2: { title: 'Objection Handling - High Price', preview: 'Customer says product is too expensive...' },
            session3: { title: 'Month-end Closing Script', preview: 'Create closing script for promotion...' },
            session4: { title: 'Facebook Post Writing', preview: 'Write a post introducing new product...' },
        },
        prompts: {
            facebook: { title: 'Write Facebook Post', prompt: 'Help me write an engaging Facebook post for ANIMA 119 with emojis and strong CTA' },
            salesScript: { title: 'Closing Script', prompt: 'Create a closing script for hesitant customers regarding price' },
            objection: { title: 'Objection Handling', prompt: 'Customer says "I need to think about it". How should I respond?' },
            coldCall: { title: 'Cold Call Script', prompt: 'Write a cold call script for new customers' },
            highlight: { title: 'Product Highlights', prompt: 'List 5 key highlights of ANIMA 119 to persuade customers' },
            promotion: { title: 'Promotion Ideas', prompt: 'Create attractive promotion ideas for the product' },
        },
    },

    // useHeroCard
    useHeroCard: {
        share_title: 'Join WellNexus',
        share_text: 'Join me on WellNexus and start earning!',
    },

    // useStatsGrid
    useStatsGrid: {
        tbd: 'TBD',
    },

    // useCopilot
    useCopilot: {
        greeting: 'Hello {name}! 👋 I am **The Copilot** - your AI Sales Assistant.\n\nI can help you:\n✅ Handle customer objections\n✅ Suggest smart responses\n✅ Create sales scripts\n\nTry entering a customer objection, e.g., "This product is too expensive!"',
        error_processing: 'Sorry, I encountered an error. Please try again!',
        script_generated: 'Sales script generated',
        failed_generate: 'Failed to generate script',
        coaching_ready: 'Coaching tips ready',
        failed_coaching: 'Failed to get coaching',
        current_product: 'Current Product',
    },

    // Revenue Progress Widget
    revenueprogresswidget: {
        revenue_milestone: 'Revenue Milestone',
        global_ecosystem_velocity: 'Global Ecosystem Velocity',
        benchmark: 'Benchmark: ',
        monthly_liquidity_flow: 'Monthly Liquidity Flow',
        baseline_0: 'Baseline $0',
        target: 'Target: ',
        annualized_run_rate_arr: 'Annualized Run Rate (ARR)',
        avg_unit_order: 'Avg Unit Order',
        daily_momentum: 'Daily Momentum',
        verified_partners: 'Verified Partners',
        benchmark_achieved: '🎉 BENCHMARK ACHIEVED',
        days_to_benchmark: 'DAYS TO $1M BENCHMARK',
    },

    // Quick Actions Card
    quickactionscard: {
        c_ng_c_h_tr_kinh_doanh: 'Business Support Tools',
        gift_card_created: 'Gift Card created: {{code}} (Copied)',
        health_check_share_text: 'Free Health Check with WellNexus!',
        link_copied: 'Link copied to clipboard!',
        achievement_title: 'My WellNexus Achievement',
        achievement_share_text: '🎉 My WellNexus Achievement:\n\n🏆 Rank: {{rank}}\n💰 Sales: {{sales}}\n👥 Team Volume: {{team}}\n\nJoin me at WellNexus! 💪',
        achievement_copied: 'Achievement copied to clipboard!',
        send_gift_card: 'Send Gift Card',
        share_health_check: 'Share Health Check Link',
        share_health_check_desc: 'Send health check link',
        tip_s_d_ng_c_c_c_ng_c_n: 'Tip: Use these tools to increase customer engagement',
    },

    // Marketplace Header
    marketplaceheader: {
        items_available: 'items available',
    },

    // Product Grid
    productgrid: {
        ai_recommended: 'AI Recommended',
        add_to_cart: 'Add to Cart',
        price: 'Price',
        commission: ' Commission',
    },

    // Redemption Zone
    redemptionzone: {
        grow_rewards: 'GROW Rewards',
        s_d_ng_grow_token_t_ch_l_y_t: 'Use accumulated GROW tokens to redeem exclusive rewards.',
        s_d_hi_n_t_i: 'Current Balance',
        grow_tokens: 'GROW Tokens',
        redeem_reward: 'Redeem Reward',
        not_enough_grow: 'Not enough GROW',
        categories: {
            all: 'All',
            tech: 'Tech',
            travel: 'Travel',
            courses: 'Courses',
        },
    },

    // Cart Drawer
    cartdrawer: {
        your_cart: 'Your Cart',
        items_confirmed: 'items confirmed',
        your_cart_is_empty: 'Your cart is empty',
        start_adding_premium_products: 'Start adding premium products to your cart.',
        subtotal: 'Subtotal',
        total: 'Total',
        proceed_to_checkout: 'Proceed to Checkout',
    },

    // AI Recommendation
    airecommendation: {
        '240': '240+',
        users_helped: 'Users Helped Today',
    },

    // Marketplace Filters
    marketplacefilters: {
        b_l_c: 'Filters',
        danh_m_c: 'Category',
        kho_ng_gi: 'Price Range',
        t_l_i_b_l_c: 'Reset Filters',
        categories: {
            all: 'All',
            health: 'Health',
            wellness: 'Wellness',
            nutrition: 'Nutrition',
        },
        prices: {
            all: 'All Prices',
            under5m: 'Under 5M',
            '5to15m': '5M - 15M',
            over15m: 'Over 15M',
        },
    },
    // Team & Leader Dashboard

  leaderdashboard: {
    qu_n_l_i_nh_m: 'Team Management',
    ai_insights: 'AI Insights',
    s_h_th_ng: 'System Tree',
    top_3_t_ng_t_i: 'Top 3 Performers',
    doanh_s_cao_nh_t_th_ng_n_y: 'Highest sales this month',
    doanh_s: 'Sales',
    doanh_s_1: 'Sales',
    doanh_s_2: 'Sales',
    th_nh_vi_n_r_i_ro_cao: 'High Risk Members',
    th_nh_vi_n_r_i_ro_trung_b_nh: 'Medium Risk Members',
    t_l_gi_ch_n: 'Retention Rate',
    c_n_ch: 'Attention Needed',
    th_nh_vi_n_c_n_ch: 'Members Needing Attention (',
    ai_ph_t_hi_n_nh_ng_th_nh_vi_n: 'AI detected members with decreasing interaction or sales.',
    l_do_c_n_ch: 'Risk Factors',
    ai_xu_t: 'AI Suggestions',
    g_i_nh_c_nh: 'Send Reminder',
    t_ng_qu_kh_ch_l: 'Send Gift',
    all_ranks: 'All Ranks',
    partner: 'Partner',
    member: 'Member',
    network_health: 'Network Health',
    status: {
        active: 'Active',
        at_risk: 'At Risk',
        inactive: 'Inactive'
    },
    ranks: {
        thien_long: 'Thien Long',
        phuong_hoang: 'Phoenix',
        dai_su_diamond: 'Diamond Ambassador',
        dai_su_gold: 'Gold Ambassador',
        dai_su_silver: 'Silver Ambassador',
        dai_su: 'Ambassador',
        khoi_nghiep: 'Startup',
        ctv: 'Collaborator',
        unknown: 'Unknown'
    },
    alerts: {
        reminder_success: 'Reminder sent successfully!',
        reminder_failed: 'Failed to send reminder',
        gift_success: 'Gift sent successfully!',
        gift_failed: 'Failed to send gift'
    },
    risk_levels: {
        high: 'High Risk',
        medium: 'Medium Risk',
        low: 'Low Risk'
    }
  },


  agentdetailsmodal: {
    intelligence_node_context: 'INTELLIGENCE NODE CONTEXT',
    enforcement: 'ENFORCEMENT',
  },

  agentgridcard: {
    node_id: 'NODE ID: ',
    '0x': ' // 0x',
    telemetry_stream_active: 'TELEMETRY STREAM ACTIVE',
    neural_training: 'NEURAL TRAINING',
  },

  // Venture Page
    venture: {
        hero: {
            badge: 'Co-Founder Recruitment Protocol v4.0',
            headline: 'Venture Builder:',
            headlineAccent: 'Next-Gen Health Tech Ecosystem',
            subheadline: 'Architecting the decentralized health supply chain across SEA. We don\'t recruit employees; we build equity-backed Co-Founder nodes.',
            primaryCta: 'Init Recruitment Protocol',
            secondaryCta: 'Audit Portfolio',
            stats: {
                valuation_label: 'Accumulated Valuation',
                nodes_label: 'Nodes Targeted',
                market_label: 'Primary Market',
            },
        },
        navigation: {
            apply_recruitment: 'Apply / Recruitment',
            venture_builder: 'Venture Builder',
            menu: {
                portfolio: 'Portfolio',
                deal: 'The Deal',
                market: 'SEA Market',
            },
        },
        deal: {
            sectionBadge: 'The Protocol Deck',
            sectionTitle: 'Equity & Infrastructure',
            subheadline: 'Hyper-scalable investment structure for high-performance Co-Founders with local autonomy.',
            capitalNode: {
                category: 'Capital Node',
                item1: 'Inventory sync with zero initial liquidity',
                item2: 'Network-backed working capital pools',
                item3: 'Performance-indexed credit extensions',
            },
            techStack: {
                category: 'Tech Stack 2.0',
                item1: 'Agentic OS - Native AI coordination',
                item2: 'Real-time valuation & yield telemetry',
                item3: 'Dynamic tax compliance abstraction',
                item4: 'Distributed ledger integration',
            },
            ownership: {
                category: 'Ownership Matrix',
                item1: 'ESOP - Direct equity ownership tracks',
                item2: 'GROW Delta - Incentive-aligned yield',
                item3: 'Linear 4-year vesting // 1-year cliff',
                item4: 'IPO-indexed valuation milestones',
            },
        },
        portfolio: {
            sectionBadge: 'Active Founder Nodes',
            sectionTitle: 'Proven Yield Generations',
            subheadline: 'Ecosystem telemetry from active high-performance nodes.',
            roles: {
                ceo: 'Co-Founder // CEO',
                cmo: 'Co-Founder // CMO',
                cto: 'Co-Founder // CTO',
            },
            regions: {
                hanoi: 'Hanoi',
                hcmc: 'HCMC',
                danang: 'Da Nang',
            },
            val: 'Val',
            growth: 'Growth',
            arr_node: 'ARR Node',
        },
        market: {
            sectionBadge: 'Ecosystem Expansion',
            sectionTitle: 'SEA Regional Dominance',
            subheadline: 'Multi-lateral expansion protocol into $12B addressable market.',
            regions: {
                vietnam: 'Vietnam',
                thailand: 'Thailand',
                indonesia: 'Indonesia',
                philippines: 'Philippines',
            },
            status: {
                active: 'Active',
                expanding: 'Expanding',
                protocol_init: 'Protocol Init',
                pending: 'Pending',
            },
            total_addressable_market: 'Total Addressable Market',
            velocity: 'Velocity',
            init_sea_expansion_protocol: 'Init SEA Expansion Protocol',
        },
        footer: {
            tagline: 'Venture Builder powering high-fidelity administrative surfaces and decentralized health commerce across Southeast Asia.',
            strategic_ecosystem_builder: 'Strategic Ecosystem Builder',
            newsletter: {
                title: 'Transmission Sync',
                placeholder: 'comm_channel@secure.vn',
            },
            subscribe_for_exclusive_intake: 'Subscribe for Exclusive Intake',
            copyright: '© 2026 WellNexus Venture Builder // Absolute Zero Debt',
            privacy: 'Ecosystem Privacy',
            terms: 'Term Sheet Compliance',
        },
    },

    // Product Detail
    productdetail: {
        identity_missing: 'IDENTITY MISSING',
        the_requested_product_node_is: 'THE REQUESTED PRODUCT NODE IS UNREACHABLE OR HAS BEEN DEPRECATED FROM THE NETWORK.',
        revert_to_marketplace: 'REVERT TO MARKETPLACE',
        back_to_command_registry: 'BACK TO COMMAND REGISTRY',
        verified_node: 'VERIFIED NODE',
        premium_tier: 'PREMIUM TIER',
    },

    // Product Components
    productactions: {
        copy_ref_node: 'COPY REF NODE',
        logistics_offline: 'LOGISTICS OFFLINE',
        allocated_successfully: 'ALLOCATED SUCCESSFULLY',
        order_prototype: 'ORDER PROTOTYPE',
    },
    productcard: {
        earn: 'Earn ',
        view_details: 'View Details',
        out_of_stock: 'Out of Stock',
        stock: 'Stock: ',
        share: 'Share',
        added: 'Added',
        buy_now: 'Buy Now',
    },
    producthero: {
        logistics_depleted: 'LOGISTICS DEPLETED',
    },
    productinfo: {
        bio_optic_optimization: 'BIO-OPTIC OPTIMIZATION',
        core_rating_4_9: '4.9 CORE RATING',
        available_capacity: 'AVAILABLE CAPACITY: ',
        units: ' UNITS',
    },
    productpricing: {
        market_valuation: 'MARKET VALUATION',
        node_yield_profit: 'NODE YIELD PROFIT',
    },
    producttabs: {
        standard_engagement_protocol: 'STANDARD ENGAGEMENT PROTOCOL',
        primary_yield: 'Primary Yield',
        composition: 'Composition',
        protocol: 'Protocol',
    },

    // Test Page
    testpage: {
        well_test_page: 'Well Test Page',
        connectivity_check: 'Connectivity Check',
        client_status: 'Client Status',
        active: 'Active',
    },

    // Debugger Page
    debuggerpage: {
        system_debugger: 'System Debugger',
        v_debug_1_0: 'v.debug.1.0',
        zustand_store_state: 'Zustand Store State',
        environment_window: 'Environment & Window',
        window_props: 'Window Properties',
        local_storage_keys: 'Local Storage Keys',
        empty: 'Empty',
    },
};
