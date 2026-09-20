import { getHomeViewModel } from "@/features/home/application/get-home-view-model";
import { HomePage } from "@/features/home/presentation/components/HomePage";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/core/i18n/localized-text";

export default async function Home() {
  const viewModel = await getHomeViewModel(await getLocale() as Locale);

  return <HomePage viewModel={viewModel} />;
}
