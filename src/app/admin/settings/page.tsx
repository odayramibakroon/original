import { SiteEditorPage } from "@/features/site-settings/presentation/SiteEditorPage";
import { OperationalSettingsPage } from "@/features/site-settings/presentation/OperationalSettingsPage";
export default function Settings() { return <><SiteEditorPage section="settings" path="/admin/settings" /><OperationalSettingsPage /></>; }
