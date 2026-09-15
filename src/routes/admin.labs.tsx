import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Edit3,
  Plus,
  Power,
  RotateCcw,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  isPlatformAdmin,
  createLab,
  listAdminLabs,
  updateAdminLab,
  disableAdminLab,
  enableAdminLab,
  deleteAdminLab,
  type AdminLab,
} from "@/lib/platform-admin";

export const Route = createFileRoute("/admin/labs")({
  loader: async () => {
    try {
      const [isAdmin, labs] = await Promise.all([
        isPlatformAdmin(),
        listAdminLabs(),
      ]);

      return {
        isAdmin,
        labs,
      };
    } catch {
      return {
        isAdmin: false,
        labs: [] as AdminLab[],
      };
    }
  },

  component: AdminLabs,
});

function AdminLabs() {
  const { isAdmin, labs: initialLabs } = Route.useLoaderData();

  const [labs, setLabs] = useState<AdminLab[]>(initialLabs);

  const [showForm, setShowForm] = useState(initialLabs.length === 0);

  const [editingLab, setEditingLab] = useState<AdminLab | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [doctorName, setDoctorName] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);
  const [actionLabId, setActionLabId] = useState<string | null>(null);

  useEffect(() => {
    setLabs(initialLabs);
  }, [initialLabs]);

  if (!isAdmin) {
    return <Navigate to="/login" />;
  }

  function resetForm() {
    setEditingLab(null);

    setUsername("");
    setPassword("");

    setName("");
    setNameEn("");
    setPhone("");
    setAddress("");
    setDoctorName("");

    setError("");
  }

  function closeForm() {
    resetForm();
    setShowForm(false);
  }

  function startCreate() {
    resetForm();
    setShowForm(true);
    setSuccess("");
  }

  function startEdit(lab: AdminLab) {
    setEditingLab(lab);

    setName(lab.name || "");
    setNameEn(lab.nameEn || "");
    setPhone(lab.phone || "");
    setAddress(lab.address || "");
    setDoctorName(lab.doctorName || "");

    setUsername(lab.username || "");
    setPassword("");

    setError("");
    setSuccess("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      /* =====================================================
         UPDATE
      ===================================================== */

      if (editingLab) {
        await updateAdminLab({
          data: {
            labId: editingLab.id,
            name,
            nameEn,
            phone,
            address,
            doctorName,
          },
        });

        setLabs((current) =>
          current.map((lab) =>
            lab.id === editingLab.id
              ? {
                  ...lab,
                  name,
                  nameEn: nameEn || null,
                  phone: phone || null,
                  address: address || null,
                  doctorName: doctorName || null,
                }
              : lab,
          ),
        );

        setSuccess("تم تعديل بيانات المعمل بنجاح ✅");

        closeForm();

        return;
      }

      /* =====================================================
         CREATE
      ===================================================== */

      const result = await createLab({
        data: {
          name,
          nameEn,
          username,
          password,
          phone,
          address,
          doctorName,
        },
      });

      const newLab: AdminLab = {
        id: result.id,
        name: result.name,
        nameEn: nameEn || null,
        username: result.username,
        phone: phone || null,
        address: address || null,
        doctorName: doctorName || null,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      setLabs((current) => [newLab, ...current]);

      setSuccess(
        `تم إنشاء حساب المعمل بنجاح — اسم المستخدم: ${result.username}`,
      );

      closeForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تنفيذ العملية",
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     DISABLE
  ======================================================= */

  async function handleDisable(lab: AdminLab) {
    const confirmed = window.confirm(
      `هل أنت متأكد من تعطيل "${lab.name}"؟\n\nلن يستطيع مستخدمو المعمل تسجيل الدخول حتى يتم تفعيله مرة أخرى.`,
    );

    if (!confirmed) return;

    setActionLabId(lab.id);
    setError("");
    setSuccess("");

    try {
      await disableAdminLab({
        data: {
          labId: lab.id,
        },
      });

      setLabs((current) =>
        current.map((item) =>
          item.id === lab.id
            ? {
                ...item,
                isActive: false,
              }
            : item,
        ),
      );

      setSuccess(`تم تعطيل ${lab.name} 🔒`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "تعذر تعطيل المعمل",
      );
    } finally {
      setActionLabId(null);
    }
  }

  /* =======================================================
     ENABLE
  ======================================================= */

  async function handleEnable(lab: AdminLab) {
    setActionLabId(lab.id);
    setError("");
    setSuccess("");

    try {
      await enableAdminLab({
        data: {
          labId: lab.id,
        },
      });

      setLabs((current) =>
        current.map((item) =>
          item.id === lab.id
            ? {
                ...item,
                isActive: true,
              }
            : item,
        ),
      );

      setSuccess(`تم إعادة تفعيل ${lab.name} 🔓`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "تعذر إعادة تفعيل المعمل",
      );
    } finally {
      setActionLabId(null);
    }
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function handleDelete(lab: AdminLab) {
    const confirmed = window.confirm(
      `⚠️ تحذير مهم\n\nهل أنت متأكد من حذف "${lab.name}" نهائيًا؟\n\nالحذف لا يمكن التراجع عنه.\n\nإذا كان المعمل يحتوي على مرضى أو تقارير، سيمنع النظام الحذف تلقائيًا.`,
    );

    if (!confirmed) return;

    setActionLabId(lab.id);
    setError("");
    setSuccess("");

    try {
      await deleteAdminLab({
        data: {
          labId: lab.id,
        },
      });

      setLabs((current) =>
        current.filter((item) => item.id !== lab.id),
      );

      setSuccess(`تم حذف ${lab.name} نهائيًا 🗑️`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "تعذر حذف المعمل",
      );
    } finally {
      setActionLabId(null);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-paper"
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="border-b border-line bg-elevated">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
              Central administration
            </p>

            <h1 className="mt-1 font-display text-xl font-semibold">
              إدارة المعامل 🏥
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-paper/60">
                Laboratory network
              </p>

              <h2 className="mt-2 font-display text-3xl font-semibold">
                إدارة شبكة المعامل الطبية
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-paper/65">
                من هنا تقدر تضيف المعامل وتعدل بياناتها وتتحكم في
                حالة الحسابات. كل العمليات محمية بصلاحيات المدير المركزي.
              </p>
            </div>

            <div className="hidden size-12 place-items-center rounded-xl bg-teal/15 text-teal sm:grid">
              <Building2 className="size-6" />
            </div>
          </div>
        </section>

        {/* =================================================
            SUCCESS
        ================================================= */}

        {success ? (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-ok/20 bg-ok/5 p-4 text-sm">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" />

            <div>
              <p className="font-medium">
                تمت العملية بنجاح ✅
              </p>

              <p className="mt-1 text-muted">
                {success}
              </p>
            </div>
          </div>
        ) : null}

        {/* =================================================
            ERROR
        ================================================= */}

        {error ? (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-high/20 bg-high/5 p-4 text-sm text-high">
            <X className="mt-0.5 size-5 shrink-0" />

            <div>
              <p className="font-semibold">
                لم تتم العملية
              </p>

              <p className="mt-1">
                {error}
              </p>
            </div>
          </div>
        ) : null}

        {/* =================================================
            LABS
        ================================================= */}

        <section className="mt-6 rounded-xl border border-line bg-elevated p-5 shadow-sm sm:p-6">

          <div className="flex flex-wrap items-center justify-between gap-3">

            <div>
              <h3 className="font-display text-xl font-semibold">
                المعامل الحالية
              </h3>

              <p className="mt-1 text-sm text-muted">
                {labs.length} معمل مسجل
              </p>
            </div>

            <Button
              type="button"
              onClick={startCreate}
            >
              <Plus className="size-4" />
              إضافة معمل
            </Button>

          </div>

          {/* =================================================
              LAB LIST
          ================================================= */}

          <div className="mt-5 space-y-3">

            {labs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line px-4 py-10 text-center">

                <div className="mx-auto grid size-12 place-items-center rounded-xl bg-teal/10 text-teal">
                  <Building2 className="size-6" />
                </div>

                <p className="mt-4 font-medium">
                  لسه مفيش معامل
                </p>

                <p className="mt-1 text-sm text-muted">
                  أضف أول معمل من زر «إضافة معمل».
                </p>

              </div>
            ) : (
              labs.map((lab) => {

                const busy = actionLabId === lab.id;

                return (
                  <div
                    key={lab.id}
                    className={`rounded-xl border p-4 transition ${
                      lab.isActive
                        ? "border-line"
                        : "border-amber-300/50 bg-amber-50/40"
                    }`}
                  >

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                      {/* LAB INFO */}

                      <div className="flex min-w-0 items-start gap-3">

                        <div
                          className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                            lab.isActive
                              ? "bg-teal/10 text-teal"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          <Building2 className="size-5" />
                        </div>

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <p className="font-semibold">
                              {lab.name}
                            </p>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                lab.isActive
                                  ? "bg-ok/10 text-ok"
                                  : "bg-amber-500/10 text-amber-700"
                              }`}
                            >
                              {lab.isActive
                                ? "نشط"
                                : "معطل"}
                            </span>

                            {lab.phone && lab.address ? (
                              <span className="rounded-full bg-ok/5 px-2.5 py-1 text-[11px] text-ok">
                                بيانات مكتملة
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-700">
                                بيانات ناقصة
                              </span>
                            )}

                          </div>

                          <div className="mt-2 space-y-1 text-xs text-muted">

                            <p>
                              اسم المستخدم:
                              {" "}
                              <span dir="ltr">
                                {lab.username || "—"}
                              </span>
                            </p>

                            {lab.phone ? (
                              <p>
                                الهاتف: {lab.phone}
                              </p>
                            ) : null}

                            {lab.address ? (
                              <p>
                                العنوان: {lab.address}
                              </p>
                            ) : null}

                            {lab.doctorName ? (
                              <p>
                                مدير المعمل: {lab.doctorName}
                              </p>
                            ) : null}

                          </div>

                        </div>
                      </div>

                      {/* ACTIONS */}

                      <div className="flex flex-wrap gap-2">

                        {/* EDIT */}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => startEdit(lab)}
                        >
                          <Edit3 className="size-4" />
                          تعديل
                        </Button>

                        {/* ENABLE / DISABLE */}

                        {lab.isActive ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => handleDisable(lab)}
                          >
                            <Power className="size-4" />
                            {busy ? "جارٍ..." : "تعطيل"}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => handleEnable(lab)}
                          >
                            <RotateCcw className="size-4" />
                            {busy ? "جارٍ..." : "تفعيل"}
                          </Button>
                        )}

                        {/* DELETE */}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => handleDelete(lab)}
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="size-4" />
                          {busy ? "جارٍ..." : "حذف"}
                        </Button>

                      </div>

                    </div>
                  </div>
                );
              })
            )}

          </div>
        </section>

        {/* =================================================
            FORM
        ================================================= */}

        {showForm ? (
          <section className="mt-6 rounded-xl border border-line bg-elevated p-5 shadow-sm sm:p-6">

            <div className="mb-6 flex items-start justify-between gap-4">

              <div className="flex items-center gap-3">

                <div className="grid size-10 place-items-center rounded-lg bg-teal/10 text-teal">
                  {editingLab ? (
                    <Edit3 className="size-5" />
                  ) : (
                    <ShieldCheck className="size-5" />
                  )}
                </div>

                <div>

                  <h3 className="font-display text-xl font-semibold">
                    {editingLab
                      ? "تعديل بيانات المعمل"
                      : "إضافة معمل جديد"}
                  </h3>

                  <p className="text-sm text-muted">
                    {editingLab
                      ? "عدّل بيانات المعمل ثم احفظ التغييرات."
                      : "أنشئ حساب المعمل وبياناته الأساسية."}
                  </p>

                </div>

              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeForm}
              >
                <X className="size-4" />
                إغلاق
              </Button>

            </div>

            <form
              onSubmit={submit}
              className="space-y-5"
            >

              {/* BASIC DATA */}

              <div className="rounded-xl border border-line bg-paper/50 p-4">

                <h4 className="font-semibold">
                  بيانات المعمل 🏥
                </h4>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">

                  <Field
                    id="lab-name"
                    label="اسم المعمل"
                    value={name}
                    onChange={setName}
                    required
                    placeholder="مثال: معمل النور للتحاليل"
                  />

                  <Field
                    id="lab-name-en"
                    label="اسم المعمل بالإنجليزية"
                    value={nameEn}
                    onChange={setNameEn}
                    placeholder="Noor Laboratory"
                    dir="ltr"
                  />

                  <Field
                    id="lab-phone"
                    label="رقم الهاتف"
                    value={phone}
                    onChange={setPhone}
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                  />

                  <Field
                    id="lab-doctor"
                    label="مدير / طبيب المعمل"
                    value={doctorName}
                    onChange={setDoctorName}
                    placeholder="د/ ..."
                  />

                  <div className="sm:col-span-2">
                    <Field
                      id="lab-address"
                      label="عنوان المعمل"
                      value={address}
                      onChange={setAddress}
                      placeholder="العنوان بالتفصيل"
                    />
                  </div>

                </div>

              </div>

              {/* LOGIN DATA */}

              {!editingLab ? (
                <div className="rounded-xl border border-teal/20 bg-teal/5 p-4">

                  <h4 className="font-semibold">
                    بيانات الدخول 🔐
                  </h4>

                  <p className="mt-1 text-sm leading-6 text-muted">
                    البيانات دي هي اللي هيستخدمها المعمل لتسجيل الدخول.
                  </p>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">

                    <Field
                      id="username"
                      label="اسم المستخدم"
                      value={username}
                      onChange={setUsername}
                      required
                      placeholder="noor_lab"
                      dir="ltr"
                    />

                    <Field
                      id="password"
                      label="كلمة المرور"
                      value={password}
                      onChange={setPassword}
                      required
                      type="password"
                      minLength={8}
                      placeholder="8 أحرف على الأقل"
                      dir="ltr"
                    />

                  </div>

                </div>
              ) : (
                <div className="rounded-xl border border-line bg-paper/50 p-4">

                  <p className="text-sm text-muted">
                    اسم المستخدم الحالي:
                    {" "}
                    <strong dir="ltr">
                      {editingLab.username || "—"}
                    </strong>
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    تغيير كلمة المرور وإدارة مستخدمي المعمل هنضيفها
                    في قسم «المستخدمون والصلاحيات» القادم.
                  </p>

                </div>
              )}

              {/* ERROR */}

              {error ? (
                <div className="rounded-lg border border-high/20 bg-high/5 px-4 py-3 text-sm text-high">
                  {error}
                </div>
              ) : null}

              {/* BUTTONS */}

              <div className="flex flex-wrap gap-3 pt-2">

                <Button
                  type="submit"
                  size="lg"
                  disabled={loading}
                >
                  {loading
                    ? "جارٍ الحفظ..."
                    : editingLab
                      ? "حفظ التعديلات"
                      : "إنشاء المعمل"}
                </Button>

                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={closeForm}
                  disabled={loading}
                >
                  إلغاء
                </Button>

              </div>

            </form>

          </section>
        ) : null}

      </div>
    </main>
  );
}

/* ===========================================================
   FIELD
=========================================================== */

function Field({
  id,
  label,
  value,
  onChange,
  required,
  placeholder,
  dir,
  type = "text",
  minLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  type?: string;
  minLength?: number;
}) {
  return (
    <div className="space-y-1.5">

      <Label htmlFor={id}>
        {label}
      </Label>

      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        dir={dir}
      />

    </div>
  );
}
