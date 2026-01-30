# Post-Implementation Checklist: Guest Checkout

## Database Updates (Required)
The following SQL must be executed in your Supabase SQL Editor to allow guest orders:

```sql
-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow guest orders (anon insert)
CREATE POLICY "Allow public insert for guest orders"
ON transactions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  type = 'sale' AND
  status = 'pending' AND
  (auth.uid() IS NULL OR auth.uid() = user_id)
);

-- Allow reading own inserted order (optional, for confirmation page)
CREATE POLICY "Allow reading own inserted order"
ON transactions
FOR SELECT
TO anon, authenticated
USING (
  (auth.uid() = user_id) OR
  (auth.uid() IS NULL AND created_at > now() - interval '1 minute')
);
```

## Environment Variables
Ensure your `.env` contains:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Deployment
1. Run `npm run build` locally to verify (Passed).
2. Deploy to Vercel/Netlify.
3. Verify the `/checkout` route works in production.

## Future Enhancements
- [ ] Integrate banking QR code generation (VietQR).
- [ ] Add email confirmation (Supabase Edge Functions).
- [ ] Add "Create Account" prompt on Success page to save order history.
