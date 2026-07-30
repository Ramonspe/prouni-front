"use client";

import { useQuery } from "@tanstack/react-query";
import { applicationsApi } from "./api";

export function useCandidateApplication(
  applicationId: string | null | undefined,
  enabled = true,
) {
  const applications = useQuery({
    queryKey: ["applications", "mine"],
    queryFn: applicationsApi.list,
    enabled,
  });
  const explicitId = applicationId?.trim() || null;
  const items = applications.data ?? [];
  const selected = explicitId
    ? items.find((application) => application.id === explicitId)
    : items.length === 1
      ? items[0]
      : undefined;

  return {
    ...applications,
    applications: items,
    application: selected,
    explicitId,
    requiresSelection:
      !applications.isLoading && !applications.isError && !explicitId && items.length > 1,
    notFound:
      !applications.isLoading &&
      !applications.isError &&
      Boolean(explicitId) &&
      !selected,
  };
}
