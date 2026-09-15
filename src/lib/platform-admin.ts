import { createServerFn } from "@tanstack/react-start";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth/server";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { ensureLabDriveFolders } from "@/lib/storage/google-drive.server";

async function assertPlatformAdmin(userId: string) {
  const sql = await getSql();

  const rows = await sql<{ auth_user_id: string }>`
    select auth_user_id
    from platform_admins
    where auth_user_id = ${userId}
    limit 1
  `;

  if (rows.length === 0) {
    throw new Error("FORBIDDEN");
  }

  return sql;
}

export const isPlatformAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();

    const rows = await sql<{ auth_user_id: string }>`
      select auth_user_id
      from platform_admins
      where auth_user_id = ${context.userId}
      limit 1
    `;

    return rows.length > 0;
  });

/* =========================================================
   FIRST ADMIN
========================================================= */

export const claimFirstPlatformAdmin = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();

    const rows = await sql<{ auth_user_id: string }>`
      insert into platform_admins (auth_user_id)
      select ${context.userId}
      where not exists (
        select 1 from platform_admins
      )
      on conflict (auth_user_id) do nothing
      returning auth_user_id
    `;

    return rows.length > 0;
  });

/* =========================================================
   TYPES
========================================================= */

export type AdminLab = {
  id: string;
  name: string;
  nameEn: string | null;
  username: string;
  phone: string | null;
  address: string | null;
  doctorName: string | null;
  isActive: boolean;
  createdAt: string;
};

/* =========================================================
   LIST LABS
========================================================= */

export const listAdminLabs = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await assertPlatformAdmin(context.userId);

    return sql<{
      id: string;
      name: string;
      name_en: string | null;
      username: string;
      phone: string | null;
      address: string | null;
      doctor_name: string | null;
      is_active: boolean;
      created_at: string | Date;
    }>`
      select
        l.id,
        l.name,
        l.name_en,
        coalesce(lu.username, '') as username,
        l.phone,
        l.address,
        l.doctor_name,
        l.is_active,
        l.created_at
      from labs l
      left join lab_users lu
        on lu.lab_id = l.id
        and lu.role = 'owner'
      order by l.created_at desc
    `.then((rows) =>
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        nameEn: row.name_en,
        username: row.username,
        phone: row.phone,
        address: row.address,
        doctorName: row.doctor_name,
        isActive: row.is_active,
        createdAt: String(row.created_at),
      })),
    );
  });

/* =========================================================
   CREATE LAB
========================================================= */

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function labLoginEmail(username: string) {
  return `${username}@lab.local`;
}

