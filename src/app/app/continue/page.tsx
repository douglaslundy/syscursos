import { redirect } from "next/navigation";

import { getContinueLearningTarget } from "@/server/services/student-service";

export default async function ContinueLearningPage() {
  const href = await getContinueLearningTarget();
  redirect(href);
}
