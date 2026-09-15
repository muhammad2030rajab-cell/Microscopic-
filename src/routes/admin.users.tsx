import { useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  FileText,
  FlaskConical,
  Lock,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

/* =========================================================
   TYPES
========================================================= */

type UserRole =
  | "owner"
  | "technician"
  | "reviewer"
  | "viewer";

type AdminUser = {
  id: string;
  username: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  labId: string;
  labName: string;
};

/* =========================================================
   SECURITY
========================================================= */

async function assertPlatformAdmin(userId: string) {
  const sql = await getSql();

  const rows = await sql`
    select auth_user_id
    from platform_admins
    where auth_user_id = ${userId}
    limit 1
  `;

  if (!rows.length) {
    throw new Error("FORBIDDEN");
  }

  return sql;
}

/* =========================================================
   LIST USERS
========================================================= */

const listPlatformUsers = createServerFn({
  method: "GET",
})
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<AdminUser[]> => {
    const sql = await assertPlatformAdmin(context.userId);

    const rows = await sql<{
      id: string;
      username: string;
      name: string | null;
      role: UserRole;
      is_active: boolean;
      lab_id: string;
      lab_name: string;
    }>`
      select
        lu.id,
        lu.username,
        u.name,
        lu.role,
        lu.is_active,
        l.id as lab_id,
        l.name as lab_name
      from lab_users lu
      join labs l
        on l.id = lu.lab_id
      left join "user" u
        on u.id = lu.auth_user_id
      order by
        l.name asc,
        case
          when lu.role = 'owner' then 0
          when lu.role = 'reviewer' then 1
          when lu.role = 'technician' then 2
          else 3
        end,
        lu.username asc
    `;

    return rows.map((row) => ({
      id: row.id,
      username: row.username,
      name: row.name,
      role: row.role,
      isActive: row.is_active,
      labId: row.lab_id,
      labName: row.lab_name,
    }));
  });

/* =========================================================
   UPDATE USER
========================================================= */

const updatePlatformUser = createServerFn({
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
        role?: Exclude<UserRole, "owner">;
        isActive?: boolean;
      };
    }) => {
      const sql = await assertPlatformAdmin(context.userId);

      const rows = await sql<{
        id: string;
        role: UserRole;
      }>`
        select id, role
        from lab_users
        where id = ${data.id}
        limit 1
      `;

      if (!rows.length) {
        throw new Error("USER_NOT_FOUND");
      }

      /*
       * حماية مهمة:
       * المدير المركزي لا يستطيع تغيير أو تعطيل Owner.
       */
      if (rows[0].role === "owner") {
        throw new Error(
          "لا يمكن تعديل أو تعطيل مالك المعمل من لوحة المدير المركزي.",
        );
      }

      if (
        data.role &&
        !["technician", "reviewer", "viewer"].includes(data.role)
      ) {
        throw new Error("الصلاحية غير صالحة");
      }

      if (
        typeof data.role === "undefined" &&
        typeof data.isActive === "undefined"
      ) {
        throw new Error("لا يوجد تعديل");
      }

      await sql.query(
        `
        update lab_users
        set
          role = coalesce($1, role),
          is_active = coalesce($2, is_active),
          updated_at = current_timestamp
        where id = $3
        `,
        [
          data.role ?? null,
          typeof data.isActive === "boolean"
            ? data.isActive
            : null,
          data.id,
        ],
      );

      return {
        ok: true,
      };
    },
  );

/* =========================================================
   ROUTE
========================================================= */

export const Route = createFileRoute("/admin/users")({
  loader: async () => {
    try {
      const [isAdmin, users] = await Promise.all([
        isPlatformAdmin(),
        listPlatformUsers(),
      ]);

      return {
        isAdmin,
        users,
      };
    } catch {
      return {
        isAdmin: false,
        users: [] as AdminUser[],
      };
    }
  },

  component: AdminUsers,
});

/* =========================================================
   PAGE
========================================================= */

