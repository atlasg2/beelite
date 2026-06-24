import { getOrCreateDefaultCompany } from "@/lib/company";
import { db } from "@/lib/db";
import { DashSidebar } from "@/components/dash-sidebar";
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
    <div className="dash">
      <DashSidebar active="rates" />
      <main className="dash-main">
        <div className="dash-top">
          <div>
            <h1>Standard rates</h1>
            <p className="dash-sub">
              Your default material + install rates. New bids auto-fill from here when the finish code matches.
            </p>
          </div>
        </div>

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
      </main>
    </div>
  );
}
