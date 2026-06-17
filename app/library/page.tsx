import Link from "next/link";
import { getOrCreateDefaultCompany } from "@/lib/company";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { LibraryEditor } from "@/components/library-editor";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const company = await getOrCreateDefaultCompany();
  const items = await db.finishLibraryItem.findMany({
    where: { companyId: company.id },
    include: { rate: true },
    orderBy: { code: "asc" },
  });

  return (
    <main className="wrap">
      <SiteHeader action={<Link href="/" className="btn">Home</Link>} />
      <div className="page-head">
        <h1 className="page-title">Standard rates</h1>
        <span className="page-count">{items.length} finishes</span>
      </div>
      <p className="detail-meta">
        Your company’s default material + install rates. Every new bid auto-fills from here on an exact
        finish-code match — so you’re never starting from zero or waiting on a sub to price.
      </p>

      <section className="section">
        <LibraryEditor
          initial={items.map((i) => ({
            code: i.code,
            type: i.type,
            description: i.description,
            unit: i.unit,
            category: i.category,
            materialUnitCost: i.rate?.materialUnitCost ?? 0,
            installRate: i.rate?.installRate ?? 0,
            wastePct: i.rate?.wastePct ?? 0,
            cartonSize: i.rate?.cartonSize ?? null,
            materialSource: i.rate?.materialSource ?? "elite_furnishes",
          }))}
        />
      </section>
    </main>
  );
}
