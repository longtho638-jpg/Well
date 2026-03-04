# Security Policy

WellNexus takes security seriously. We appreciate your help in keeping our platform secure.

---

## 📧 Reporting a Vulnerability

**Private & Responsible Disclosure:**

- 📧 Email: [security@wellnexus.vn](mailto:security@wellnexus.vn)
- 🔒 PGP Key: Available upon request
- ⏰ Response Time: Within 48 hours

**What to Include:**

1. Description of the vulnerability
2. Steps to reproduce the issue
3. Potential impact
4. Suggested fix (if any)
5. Your contact information

**What NOT to Do:**

- ❌ Do not create public GitHub issues for security vulnerabilities
- ❌ Do not disclose the vulnerability publicly before we've had time to fix it
- ❌ Do not exploit the vulnerability beyond what's necessary to demonstrate the issue

---

## 🛡️ Supported Versions

| Version | Supported |
| ------- | --------- |
| **3.x.x** | ✅ Yes (Current) |
| 2.x.x | ⚠️ Security updates only |
| 1.x.x | ❌ End of life |

---

## 🔒 Security Best Practices

### For Contributors

1. **No Secrets in Code**
   - Never commit API keys, passwords, or tokens
   - Use environment variables for sensitive data
   - Review `.env.example` for required variables

2. **Input Validation**
   - Always validate user input with Zod schemas
   - Sanitize data before rendering
   - Use parameterized queries (Supabase handles this)

3. **Authentication**
   - Use Supabase Auth for all authenticated routes
   - Implement Row-Level Security (RLS) policies
   - Validate JWT tokens server-side

4. **XSS Prevention**
   - React auto-escapes by default — don't use `dangerouslySetInnerHTML`
   - Use DOMPurify for any HTML sanitization
   - Escape special characters in user-generated content

5. **CORS & Headers**
   - CORS is configured for production domains only
   - Security headers: HSTS, CSP, X-Frame-Options, X-Content-Type-Options

### For Users

1. **Protect Your Credentials**
   - Never share your Supabase keys publicly
   - Use strong, unique passwords
   - Enable MFA when available

2. **Keep Dependencies Updated**
   - Run `npm audit` regularly
   - Update packages: `npm update`
   - Monitor security advisories

3. **Monitor Usage**
   - Check your dashboard for unusual activity
   - Review API logs regularly
   - Set up alerts for quota breaches

---

## 🚨 Security Features

### Built-In Protections

| Feature | Status | Description |
| ------- | ------ | ----------- |
| **Row-Level Security (RLS)** | ✅ Enabled | All database tables have RLS policies |
| **JWT Authentication** | ✅ Required | All API calls require valid tokens |
| **Input Validation** | ✅ Zod | Server-side validation on all inputs |
| **XSS Prevention** | ✅ React | Auto-escaping + DOMPurify |
| **CORS** | ✅ Configured | Whitelist domains only |
| **Rate Limiting** | ✅ Supabase | Built-in rate limiting |
| **HTTPS** | ✅ Enforced | All traffic encrypted |
| **Security Headers** | ✅ Enabled | HSTS, CSP, X-Frame-Options |

### Security Audit Trail

- ✅ All authentication events logged
- ✅ API calls tracked in Supabase logs
- ✅ Admin actions audited
- ✅ Failed login attempts monitored

---

## 📋 Vulnerability Disclosure Process

1. **You report** → Email security@wellnexus.vn
2. **We acknowledge** → Within 48 hours
3. **We investigate** → 5-10 business days
4. **We fix** → Timeline based on severity
5. **We publish** → Security advisory after fix
6. **You verify** → Optional: Confirm the fix

### Severity Levels

| Severity | Response Time | Examples |
| -------- | ------------- | -------- |
| **Critical** | 24-48 hours | Remote code execution, SQL injection |
| **High** | 3-5 days | Authentication bypass, XSS |
| **Medium** | 1-2 weeks | CSRF, information disclosure |
| **Low** | 2-4 weeks | Minor bugs, best practice violations |

---

## 🏆 Security Hall of Fame

We recognize security researchers who help us stay secure:

| Researcher | Date | Contribution |
| ---------- | ---- | ------------ |
| *(Be the first!)* | - | - |

---

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/database/security)
- [React Security Guidelines](https://react.dev/reference/react-dom/components/common#avoiding-xss-attacks)

---

## 📞 Contact

- **Security Team:** security@wellnexus.vn
- **General Support:** support@wellnexus.vn
- **GitHub Issues:** [Report non-security issues](https://github.com/longtho638-jpg/Well/issues)

---

**Last Updated:** 2026-03-04 | **Version:** 1.0.0
