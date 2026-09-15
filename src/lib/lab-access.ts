import { getDb } from "./db";
import { getCurrentUser } from "./auth/server";

export type LabProfileData = {
  id: string;
  name: string;
  name_en: string | null;
  logo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  doctor_name: string | null;
  doctor_degree: string | null;
  doctor_specialty: string | null;
  is_active: boolean;
  is_profile_complete: boolean;
};

export type LabStats = {
  patients: number;
  reports: number;
  pending: number;
  completed: number;
};

export type CurrentLabAccess = {
  userId: string;
  lab: LabProfileData | null;
  stats: LabStats;
};

export type UpdateLabProfileInput = {
  name?: string;
  nameEn?: string;
  logoUrl?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  address?: string;
  doctorName?: string;
  doctorDegree?: string;
  doctorSpecialty?: string;
};

function calculateProfileComplete(lab: LabProfileData): boolean {
  return Boolean(
    lab.name?.trim() &&
      lab.phone?.trim() &&
      lab.address?.trim() &&
      lab.doctor_name?.trim()
  );
}

export async function getCurrentLab(): Promise<LabProfileData | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const db = getDb();

  const result = await db.execute({
    sql: `
      select
        l.id,
        l.name,
        l.name_en,
        l.logo_url,
        l.phone,
        l.whatsapp,
        l.email,
        l.website,
        l.address,
        l.doctor_name,
        l.doctor_degree,
        l.doctor_specialty,
        l.is_active
      from lab_users lu
      inner join labs l on l.id = lu.lab_id
      where lu.user_id = ?
        and l.is_active = true
      limit 1
    `,
    args: [user.id],
  });

  const row = result.rows[0] as
    | {
        id: string;
        name: string;
        name_en: string | null;
        logo_url: string | null;
        phone: string | null;
        whatsapp: string | null;
        email: string | null;
        website: string | null;
        address: string | null;
        doctor_name: string | null;
        doctor_degree: string | null;
        doctor_specialty: string | null;
        is_active: boolean;
      }
    | undefined;

  if (!row) {
    return null;
  }

  const lab: LabProfileData = {
    ...row,
    is_profile_complete: false,
  };

  lab.is_profile_complete = calculateProfileComplete(lab);

  return lab;
}

export async function getCurrentLabStats(): Promise<LabStats> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      patients: 0,
      reports: 0,
      pending: 0,
      completed: 0,
    };
  }

  const db = getDb();

  const labResult = await db.execute({
    sql: `
      select lab_id
      from lab_users
      where user_id = ?
      limit 1
    `,
    args: [user.id],
  });

  const labRow = labResult.rows[0] as
    | {
        lab_id: string;
      }
    | undefined;

  if (!labRow) {
    return {
      patients: 0,
      reports: 0,
      pending: 0,
      completed: 0,
    };
  }

  const labId = labRow.lab_id;

  const patientsResult = await db.execute({
    sql: `
      select count(*) as count
      from patients
      where lab_id = ?
    `,
    args: [labId],
  });

  const reportsResult = await db.execute({
    sql: `
      select
        count(*) as total,
        sum(
          case
            when status = 'pending' then 1
            else 0
          end
        ) as pending,
        sum(
          case
            when status = 'completed'
              or status = 'approved'
            then 1
            else 0
          end
        ) as completed
      from lab_reports
      where lab_id = ?
    `,
    args: [labId],
  });

  const patientsRow = patientsResult.rows[0] as
    | {
        count: number | string;
      }
    | undefined;

  const reportsRow = reportsResult.rows[0] as
    | {
        total: number | string;
        pending: number | string;
        completed: number | string;
      }
    | undefined;

  return {
    patients: Number(patientsRow?.count ?? 0),
    reports: Number(reportsRow?.total ?? 0),
    pending: Number(reportsRow?.pending ?? 0),
    completed: Number(reportsRow?.completed ?? 0),
  };
}

export async function getCurrentLabAccess(): Promise<CurrentLabAccess> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      userId: "",
      lab: null,
      stats: {
        patients: 0,
        reports: 0,
        pending: 0,
        completed: 0,
      },
    };
  }

  const [lab, stats] = await Promise.all([
    getCurrentLab(),
    getCurrentLabStats(),
  ]);

  return {
    userId: user.id,
    lab,
    stats,
  };
}

