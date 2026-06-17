# SAM.gov Plan Sources

Last checked: 2026-06-17.

This file documents how to use SAM.gov to find public construction bid opportunities and fetch plan/spec attachments for Beelite test data. Do not commit a real SAM API key. Store it in `.env` as `SAM_API_KEY`.

## Bulk import scripts (the practiced path)

Two idempotent scripts turn SAM into a local corpus and then into review-ready bids:

```bash
npm run sam:fetch     # search → download plan/spec PDFs into data/sam/<soln>/ + manifest.json
npm run sam:import    # data/sam/ → Project + Document(s) + per-page PlanSheet scan in the DB
```

- `scripts/sam-fetch.ts` flags: `--naics=238330,238340,236220 --days=180 --max=60 --keyword=flooring`.
  Searches the keyed API, keeps attachments whose names look like plans/specs (drawings, finish,
  flooring, spec, SOW…) and drops boilerplate (wage determinations, SF1442, instructions, SDS…).
  Re-running skips any opportunity folder that already has a `manifest.json`.
- `scripts/sam-import.ts` reuses a Project by name and skips a PDF already stored, so it is safe to
  re-run after each fetch. It prints the projects whose pages the scanner flags as `finish_schedule`
  — the high-signal plans to practice on.

**Daily quota:** non-federal `SAM_API_KEY`s are rate-limited (~10 search calls/day); exceeding it
returns HTTP 429 with a `nextAccessTime` (resets 00:00 UTC). The fetcher catches this, downloads
whatever it gathered, and reports the reset time. To get more in one day: list several keys
(each has its own quota) comma-separated in `SAM_API_KEY` or in `SAM_API_KEYS` — the fetcher rotates
to the next key on a 429. Also spread large pulls across days, raise `--days` to widen each pull, or
request a higher-tier key. Attachment downloads use the no-key endpoint and
are **not** subject to this quota. For higher volume without the keyed quota, the no-key UI search
endpoint below (`sgs/v1/search`) is the fallback (different response shape — `_id`/`parentNoticeId`).

## Official API Key

Official docs: https://open.gsa.gov/api/get-opportunities-public-api/

How to get the key:
1. Sign in to https://sam.gov.
2. Open Account Details.
3. Enter the SAM.gov account password when prompted.
4. Generate/view the Public API Key.

The official Opportunities API requires `api_key`. The production endpoint is:

```text
https://api.sam.gov/opportunities/v2/search
```

Important official fields:
- `postedFrom` and `postedTo` are required date filters, formatted `MM/dd/yyyy`.
- Date range is limited to 1 year.
- `limit` max is `1000`.
- `ncode` filters NAICS, for example `236220`.
- `ptype` filters notice type, for example `o` solicitation, `k` combined synopsis/solicitation, `p` presolicitation.
- Response can include `resourceLinks`, which are direct attachment download URLs.

Example:

```bash
curl "https://api.sam.gov/opportunities/v2/search?api_key=$SAM_API_KEY&postedFrom=06/01/2026&postedTo=06/17/2026&ptype=o&ncode=236220&limit=10&title=flooring"
```

Recommended official query pattern for Beelite:

```text
postedFrom=<recent date>
postedTo=<today>
ncode=236220
ptype=o,k,p
title=flooring OR drawings OR renovation
```

## No-Key SAM UI Endpoints

These are public SAM.gov UI endpoints verified from curl. They are useful for demo/test corpus fetching, but the official API is better for long-term reliability.

### Search Opportunities

```text
https://sam.gov/api/prod/sgs/v1/search/?index=opp&mode=search&responseType=json&domain=opp&size=20&page=0&q=drawings%20flooring&naics=236220&is_active=true
```

Useful response fields:
- `_id`: current notice ID.
- `parentNoticeId`: parent notice ID. Attachments often live here.
- `title`
- `solicitationNumber`
- `responseDate`
- `type.value`
- `organizationHierarchy`

Important: search results often point to an amendment `_id`. Always try both `_id` and `parentNoticeId` for attachments.

