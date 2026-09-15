import { createServerFn } from "@tanstack/react-start";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth/server";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export type LabRole =
  | "owner"
  | "supervisor"
  | "technician"
  | "reviewer"
  | "viewer";

export type LabPermission =
  | "patients.view"
  | "patients.create"
  | "patients.edit"
  | "patients.delete"
  | "reports.view"
  | "reports.create"
  | "reports.edit"
  | "reports.delete"
  | "reports.print"
  | "reports.export"
  | "users.manage";

export type LabPermissions = Partial<
  Record<LabPermission, boolean>
>;

export type LabStaff = {
  id: string;
  username: string;
  name: string | null;
  role: LabRole;
  permissions: LabPermissions;
  isActive: boolean;
  createdAt: string;
};

export const ALL_LAB_PERMISSIONS: LabPermission[] = [
  "patients.view",
  "patients.create",
  "patients.edit",
  "patients.delete",

  "reports.view",
  "reports.create",
  "reports.edit",
  "reports.approve",
  "reports.delete",
  "reports.print",
  "reports.export",

  "users.manage",
];

/**
 * الحصول على بيانات وصلاحيات المستخدم الحالي داخل المعمل.
 *
 * Owner يحصل تلقائيًا على كل الصلاحيات.
 */
export const getCurrentLabPermissions = createServerFn({
  method: "GET",
})
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();

    const rows = await sql<{
      id: string;
      lab_id: string;
      role: LabRole;
    }>`
      select id, lab_id, role
      from lab_users
      where auth_user_id = ${context.userId}
        and is_active = true
      limit 1
    `;

    if (!rows.length) {
      throw new Error("LAB_ACCESS_REQUIRED");
    }

    const user = rows[0];

    if (user.role === "owner") {
      return {
        labId: user.lab_id,
        labUserId: user.id,
        role: user.role,
        permissions: Object.fromEntries(
          ALL_LAB_PERMISSIONS.map((permission) => [
            permission,
            true,
          ]),
        ) as LabPermissions,
      };
    }

    const permissionRows = await sql<{
      permissions: LabPermissions | string;
    }>`
      select permissions
      from lab_user_permissions
      where lab_user_id = ${user.id}
      limit 1
    `;

    let permissions: LabPermissions = {};

    if (permissionRows.length) {
      const raw = permissionRows[0].permissions;

      if (typeof raw === "string") {
        try {
          permissions = JSON.parse(raw) as LabPermissions;
        } catch {
          permissions = {};
        }
      } else {
        permissions = raw || {};
      }
    }

    return {
      labId: user.lab_id,
      labUserId: user.id,
      role: user.role,
      permissions,
    };
  });

/**
 * دالة داخلية تستخدمها العمليات المحمية في السيرفر.
 */
async function getLabUserContext(userId: string) {
  const sql = await getSql();

  const rows = await sql<{
    id: string;
    lab_id: string;
    role: LabRole;
  }>`
    select id, lab_id, role
    from lab_users
    where auth_user_id = ${userId}
      and is_active = true
    limit 1
  `;

  if (!rows.length) {
    throw new Error("LAB_ACCESS_REQUIRED");
  }

  const user = rows[0];

  if (user.role === "owner") {
    return {
      sql,
      labId: user.lab_id,
      labUserId: user.id,
      role: user.role,
      permissions: Object.fromEntries(
        ALL_LAB_PERMISSIONS.map((permission) => [
          permission,
          true,
        ]),
      ) as LabPermissions,
    };
  }

  const permissionRows = await sql<{
    permissions: LabPermissions | string;
  }>`
    select permissions
    from lab_user_permissions
    where lab_user_id = ${user.id}
    limit 1
  `;

  let permissions: LabPermissions = {};

  if (permissionRows.length) {
    const raw = permissionRows[0].permissions;

    if (typeof raw === "string") {
      try {
        permissions = JSON.parse(raw) as LabPermissions;
      } catch {
        permissions = {};
      }
    } else {
      permissions = raw || {};
    }
  }

  return {
    sql,
    labId: user.lab_id,
    labUserId: user.id,
    role: user.role,
    permissions,
  };
}

export async function requireLabPermission(
  userId: string,
  permission: LabPermission,
) {
  const context = await getLabUserContext(userId);

  if (context.role === "owner") {
    return context;
  }

  if (context.permissions[permission] !== true) {
    throw new Error("PERMISSION_DENIED");
  }

  return context;
}