export async function updateCurrentLabProfile(
  input: UpdateLabProfileInput
): Promise<LabProfileData | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const db = getDb();

  const labResult = await db.execute({
    sql: `
      select lab_id
      from lab_users
      where user_id = ?
      limit 1
    `,
    args: [user.id],
  });

  const labRow = labResult.rows[0] as
    | {
        lab_id: string;
      }
    | undefined;

  if (!labRow) {
    return null;
  }

  const current = await db.execute({
    sql: `
      select
        name,
        name_en,
        logo_url,
        phone,
        whatsapp,
        email,
        website,
        address,
        doctor_name,
        doctor_degree,
        doctor_specialty
      from labs
      where id = ?
      limit 1
    `,
    args: [labRow.lab_id],
  });

  const row = current.rows[0] as
    | {
        name: string;
        name_en: string | null;
        logo_url: string | null;
        phone: string | null;
        whatsapp: string | null;
        email: string | null;
        website: string | null;
        address: string | null;
        doctor_name: string | null;
        doctor_degree: string | null;
        doctor_specialty: string | null;
      }
    | undefined;

  if (!row) {
    return null;
  }

  const name = input.name ?? row.name;
  const nameEn = input.nameEn ?? row.name_en;
  const logoUrl = input.logoUrl ?? row.logo_url;
  const phone = input.phone ?? row.phone;
  const whatsapp = input.whatsapp ?? row.whatsapp;
  const email = input.email ?? row.email;
  const website = input.website ?? row.website;
  const address = input.address ?? row.address;
  const doctorName = input.doctorName ?? row.doctor_name;
  const doctorDegree = input.doctorDegree ?? row.doctor_degree;
  const doctorSpecialty =
    input.doctorSpecialty ?? row.doctor_specialty;

  await db.execute({
    sql: `
      update labs
      set
        name = ?,
        name_en = ?,
        logo_url = ?,
        phone = ?,
        whatsapp = ?,
        email = ?,
        website = ?,
        address = ?,
        doctor_name = ?,
        doctor_degree = ?,
        doctor_specialty = ?,
        updated_at = current_timestamp
      where id = ?
    `,
    args: [
      name.trim(),
      nameEn?.trim() || null,
      logoUrl?.trim() || null,
      phone?.trim() || null,
      whatsapp?.trim() || null,
      email?.trim() || null,
      website?.trim() || null,
      address?.trim() || null,
      doctorName?.trim() || null,
      doctorDegree?.trim() || null,
      doctorSpecialty?.trim() || null,
      labRow.lab_id,
    ],
  });

  return getCurrentLab();
}  doctorDegree?: string;
  doctorSpecialty?: string;
};

export const updateCurrentLabProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }: { context: { userId: string }; data: UpdateLabProfileInput }) => {
    const sql = await getSql();
    const name = data.name.trim();
    if (name.length < 2) throw new Error("اسم المعمل غير صالح");

    const rows = await sql<{ lab_id: string; role: string }>`
      select lab_id, role
      from lab_users
      where auth_user_id = ${context.userId}
        and is_active = true
      limit 1
    `;
    if (!rows.length) throw new Error("LAB_ACCESS_REQUIRED");
    if (rows[0].role !== "owner") throw new Error("OWNER_ACCESS_REQUIRED");

    await sql.query(
      `update labs
       set name=$1, name_en=$2, phone=$3, whatsapp=$4, email=$5, website=$6,
           address=$7, doctor_name=$8, doctor_degree=$9, doctor_specialty=$10,
           updated_at=current_timestamp
       where id=$11`,
      [
        name,
        data.nameEn?.trim() || null,
        data.phone?.trim() || null,
        data.whatsapp?.trim() || null,
        data.email?.trim() || null,
        data.website?.trim() || null,
        data.address?.trim() || null,
        data.doctorName?.trim() || null,
        data.doctorDegree?.trim() || null,
        data.doctorSpecialty?.trim() || null,
        rows[0].lab_id,
      ],
    );

    return { ok: true };
  });

export type LabDashboardStats = {
  patients: number;
  reportsToday: number;
  pendingReview: number;
  approved: number;
  critical: number;
};

export const getLabDashboardStats = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<LabDashboardStats> => {
    const sql = await getSql();
    const lab = await sql<{ lab_id: string }>`
      select lu.lab_id
      from lab_users lu
      inner join labs l on l.id = lu.lab_id
      where lu.auth_user_id = ${context.userId}
        and lu.is_active = true
        and l.is_active = true
      limit 1
    `;
    if (!lab.length) throw new Error("LAB_ACCESS_REQUIRED");
    const labId = lab[0].lab_id;

    const rows = await sql<LabDashboardStats>`
      select
        (select count(*)::int from patients where lab_id = ${labId}) as patients,
        (select count(*)::int from reports where lab_id = ${labId} and created_at::date = current_date) as "reportsToday",
        (select count(*)::int from reports where lab_id = ${labId} and status = 'pending_review') as "pendingReview",
        (select count(*)::int from reports where lab_id = ${labId} and status = 'approved') as approved,
        (select count(*)::int from report_results rr inner join reports r on r.id = rr.report_id where r.lab_id = ${labId} and rr.flag = 'critical') as critical
    `;
    return rows[0] ?? { patients: 0, reportsToday: 0, pendingReview: 0, approved: 0, critical: 0 };
  });