### List Attachments

```text
https://sam.gov/api/prod/opps/v3/opportunities/{noticeId}/resources
```

This returns attachment metadata under:

```text
_embedded.opportunityAttachmentList[].attachments[]
```

Useful attachment fields:
- `name`
- `resourceId`
- `attachmentId`
- `mimeType`
- `size`
- `accessStatus`
- `accessLevel`
- `exportControlled`

Only use public, non-export-controlled attachments for Beelite sample data.

### Download All Attachments As Zip

```text
https://sam.gov/api/prod/opps/v3/opportunities/{noticeId}/resources/download/zip
```

This returns JSON with a short-lived S3 URL:

```json
{
  "location": "https://iae-fbo-attachments.s3.amazonaws.com/...zip?...X-Amz-Expires=9..."
}
```

The URL expires very quickly, around 9 seconds in testing. A script should request this endpoint and immediately download the returned `location`.

Example flow:

```bash
ZIP_URL=$(curl -s "https://sam.gov/api/prod/opps/v3/opportunities/$NOTICE_ID/resources/download/zip" \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).location))')

curl -L "$ZIP_URL" -o "sam-$NOTICE_ID.zip"
```

## Verified Test Candidates

### VA Reno Flooring

SAM UI:

```text
https://sam.gov/opp/883629042e4f475cb502b0f0df2b3302/view
```

Resources parent ID:

```text
3f7108f2e1bb4ea79b84ff304bca15e4
```

Good attachments:
- `Attachment Exhibit A 654-22-003 Drawings.pdf` about 2.0 MB
- `Attachment 654-22-003 Specifications.pdf` about 2.2 MB
- `Attachment SOW 654-22-003.pdf`
- price breakdown spreadsheet

### Navy Camp Lejeune RR139/RR140/RR141 Flooring/Paint

SAM UI:

```text
https://sam.gov/opp/0e74e293a0774ffbaaf7016a07383db0/view
```

Good attachments:
- `09 65 00 RESILIENT FLOORING SPECS.pdf`
- `09 90 00 PAINTS COATINGS Spec..pdf`
- `Combined DIV 01 DBB SPECS.pdf`
- per-building PD/QD/PS/SR/SOW PDFs

### Navy FC371/FC372 Flooring/Paint

SAM UI:

```text
https://sam.gov/opp/c7e3e978ae2d4867afb53054995206dd/view
```

Good attachments:
- RFP PDF
- flooring specs
- paint specs
- DBB specs
- per-building PDFs

### Navy FC478/FC481 Flooring/Paint

SAM UI:

```text
https://sam.gov/opp/4afe4d1d35644a22afeb1d9f8f157141/view
```

Good attachments:
- RFP PDF
- flooring specs
- paint specs
- DBB specs
- per-building PDFs

## Recommended Import Workflow

1. Search SAM using the no-key UI search endpoint or official keyed API.
2. For each result, collect `_id` and `parentNoticeId`.
3. For each candidate ID, call `/resources`.
4. Keep IDs with public PDF attachments whose names include:
   - `drawing`
   - `drawings`
   - `spec`
   - `specifications`
   - `finish`
   - `flooring`
   - `sow`
   - `plans`
5. Download all attachments using `/resources/download/zip`.
6. Unzip locally and select plan/spec PDFs for Beelite sample projects.
7. Store source metadata with the sample:
   - SAM notice ID
   - parent notice ID
   - solicitation number
   - title
   - UI URL
   - attachment names
   - downloaded timestamp

## Notes For Beelite

- Use SAM for sample/test plan corpus, not lead generation.
- Prefer official API `resourceLinks` when `SAM_API_KEY` is available.
- Use the no-key UI endpoints for quick demos and local testing.
- Attachment zips can include forms, wage determinations, and environmental guides; filter to drawings/specs before uploading into Beelite.
- Public bid sets often include multi-page PDFs and specs, so they are good for testing page scanning, targeted extraction, and finish schedule detection.