async function getManagerContext(userId: string) {
  const context = await getLabUserContext(userId);

  if (
    context.role !== "owner" &&
    context.permissions["users.manage"] !== true
  ) {
    throw new Error("USERS_MANAGE_REQUIRED");
  }

  return context;
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function labLoginEmail(username: string) {
  return `${username}@lab.local`;
}

function normalizePermissions(
  permissions?: LabPermissions,
): LabPermissions {
  const result: LabPermissions = {};

  for (const permission of ALL_LAB_PERMISSIONS) {
    if (permissions?.[permission] === true) {
      result[permission] = true;
    }
  }

  return result;
}

export const listLabStaff = createServerFn({
  method: "GET",
})
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<LabStaff[]> => {
    const { sql, labId } = await getManagerContext(
      context.userId,
    );

    const rows = await sql<{
      id: string;
      username: string;
      name: string | null;
      role: LabRole;
      is_active: boolean;
      created_at: string | Date;
      permissions: LabPermissions | string | null;
    }>`
      select
        lu.id,
        lu.username,
        u.name,
        lu.role,
        lu.is_active,
        lu.created_at,
        lup.permissions
      from lab_users lu
      left join "user" u
        on u.id = lu.auth_user_id
      left join lab_user_permissions lup
        on lup.lab_user_id = lu.id
      where lu.lab_id = ${labId}
      order by
        case
          when lu.role = 'owner' then 0
          when lu.role = 'supervisor' then 1
          else 2
        end,
        lu.created_at asc
    `;

    return rows.map((row) => {
      let permissions: LabPermissions = {};

      if (row.role === "owner") {
        permissions = Object.fromEntries(
          ALL_LAB_PERMISSIONS.map((permission) => [
            permission,
            true,
          ]),
        ) as LabPermissions;
      } else if (row.permissions) {
        if (typeof row.permissions === "string") {
          try {
            permissions = JSON.parse(
              row.permissions,
            ) as LabPermissions;
          } catch {
            permissions = {};
          }
        } else {
          permissions = row.permissions;
        }
      }

      return {
        id: row.id,
        username: row.username,
        name: row.name,
        role: row.role,
        permissions,
        isActive: row.is_active,
        createdAt: String(row.created_at),
      };
    });
  });

export const createLabStaff = createServerFn({
  method: "POST",
})
  .middleware([authMiddleware])
  .handler(
    async ({
      context,
      data,
    }: {
      context: { userId: string };
      data: {
        username: string;
        password: string;
        name?: string;
        role?: Exclude<LabRole, "owner">;
        permissions?: LabPermissions;
      };
    }) => {
      const { sql, labId, labUserId } = await getManagerContext(
        context.userId,
      );

      const username = normalizeUsername(data.username);
      const password = data.password;
      const name = data.name?.trim() || username;
      const role = data.role || "supervisor";
      const permissions = normalizePermissions(
        data.permissions,
      );

      if (!/^[a-z0-9._-]{3,40}$/.test(username)) {
        throw new Error(
          "اسم المستخدم يجب أن يكون 3-40 حرفًا إنجليزيًا أو أرقامًا أو ._- فقط",
        );
      }

      if (password.length < 8) {
        throw new Error(
          "كلمة المرور يجب ألا تقل عن 8 أحرف",
        );
      }

      if (
        ![
          "supervisor",
          "technician",
          "reviewer",
          "viewer",
        ].includes(role)
      ) {
        throw new Error("الصلاحية غير صالحة");
      }

      const duplicate = await sql<{ id: string }>`
        select id
        from lab_users
        where username = ${username}
        limit 1
      `;

      if (duplicate.length) {
        throw new Error("اسم المستخدم موجود بالفعل");
      }

      const created = await auth.api.signUpEmail({
        body: {
          name,
          email: labLoginEmail(username),
          password,
        },
      });

      if (!created?.user?.id) {
        throw new Error("تعذر إنشاء حساب الموظف");
      }

      const staffId = randomUUID();

      await sql.query(
        `insert into lab_users
          (id, lab_id, auth_user_id, username, role)
         values ($1,$2,$3,$4,$5)`,
        [
          staffId,
          labId,
          created.user.id,
          username,
          role,
        ],
      );

      await sql.query(
        `insert into lab_user_permissions
          (lab_user_id, permissions)
         values ($1,$2::jsonb)
         on conflict (lab_user_id)
         do update set
           permissions = excluded.permissions,
           updated_at = current_timestamp`,
        [
          staffId,
          JSON.stringify(permissions),
        ],
      );

      return {
        id: staffId,
        username,
        name,
        role,
        permissions,
      };
    },
  );

