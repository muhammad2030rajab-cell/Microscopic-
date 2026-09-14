import { createServerFn } from "@tanstack/react-start";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth/server";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export type LabRole = "owner" | "technician" | "reviewer" | "viewer";

export type LabStaff = {
  id: string;
  username: string;
  name: string | null;
  role: LabRole;
  isActive: boolean;
  createdAt: string;
};

async function getOwnerContext(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ id: string; lab_id: string; role: LabRole }>`
    select id, lab_id, role
    from lab_users
    where auth_user_id = ${userId} and is_active = true
    limit 1
  `;
  if (!rows.length) throw new Error("LAB_ACCESS_REQUIRED");
  if (rows[0].role !== "owner") throw new Error("OWNER_ACCESS_REQUIRED");
  return { sql, ...rows[0] };
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function labLoginEmail(username: string) {
  return `${username}@lab.local`;
}

export const listLabStaff = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<LabStaff[]> => {
    const { sql, lab_id } = await getOwnerContext(context.userId);
    const rows = await sql<{
      id: string;
      username: string;
      name: string | null;
      role: LabRole;
      is_active: boolean;
      created_at: string | Date;
    }>`
      select lu.id, lu.username, u.name, lu.role, lu.is_active, lu.created_at
      from lab_users lu
      left join "user" u on u.id = lu.auth_user_id
      where lu.lab_id = ${lab_id}
      order by case when lu.role = 'owner' then 0 else 1 end, lu.created_at asc
    `;
    return rows.map((row) => ({
      id: row.id,
      username: row.username,
      name: row.name,
      role: row.role,
      isActive: row.is_active,
      createdAt: String(row.created_at),
    }));
  });

export const createLabStaff = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }: {
    context: { userId: string };
    data: { username: string; password: string; name?: string; role: Exclude<LabRole, "owner"> };
  }) => {
    const { sql, lab_id } = await getOwnerContext(context.userId);
    const username = normalizeUsername(data.username);
    const password = data.password;
    const name = data.name?.trim() || username;

    if (!/^[a-z0-9._-]{3,40}$/.test(username)) {
      throw new Error("اسم المستخدم يجب أن يكون 3-40 حرفًا إنجليزيًا أو أرقامًا أو ._- فقط");
    }
    if (password.length < 8) throw new Error("كلمة المرور يجب ألا تقل عن 8 أحرف");
    if (!['technician', 'reviewer', 'viewer'].includes(data.role)) throw new Error("الصلاحية غير صالحة");

    const duplicate = await sql<{ id: string }>`
      select id from lab_users where username = ${username} limit 1
    `;
    if (duplicate.length) throw new Error("اسم المستخدم موجود بالفعل");

    const created = await auth.api.signUpEmail({
      body: { name, email: labLoginEmail(username), password },
    });
    if (!created?.user?.id) throw new Error("تعذر إنشاء حساب الموظف");

    try {
      const staffId = randomUUID();
      await sql.query(
        `insert into lab_users (id, lab_id, auth_user_id, username, role)
         values ($1,$2,$3,$4,$5)`,
        [staffId, lab_id, created.user.id, username, data.role],
      );
      return { id: staffId, username, name, role: data.role as LabRole };
    } catch (error) {
      throw error;
    }
  });

export const updateLabStaff = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }: {
    context: { userId: string };
    data: { id: string; role?: Exclude<LabRole, "owner">; isActive?: boolean };
  }) => {
    const { sql, lab_id } = await getOwnerContext(context.userId);
    const rows = await sql<{ id: string; role: LabRole }>`
      select id, role from lab_users where id = ${data.id} and lab_id = ${lab_id} limit 1
    `;
    if (!rows.length) throw new Error("USER_NOT_FOUND");
    if (rows[0].role === "owner") throw new Error("لا يمكن تعديل حساب مالك المعمل من هنا");

    if (data.role && !['technician', 'reviewer', 'viewer'].includes(data.role)) {
      throw new Error("الصلاحية غير صالحة");
    }
    if (typeof data.role === "undefined" && typeof data.isActive === "undefined") {
      throw new Error("لا يوجد تعديل");
    }

    await sql.query(
      `update lab_users
       set role = coalesce($1, role), is_active = coalesce($2, is_active), updated_at=current_timestamp
       where id=$3 and lab_id=$4`,
      [data.role ?? null, typeof data.isActive === "boolean" ? data.isActive : null, data.id, lab_id],
    );
    return { ok: true };
  });
