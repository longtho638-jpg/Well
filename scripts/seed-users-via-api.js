import { createClient } from '@supabase/supabase-js';

// Configuration from .env.local (hardcoded for this script execution based on previous reads)
const SUPABASE_URL = 'https://jcbahdioqoepvoliplqy.supabase.co';
// Using the service role key we found earlier
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.argv[2];

if (!SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const users = [
  {
    email: 'admin@wellnexus.vn',
    password: 'AdminPassword123!',
    email_confirm: true,
    user_metadata: { full_name: 'Admin User' },
    app_metadata: { provider: 'email', providers: ['email'], role: 'admin' }
  },
  {
    email: 'testuser@wellnexus.vn',
    password: 'TestPassword123!',
    email_confirm: true,
    user_metadata: { full_name: 'Test User' },
    app_metadata: { provider: 'email', providers: ['email'] }
  }
];

async function seedUsers() {
  console.log(`🌱 Seeding users to ${SUPABASE_URL}...`);

  for (const user of users) {
    try {
      console.log(`Creating/Updating user: ${user.email}`);

      // Check if user exists first to avoid "User already registered" error being fatal
      // Actually, admin.createUser throws if exists.
      // admin.listUsers isn't efficient for lookup by email but we can try createUser and catch.

      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: user.email_confirm,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata
      });

      if (error) {
        if (error.message.includes('already registered') || error.status === 422) {
             console.log(`⚠️ User ${user.email} already exists. Attempting to update...`);
             // Find user to get ID (needed for update)
             // We have to list users and find.
             const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
             if (listError) throw listError;

             const existingUser = listData.users.find(u => u.email === user.email);
             if (existingUser) {
                 const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
                     existingUser.id,
                     {
                         password: user.password,
                         email_confirm: user.email_confirm,
                         user_metadata: user.user_metadata,
                         app_metadata: user.app_metadata
                     }
                 );
                 if (updateError) {
                     console.error(`❌ Failed to update ${user.email}:`, updateError.message);
                 } else {
                     console.log(`✅ Updated user: ${user.email}`);
                 }
             } else {
                 console.error(`❌ Could not find user ${user.email} in list to update.`);
             }

        } else {
          console.error(`❌ Failed to create ${user.email}:`, error.message);
        }
      } else {
        console.log(`✅ Created user: ${user.email} (${data.user.id})`);
      }
    } catch (err) {
      console.error(`❌ Unexpected error for ${user.email}:`, err.message);
    }
  }
}

seedUsers();
