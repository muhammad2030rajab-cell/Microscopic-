import { useEffect, useState } from "react";
import {
  ALL_LAB_PERMISSIONS,
  type LabPermission,
  type LabPermissions,
  type LabRole,
  type LabStaff,
  listLabStaff,
  createLabStaff,
  updateLabStaff,
} from "@/lib/lab-users";

const permissionLabels: Record<
  LabPermission,
  { ar: string; description: string }
> = {
  "patients.view": {
    ar: "عرض المرضى",
    description: "يمكنه مشاهدة بيانات المرضى",
  },
  "patients.create": {
    ar: "إضافة مريض",
    description: "يمكنه تسجيل مريض جديد",
  },
  "patients.edit": {
    ar: "تعديل المرضى",
    description: "يمكنه تعديل بيانات المرضى",
  },
  "patients.delete": {
    ar: "حذف المرضى",
    description: "يمكنه حذف المرضى",
  },

  "reports.view": {
    ar: "عرض التقارير",
    description: "يمكنه مشاهدة التقارير والنتائج",
  },
  "reports.create": {
    ar: "إنشاء تقرير",
    description: "يمكنه إنشاء تقرير جديد",
  },
  "reports.edit": {
    ar: "تعديل التقارير",
    description: "يمكنه تعديل التقارير",
  },
  "reports.delete": {
    ar: "حذف التقارير",
    description: "يمكنه حذف التقارير",
  },
  "reports.print": {
    ar: "طباعة التقارير",
    description: "يمكنه طباعة التقارير",
  },
  "reports.export": {
    ar: "تصدير التقارير",
    description: "يمكنه تصدير البيانات والتقارير",
  },

  "users.manage": {
    ar: "إدارة المستخدمين",
    description: "يمكنه إضافة وتعديل وتعطيل مستخدمي المعمل",
  },
};

const permissionGroups = [
  {
    title: "👥 المرضى",
    permissions: [
      "patients.view",
      "patients.create",
      "patients.edit",
      "patients.delete",
    ] as LabPermission[],
  },
  {
    title: "📄 التقارير",
    permissions: [
      "reports.view",
      "reports.create",
      "reports.edit",
      "reports.delete",
      "reports.print",
      "reports.export",
    ] as LabPermission[],
  },
  {
    title: "⚙️ الإدارة",
    permissions: ["users.manage"] as LabPermission[],
  },
];

const emptyPermissions = (): LabPermissions => ({});

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    switch (error.message) {
      case "PERMISSION_DENIED":
        return "ليس لديك صلاحية لتنفيذ هذا الإجراء";
      case "USERS_MANAGE_REQUIRED":
        return "ليس لديك صلاحية إدارة المستخدمين";
      case "LAB_ACCESS_REQUIRED":
        return "لا يوجد وصول إلى المعمل";
      case "USER_NOT_FOUND":
        return "المستخدم غير موجود";
      default:
        return error.message;
    }
  }

  return "حدث خطأ غير متوقع";
}

function PermissionCheckbox({
  permission,
  checked,
  onChange,
}: {
  permission: LabPermission;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const item = permissionLabels[permission];

  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 14px",
        border: checked
          ? "1px solid #0f766e"
          : "1px solid #e5e7eb",
        background: checked ? "#f0fdfa" : "#fff",
        borderRadius: 12,
        cursor: "pointer",
        transition: "all .15s ease",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        style={{
          width: 19,
          height: 19,
          marginTop: 2,
          accentColor: "#0f766e",
        }}
      />

      <span>
        <span
          style={{
            display: "block",
            fontWeight: 800,
            color: "#111827",
            marginBottom: 3,
          }}
        >
          {item.ar}
        </span>

        <span
          style={{
            display: "block",
            color: "#6b7280",
            fontSize: 12,
          }}
        >
          {item.description}
        </span>
      </span>
    </label>
  );
}

