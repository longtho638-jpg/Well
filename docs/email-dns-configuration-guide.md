# Email DNS Configuration Guide - WellNexus

**Purpose:** Configure wellnexus.vn domain for Resend email service
**Status:** ⚠️ PENDING - Currently using default `onboarding@resend.dev`
**Target:** Use custom domain `noreply@wellnexus.vn`

---

## Why Email DNS Matters

**Current State:**
- ✅ Emails send successfully via Resend API
- ⚠️ Using default domain: `onboarding@resend.dev`
- ❌ Lower deliverability (may go to spam)
- ❌ Not branded with wellnexus.vn

**After DNS Configuration:**
- ✅ Custom sender: `noreply@wellnexus.vn`
- ✅ Higher deliverability (90%+ inbox rate)
- ✅ Branded email address
- ✅ DMARC protection against spoofing

---

## Required DNS Records

### 1. SPF (Sender Policy Framework)

**Purpose:** Authorize Resend to send emails on behalf of wellnexus.vn

**Record Type:** `TXT`
**Name:** `@` (root domain)
**Value:** `v=spf1 include:_spf.resend.com ~all`

**Explanation:**
- `v=spf1` - SPF version 1
- `include:_spf.resend.com` - Allow Resend's servers
- `~all` - Soft fail for other servers (recommended for testing)

**After Testing:** Change to `v=spf1 include:_spf.resend.com -all` (hard fail)

---

### 2. DKIM (DomainKeys Identified Mail)

**Purpose:** Cryptographic signature to verify email authenticity

**Record Type:** `CNAME`
**Name:** `resend._domainkey` (subdomain)
**Value:** `resend._domainkey.resend.com`

**How it Works:**
- Resend signs outgoing emails with private key
- Recipients verify signature using public key in DNS
- Prevents email tampering in transit

---

### 3. DMARC (Domain-based Message Authentication)

**Purpose:** Policy for handling failed SPF/DKIM checks

**Record Type:** `TXT`
**Name:** `_dmarc` (subdomain)
**Value:** `v=DMARC1; p=quarantine; rua=mailto:dmarc@wellnexus.vn; pct=100`

**Explanation:**
- `p=quarantine` - Put suspicious emails in spam (recommended)
- `rua=mailto:dmarc@wellnexus.vn` - Send reports to this email
- `pct=100` - Apply policy to 100% of emails

**Alternative Policies:**
- `p=none` - Monitor only (for testing)
- `p=reject` - Block all failed emails (strictest)

---

## Step-by-Step Setup

### Phase 1: Resend Domain Verification (5 minutes)

1. **Login to Resend Dashboard**
   - URL: https://resend.com/domains
   - Use wellnexus.vn account credentials

2. **Add Domain**
   - Click "Add Domain"
   - Enter: `wellnexus.vn`
   - Click "Add"

3. **Copy DNS Records**
   - Resend will display 3 DNS records:
     - SPF (TXT)
     - DKIM (CNAME)
     - DMARC (TXT)
   - **Keep this tab open** for copy-pasting

---

### Phase 2: Add DNS Records (15 minutes)

**Where to add records:**
- If using **Vercel DNS:** Vercel Dashboard → Domains → wellnexus.vn → DNS Records
- If using **Cloudflare DNS:** Cloudflare Dashboard → wellnexus.vn → DNS
- If using **Other Registrar:** Login to domain registrar (GoDaddy, Namecheap, etc.)

**Add these 3 records:**

```
Record 1 (SPF):
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600 (1 hour)

Record 2 (DKIM):
Type: CNAME
Name: resend._domainkey
Value: resend._domainkey.resend.com
TTL: 3600 (1 hour)

Record 3 (DMARC):
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@wellnexus.vn; pct=100
TTL: 3600 (1 hour)
```

**Save all records**

---

### Phase 3: Verify Domain (10 minutes)

1. **Wait for DNS Propagation**
   - DNS changes take 5-60 minutes to propagate
   - Check status: https://dnschecker.org

2. **Verify in Resend**
   - Go back to Resend Dashboard → Domains
   - Click "Verify" next to wellnexus.vn
   - If successful: ✅ Domain verified
   - If failed: Wait longer or check DNS records

3. **Check DNS Records**
   ```bash
   # SPF
   dig txt wellnexus.vn +short | grep spf

   # DKIM
   dig cname resend._domainkey.wellnexus.vn +short

   # DMARC
   dig txt _dmarc.wellnexus.vn +short
   ```

---

### Phase 4: Update Email Templates (5 minutes)

**Update sender address in Edge Function:**

File: `supabase/functions/send-email/index.ts`

```typescript
// BEFORE (using default domain)
from: 'WellNexus <onboarding@resend.dev>',

// AFTER (using custom domain)
from: 'WellNexus <noreply@wellnexus.vn>',
```

**Redeploy Edge Function:**
```bash
supabase functions deploy send-email --project-ref zumgrvmwmpstsigefuau
```

---

### Phase 5: Test Email Delivery (10 minutes)

1. **Send Test Email**
   ```bash
   curl -X POST \
     https://zumgrvmwmpstsigefuau.supabase.co/functions/v1/send-email \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer [ANON_KEY]" \
     -d '{
       "to": "test@gmail.com",
       "subject": "Test from wellnexus.vn",
       "templateType": "welcome",
       "data": {
         "userName": "Test User",
         "userEmail": "test@gmail.com"
       }
     }'
   ```

