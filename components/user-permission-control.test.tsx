import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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
  it("concede e revoga apenas por uma ação explícita no analista", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <UserSchedulePermissionControl user={staff()} onToggle={onToggle} />,
    );

    const grant = screen.getByRole("button", {
      name: "Conceder gestão de cronograma para Analista de Teste",
    });
    expect(grant).toHaveAttribute("aria-pressed", "false");
    await user.click(grant);
    expect(onToggle).toHaveBeenCalledWith(staff());

    rerender(
      <UserSchedulePermissionControl
        user={staff({ permissions: ["MANAGE_SCHEDULE"] })}
        onToggle={onToggle}
      />,
    );
    expect(
      screen.getByRole("button", {
        name: "Revogar gestão de cronograma para Analista de Teste",
      }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("explica que ADMIN é implícito e VIEWER não recebe a delegação", () => {
    const { rerender } = render(
      <UserSchedulePermissionControl
        user={staff({ role: "ADMIN" })}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("Acesso implícito")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(
      <UserSchedulePermissionControl
        user={staff({ role: "VIEWER" })}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("Não aplicável")).toBeInTheDocument();
  });
});
