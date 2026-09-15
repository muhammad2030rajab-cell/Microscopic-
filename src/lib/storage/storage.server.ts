import { createServerFn } from '@tanstack/react-start';
import { authMiddleware } from '@/lib/auth/middleware';
import { getSql } from '@/lib/db';
import { assertPlatformAdmin } from '@/lib/storage/storage-permissions.server';
import { ensureLabDriveFolders, getLabDriveStorage, isGoogleDriveConfigured } from './google-drive.server';

export const getDriveStatus = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await assertPlatformAdmin(context.userId);
    const labs = await sql<{ id: string; name: string; is_active: boolean }>`
      select id, name, is_active
      from labs
      order by created_at asc
    `;

    const storage = await Promise.all(
      labs.map(async (lab) => ({
        labId: lab.id,
        labName: lab.name,
        isActive: lab.is_active,
        storage: await getLabDriveStorage(lab.id),
      })),
    );

    return {
      configured: isGoogleDriveConfigured(),
      labs: storage,
    };
  });

export const initializeLabDrive = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async ({ context, data }: { context: { userId: string }; data: { labId: string } }) => {
    const sql = await assertPlatformAdmin(context.userId);
    const labs = await sql<{ id: string; name: string }>`
      select id, name from labs where id = ${data.labId} limit 1
    `;
    if (!labs.length) throw new Error('LAB_NOT_FOUND');

    return ensureLabDriveFolders(labs[0].id, labs[0].name);
  });