export const updateLabStaff = createServerFn({
  method: "POST",
})
  .middleware([authMiddleware])
  .handler(
    async ({
      context,
      data,
    }: {
      context: { userId: string };
      data: {
        id: string;
        name?: string;
        role?: Exclude<LabRole, "owner">;
        permissions?: LabPermissions;
        isActive?: boolean;
      };
    }) => {
      const { sql, labId } = await getManagerContext(
        context.userId,
      );

      const rows = await sql<{
        id: string;
        auth_user_id: string | null;
        role: LabRole;
        is_active: boolean;
      }>`
        select id, auth_user_id, role, is_active
        from lab_users
        where id = ${data.id}
          and lab_id = ${labId}
        limit 1
      `;

      if (!rows.length) {
        throw new Error("USER_NOT_FOUND");
      }

      if (rows[0].role === "owner") {
        throw new Error(
          "لا يمكن تعديل حساب مالك المعمل من هنا",
        );
      }

      if (
        data.role &&
        ![
          "supervisor",
          "technician",
          "reviewer",
          "viewer",
        ].includes(data.role)
      ) {
        throw new Error("الصلاحية غير صالحة");
      }

      const normalizedName = data.name?.trim();

      if (typeof data.name !== "undefined") {
        if (!normalizedName) {
          throw new Error("اسم الموظف مطلوب");
        }
        if (normalizedName.length > 120) {
          throw new Error("اسم الموظف طويل جدًا");
        }
      }

      if (
        typeof data.name === "undefined" &&
        typeof data.role === "undefined" &&
        typeof data.permissions === "undefined" &&
        typeof data.isActive === "undefined"
      ) {
        throw new Error("لا يوجد تعديل");
      }

      if (typeof data.isActive !== "undefined" && data.isActive === false && rows[0].is_active) {
        const self = rows[0].auth_user_id === context.userId;
        if (self) {
          throw new Error("لا يمكنك إيقاف حسابك الحالي");
        }
      }

      if (typeof data.name !== "undefined" && rows[0].auth_user_id) {
        await sql.query(
          `update "user"
           set name=$1,
               "updatedAt"=current_timestamp
           where id=$2`,
          [normalizedName, rows[0].auth_user_id],
        );
      }

      if (typeof data.role !== "undefined") {
        await sql.query(
          `update lab_users
           set role=$1,
               updated_at=current_timestamp
           where id=$2
             and lab_id=$3`,
          [
            data.role,
            data.id,
            labId,
          ],
        );
      }

      if (typeof data.isActive !== "undefined") {
        await sql.query(
          `update lab_users
           set is_active=$1,
               updated_at=current_timestamp
           where id=$2
             and lab_id=$3`,
          [
            data.isActive,
            data.id,
            labId,
          ],
        );
      }

      if (typeof data.permissions !== "undefined") {
        const permissions = normalizePermissions(
          data.permissions,
        );

        await sql.query(
          `insert into lab_user_permissions
            (lab_user_id, permissions)
           values ($1,$2::jsonb)
           on conflict (lab_user_id)
           do update set
             permissions = excluded.permissions,
             updated_at = current_timestamp`,
          [
            data.id,
            JSON.stringify(permissions),
          ],
        );
      }

      const changedFields = [
        typeof data.name !== "undefined" ? "name" : null,
        typeof data.role !== "undefined" ? "role" : null,
        typeof data.permissions !== "undefined" ? "permissions" : null,
        typeof data.isActive !== "undefined" ? "isActive" : null,
      ].filter(Boolean);

      await sql.query(
        `insert into audit_logs
          (id, lab_id, actor_user_id, actor_auth_user_id, action, entity_type, entity_id, metadata_json)
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          randomUUID(),
          labId,
          labUserId,
          context.userId,
          "lab_user.updated",
          "lab_user",
          data.id,
          JSON.stringify({ fields: changedFields }),
        ],
      );

      return {
        ok: true,
        id: data.id,
        name: normalizedName,
        role: data.role,
        permissions: typeof data.permissions !== "undefined"
          ? normalizePermissions(data.permissions)
          : undefined,
        isActive: data.isActive,
      };
    },
  );
