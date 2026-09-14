import { ArrowDown, ArrowUp, FlaskConical, TriangleAlert } from "lucide-react";
import { interpretResult, isCritical, parseValue, type Flag } from "@/lib/medical";
import { getNormalRange } from "@/lib/tests-catalog";
import { defaultLab, type LabProfile, type Report, type SavedTest } from "@/lib/store";
import { cn, formatSlashDate, visitIdFrom } from "@/lib/utils";

function groupTests(report: Report) {
  const groups: { en: string; ar: string; tests: SavedTest[] }[] = [];
  const index = new Map<string, number>();
  for (const test of report.tests) {
    const key = test.categoryEn;
    let i = index.get(key);
    if (i == null) {
      i = groups.length;
      index.set(key, i);
      groups.push({ en: test.categoryEn, ar: test.categoryAr, tests: [] });
    }
    groups[i].tests.push(test);
  }
  return groups;
}

function profileTitle(en: string) {
  if (en === "Diabetes") return "Diabetes Profile";
  if (en === "Complete Blood Count") return "Anemia Profile";
  if (en === "Liver Functions") return "Liver Functions Profile";
  if (en === "Kidney Functions") return "Kidney Functions Profile";
  if (en === "Lipid Profile") return "Lipid Profile";
  if (en === "Thyroid") return "Thyroid Profile";
  return `${en} Profile`;
}

function isGlucose(name: string) {
  return /glucose|fbs/i.test(name);
}

