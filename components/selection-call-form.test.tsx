import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SelectionCallSummaryDto } from "@prouni/shared";
import { SelectionCallForm } from "./selection-call-form";

const call: SelectionCallSummaryDto = {
  id: "call-2",
  cycle: { id: "cycle-1", label: "2026/2", year: 2026, term: 2 },
  code: "segunda-chamada",
  name: "2ª chamada",
  kind: "SECOND_CALL",
  sequence: 2,
  status: "DRAFT",
  timeZone: "America/Sao_Paulo",
};

describe("SelectionCallForm", () => {
  it("cria a entrada com o ciclo do contexto e os cinco campos mínimos", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <SelectionCallForm
        cycleId="cycle-1"
        cycleLabel="2026/2"
        suggestedSequence={3}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/^Código/), "lista-espera");
    await user.type(
      screen.getByLabelText(/^Nome de exibição/),
      "Lista de espera",
    );
    await user.selectOptions(screen.getByLabelText(/^Tipo/), "WAITLIST");
    await user.click(screen.getByRole("button", { name: "Criar chamada" }));

    expect(onSubmit).toHaveBeenCalledWith({
      cycleId: "cycle-1",
      code: "lista-espera",
      name: "Lista de espera",
      kind: "WAITLIST",
      sequence: 3,
      timeZone: "America/Sao_Paulo",
    });
  });

  it("mantém o fuso oficial fixo mesmo enquanto a chamada está em rascunho", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <SelectionCallForm
        cycleId="cycle-1"
        cycleLabel="2026/2"
        call={call}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    const name = screen.getByLabelText(/^Nome de exibição/);
    expect(screen.getByLabelText(/^Fuso horário/)).toBeDisabled();
    expect(screen.getByLabelText(/^Fuso horário/)).toHaveValue(
      "America/Sao_Paulo",
    );
    await user.clear(name);
    await user.type(name, "Segunda chamada");
    await user.click(screen.getByRole("button", { name: "Salvar chamada" }));

    expect(onSubmit).toHaveBeenCalledWith({
      cycleId: "cycle-1",
      code: "segunda-chamada",
      name: "Segunda chamada",
      kind: "SECOND_CALL",
      sequence: 2,
      timeZone: "America/Sao_Paulo",
    });
  });

  it("preserva a identidade depois da publicação", () => {
    render(
      <SelectionCallForm
        cycleId="cycle-1"
        cycleLabel="2026/2"
        call={{ ...call, status: "PUBLISHED" }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/^Código/)).toBeDisabled();
    expect(screen.getByLabelText(/^Tipo/)).toBeDisabled();
    expect(screen.getByLabelText(/^Sequência/)).toBeDisabled();
    expect(screen.getByLabelText(/^Fuso horário/)).toBeDisabled();
    expect(screen.getByLabelText(/^Nome de exibição/)).toBeEnabled();
  });
});
