import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { UserDto } from "@prouni/shared";
import { UserSchedulePermissionControl } from "./user-permission-control";

function staff(overrides: Partial<UserDto> = {}): UserDto {
  return {
    id: "user-1",
    fullName: "Analista de Teste",
    cpf: "529.982.247-25",
    email: "analista@example.com",
    role: "ANALYST",
    active: true,
    permissions: [],
    createdAt: "2026-07-29T12:00:00.000Z",
    ...overrides,
  };
}

describe("UserSchedulePermissionControl", () => {
  it("informa acesso implícito para administradores e analistas", () => {
    const { rerender } = render(<UserSchedulePermissionControl user={staff()} />);
    expect(screen.getByText("Pode gerenciar")).toBeInTheDocument();

    rerender(<UserSchedulePermissionControl user={staff({ role: "ADMIN" })} />);
    expect(screen.getByText("Pode gerenciar")).toBeInTheDocument();
  });

  it("mantém visualizadores em consulta", () => {
    render(<UserSchedulePermissionControl user={staff({ role: "VIEWER" })} />);
    expect(screen.getByText("Somente consulta")).toBeInTheDocument();
  });
});
