# 🔐 Security Policy — LifePulse

## What's Sensitive vs. What's Safe

| Item | Sensitive? | Where it lives |
|---|---|---|
| `GEMINI_API_KEY` | ✅ YES — server only | `.env` → Vercel Env Vars |
| Firebase Web Config (apiKey, appId…) | ⚠️  **Intentionally public** | `firebase-config.js` |
| Firebase Admin SDK service account | ✅ YES — server only | `.env` (never commit) |
| `GITGUARDIAN_API_KEY` | ✅ YES | `.env` (local only) |

> **Firebase Web API keys are designed to be public.** They identify your project to Google servers but do **not** grant admin access. Security is enforced by [Firebase Security Rules](https://firebase.google.com/docs/rules).

---

## GitGuardian Integration

This project uses [GitGuardian ggshield](https://docs.gitguardian.com/ggshield-docs/getting-started) to scan every commit for leaked secrets.

### Setup (one-time)

```bash
pip install ggshield
ggshield auth login        # opens browser — sign in with GitHub/GitLab or GitGuardian account
```

The pre-commit hook at `.git/hooks/pre-commit` runs automatically on every `git commit`.

### What happens when a secret is detected?

```
🚨 GitGuardian: SECRET DETECTED in staged files!
   ─────────────────────────────────────────────
   Your commit has been BLOCKED to protect your project.

   ✅ To fix:
     1. Remove the secret from the file
     2. Move it to your .env file instead
     3. Add the file to .gitignore if needed
     4. Stage your changes again and re-commit
```

---

## Safe Secret Management Rules

1. **Server secrets** → `.env` (gitignored) → Vercel / Render environment variables in production
2. **Never hardcode** API keys, passwords, tokens, or private keys in source code
3. **Browser-facing config** (like Firebase Web Config) is OK in source — document why clearly
4. **Rotate immediately** if you accidentally commit a secret

## Files That Must NEVER Be Committed

- `.env`
- `*service-account*.json`
- `*firebase-adminsdk*.json`
- `*.pem`, `*.key`, `*.p12`

All are covered in `.gitignore`.