export function PrintView({
  report,
  lab,
}: {
  report: Report;
  lab: LabProfile;
  interactive?: boolean;
}) {
  const brand = { ...defaultLab, ...lab };
  const groups = groupTests(report);
  const sex = report.gender === "أنثى" ? "Female" : "Male";
  const visit = visitIdFrom(report.id);
  const printed = formatSlashDate(new Date().toISOString());
  const requested = formatSlashDate(report.createdAt);

  return (
    <article
      dir="ltr"
      className="print-sheet lab-sheet relative mx-auto w-full max-w-4xl overflow-hidden bg-elevated text-ink shadow-[var(--shadow-sheet)]"
    >
      <div className="lab-corner" aria-hidden>
        <span className="lab-corner-navy" />
        <span className="lab-corner-red" />
      </div>

      <header className="lab-header">
        <div className="flex items-center gap-3">
          <span className="lab-logo" aria-hidden>
            <FlaskConical className="size-6" />
          </span>
          <div>
            <p className="font-display text-xl font-semibold leading-tight sm:text-2xl">{brand.name}</p>
            <p className="text-[0.68rem] font-medium tracking-[0.18em] text-teal uppercase">{brand.nameEn}</p>
            {brand.doctorSpecialty ? <p className="mt-1 text-xs text-muted">{brand.doctorSpecialty}</p> : null}
          </div>
        </div>
        <div dir="rtl" className="text-end text-xs leading-relaxed text-ink-soft">
          <p className="font-semibold text-ink">{brand.name}</p>
          {brand.address ? <p>{brand.address}</p> : null}
          {brand.phone ? <p dir="ltr">{brand.phone}</p> : null}
        </div>
      </header>

      <div className="lab-titlebar">
        <div>
          <p className="font-display text-lg font-semibold tracking-[0.12em] sm:text-xl">LABORATORY REPORT</p>
          <p className="text-[0.65rem] font-medium tracking-[0.2em] text-muted uppercase">Clinical Laboratory Medicine</p>
        </div>
        <div dir="rtl" className="text-end">
          <p className="font-semibold">تقرير نتائج التحاليل الطبية</p>
          <p className="text-[0.65rem] text-muted">نتائج سريرية — للاستخدام الطبي</p>
        </div>
      </div>

      <div className="lab-patient-grid mt-5">
        <InfoCell label="Patient Name / اسم المريض" value={report.patientName} rtl />
        <InfoCell label="Patient Code / كود المريض" value={report.patientCode || "—"} mono />
        <InfoCell label="Age / Sex" value={`${report.age} Years / ${sex}`} />
        <InfoCell label="Phone / الهاتف" value={report.phone || "—"} mono />
        <InfoCell label="Referred By / الطبيب" value={report.doctor || "—"} rtl />
        <InfoCell label="National ID / الرقم القومي" value={report.nationalId || "—"} mono />
        <InfoCell label="Request Date / تاريخ الطلب" value={requested} />
        <InfoCell label="Report ID / رقم التقرير" value={visit} mono />
        <InfoCell label="Sample ID / رقم العينة" value={report.sampleId || "—"} mono />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-ink" />
        <h2 className="font-display text-lg font-semibold tracking-[0.16em] sm:text-xl">CLINICAL CHEMISTRY</h2>
        <span className="h-px flex-1 bg-ink" />
      </div>

      <div className="mt-6 space-y-6">
        {groups.map((group) => (
          <section key={group.en}>
            <div className="lab-section-heading">
              <span>{group.ar}</span>
              <span>{profileTitle(group.en)}</span>
            </div>
            <div className="lab-scroll">
            <table className="lab-grid w-full text-sm">
              <thead>
                <tr>
                  <th className="w-[34%]">Test / التحليل</th>
                  <th className="w-[13%]">Result / النتيجة</th>
                  <th className="w-[8%]">Flag</th>
                  <th className="w-[12%]">Unit</th>
                  <th>Reference Interval / المدى المرجعي</th>
                </tr>
              </thead>
              <tbody>
                {group.tests.map((test) => {
                  const range = test.customRange || getNormalRange(test.name, report.gender);
                  const interp = interpretResult(
                    test.name,
                    test.value,
                    report.gender,
                    test.customRange,
                  );
                  const critical = isCritical(test.name, test.value);
                  const glucose = isGlucose(test.name);
                  return (
                    <tr key={`${test.categoryId}-${test.name}`}>
                      <td className="font-medium">
                        <span className="block">{displayName(test.name)}</span>
                        <span dir="rtl" className="mt-0.5 block text-[0.68rem] font-normal text-muted">{arabicName(test.name)}</span>
                        {test.calculated ? (
                          <span className="ms-1 text-[0.6rem] font-normal uppercase text-muted">calculated</span>
                        ) : null}
                      </td>
                      <td className={cn("tabular-nums font-semibold", resultTone(interp.flag, critical))}>
                        {test.value}
                      </td>
                      <td>
                        <FlagMark flag={interp.flag} critical={critical} />
                      </td>
                      <td className="text-ink-soft">{test.unit || "—"}</td>
                      <td className="text-xs">
                        {glucose ? (
                          <AdaGlucoseRange value={test.value} />
                        ) : (
                          <span>
                            {rangeLabel(test.name, range, report.gender)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </section>
        ))}
      </div>

      {report.notes ? (
        <p className="mt-5 border border-ink px-3 py-2 text-sm">
          <span className="font-semibold">Notes: </span>
          {report.notes}
        </p>
      ) : null}

      <div className="mt-8 flex items-end justify-between gap-4">
        <div className="text-xs leading-relaxed text-ink-soft">
          <p className="font-medium text-ink">Flag Meaning:</p>
          <p className="mt-1 inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Normal</span>
            <span className="inline-flex items-center gap-1 text-high">
              <ArrowUp className="size-3.5" /> Abnormal High
            </span>
            <span className="inline-flex items-center gap-1 text-high">
              <ArrowDown className="size-3.5" /> Abnormal Low
            </span>
            <span className="inline-flex items-center gap-1 text-high">
              <TriangleAlert className="size-3.5" /> Critical
            </span>
          </p>
        </div>
        <div className="text-end">
          {report.status === "approved" ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ok">Approved / معتمد</p> : null}
          <p className="font-display text-base italic text-ink">{brand.doctorName}</p>
          <p className="text-sm font-semibold">Lab. Director</p>
          <p className="text-xs text-muted">{brand.doctorDegree}</p>
        </div>
      </div>

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-ink pt-3 text-xs text-ink-soft">
        {brand.website ? <span>{brand.website}</span> : <span>{brand.address}</span>}
        {brand.phone ? <span dir="ltr">{brand.phone}</span> : null}
        {brand.email ? <span>{brand.email}</span> : null}
      </footer>
    </article>
  );
}

function InfoCell({ label, value, rtl = false, mono = false }: { label: string; value: string; rtl?: boolean; mono?: boolean }) {
  return (
    <div className="lab-info-cell">
      <span className="lab-info-label">{label}</span>
      <span dir={rtl ? "rtl" : "ltr"} className={cn("lab-info-value", mono && "font-mono tabular-nums")}>
        {value || "—"}
      </span>
    </div>
  );
}

function arabicName(name: string) {
  const names: Record<string, string> = {
    "Fasting Glucose": "سكر صائم",
    "HbA1c": "الهيموجلوبين السكري",
    "SGPT (ALT)": "إنزيم ALT — وظائف الكبد",
    "SGOT (AST)": "إنزيم AST — وظائف الكبد",
    "ALP": "الفوسفاتاز القلوي",
    "Total Bilirubin": "البيليروبين الكلي",
    Albumin: "الألبومين",
    Creatinine: "الكرياتينين",
    Urea: "اليوريا",
    "Uric Acid": "حمض اليوريك",
    Hemoglobin: "الهيموجلوبين",
    WBCs: "كرات الدم البيضاء",
    RBCs: "كرات الدم الحمراء",
    Platelets: "الصفائح الدموية",
    TSH: "الهرمون المنبه للغدة الدرقية",
    "Free T4": "الثيروكسين الحر",
    "Free T3": "ثلاثي يودوثيرونين الحر",
    "Vitamin D": "فيتامين د",
    "Vitamin B12": "فيتامين ب12",
    Ferritin: "الفيريتين",
    Iron: "الحديد",
    "Total Cholesterol": "الكوليسترول الكلي",
    Triglycerides: "الدهون الثلاثية",
    HDL: "الكوليسترول عالي الكثافة HDL",
    LDL: "الكوليسترول منخفض الكثافة LDL",
  };
  return names[name] || name;
}

function displayName(name: string) {
  if (name === "SGPT (ALT)") return "Alanine Aminotransferase (ALT / s.GPT)";
  if (name === "SGOT (AST)") return "Aspartate Aminotransferase (AST / s.GOT)";
  if (name === "Fasting Glucose") return "Fasting Blood Sugar (FBS)";
  if (name === "Hemoglobin") return "Hemoglobin (Hb)";
  return name;
}

function rangeLabel(name: string, range: string, gender: "ذكر" | "أنثى") {
  const sex = gender === "أنثى" ? "Female" : "Male";
  if (name === "Hemoglobin") {
    return (
      <span>
        {range.replace("حتى", "Up to")}
        <span className="mt-0.5 block text-muted">(for Age & Sex · {sex})</span>
      </span>
    );
  }
  if (range.startsWith("حتى")) return `Up to ${range.replace("حتى", "").trim()}`;
  if (range.startsWith("أقل من")) return `Less than ${range.replace("أقل من", "").trim()}`;
  if (range.startsWith("أكثر من")) return `More than ${range.replace("أكثر من", "").trim()}`;
  return range;
}

function AdaGlucoseRange({ value }: { value: string }) {
  const n = parseValue(value);
  const band = n == null ? "" : n < 100 ? "ok" : n <= 125 ? "pre" : "dm";
  return (
    <table className="lab-nested w-full">
      <tbody>
        <tr className={band === "ok" ? "lab-band-ok" : undefined}>
          <td>Less than 100</td>
          <td>Non-Diabetic</td>
        </tr>
        <tr className={band === "pre" ? "lab-band-pre" : undefined}>
          <td>100 – 125</td>
          <td>Pre-Diabetic</td>
        </tr>
        <tr className={band === "dm" ? "lab-band-dm" : undefined}>
          <td>More than 125</td>
          <td>Diabetic (must be confirmed)</td>
        </tr>
      </tbody>
    </table>
  );
}

function FlagMark({ flag, critical }: { flag: Flag; critical: boolean }) {
  if (critical) {
    return (
      <span className="inline-flex items-center gap-0.5 text-high" title="Critical">
        {flag === "high" ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
        <TriangleAlert className="size-4" />
      </span>
    );
  }
  if (flag === "high" || flag === "abnormal") {
    return <ArrowUp className="size-4 text-high" aria-label="Abnormal High" />;
  }
  if (flag === "low") {
    return <ArrowDown className="size-4 text-high" aria-label="Abnormal Low" />;
  }
  return <span className="text-muted">—</span>;
}

function resultTone(flag: Flag, critical: boolean) {
  if (critical || flag === "high" || flag === "abnormal" || flag === "low") return "text-high";
  return "text-ink";
}
