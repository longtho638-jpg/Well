import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.log('⚠️ .env file not found. Creating a dummy .env for CI build...');

  const dummyEnvContent = `
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=dummy-key-for-ci-build
VITE_API_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=dummy-api-key
VITE_FIREBASE_AUTH_DOMAIN=dummy-auth-domain
VITE_FIREBASE_PROJECT_ID=dummy-project-id
VITE_FIREBASE_STORAGE_BUCKET=dummy-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=dummy-sender-id
VITE_FIREBASE_APP_ID=dummy-app-id
`;

  fs.writeFileSync(envPath, dummyEnvContent.trim());
  console.log('✅ Dummy .env created successfully.');
} else {
  console.log('ℹ️ .env file already exists. Skipping creation.');
}
