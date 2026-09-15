import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";
import { getSql } from "@/lib/db";

export const Route = createFileRoute("/api/mobile/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          // Verify the Better Auth session.
          // Supports the Authorization: Bearer <session-token>
          // header through the existing Better Auth bearer plugin.
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            return new Response(
              JSON.stringify({
                ok: false,
                error: "UNAUTHORIZED",
              }),
              {
                status: 401,
                headers: {
                  "Content-Type": "application/json",
                },
              },
            );
          }

          const userId = session.user.id;
          const sql = await getSql();

          // Check whether this user is a central admin.
          const admin = await sql<{
            id: string;
            name: string | null;
            email: string | null;
          }>`
            select u.id, u.name, u.email
            from "user" u
            inner join platform_admins pa
              on pa.auth_user_id = u.id
            where u.id = ${userId}
            limit 1
          `;

          if (admin.length) {
            return Response.json({
              ok: true,
              access: {
                type: "admin",
                userId,
                name: admin[0].name,
                email: admin[0].email,
              },
            });
          }

          // Check the user's active laboratory access.
          const lab = await sql<{
            lab_id: string;
            lab_name: string;
            username: string;
            role: string;
            phone: string | null;
            whatsapp: string | null;
            email: string | null;
            website: string | null;
            address: string | null;
            doctor_name: string | null;
            doctor_degree: string | null;
            doctor_specialty: string | null;
          }>`
            select
              l.id as lab_id,
              l.name as lab_name,
              lu.username,
              lu.role,
              l.phone,
              l.whatsapp,
              l.email,
              l.website,
              l.address,
              l.doctor_name,
              l.doctor_degree,
              l.doctor_specialty
            from lab_users lu
            inner join labs l
              on l.id = lu.lab_id
            where lu.auth_user_id = ${userId}
              and lu.is_active = true
              and l.is_active = true
            limit 1
          `;

          if (!lab.length) {
            return Response.json(
              {
                ok: false,
                error: "LAB_ACCESS_REQUIRED",
              },
              { status: 403 },
            );
          }

          const labData = lab[0];

          // Dashboard statistics.
          const statsRows = await sql<{
            patients: number;
            reportsToday: number;
            pendingReview: number;
            approved: number;
            critical: number;
          }>`
            select
              (
                select count(*)::int
                from patients
                where lab_id = ${labData.lab_id}
              ) as patients,

              (
                select count(*)::int
                from reports
                where lab_id = ${labData.lab_id}
                  and created_at::date = current_date
              ) as "reportsToday",

              (
                select count(*)::int
                from reports
                where lab_id = ${labData.lab_id}
                  and status = 'pending_review'
              ) as "pendingReview",

              (
                select count(*)::int
                from reports
                where lab_id = ${labData.lab_id}
                  and status = 'approved'
              ) as approved,

              (
                select count(*)::int
                from report_results rr
                inner join reports r
                  on r.id = rr.report_id
                where r.lab_id = ${labData.lab_id}
                  and rr.flag = 'critical'
              ) as critical
          `;

          const stats = statsRows[0] ?? {
            patients: 0,
            reportsToday: 0,
            pendingReview: 0,
            approved: 0,
            critical: 0,
          };

          return Response.json({
            ok: true,
            access: {
              type: "lab",
              userId,
              labId: labData.lab_id,
              labName: labData.lab_name,
              username: labData.username,
              role: labData.role,
            },
            lab: {
              id: labData.lab_id,
              name: labData.lab_name,
              phone: labData.phone,
              whatsapp: labData.whatsapp,
              email: labData.email,
              website: labData.website,
              address: labData.address,
              doctorName: labData.doctor_name,
              doctorDegree: labData.doctor_degree,
              doctorSpecialty: labData.doctor_specialty,
            },
            stats,
          });
        } catch (error) {
          console.error("Mobile /me error:", error);

          return Response.json(
            {
              ok: false,
              error: "SERVER_ERROR",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