function AdminUsers() {
  const { isAdmin, users: initialUsers } =
    Route.useLoaderData();

  const [users, setUsers] =
    useState<AdminUser[]>(initialUsers);

  const [selectedUser, setSelectedUser] =
    useState<AdminUser | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isAdmin) {
    return <Navigate to="/login" />;
  }

  function roleLabel(role: UserRole) {
    switch (role) {
      case "owner":
        return "مالك المعمل";
      case "technician":
        return "فني";
      case "reviewer":
        return "مراجع";
      case "viewer":
        return "مشاهد";
      default:
        return role;
    }
  }

  async function changeRole(
    user: AdminUser,
    role: Exclude<UserRole, "owner">,
  ) {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await updatePlatformUser({
        data: {
          id: user.id,
          role,
        },
      });

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? {
                ...item,
                role,
              }
            : item,
        ),
      );

      setSuccess(
        `تم تغيير صلاحية ${user.username} إلى ${roleLabel(role)} ✅`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "تعذر تغيير الصلاحية",
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggleUser(user: AdminUser) {
    if (user.role === "owner") {
      setError(
        "لا يمكن تعطيل مالك المعمل من لوحة المدير المركزي.",
      );
      return;
    }

    const action = user.isActive
      ? "إيقاف"
      : "إعادة تفعيل";

    const confirmed = window.confirm(
      `هل أنت متأكد من ${action} المستخدم "${user.username}"؟`,
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await updatePlatformUser({
        data: {
          id: user.id,
          isActive: !user.isActive,
        },
      });

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? {
                ...item,
                isActive: !item.isActive,
              }
            : item,
        ),
      );

      setSuccess(
        user.isActive
          ? `تم إيقاف ${user.username} 🔒`
          : `تم إعادة تفعيل ${user.username} 🔓`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "تعذر تغيير حالة المستخدم",
      );
    } finally {
      setLoading(false);
    }
  }

  const owners = users.filter(
    (user) => user.role === "owner",
  ).length;

  const activeUsers = users.filter(
    (user) => user.isActive,
  ).length;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-paper"
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b border-line bg-elevated">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
              Central administration
            </p>

            <h1 className="mt-1 font-display text-xl font-semibold">
              المستخدمون والصلاحيات 👥
            </h1>
          </div>

          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-sm text-teal hover:underline"
          >
            <ArrowRight className="size-4" />
            لوحة التحكم
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">

        {/* =================================================
            HERO
        ================================================= */}

        <section className="rounded-2xl bg-ink p-6 text-paper shadow-sm sm:p-8">
          <div className="flex items-start gap-4">

            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-teal/15 text-teal">
              <ShieldCheck className="size-6" />
            </div>

            <div>
              <p className="text-sm text-paper/60">
                User & Permission Management
              </p>

              <h2 className="mt-2 font-display text-3xl font-semibold">
                التحكم في المستخدمين 🔐
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-paper/65">
                من هنا المدير المركزي يقدر يراجع حسابات جميع المعامل
                ويغير الأدوار أو يوقف الحسابات غير المسموح لها.
              </p>
            </div>

          </div>
        </section>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">

          <Stat
            icon={<Users />}
            title="إجمالي المستخدمين"
            value={users.length}
          />

          <Stat
            icon={<CheckCircle2 />}
            title="الحسابات النشطة"
            value={activeUsers}
          />

          <Stat
            icon={<ShieldCheck />}
            title="ملاك المعامل"
            value={owners}
          />

        </div>

        {/* =================================================
            MESSAGES
        ================================================= */}

        {success ? (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-ok/20 bg-ok/5 p-4 text-sm">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" />

            <p className="text-ok">
              {success}
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-high/20 bg-high/5 p-4 text-sm text-high">
            <X className="mt-0.5 size-5 shrink-0" />

            <p>{error}</p>
          </div>
        ) : null}

        {/* =================================================
            USERS
        ================================================= */}

        <section className="mt-6 rounded-xl border border-line bg-elevated p-5 shadow-sm sm:p-6">

          <div className="flex items-center justify-between gap-3">

            <div>
              <h3 className="font-display text-xl font-semibold">
                حسابات المعامل
              </h3>

              <p className="mt-1 text-sm text-muted">
                إدارة الأدوار وحالة الحسابات.
              </p>
            </div>

            <div className="grid size-10 place-items-center rounded-lg bg-teal/10 text-teal">
              <UserRound className="size-5" />
            </div>

          </div>

          <div className="mt-5 space-y-3">

            {users.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line p-10 text-center">

                <Users className="mx-auto size-10 text-muted" />

                <p className="mt-3 font-medium">
                  لا توجد حسابات معامل.
                </p>

              </div>
            ) : (
              users.map((user) => {

                const isOwner = user.role === "owner";

                return (
                  <div
                    key={user.id}
                    className={`rounded-xl border p-4 transition ${
                      user.isActive
                        ? "border-line"
                        : "border-red-200 bg-red-50/30"
                    }`}
                  >

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                      {/* USER INFO */}

                      <div className="flex min-w-0 items-start gap-3">

                        <div
                          className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                            isOwner
                              ? "bg-teal/10 text-teal"
                              : "bg-paper-2 text-teal"
                          }`}
                        >
                          {isOwner ? (
                            <ShieldCheck className="size-5" />
                          ) : (
                            <UserRound className="size-5" />
                          )}
                        </div>

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <p className="font-semibold">
                              {user.name || user.username}
                            </p>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                user.isActive
                                  ? "bg-ok/10 text-ok"
                                  : "bg-red-500/10 text-red-600"
                              }`}
                            >
                              {user.isActive
                                ? "نشط"
                                : "موقوف"}
                            </span>

                          </div>

                          <p className="mt-1 text-xs text-muted">
                            اسم المستخدم:
                            {" "}
                            <span dir="ltr">
                              {user.username}
                            </span>
                          </p>

                          <p className="mt-1 text-xs text-muted">
                            المعمل: {user.labName}
                          </p>

                          <p className="mt-1 text-xs text-muted">
                            الدور الحالي:
                            {" "}
                            <strong>
                              {roleLabel(user.role)}
                            </strong>
                          </p>

                        </div>
                      </div>

                      {/* ACTIONS */}

                      {!isOwner ? (
                        <div className="flex flex-wrap items-center gap-2">

                          {/* ROLE SELECT */}

                          <select
                            value={user.role}
                            disabled={loading}
                            onChange={(event) =>
                              changeRole(
                                user,
                                event.target.value as Exclude<
                                  UserRole,
                                  "owner"
                                >,
                              )
                            }
                            className="h-9 rounded-lg border border-line bg-paper px-3 text-sm outline-none focus:border-teal"
                          >
                            <option value="technician">
                              🧪 فني
                            </option>

                            <option value="reviewer">
                              🔍 مراجع
                            </option>

                            <option value="viewer">
                              👁️ مشاهد
                            </option>
                          </select>

                          {/* ACTIVATE / DISABLE */}

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={loading}
                            onClick={() =>
                              toggleUser(user)
                            }
                          >
                            {user.isActive ? (
                              <>
                                <Lock className="size-4" />
                                إيقاف
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="size-4" />
                                تفعيل
                              </>
                            )}
                          </Button>

                        </div>
                      ) : (
                        <div className="rounded-lg border border-teal/20 bg-teal/5 px-4 py-2 text-sm text-teal">
                          👑 مالك المعمل — محمي
                        </div>
                      )}

                    </div>

                  </div>
                );
              })
            )}

          </div>

        </section>

        {/* =================================================
            PERMISSIONS MATRIX
        ================================================= */}

        <section className="mt-6 rounded-xl border border-line bg-elevated p-5 shadow-sm sm:p-6">

          <div className="flex items-center gap-3">

            <div className="grid size-10 place-items-center rounded-lg bg-teal/10 text-teal">
              <ShieldCheck className="size-5" />
            </div>

            <div>
              <h3 className="font-display text-xl font-semibold">
                مصفوفة الصلاحيات
              </h3>

              <p className="mt-1 text-sm text-muted">
                الصلاحيات الأساسية لكل دور داخل المعمل.
              </p>
            </div>

          </div>

          <div className="mt-5 overflow-x-auto rounded-xl border border-line">

            <table className="w-full min-w-[720px] text-sm">

              <thead className="bg-paper-2">
                <tr className="border-b border-line">

                  <th className="px-4 py-4 text-right font-semibold">
                    الدور
                  </th>

                  <th className="px-4 py-4 text-center">
                    <Eye className="mx-auto size-4" />
                    <span className="mt-1 block">
                      مشاهدة
                    </span>
                  </th>

                  <th className="px-4 py-4 text-center">
                    <Plus className="mx-auto size-4" />
                    <span className="mt-1 block">
                      إضافة
                    </span>
                  </th>

                  <th className="px-4 py-4 text-center">
                    <Pencil className="mx-auto size-4" />
                    <span className="mt-1 block">
                      تعديل
                    </span>
                  </th>

                  <th className="px-4 py-4 text-center">
                    <Trash2 className="mx-auto size-4" />
                    <span className="mt-1 block">
                      حذف
                    </span>
                  </th>

                  <th className="px-4 py-4 text-center">
                    <FileText className="mx-auto size-4" />
                    <span className="mt-1 block">
                      مراجعة
                    </span>
                  </th>

                  <th className="px-4 py-4 text-center">
                    <Lock className="mx-auto size-4" />
                    <span className="mt-1 block">
                      طباعة
                    </span>
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-line">

                <PermissionRow
                  role="👑 مالك المعمل"
                  permissions={[
                    true,
                    true,
                    true,
                    true,
                    true,
                    true,
                  ]}
                />

                <PermissionRow
                  role="🧪 فني"
                  permissions={[
                    true,
                    true,
                    true,
                    false,
                    false,
                    true,
                  ]}
                />

                <PermissionRow
                  role="🔍 مراجع"
                  permissions={[
                    true,
                    false,
                    false,
                    false,
                    true,
                    true,
                  ]}
                />

                <PermissionRow
                  role="👁️ مشاهد"
                  permissions={[
                    true,
                    false,
                    false,
                    false,
                    false,
                    false,
                  ]}
                />

              </tbody>

            </table>

          </div>

          <div className="mt-4 rounded-xl border border-teal/20 bg-teal/5 p-4 text-sm leading-6 text-muted">
            <strong className="text-ink">
              🔐 ملاحظة أمنية:
            </strong>
            {" "}
            الجدول ده يوضح الصلاحيات المعتمدة. المرحلة التالية
            هنربط كل صلاحية فعليًا بعمليات المرضى والتقارير
            والتحاليل، بحيث السيرفر نفسه يمنع أي عملية غير مسموحة.
          </div>

        </section>

      </div>
    </main>
  );
}

/* ===========================================================
   STAT
=========================================================== */

function Stat({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-line bg-elevated p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm text-muted">
            {title}
          </p>

          <p className="mt-2 font-display text-3xl font-bold">
            {value}
          </p>
        </div>

        <div className="grid size-11 place-items-center rounded-xl bg-teal/10 text-teal">
          {icon}
        </div>

      </div>

    </div>
  );
}

/* ===========================================================
   PERMISSION ROW
=========================================================== */

function PermissionRow({
  role,
  permissions,
}: {
  role: string;
  permissions: boolean[];
}) {
  return (
    <tr className="hover:bg-paper/50">

      <td className="px-4 py-4 font-semibold">
        {role}
      </td>

      {permissions.map((allowed, index) => (
        <td
          key={index}
          className="px-4 py-4 text-center"
        >
          {allowed ? (
            <span className="font-bold text-ok">
              ✓
            </span>
          ) : (
            <span className="text-muted">
              —
            </span>
          )}
        </td>
      ))}

    </tr>
  );
}