export default function LabUsersPage() {
  const [staff, setStaff] = useState<LabStaff[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] =
    useState<LabStaff | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] =
    useState<Exclude<LabRole, "owner">>("supervisor");

  const [permissions, setPermissions] =
    useState<LabPermissions>(emptyPermissions());

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadStaff() {
    try {
      setLoading(true);
      setError("");

      const result = await listLabStaff();
      setStaff(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  function resetForm() {
    setUsername("");
    setPassword("");
    setName("");
    setRole("supervisor");
    setPermissions(emptyPermissions());
    setEditingUser(null);
    setShowForm(false);
    setError("");
  }

  function openCreate() {
    setEditingUser(null);
    setUsername("");
    setPassword("");
    setName("");
    setRole("supervisor");
    setPermissions(emptyPermissions());
    setError("");
    setShowForm(true);
  }

  function openEdit(user: LabStaff) {
    setEditingUser(user);
    setUsername(user.username);
    setName(user.name || "");
    setPassword("");
    setRole(
      user.role === "owner"
        ? "supervisor"
        : user.role,
    );
    setPermissions({
      ...user.permissions,
    });
    setError("");
    setShowForm(true);
  }

  function togglePermission(
    permission: LabPermission,
    checked: boolean,
  ) {
    setPermissions((current) => ({
      ...current,
      [permission]: checked,
    }));
  }

  function selectAll() {
    const next: LabPermissions = {};

    for (const permission of ALL_LAB_PERMISSIONS) {
      next[permission] = true;
    }

    setPermissions(next);
  }

  function clearAll() {
    setPermissions({});
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (editingUser) {
        await updateLabStaff({
          data: {
            id: editingUser.id,
            role,
            permissions,
          },
        });
      } else {
        if (!password) {
          throw new Error("اكتب كلمة المرور");
        }

        await createLabStaff({
          data: {
            username,
            password,
            name,
            role,
            permissions,
          },
        });
      }

      await loadStaff();
      resetForm();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user: LabStaff) {
    if (user.role === "owner") return;

    try {
      setError("");

      await updateLabStaff({
        data: {
          id: user.id,
          isActive: !user.isActive,
        },
      });

      await loadStaff();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: 16,
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <header
          style={{
            background:
              "linear-gradient(135deg, #0f766e, #115e59)",
            color: "#fff",
            borderRadius: 20,
            padding: 22,
            marginBottom: 18,
            boxShadow:
              "0 10px 30px rgba(15,118,110,.18)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 15,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 25,
                  fontWeight: 900,
                }}
              >
                👥 إدارة مستخدمي المعمل
              </h1>

              <p
                style={{
                  margin: "7px 0 0",
                  opacity: 0.9,
                  fontSize: 14,
                }}
              >
                إضافة المستخدمين وتحديد صلاحيات كل مستخدم
              </p>
            </div>

            <button
              type="button"
              onClick={openCreate}
              style={{
                border: 0,
                borderRadius: 12,
                background: "#fff",
                color: "#0f766e",
                padding: "12px 18px",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              ＋ مستخدم جديد
            </button>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              borderRadius: 14,
              padding: 13,
              marginBottom: 16,
              fontWeight: 700,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Users */}
        <section
          style={{
            background: "#fff",
            borderRadius: 18,
            padding: 16,
            boxShadow:
              "0 4px 18px rgba(15,23,42,.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 19,
                fontWeight: 900,
              }}
            >
              المستخدمون
            </h2>

            <span
              style={{
                background: "#f0fdfa",
                color: "#0f766e",
                padding: "6px 10px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              {staff.length} مستخدم
            </span>
          </div>

          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: "#64748b",
              }}
            >
              جاري تحميل المستخدمين...
            </div>
          ) : staff.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 35,
                color: "#64748b",
              }}
            >
              لا يوجد مستخدمون إضافيون حتى الآن.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 10,
              }}
            >
              {staff.map((user) => (
                <div
                  key={user.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 15,
                    padding: 15,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 900,
                        fontSize: 16,
                      }}
                    >
                      {user.name || user.username}
                    </div>

                    <div
                      style={{
                        color: "#64748b",
                        fontSize: 13,
                        marginTop: 3,
                      }}
                    >
                      @{user.username}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 7,
                        flexWrap: "wrap",
                        marginTop: 8,
                      }}
                    >
                      <span
                        style={{
                          background:
                            user.role === "owner"
                              ? "#fef3c7"
                              : "#f1f5f9",
                          color:
                            user.role === "owner"
                              ? "#92400e"
                              : "#475569",
                          padding: "4px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {user.role === "owner"
                          ? "مدير المعمل"
                          : user.role === "supervisor"
                            ? "مشرف"
                            : user.role === "technician"
                              ? "فني"
                              : user.role === "reviewer"
                                ? "مراجع"
                                : "مشاهد"}
                      </span>

                      <span
                        style={{
                          background: user.isActive
                            ? "#dcfce7"
                            : "#fee2e2",
                          color: user.isActive
                            ? "#166534"
                            : "#991b1b",
                          padding: "4px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {user.isActive
                          ? "نشط"
                          : "متوقف"}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    {user.role !== "owner" && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            openEdit(user)
                          }
                          style={{
                            border: "1px solid #cbd5e1",
                            background: "#fff",
                            borderRadius: 10,
                            padding: "9px 13px",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          ✏️ تعديل
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleActive(user)
                          }
                          style={{
                            border: "1px solid #fecaca",
                            background: user.isActive
                              ? "#fff"
                              : "#f0fdf4",
                            color: user.isActive
                              ? "#b91c1c"
                              : "#166534",
                            borderRadius: 10,
                            padding: "9px 13px",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          {user.isActive
                            ? "🔴 تعطيل"
                            : "🟢 تفعيل"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Form */}
        {showForm && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,.55)",
              zIndex: 1000,
              padding: 14,
              overflowY: "auto",
            }}
          >
            <form
              onSubmit={handleSubmit}
              style={{
                maxWidth: 700,
                margin: "20px auto",
                background: "#fff",
                borderRadius: 20,
                padding: 20,
                boxShadow:
                  "0 25px 70px rgba(0,0,0,.2)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 21,
                      fontWeight: 900,
                    }}
                  >
                    {editingUser
                      ? "✏️ تعديل المستخدم"
                      : "➕ إضافة مستخدم جديد"}
                  </h2>

                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#64748b",
                      fontSize: 13,
                    }}
                  >
                    حدد الصلاحيات التي يحتاجها المستخدم فقط
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    border: 0,
                    background: "#f1f5f9",
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    fontSize: 20,
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>

              {/* Basic data */}
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <label>
                  <span
                    style={{
                      display: "block",
                      fontWeight: 800,
                      marginBottom: 6,
                    }}
                  >
                    اسم المستخدم
                  </span>

                  <input
                    value={username}
                    onChange={(event) =>
                      setUsername(event.target.value)
                    }
                    disabled={!!editingUser}
                    required
                    placeholder="مثال: ahmed.lab"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: 12,
                      borderRadius: 11,
                      border: "1px solid #cbd5e1",
                      outline: "none",
                    }}
                  />
                </label>

                <label>
                  <span
                    style={{
                      display: "block",
                      fontWeight: 800,
                      marginBottom: 6,
                    }}
                  >
                    اسم الموظف
                  </span>

                  <input
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    required
                    placeholder="الاسم"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: 12,
                      borderRadius: 11,
                      border: "1px solid #cbd5e1",
                    }}
                  />
                </label>

                {!editingUser && (
                  <label>
                    <span
                      style={{
                        display: "block",
                        fontWeight: 800,
                        marginBottom: 6,
                      }}
                    >
                      كلمة المرور
                    </span>

                    <input
                      type="password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value,
                        )
                      }
                      required
                      minLength={8}
                      placeholder="8 أحرف على الأقل"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: 12,
                        borderRadius: 11,
                        border:
                          "1px solid #cbd5e1",
                      }}
                    />
                  </label>
                )}

                <label>
                  <span
                    style={{
                      display: "block",
                      fontWeight: 800,
                      marginBottom: 6,
                    }}
                  >
                    نوع المستخدم
                  </span>

                  <select
                    value={role}
                    onChange={(event) =>
                      setRole(
                        event.target
                          .value as Exclude<
                          LabRole,
                          "owner"
                        >,
                      )
                    }
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: 12,
                      borderRadius: 11,
                      border:
                        "1px solid #cbd5e1",
                      background: "#fff",
                    }}
                  >
                    <option value="supervisor">
                      مشرف
                    </option>
                    <option value="technician">
                      فني
                    </option>
                    <option value="reviewer">
                      مراجع
                    </option>
                    <option value="viewer">
                      مشاهد
                    </option>
                  </select>
                </label>
              </div>

              {/* Permissions */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 14,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 900,
                  }}
                >
                  🔐 الصلاحيات
                </h3>

                <div
                  style={{
                    display: "flex",
                    gap: 7,
                  }}
                >
                  <button
                    type="button"
                    onClick={selectAll}
                    style={{
                      border: "1px solid #99f6e4",
                      background: "#f0fdfa",
                      color: "#0f766e",
                      borderRadius: 9,
                      padding: "7px 10px",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    تحديد الكل
                  </button>

                  <button
                    type="button"
                    onClick={clearAll}
                    style={{
                      border: "1px solid #e2e8f0",
                      background: "#fff",
                      color: "#475569",
                      borderRadius: 9,
                      padding: "7px 10px",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    إلغاء الكل
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 18,
                }}
              >
                {permissionGroups.map(
                  (group) => (
                    <section
                      key={group.title}
                      style={{
                        border:
                          "1px solid #e5e7eb",
                        borderRadius: 15,
                        padding: 13,
                      }}
                    >
                      <h4
                        style={{
                          margin:
                            "0 0 10px",
                          fontSize: 15,
                          fontWeight: 900,
                        }}
                      >
                        {group.title}
                      </h4>

                      <div
                        style={{
                          display: "grid",
                          gap: 8,
                        }}
                      >
                        {group.permissions.map(
                          (permission) => (
                            <PermissionCheckbox
                              key={permission}
                              permission={
                                permission
                              }
                              checked={
                                permissions[
                                  permission
                                ] === true
                              }
                              onChange={(
                                checked,
                              ) =>
                                togglePermission(
                                  permission,
                                  checked,
                                )
                              }
                            />
                          ),
                        )}
                      </div>
                    </section>
                  ),
                )}
              </div>

              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 20,
                }}
              >
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    border: 0,
                    borderRadius: 12,
                    padding: 13,
                    background: "#0f766e",
                    color: "#fff",
                    fontWeight: 900,
                    cursor: saving
                      ? "wait"
                      : "pointer",
                  }}
                >
                  {saving
                    ? "جاري الحفظ..."
                    : editingUser
                      ? "حفظ التعديلات"
                      : "إنشاء المستخدم"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  style={{
                    border:
                      "1px solid #cbd5e1",
                    borderRadius: 12,
                    padding: "13px 18px",
                    background: "#fff",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
