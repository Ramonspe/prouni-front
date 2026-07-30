import { describe, expect, it } from "vitest";
import { canManageSchedule, hasSystemPermission } from "./permissions";

describe("permissões da sessão", () => {
  it("trata o acesso do administrador como implícito", () => {
    expect(canManageSchedule({ role: "ADMIN", permissions: [] })).toBe(true);
  });

  it("libera a gestão para quem recebeu MANAGE_SCHEDULE", () => {
    expect(
      canManageSchedule({
        role: "ANALYST",
        permissions: ["MANAGE_SCHEDULE"],
      }),
    ).toBe(true);
  });

  it("mantém a consulta sem transformar ausência de permissão em gestão", () => {
    expect(canManageSchedule({ role: "ANALYST", permissions: [] })).toBe(false);
    expect(hasSystemPermission(null, "MANAGE_SCHEDULE")).toBe(false);
  });
});
