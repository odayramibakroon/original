import { authorizeAdminPage } from "@/features/admin/application/authorize-page";
import { AccountSettings } from "@/features/account/presentation/AccountSettings";

export default async function AccountPage() {
  const admin = await authorizeAdminPage("/admin/account");
  return <AccountSettings uid={admin.uid} email={admin.email} />;
}