export const createLab = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(
    async ({
      context,
      data,
    }: {
      context: { userId: string };
      data: {
        name?: string;
        nameEn?: string;
        username: string;
        password: string;
        phone?: string;
        whatsapp?: string;
        email?: string;
        address?: string;
        doctorName?: string;
        doctorDegree?: string;
        doctorSpecialty?: string;
      };
    }) => {
      const sql = await assertPlatformAdmin(context.userId);

      const name = data.name?.trim() || "معمل جديد";
      const username = normalizeUsername(data.username);
      const password = data.password;

      if (name.length < 2) {
        throw new Error("اسم المعمل غير صالح");
      }

      if (!/^[a-z0-9._-]{3,40}$/.test(username)) {
        throw new Error(
          "اسم المستخدم يجب أن يكون 3-40 حرفًا إنجليزيًا أو أرقامًا أو ._- فقط",
        );
      }

      if (password.length < 8) {
        throw new Error("كلمة المرور يجب ألا تقل عن 8 أحرف");
      }

      if (name !== "معمل جديد") {
        const duplicate = await sql<{ id: string }>`
          select id
          from labs
          where lower(name) = lower(${name})
          limit 1
        `;

        if (duplicate.length) {
          throw new Error("اسم المعمل موجود بالفعل");
        }
      }

      const duplicateUsername = await sql<{ id: string }>`
        select id
        from lab_users
        where username = ${username}
        limit 1
      `;

      if (duplicateUsername.length) {
        throw new Error("اسم المستخدم موجود بالفعل");
      }

      const labId = randomUUID();
      const authEmail = labLoginEmail(username);

      const created = await auth.api.signUpEmail({
        body: {
          name,
          email: authEmail,
          password,
        },
      });

      if (!created?.user?.id) {
        throw new Error("تعذر إنشاء حساب المعمل");
      }

      try {
        await sql.query(
          `insert into labs
            (
              id,
              name,
              name_en,
              phone,
              whatsapp,
              email,
              address,
              doctor_name,
              doctor_degree,
              doctor_specialty
            )
           values
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            labId,
            name,
            data.nameEn?.trim() || null,
            data.phone?.trim() || null,
            data.whatsapp?.trim() || null,
            data.email?.trim() || null,
            data.address?.trim() || null,
            data.doctorName?.trim() || null,
            data.doctorDegree?.trim() || null,
            data.doctorSpecialty?.trim() || null,
          ],
        );

        await sql.query(
          `insert into lab_users
            (id, lab_id, auth_user_id, username, role)
           values
            ($1,$2,$3,$4,'owner')`,
          [
            randomUUID(),
            labId,
            created.user.id,
            username,
          ],
        );

        /* =====================================================
           GOOGLE DRIVE
           إنشاء مجلدات المعمل تلقائيًا
        ===================================================== */

        try {
          await ensureLabDriveFolders(labId, name);
        } catch (driveError) {
          console.error(
            "Google Drive setup failed for lab:",
            driveError,
          );
        }
      } catch (error) {
        await sql
          .query(`delete from labs where id = $1`, [labId])
          .catch(() => undefined);

        throw error;
      }

      return {
        id: labId,
        name,
        username,
      };
    },
  );

/* =========================================================
   UPDATE LAB
========================================================= */

export const updateAdminLab = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(
    async ({
      context,
      data,
    }: {
      context: { userId: string };
      data: {
        labId: string;
        name: string;
        nameEn?: string;
        phone?: string;
        address?: string;
        doctorName?: string;
      };
    }) => {
      const sql = await assertPlatformAdmin(context.userId);

      const name = data.name.trim();

      if (name.length < 2) {
        throw new Error("اسم المعمل غير صالح");
      }

      const existing = await sql<{ id: string }>`
        select id
        from labs
        where lower(name) = lower(${name})
          and id <> ${data.labId}
        limit 1
      `;

      if (existing.length) {
        throw new Error("اسم المعمل مستخدم بالفعل");
      }

      const updated = await sql<{ id: string }>`
        update labs
        set
          name = ${name},
          name_en = ${data.nameEn?.trim() || null},
          phone = ${data.phone?.trim() || null},
          address = ${data.address?.trim() || null},
          doctor_name = ${data.doctorName?.trim() || null},
          updated_at = current_timestamp
        where id = ${data.labId}
        returning id
      `;

      if (!updated.length) {
        throw new Error("المعمل غير موجود");
      }

      return { ok: true };
    },
  );

/* =========================================================
   DISABLE LAB
========================================================= */

export const disableAdminLab = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(
    async ({
      context,
      data,
    }: {
      context: { userId: string };
      data: { labId: string };
    }) => {
      const sql = await assertPlatformAdmin(context.userId);

      await sql`
        update labs
        set
          is_active = false,
          updated_at = current_timestamp
        where id = ${data.labId}
      `;

      await sql`
        update lab_users
        set is_active = false
        where lab_id = ${data.labId}
      `;

      return { ok: true };
    },
  );

/* =========================================================
   ENABLE LAB
========================================================= */

export const enableAdminLab = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(
    async ({
      context,
      data,
    }: {
      context: { userId: string };
      data: { labId: string };
    }) => {
      const sql = await assertPlatformAdmin(context.userId);

      await sql`
        update labs
        set
          is_active = true,
          updated_at = current_timestamp
        where id = ${data.labId}
      `;

      await sql`
        update lab_users
        set is_active = true
        where lab_id = ${data.labId}
      `;

      return { ok: true };
    },
  );

/* =========================================================
   DELETE LAB
   حماية: لا نحذف معملًا لديه بيانات مرضى أو تقارير.
========================================================= */

export const deleteAdminLab = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(
    async ({
      context,
      data,
    }: {
      context: { userId: string };
      data: { labId: string };
    }) => {
      const sql = await assertPlatformAdmin(context.userId);

      const patients = await sql<{ count: number }>`
        select count(*)::int as count
        from patients
        where lab_id = ${data.labId}
      `;

      const reports = await sql<{ count: number }>`
        select count(*)::int as count
        from reports
        where lab_id = ${data.labId}
      `;

      if ((patients[0]?.count ?? 0) > 0) {
        throw new Error(
          "لا يمكن حذف المعمل لأنه يحتوي على مرضى. استخدم التعطيل بدلًا من الحذف.",
        );
      }

      if ((reports[0]?.count ?? 0) > 0) {
        throw new Error(
          "لا يمكن حذف المعمل لأنه يحتوي على تقارير. استخدم التعطيل بدلًا من الحذف.",
        );
      }

      await sql.query(
        `delete from lab_users where lab_id = $1`,
        [data.labId],
      );

      await sql.query(
        `delete from labs where id = $1`,
        [data.labId],
      );

      return { ok: true };
    },
  );
