/**
 * Scrape the City of New Orleans "Permits - BLDS" open dataset into the NolaPermit table.
 *
 * Source: https://data.nola.gov/resource/72f9-bi28.json (Socrata SODA 2.1 — no upper row limit).
 * ~456k rows; every row carries a `link` to the OneStop permit portal where plans/documents may be
 * attached. We page through with $limit/$offset (ordered by :id for stable paging) and bulk-insert
 * with skipDuplicates, so the run is idempotent — re-running only adds permits we don't have yet.
 *
 *   npm run nola:fetch
 *   tsx --env-file=.env scripts/nola-fetch.ts --page=50000 --workclass=New --max=2000
 *
 * Flags (all optional):
 *   --page       rows per API request            (default 50000)
 *   --workclass  filter by BLDS WorkClassMapped  (e.g. "New" for new construction; default all)
 *   --max        stop after this many rows        (default: whole dataset)
 *   --dataset    Socrata dataset id              (default 72f9-bi28)
 *
 * Note: skipDuplicates means existing permits are NOT updated (status/dates can go stale). For a
 * periodic refresh we'd switch to upsert; for the initial corpus pull, fast insert is what we want.
 */
process.loadEnvFile(".env");
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const BASE = "https://data.nola.gov/resource";

function arg(name: string, fallback: string): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

// Socrata serves numbers and dates as strings; coerce defensively.
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const date = (v: unknown): Date | null => {
  if (!v || typeof v !== "string") return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};
const str = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

// A raw BLDS row. `link` is {url}; `location` is {latitude, longitude, ...} when present.
type Row = Record<string, unknown> & {
  link?: { url?: string };
  location?: { latitude?: string | number; longitude?: string | number };
};

function mapRow(r: Row) {
  const permitNum = str(r.permitnum);
  if (!permitNum) return null; // natural key — skip the rare row without one
  return {
    permitNum,
    description: str(r.description),
    appliedDate: date(r.applieddate),
    issueDate: date(r.issuedate),
    completeDate: date(r.completedate),
    statusDate: date(r.statusdate),
    expiresDate: date(r.expiresdate),
    coIssuedDate: date(r.coissueddate),
    statusCurrent: str(r.statuscurrent),
    statusCurrentMapped: str(r.statuscurrentmapped),
    originalAddress1: str(r.originaladdress1),
    originalCity: str(r.originalcity),
    originalState: str(r.originalstate),
    originalZip: str(r.originalzip),
    permitClass: str(r.permitclass),
    permitClassMapped: str(r.permitclassmapped),
    workClass: str(r.workclass),
    workClassMapped: str(r.workclassmapped),
    permitType: str(r.permittype),
    permitTypeDesc: str(r.permittypedesc),
    permitTypeMapped: str(r.permittypemapped),
    totalSqFt: num(r.totalsqft),
    estProjectCost: num(r.estprojectcost),
    pin: str(r.pin),
    fee: num(r.fee),
    contractorCompanyName: str(r.contractorcompanyname),
    contractorTrade: str(r.contractortrade),
    contractorTradeMapped: str(r.contractortrademapped),
    contractorLicNum: str(r.contractorlicnum),
    contractorStateLic: str(r.contractorstatelic),
    publisher: str(r.publisher),
    latitude: num(r.location?.latitude),
    longitude: num(r.location?.longitude),
    link: str(r.link?.url),
  };
}

async function fetchPage(dataset: string, page: number, offset: number, where: string): Promise<Row[]> {
  const u = new URL(`${BASE}/${dataset}.json`);
  u.searchParams.set("$limit", String(page));
  u.searchParams.set("$offset", String(offset));
  u.searchParams.set("$order", ":id"); // stable paging across requests
  if (where) u.searchParams.set("$where", where);
  const res = await fetch(u);
  if (!res.ok) throw new Error(`SODA HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as Row[];
}

async function main() {
  const dataset = arg("dataset", "72f9-bi28");
  const page = Number(arg("page", "50000"));
  const max = Number(arg("max", "0")) || Infinity; // 0 → whole dataset
  const workclass = arg("workclass", "");
  const where = workclass ? `workclassmapped='${workclass.replace(/'/g, "''")}'` : "";

  // Postgres caps a statement at 65535 bind params; ~33 columns → keep insert batches well under.
  const INSERT_BATCH = 1000;

  console.log(
    `NOLA fetch · dataset ${dataset} · page ${page}` +
      (workclass ? ` · workclass="${workclass}"` : " · all rows") +
      (max !== Infinity ? ` · max ${max}` : ""),
  );

  let offset = 0;
  let pulled = 0;
  let inserted = 0;
  const t0 = Date.now();

  while (pulled < max) {
    const want = Math.min(page, max - pulled);
    const rows = await fetchPage(dataset, want, offset, where);
    if (rows.length === 0) break;
    pulled += rows.length;
    offset += rows.length;

    const mapped = rows.map(mapRow).filter((r): r is NonNullable<typeof r> => r !== null);
    for (let i = 0; i < mapped.length; i += INSERT_BATCH) {
      const slice = mapped.slice(i, i + INSERT_BATCH);
      const res = await db.nolaPermit.createMany({ data: slice, skipDuplicates: true });
      inserted += res.count;
    }
    const secs = ((Date.now() - t0) / 1000).toFixed(0);
    console.log(`  pulled ${pulled} · inserted(new) ${inserted} · ${secs}s elapsed`);
    if (rows.length < want) break; // last page
  }

  const total = await db.nolaPermit.count();
  console.log(`Done. Pulled ${pulled} rows, ${inserted} new inserted. NolaPermit now holds ${total} rows.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