2. **Check Inbox**
   - Verify email received
   - Check sender: `WellNexus <noreply@wellnexus.vn>`
   - Check spam folder if not in inbox

3. **Inspect Email Headers**
   - Open email → View source/original
   - Check for:
     - `SPF: PASS`
     - `DKIM: PASS`
     - `DMARC: PASS`

---

## Verification Checklist

- [ ] SPF record added to DNS
- [ ] DKIM CNAME record added to DNS
- [ ] DMARC policy record added to DNS
- [ ] DNS propagation complete (60+ minutes)
- [ ] Domain verified in Resend dashboard
- [ ] Email templates updated with `@wellnexus.vn`
- [ ] Edge Function redeployed
- [ ] Test email sent successfully
- [ ] Email headers show SPF/DKIM/DMARC PASS
- [ ] Email delivered to inbox (not spam)

---

## Troubleshooting

### Issue: Domain verification fails

**Check DNS records:**
```bash
dig txt wellnexus.vn +short
dig cname resend._domainkey.wellnexus.vn +short
dig txt _dmarc.wellnexus.vn +short
```

**Common Problems:**
- DNS not propagated yet → Wait 1 hour, try again
- Incorrect record value → Copy-paste exactly from Resend
- Wrong record type (TXT vs CNAME) → Double-check type

---

### Issue: Emails still going to spam

**Possible Causes:**
1. **Domain reputation low** (new domain)
   - Solution: Send emails gradually, monitor bounce rate

2. **Email content flagged as spam**
   - Solution: Avoid spam trigger words (FREE, URGENT, !!!)
   - Use text/html balance
   - Include unsubscribe link

3. **SPF/DKIM/DMARC not passing**
   - Check email headers
   - Verify DNS records correct

4. **Recipient's spam filter too aggressive**
   - Ask recipient to whitelist `@wellnexus.vn`

---

### Issue: DMARC reports not received

**Setup DMARC monitoring email:**
```bash
# Create email alias: dmarc@wellnexus.vn
# Forward to: devops@wellnexus.vn

# Or use DMARC analysis service:
# - dmarcian.com
# - postmarkapp.com/dmarc
```

---

## Monitoring Email Deliverability

### Resend Dashboard Metrics

**Check daily:**
- Delivered rate (target: >95%)
- Bounce rate (target: <5%)
- Spam complaint rate (target: <0.1%)

**Access:** https://resend.com/emails

---

### Email Testing Tools

**Before going live:**
- **Mail Tester:** https://www.mail-tester.com
  - Send email to provided address
  - Get deliverability score (target: 9/10+)

- **Google Postmaster:** https://postmaster.google.com
  - Monitor domain reputation with Gmail
  - Track spam rate

- **MXToolbox:** https://mxtoolbox.com/emailhealth
  - Overall email health check
  - Blacklist monitoring

---

## Maintenance

### Monthly Tasks
- [ ] Check DMARC reports for authentication failures
- [ ] Review bounce rate in Resend dashboard
- [ ] Monitor spam complaint rate

### Quarterly Tasks
- [ ] Audit email content for spam triggers
- [ ] Review and update DMARC policy if needed
- [ ] Test email deliverability to major providers (Gmail, Outlook)

### Annually
- [ ] Renew domain registration (wellnexus.vn)
- [ ] Review DNS record TTLs and update if needed

---

## Advanced Configuration (Optional)

### Custom Subdomain for Emails

Instead of `noreply@wellnexus.vn`, use `noreply@mail.wellnexus.vn`:

**Benefits:**
- Separate email subdomain reputation
- Easier to migrate email providers later

**Setup:**
1. Add domain in Resend: `mail.wellnexus.vn`
2. Add DNS records for subdomain
3. Update templates to use `@mail.wellnexus.vn`

---

### Multiple Sender Addresses

**Use different addresses for different email types:**
- `noreply@wellnexus.vn` - Transactional (orders, confirmations)
- `support@wellnexus.vn` - Customer support replies
- `team@wellnexus.vn` - Team invites, notifications

**Requirement:** Each sender must be verified in Resend

---

## Cost Implications

**Resend Pricing:**
- **Free Tier:** 100 emails/day, 3,000/month ✅ Currently using
- **Paid Tier:** $20/month for 50,000 emails/month

**Recommendation:**
- Start with free tier
- Upgrade when reaching 80+ emails/day consistently
- Current usage: ~10-30 emails/day (commission notifications)

---

## Security Best Practices

1. **Never use personal email as sender**
   - Use `noreply@` or `no-reply@` for one-way emails
   - Use `support@` for two-way communication

2. **Monitor for domain spoofing**
   - DMARC reports will alert you
   - Check for unauthorized email senders

3. **Rotate Resend API key annually**
   - Generate new key in Resend dashboard
   - Update in Supabase secrets
   - Revoke old key

4. **Keep DNS records secure**
   - Enable 2FA on domain registrar
   - Restrict DNS editing permissions

---

## Additional Resources

- **Resend Documentation:** https://resend.com/docs
- **SPF Wizard:** https://www.spfwizard.net
- **DMARC Guide:** https://dmarc.org/overview
- **Email Deliverability Best Practices:** https://resend.com/docs/knowledge-base/deliverability

---

**Last Updated:** 2026-02-02
**Owner:** DevOps Team
**Status:** Documentation complete, awaiting DNS configuration
