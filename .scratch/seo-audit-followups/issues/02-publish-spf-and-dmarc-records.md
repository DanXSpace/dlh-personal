# 02 — Publish SPF and DMARC records

Status: resolved
Type: task

## Problem

`danielholung.dev` has no TXT, MX or `_dmarc` records (checked over DNS-over-HTTPS, 2026-11-23). The domain sends no mail (the contact address is a Gmail account), but without SPF and DMARC, receiving servers have no policy telling them to reject mail that claims to come from it, so anyone can spoof the domain.

The fix is to declare the domain non-sending. Nothing in the repo changes.

## Steps (Cloudflare dashboard → danielholung.dev → DNS → Records)

Add two TXT records, proxy status not applicable:

| Type | Name | Content |
| --- | --- | --- |
| TXT | `@` | `v=spf1 -all` |
| TXT | `_dmarc` | `v=DMARC1; p=reject;` |

`-all` says no server may send for this domain. `p=reject` tells receivers to drop mail that fails.

If the domain will ever send mail (for example a custom address through Cloudflare Email Routing or a mail provider), replace both records with the provider's values at that point. `p=reject` would otherwise block that mail.

## Done when

Both lookups return the new record:

```sh
curl -s -H 'accept: application/dns-json' 'https://cloudflare-dns.com/dns-query?name=danielholung.dev&type=TXT'
curl -s -H 'accept: application/dns-json' 'https://cloudflare-dns.com/dns-query?name=_dmarc.danielholung.dev&type=TXT'
```

The first answer contains `v=spf1 -all`; the second contains `v=DMARC1; p=reject;`.

## Comments

- 2026-11-23, done in the Cloudflare dashboard: added TXT `@` = `v=spf1 -all` and TXT `_dmarc` = `v=DMARC1; p=reject;` (DNS only, TTL Auto). Before this the zone had no SPF or DMARC record, only the two Worker records for `@` and `www`.
- 2026-11-23, verified: public DNS (Google and Cloudflare resolvers) returns both records.
