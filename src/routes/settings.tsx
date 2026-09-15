import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { InstallBanner } from "@/components/install-banner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  getCurrentLab,
  updateCurrentLabProfile,
  type LabProfileData,
} from "@/lib/lab-access";

export const Route = createFileRoute("/settings")({
  loader: async () => {
    try {
      return {
        lab: await getCurrentLab(),
      };
    } catch {
      return {
        lab: null as LabProfileData | null,
      };
    }
  },

  component: SettingsPage,
});

function SettingsPage() {
  const { lab } = Route.useLoaderData();

  if (!lab) {
    return <Navigate to="/login" replace />;
  }

  return <SettingsForm lab={lab} />;
}

function SettingsForm({ lab }: { lab: LabProfileData }) {
  const [name, setName] = useState(lab.name);
  const [nameEn, setNameEn] = useState(lab.name_en ?? "");

  const [logoUrl, setLogoUrl] = useState(lab.logo_url ?? "");

  const [phone, setPhone] = useState(lab.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(lab.whatsapp ?? "");
  const [email, setEmail] = useState(lab.email ?? "");
  const [website, setWebsite] = useState(lab.website ?? "");
  const [address, setAddress] = useState(lab.address ?? "");

  const [doctorName, setDoctorName] = useState(lab.doctor_name ?? "");
  const [doctorDegree, setDoctorDegree] = useState(
    lab.doctor_degree ?? ""
  );
  const [doctorSpecialty, setDoctorSpecialty] = useState(
    lab.doctor_specialty ?? ""
  );

  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  async function save(e: import("react").FormEvent) {
    e.preventDefault();

    setSaving(true);

    try {
      await updateCurrentLabProfile({
        name,
        nameEn,
        logoUrl,
        phone,
        whatsapp,
        email,
        website,
        address,
        doctorName,
        doctorDegree,
        doctorSpecialty,
      });

      toast.success("تم حفظ بيانات المعمل بنجاح");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "تعذر حفظ بيانات المعمل"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoChange(
    event: import("react").ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("من فضلك اختر صورة فقط");
      return;
    }

    setUploadingLogo(true);

    try {
      const compressedImage = await compressLogo(file);

      setLogoUrl(compressedImage);

      toast.success("تم تحميل اللوجو، اضغط حفظ لتثبيته");
    } catch {
      toast.error("تعذر تحميل صورة اللوجو");
    } finally {
      setUploadingLogo(false);
    }
  }

  function removeLogo() {
    setLogoUrl("");
    toast.success("تم إزالة اللوجو، اضغط حفظ لتأكيد التغيير");
  }

  return (
    <AppShell>
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          المختبر
        </p>

        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          بيانات المعمل
        </h1>

        <p className="mt-2 max-w-xl text-sm text-ink-soft">
          البيانات دي خاصة بالمعمل نفسه وبتظهر تلقائيًا في التقارير
          المطبوعة.
        </p>
      </header>

      <form
        onSubmit={save}
        className="mx-auto max-w-3xl space-y-6 rounded-lg border border-line bg-elevated p-5 sm:p-7"
      >
        {/* Laboratory Logo */}
        <section className="rounded-xl border border-line bg-background p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              شعار المعمل
            </h2>

            <p className="mt-1 text-sm text-ink-soft">
              اللوجو ده هيظهر في تقارير المعمل الخاصة بيك.
            </p>
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {/* Logo Preview */}
            <div className="flex size-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-white">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`شعار ${name || "المعمل"}`}
                  className="h-full w-full object-contain p-3"
                />
              ) : (
                <div className="text-center text-sm text-muted">
                  <div className="text-3xl">🔬</div>
                  <div className="mt-1">بدون لوجو</div>
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-3">
              <label
                htmlFor="lab-logo"
                className="inline-flex w-fit cursor-pointer items-center justify-center rounded-md border border-line bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted/10"
              >
                {uploadingLogo
                  ? "جارٍ تجهيز الصورة…"
                  : "رفع لوجو المعمل"}

                <input
                  id="lab-logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  disabled={uploadingLogo}
                  className="hidden"
                />
              </label>

              {logoUrl && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={removeLogo}
                  className="w-fit"
                >
                  إزالة اللوجو
                </Button>
              )}

              <p className="text-xs text-muted">
                يفضل استخدام صورة واضحة بخلفية شفافة أو بيضاء.
              </p>
            </div>
          </div>
        </section>

        {/* Basic Information */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              البيانات الأساسية
            </h2>

            <p className="mt-1 text-sm text-ink-soft">
              البيانات التي تظهر في رأس التقرير.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="اسم المعمل"
              value={name}
              onChange={setName}
              required
            />

            <Field
              label="الاسم الإنجليزي"
              value={nameEn}
              onChange={setNameEn}
              dir="ltr"
            />
          </div>
        </section>

        {/* Contact */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">
            بيانات التواصل
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="الهاتف"
              value={phone}
              onChange={setPhone}
              dir="ltr"
            />

            <Field
              label="واتساب"
              value={whatsapp}
              onChange={setWhatsapp}
              dir="ltr"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="البريد الإلكتروني"
              value={email}
              onChange={setEmail}
              dir="ltr"
            />

            <Field
              label="الموقع الإلكتروني"
              value={website}
              onChange={setWebsite}
              dir="ltr"
            />
          </div>

          <div>
            <Label>العنوان</Label>

            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="عنوان المعمل"
            />
          </div>
        </section>

        {/* Doctor */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">
            بيانات الطبيب المسؤول
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="اسم الطبيب المسؤول"
              value={doctorName}
              onChange={setDoctorName}
            />

            <Field
              label="الدرجة / الشهادة"
              value={doctorDegree}
              onChange={setDoctorDegree}
            />
          </div>

          <Field
            label="التخصص"
            value={doctorSpecialty}
            onChange={setDoctorSpecialty}
          />
        </section>

        {/* Save */}
        <div className="flex flex-wrap gap-3 border-t border-line pt-5">
          <Button type="submit" disabled={saving || uploadingLogo}>
            {saving
              ? "جارٍ الحفظ…"
              : "حفظ بيانات المعمل"}
          </Button>
        </div>
      </form>

      <InstallBanner />
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  dir,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  dir?: "ltr" | "rtl";
  required?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>

      <Input
        dir={dir}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

/**
 * Resize and compress the uploaded laboratory logo.
 *
 * This keeps the image small enough to store in the database
 * while preserving good quality for the laboratory report.
 */
function compressLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("Failed to read image"));
    };

    reader.onload = () => {
      const image = new Image();

      image.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      image.onload = () => {
        const maxSize = 600;

        let width = image.width;
        let height = image.height;

        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(
            maxSize / width,
            maxSize / height
          );

          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Canvas is not supported"));
          return;
        }

        context.clearRect(0, 0, width, height);

        context.drawImage(
          image,
          0,
          0,
          width,
          height
        );

        const result = canvas.toDataURL(
          "image/webp",
          0.85
        );

        resolve(result);
      };

      image.src = String(reader.result);
    };

    reader.readAsDataURL(file);
  });
}
