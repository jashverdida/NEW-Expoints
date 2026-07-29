# Email templates

Branded replacements for Supabase's default auth emails, which ship as plain
black-on-white text.

## ⚠️ Prerequisite: custom SMTP

**Template editing is locked until you configure custom SMTP.** On the free
tier the Subject and Body fields are read-only, and the dashboard shows
_"Set up custom SMTP to edit templates"_. Pasting these files before that step
will not work.

This is worth doing regardless of styling: Supabase's built-in email service is
capped at **2 messages per hour**, across all auth emails combined. That is a
development convenience, not something a live forum can run on — a handful of
simultaneous signups will silently fail.

See [Configuring SMTP](#configuring-smtp) below.

### No domain yet? Turn off email confirmation instead

Custom SMTP needs a domain you control, because providers require DNS records
(SPF/DKIM) to prove you may send as it. A `*.vercel.app` subdomain won't work —
you can't add DNS records to it.

Until you have one, the cleaner option is to skip confirmation entirely:

> **Authentication** → **Sign In / Providers** → **Email** → turn **Confirm
> email** off.

Signup then completes instantly — no email is sent, so neither the default
template nor the 2/hour cap matters. `signUp()` in `src/lib/actions.ts` already
handles both configurations: it redirects straight to the feed when a session
comes back, and shows a "check your inbox" state when it doesn't.

The trade-off is unverified addresses. For a forum where email isn't used for
anything critical, that's a normal call — the admin ban system is the real
abuse defence. Revisit this once you have a domain.

## Installing

Once SMTP is configured: Supabase Dashboard → **Authentication** → **Emails**.
Pick a template, switch the editor from **Preview** to **Source**, paste the
matching file, save.

| File | Template |
| --- | --- |
| `confirm-signup.html` | Confirm signup |
| `reset-password.html` | Reset password |
| `magic-link.html` | Magic Link |

These are dashboard configuration, not application code — nothing in the repo
reads them. They live here so the branding is version-controlled and reviewable.

While you're on that screen, set the **sender name** to `EXPoints` under
Authentication → Emails → SMTP Settings. The default `Supabase Auth` is what
makes the current emails look like someone else's product.

## Variables

Supabase renders these with Go templates. Available in all three:

| Variable | Contents |
| --- | --- |
| `{{ .ConfirmationURL }}` | The action link |
| `{{ .Token }}` | 6-digit OTP — the fallback when a link is mangled |
| `{{ .TokenHash }}` | Hashed token, for building your own verify URL |
| `{{ .SiteURL }}` | Your configured Site URL |
| `{{ .Email }}` | The recipient |
| `{{ .RedirectTo }}` | The `redirectTo` passed at call time |
| `{{ .Data }}` | `auth.users.user_metadata` — e.g. `{{ .Data.username }}` |

Change-email templates also get `{{ .NewEmail }}`.

## Why they're written this way

Email clients are not browsers. Outlook 2016+ renders with the Microsoft Word
engine — no flexbox, no grid, no external stylesheets, no `<style>` reliability.
So these templates use:

- **Tables for layout**, never divs
- **Inline styles** on every element
- `align="center"` *and* `margin:0 auto`, because older Outlook ignores the latter
- **VML button fallbacks** (`<v:roundrect>`) so the CTA is a real clickable
  button in Outlook rather than a bare link
- **No web fonts, no background images, no semi-transparent PNGs** — Outlook's
  dark-mode auto-inversion mangles all three
- `color-scheme` / `supported-color-schemes` meta tags, which stop Apple Mail
  and iOS from inverting a design that is already dark
- A **hidden preheader** so the inbox preview line reads well
- The **OTP code** alongside every button, since some corporate mail gateways
  rewrite or break long links

## Testing

Send yourself one from a real signup and check Gmail (web + mobile), Outlook,
and Apple Mail in both light and dark mode. Free rendering previews:
[Testi.at](https://testi.at) or [Mailtrap](https://mailtrap.io).

## Configuring SMTP

Any provider works. [Resend](https://resend.com) is the easiest fit for
Supabase and has the most generous free tier — 3,000 emails/month, 100/day.

1. Create a Resend account and an **API key** (starts with `re_`).
2. Supabase Dashboard → **Authentication** → **Emails** → **SMTP Settings**,
   toggle **Enable custom SMTP**, then fill in:

   | Field | Value |
   | --- | --- |
   | Host | `smtp.resend.com` |
   | Port | `587` |
   | Username | `resend` |
   | Password | your `re_…` API key |
   | Sender email | see the domain note below |
   | Sender name | `EXPoints` |

3. Save. The template Subject/Body fields unlock immediately.

### The domain caveat

Without a verified domain, Resend only lets you send **from**
`onboarding@resend.dev` **to** the address on your Resend account. That's fine
for testing the templates, but real users won't receive anything.

To send to anyone, add a domain in Resend → **Domains**, add the DNS records it
gives you (SPF, DKIM, and ideally DMARC), then use something like
`no-reply@yourdomain.com` as the sender. Same requirement with any provider —
it's how mailboxes verify you're allowed to send as that domain.

### Rate limits

After enabling custom SMTP, Supabase defaults to **30 messages/hour**. Raise it
under Authentication → **Rate Limits** to match what your provider allows.
