import { createServerFn } from "@tanstack/react-start";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth/server";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql, type Sql } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { logEvent } from "@/lib/logger.server";
import { passwordPolicyError } from "@/lib/password-policy";

/**
 * Delete a Better Auth "user" row. `session`/`account` both reference it with
 * `on delete cascade` (see `migrations/auth/0001_auth.sql`), and `lab_users`
 * does too (see `migrations/0002_laboratory_system.sql`), so this is enough
 * to fully undo a `signUpEmail` call — used to roll back an orphaned account
 * when the application-side insert that was supposed to follow it fails.
 * Swallows its own errors: this already runs inside a catch block, and an
 * orphaned auth user is a cleanup nit, never a reason to mask the original
 * error.
 */
async function deleteAuthUser(sql: Sql, authUserId: string): Promise<void> {
  try {
    await sql.query(`delete from "user" where id = $1`, [authUserId]);
  } catch (err) {
    logEvent("error", "auth_user.rollback_failed", { authUserId, error: String(err) });
  }
}

async function assertPlatformAdmin(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ auth_user_id: string }>`
    select auth_user_id
    from platform_admins
    where auth_user_id = ${userId}
    limit 1
  `;
  if (rows.length === 0) throw new Error("FORBIDDEN");
  return sql;
}

/**
 * Public, unauthenticated check for whether the platform has already been
 * bootstrapped. Used by `/admin/setup` to close itself once a first admin
 * exists — previously that route stayed open forever (see AGENTS note in
 * `admin.tsx`: "Keep first-admin bootstrap accessible before any platform
 * admin exists" only skipped the *admin* check, it never re-closed the page).
 * Deliberately returns nothing but a boolean — no admin identity is exposed.
 */
export const platformAdminExists = createServerFn({ method: "GET" }).handler(
  async () => {
    const sql = await getSql();
    const rows = await sql<{ exists: boolean }>`
      select exists(select 1 from platform_admins) as exists
    `;
    return Boolean(rows[0]?.exists);
  },
);

/**
 * Self-service cleanup for the caller's OWN auth account, and only when it is
 * truly orphaned (no platform-admin row, no lab_users row). Used right after
 * a failed `claimFirstPlatformAdmin()` — `authClient.signUp.email` on
 * `/admin/setup` already created a real Better Auth user before the claim is
 * attempted, so a losing race must not leave a stray, unlinked account behind.
 * Scoped to `context.userId` only: a caller can never delete anyone else, and
 * never an account that already holds a role.
 */
export const deleteSelfIfOrphaned = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const admin = await sql<{ auth_user_id: string }>`
      select auth_user_id from platform_admins where auth_user_id = ${context.userId} limit 1
    `;
    if (admin.length) return { deleted: false };
    const lab = await sql<{ id: string }>`
      select id from lab_users where auth_user_id = ${context.userId} limit 1
    `;
    if (lab.length) return { deleted: false };
    await deleteAuthUser(sql, context.userId);
    return { deleted: true };
  });

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

/** Bootstrap the very first platform administrator. */
export const claimFirstPlatformAdmin = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ auth_user_id: string }>`
      insert into platform_admins (auth_user_id)
      select ${context.userId}
      where not exists (select 1 from platform_admins)
      on conflict (auth_user_id) do nothing
      returning auth_user_id
    `;
    const claimed = rows.length > 0;
    if (claimed) {
      await logAudit(sql, {
        actorAuthUserId: context.userId,
        action: "platform_admin.claim",
        entityType: "platform_admin",
        entityId: context.userId,
      });
      logEvent("info", "platform_admin.claimed", { authUserId: context.userId });
    }
    return claimed;
  });

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
      select l.id, l.name, l.name_en, lu.username, l.phone, l.address,
             l.doctor_name, l.is_active, l.created_at
      from labs l
      left join lab_users lu on lu.lab_id = l.id and lu.role = 'owner'
      order by l.created_at desc
    `.then((rows) => rows.map((row) => ({
      id: row.id,
      name: row.name,
      nameEn: row.name_en,
      username: row.username,
      phone: row.phone,
      address: row.address,
      doctorName: row.doctor_name,
      isActive: row.is_active,
      createdAt: String(row.created_at),
    })));
  });

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function labLoginEmail(username: string) {
  return `${username}@lab.local`;
}

export const createLab = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }: {
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

    if (name.length < 2) throw new Error("اسم المعمل غير صالح");
    if (!/^[a-z0-9._-]{3,40}$/.test(username)) {
      throw new Error("اسم المستخدم يجب أن يكون 3-40 حرفًا إنجليزيًا أو أرقامًا أو ._- فقط");
    }
    const passwordError = passwordPolicyError(password);
    if (passwordError) throw new Error(passwordError);

    if (name !== "معمل جديد") {
      const duplicate = await sql<{ id: string }>`
        select id from labs where lower(name) = lower(${name}) limit 1
      `;
      if (duplicate.length) throw new Error("اسم المعمل موجود بالفعل");
    }

    const duplicateUsername = await sql<{ id: string }>`
      select id from lab_users where username = ${username} limit 1
    `;
    if (duplicateUsername.length) throw new Error("اسم المستخدم موجود بالفعل");

    const labId = randomUUID();
    const authEmail = labLoginEmail(username);

    // Better Auth stores the password hash in its own account table; we never
    // persist the lab password in our application tables.
    const created = await auth.api.signUpEmail({
      body: {
        name,
        email: authEmail,
        password,
      },
    });

    if (!created?.user?.id) throw new Error("تعذر إنشاء حساب المعمل");

    try {
      await sql.query(
        `insert into labs
          (id, name, name_en, phone, whatsapp, email, address, doctor_name, doctor_degree, doctor_specialty)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
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
        `insert into lab_users (id, lab_id, auth_user_id, username, role)
         values ($1,$2,$3,$4,'owner')`,
        [randomUUID(), labId, created.user.id, username],
      );
    } catch (error) {
      // `deleteAuthUser` cascades to `lab_users` too (see its docstring), so
      // this also cleans up a lab_users row if that insert somehow partially
      // landed. Previously only the `labs` row was rolled back here, which
      // left a real, permanently-orphaned Better Auth account (a login that
      // could never reach any lab or admin surface) behind on every failure.
      await deleteAuthUser(sql, created.user.id);
      await sql.query(`delete from labs where id = $1`, [labId]).catch(() => undefined);
      logEvent("error", "lab.create.failed", { labId, error: String(error) });
      throw error;
    }

    await logAudit(sql, {
      labId,
      actorAuthUserId: context.userId,
      action: "lab.create",
      entityType: "lab",
      entityId: labId,
    });
    logEvent("info", "lab.created", { labId, actorAuthUserId: context.userId });

    return { id: labId, name, username };
  });
