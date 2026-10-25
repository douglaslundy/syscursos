import { requireFeature } from "@/server/services/feature-service";

export default async function FeatureLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireFeature("review");

  return children;
}
