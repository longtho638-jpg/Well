#!/usr/bin/env node
/**
 * Test Supabase Auth Connection
 * Usage: node scripts/test-supabase-auth.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('=== Supabase Auth Test ===');
console.log('URL:', supabaseUrl ? '✅ Configured' : '❌ Missing');
console.log('Key:', supabaseKey ? '✅ Configured' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
    const email = 'doanhnhancaotuan@gmail.com';
    const password = process.env.TEST_USER_PASSWORD || 'password123';

    console.log('\n🔐 Testing login for:', email);

    try {
        const startTime = Date.now();
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        const elapsed = Date.now() - startTime;

        console.log(`⏱️ Response time: ${elapsed}ms`);

        if (error) {
            console.error('❌ Auth Error:', error.message);
            console.error('   Error Code:', error.status);
        } else {
            console.log('✅ Login successful!');
            console.log('   User ID:', data.user?.id);
            console.log('   Email:', data.user?.email);
            console.log('   Session:', data.session ? 'Active' : 'None');
        }
    } catch (err) {
        console.error('❌ Exception:', err.message);
    }
}

testAuth();
