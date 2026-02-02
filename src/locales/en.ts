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
        currency: {
            vnd: '₫',
            grow: 'Token',
            shop: 'SHOP',
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
    },

    // Landing Page - AST Migration Keys
    landingpage: {
        ultimate_level_wellness: 'ULTIMATE LEVEL WELLNESS',
        hu_n_luy_n_vi_n_ai: 'AI Coach',
        h_ng_d_n_c_nh_n_h_a_b_i_gemi: 'Personalized guidance by Gemini',
        thu_nh_p_th_ng: 'Passive Income',
        theo_d_i_hoa_h_ng_t_ng_v_p: 'Track commissions in real-time',
        '12_450': '12,450,000₫',
        thu_nh_p_tb_partner: 'Avg. Income/Partner',
        c_ng_ng: 'Community',
        tham_gia_c_ng_1_000_founders: 'Join 1,000+ successful Founders',
        m_r_ng_to_n_c_u: 'Global Expansion',
        s_n_s_ng_chinh_ph_c_th_tr_ng: 'Ready to conquer Southeast Asia market',
        m_kh_a_khi_t: 'Unlock at ',
        xem_t_m_nh_n: 'See Vision',
        giai_o_n_hi_n_t_i: 'Current Stage',
        tham_gia_ngay_ch_c_n_157_sl: 'Join Now - Only 157 slots left',
        c_u_chuy_n_th_nh_c_ng: 'Success Stories',
        partner_n_i_g_v_wellnexus: 'What Partners Say About WellNexus',
        h_ng_ng_n_partner_thay_i: 'Thousands of Partners have transformed their lives with WellNexus',
    },

    // Dashboard Page
    dashboard: {
        title: 'Dashboard',
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
            available: 'Liquid Assets',
            locked: 'Locked Assets',
            staked: 'Staked for Yield',
            total: 'Total Portfolio Value',
            shopToken: 'SHOP Token - Cashflow',
            growToken: 'GROW Token - Equity',
        },

        actions: {
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
            noTransactions: 'No transactions yet',
            id: 'Transaction ID',
            date: 'Date',
            amount: 'Amount',
            type: 'Type',
            status: 'Status',
            hash: 'Hash',
            tax: 'Tax',
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
        form: {
            fullName: 'Full Name',
            phone: 'Phone Number',
            email: 'Email (For order notifications)',
            city: 'City / Province',
            district: 'District',
            ward: 'Ward / Commune',
            street: 'Detailed Address',
            note: 'Note (Optional)',
            notePlaceholder: 'Delivery during office hours...',
            fullNamePlaceholder: 'John Doe',
            phonePlaceholder: '0901234567',
            emailPlaceholder: 'example@email.com',
            cityPlaceholder: 'Ho Chi Minh City',
            districtPlaceholder: 'District 1',
            wardPlaceholder: 'Ben Nghe Ward',
            streetPlaceholder: '123 Nguyen Hue Street',
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
        },

        stats: {
            totalReferrals: 'Total Referrals',
            activeReferrals: 'Active Referrals',
            active: 'Active',
            conversionRate: 'Conversion Rate',
            totalRevenue: 'Total Revenue',
            totalBonus: 'Total Bonus',
            monthlyReferrals: 'Monthly Referrals',
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
        },

        chart: {
            title: 'Referral Trend',
            referrals: 'Referrals',
            revenue: 'Revenue',
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
            }
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
            },
            tip: '💡 Tip: Share this link on Facebook, Zalo, or your personal website to earn commission from every order!',
            partnerLabel: 'WellNexus Partner',
            downloadQR: 'Download QR Code',
            share: 'Share',
            qrTip: 'Print this QR code and display at your store, or share online for easy customer access!',
            shareTitle: 'My QR Code - WellNexus',
            shareText: 'Scan this QR code to access my referral link!',
        }
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
        adminLabel: 'Admin',
        superUser: 'Super User',

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
        },
        register: {
            title: 'Register',
            subtitle: 'Join the WellNexus community',
            fullName: 'Full Name',
            email: 'Email',
            phone: 'Phone Number',
            password: 'Password',
            confirmPassword: 'Confirm Password',
            referralCode: 'Referral Code (optional)',
            agree: 'I agree to the',
            terms: 'Terms of Service',
            and: 'and',
            privacy: 'Privacy Policy',
            registerButton: 'Register',
            haveAccount: 'Already have an account?',
            login: 'Login',
        },
        forgotPassword: {
            title: 'Forgot Password',
            subtitle: 'Enter your email to reset password',
            email: 'Email',
            sendReset: 'Send Reset Link',
            backToLogin: 'Back to Login',
        }
    },

    // Landing Page
    landing: {
        hero: {
            title: 'Build Your Career with WellNexus',
            subtitle: 'Smart business platform combining AI, Tokenomics, and community',
            cta: 'Get Started',
            learnMore: 'Learn More',
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
            title: 'Success Stories',
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
            stages: {
                seed: {
                    name: 'SEED',
                    description: 'Recruiting 200 Founders Club, Building Trust',
                    mission: 'Retail & Community Building',
                    status: 'Active'
                },
                tree: {
                    name: 'TREE',
                    description: 'Sales Automation with AI',
                    mission: 'Scale team & Automation',
                    status: 'Unlock Soon'
                },
                forest: {
                    name: 'FOREST',
                    description: 'Marketplace & Ecosystem',
                    mission: 'Build ecosystem products',
                    status: 'Future'
                },
                empire: {
                    name: 'LAND',
                    description: 'Venture Builder & IPO',
                    mission: 'Build the empire',
                    status: 'Vision 2028'
                }
            }
        },
        whyNow: {
            sectionBadge: 'First Mover Advantage',
            sectionTitle: 'Why Join Now?',
            subheadline: 'Special benefits for early adopters in the Seed stage',
            benefits: {
                founders: {
                    title: 'Founders Club Bonus',
                    description: 'Special commission and equity allocation for first 200 Partners'
                },
                growth: {
                    title: 'Early Growth',
                    description: 'Build team from scratch, benefit from network effect when system scales'
                },
                tech: {
                    title: 'Exclusive AI Tech',
                    description: 'Early access to Agentic OS and AI tools only for Founders'
                },
                market: {
                    title: 'SEA Market First-Mover',
                    description: 'Lead the $12B market, expanding to 4 SEA countries'
                }
            }
        }
    },

    // Error Messages
    errors: {
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
    }
};
