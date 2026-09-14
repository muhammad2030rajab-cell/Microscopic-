import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { CATEGORIES } from "@/lib/tests-catalog";

export type LabCatalogRow = {
  id: string;
  test_name: string;
  category_id: string;
  category_name_ar: string;
  category_name_en: string;
  unit: string;
  male_range: string;
  female_range: string;
  is_active: boolean;
};

async function getLab(sql: Awaited<ReturnType<typeof getSql>>, userId: string) {
  const rows = await sql<{ lab_id: string; role: string }>`
    select lu.lab_id, lu.role
    from lab_users lu
    inner join labs l on l.id = lu.lab_id
    where lu.auth_user_id = ${userId} and lu.is_active = true and l.is_active = true
    limit 1
  `;
  if (!rows.length) throw new Error("LAB_ACCESS_REQUIRED");
  return rows[0];
}

async function ensureSeeded(sql: Awaited<ReturnType<typeof getSql>>, labId: string) {
  const count = await sql<{ count: number }>`select count(*)::int as count from lab_test_catalog where lab_id = ${labId}`;
  if (count[0]?.count) return;

  for (const category of CATEGORIES) {
    for (const test of category.tests) {
      const id = crypto.randomUUID();
      await sql.query(
        `insert into lab_test_catalog
          (id, lab_id, test_name, category_id, category_name_ar, category_name_en, unit, male_range, female_range)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         on conflict (lab_id, test_name) do nothing`,
        [id, labId, test.name, category.id, category.nameAr, category.nameEn, test.unit, test.male, test.female],
      );
    }
  }
}

export const listLabCatalog = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<LabCatalogRow[]> => {
    const sql = await getSql();
    const lab = await getLab(sql, context.userId);
    await ensureSeeded(sql, lab.lab_id);
    return sql<LabCatalogRow>`
      select id, test_name, category_id, category_name_ar, category_name_en,
             unit, male_range, female_range, is_active
      from lab_test_catalog
      where lab_id = ${lab.lab_id}
      order by category_id, test_name
    `;
  });

export const updateLabCatalogItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }: { context: { userId: string }; data: { id: string; unit: string; maleRange: string; femaleRange: string; isActive: boolean } }) => {
    const sql = await getSql();
    const lab = await getLab(sql, context.userId);
    if (lab.role !== "owner") throw new Error("OWNER_ACCESS_REQUIRED");
    await sql.query(
      `update lab_test_catalog
       set unit=$1, male_range=$2, female_range=$3, is_active=$4, updated_at=current_timestamp
       where id=$5 and lab_id=$6`,
      [data.unit.trim(), data.maleRange.trim(), data.femaleRange.trim(), Boolean(data.isActive), data.id, lab.lab_id],
    );
    return { ok: true };
  });
