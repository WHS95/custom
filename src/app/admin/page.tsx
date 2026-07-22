import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth/admin-auth';

export default async function AdminIndex() {
  const session = await getCurrentAdmin();
  if (!session) {
    redirect('/admin/login');
  }
  redirect(`/admin/${session.tenantSlug}/dashboard`);
}
