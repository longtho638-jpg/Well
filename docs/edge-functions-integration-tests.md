# Edge Functions Integration Tests

**Date:** 2026-03-05
**Status:** ✅ Ready to Run

---

## 🧪 Test Coverage

| Function | Tests | Status |
|----------|-------|--------|
| `validate-csrf` | 4 tests | ✅ Ready |
| `check-rate-limit` | 4 tests | ✅ Ready |
| Rate Limit Stress | 1 test | ✅ Ready |

---

## 🚀 Run Tests

### Local Testing

```bash
# 1. Start Supabase + Functions locally
pnpm supabase start

# 2. Serve functions
pnpm supabase functions serve --env-file .env.local

# 3. Run integration tests
pnpm vitest run supabase/functions/__tests__/integration.test.ts
```

### Staging Testing

```bash
# Deploy to staging
pnpm supabase functions deploy validate-csrf --project-ref YOUR_STAGING_REF
pnpm supabase functions deploy check-rate-limit --project-ref YOUR_STAGING_REF

# Update test URL to staging
# Run tests against staging environment
```

---

## ✅ Expected Results

### validate-csrf
- ✅ 400 for missing token
- ✅ 400 for missing userId
- ✅ 403 for invalid token
- ✅ 200 for OPTIONS preflight

### check-rate-limit
- ✅ 400 for missing userId
- ✅ 200 for first request (allowed)
- ✅ 200 for OPTIONS preflight
- ✅ 200 for requests under limit (100/min)

---

## 🔧 Troubleshooting

### Connection Refused
```bash
# Ensure Supabase is running
pnpm supabase status

# Restart if needed
pnpm supabase stop && pnpm supabase start
```

### CORS Errors
- Check `_shared/cors.ts` headers
- Verify OPTIONS handler in function

### Database Errors
- Ensure `rate_limits` table exists
- Run: `pnpm supabase db push --include-all`

---

## 📊 Monitoring

After deployment, monitor function health:

```bash
# View function logs
pnpm supabase functions logs validate-csrf
pnpm supabase functions logs check-rate-limit

# Check for errors
pnpm supabase functions logs | grep -i error
```

---

## 🎯 Production Checklist

- [ ] Tests pass locally
- [ ] Functions deployed to staging
- [ ] Staging tests pass
- [ ] Deploy to production
- [ ] Monitor logs for 24h
- [ ] Set up error alerts

---

**Status:** Ready for integration testing.
