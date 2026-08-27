import { describe, expect, it } from "vitest";
import { canManageSchedule, hasSystemPermission } from "./permissions";

describe("permissões da sessão", () => {
  it("trata o acesso do administrador como implícito", () => {
    expect(canManageSchedule({ role: "ADMIN", permissions: [] })).toBe(true);
  });

  it("libera a gestão de cronograma para todo analista", () => {
    expect(
      canManageSchedule({
        role: "ANALYST",
        permissions: [],
      }),
    ).toBe(true);
  });

  it("mantém o visualizador em consulta", () => {
    expect(canManageSchedule({ role: "VIEWER", permissions: [] })).toBe(false);
    expect(hasSystemPermission(null, "MANAGE_SCHEDULE")).toBe(false);
  });
});
