"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-context";

/** Redireciona para /login quando não há sessão (após a reidratação). */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);
  return { user, loading };
}

const STAFF_ROLES = ["ADMIN", "ANALYST", "VIEWER"];

/** Exige sessão de equipe (admin/analista/visualizador) — candidato vai para /painel. */
export function useRequireStaff() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!STAFF_ROLES.includes(user.role)) router.replace("/painel");
  }, [loading, user, router]);
  return { user, loading };
}
