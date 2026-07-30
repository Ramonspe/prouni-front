import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApplicationCard } from "./application-card";
import { ApplicationContextHeader } from "./application-context-header";
import { OpportunityCard } from "./opportunity-card";
import { ProcessContextSelector } from "./process-context-selector";

describe("ApplicationContextHeader", () => {
  it("expõe ciclo, chamada, curso, campus, protocolo e status", () => {
    render(
      <ApplicationContextHeader
        cycleLabel="2026/2"
        callLabel="2ª chamada"
        courseName="Design"
        campusName="São Caetano do Sul"
        protocol="PRN-2026-0420"
        statusLabel="Inscrição iniciada"
        title="Ficha socioeconômica"
      />,
    );

    expect(
      screen.getByRole("banner", { name: "Contexto da inscrição" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Ficha socioeconômica" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2026/2")).toBeInTheDocument();
    expect(screen.getByText("2ª chamada")).toBeInTheDocument();
    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(screen.getByText("Campus São Caetano do Sul")).toBeInTheDocument();
    expect(screen.getByText("PRN-2026-0420")).toBeInTheDocument();
    expect(screen.getByText("Inscrição iniciada")).toBeInTheDocument();
  });

  it("omite metadados e área lateral opcionais", () => {
    render(
      <ApplicationContextHeader
        cycleLabel="2026/2"
        callLabel="1ª chamada"
        courseName="Administração"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Administração" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Campus/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Protocolo/)).not.toBeInTheDocument();
  });
});

describe("ApplicationCard", () => {
  it("renderiza identificação, prazo e ação da inscrição", () => {
    render(
      <ApplicationCard
        cycleLabel="2026/2"
        callLabel="2ª chamada"
        courseName="Design"
        campusName="São Caetano do Sul"
        protocol="PRN-2026-0420"
        statusLabel="Ação necessária"
        deadlineLabel="Complete até 17/08/2026 às 23:59"
        href="/inscricoes/app-2"
        actionLabel="Continuar inscrição"
        tone="attention"
      />,
    );

    expect(
      screen.getByRole("article", {
        name: "2026/2 · 2ª chamada · Design",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("PRN-2026-0420")).toBeInTheDocument();
    expect(
      screen.getByText("Complete até 17/08/2026 às 23:59"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Continuar inscrição/ }),
    ).toHaveAttribute("href", "/inscricoes/app-2");
  });

  it("não cria uma ação quando href não é informado", () => {
    render(
      <ApplicationCard
        cycleLabel="2026/2"
        callLabel="1ª chamada"
        courseName="Administração"
        protocol="PRN-2026-0001"
        statusLabel="Análise concluída"
      />,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("OpportunityCard", () => {
  it("distingue uma oportunidade de uma inscrição existente", () => {
    render(
      <OpportunityCard
        cycleLabel="2026/2"
        callLabel="2ª chamada"
        courseName="Design"
        campusName="São Caetano do Sul"
        availableUntilLabel="Inicie até 05/08/2026 às 18:00"
        href="/inscricoes/nova/op-2"
      />,
    );

    expect(
      screen.getByRole("article", {
        name: "Nova pré-seleção · 2026/2 · 2ª chamada · Design",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Nova pré-seleção")).toBeInTheDocument();
    expect(
      screen.getByText("Inicie até 05/08/2026 às 18:00"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Iniciar inscrição/ }),
    ).toHaveAttribute("href", "/inscricoes/nova/op-2");
  });

  it("aceita uma ação controlada pelo fluxo de reivindicação", async () => {
    const user = userEvent.setup();
    const onClaim = vi.fn();
    render(
      <OpportunityCard
        cycleLabel="2026/2"
        callLabel="Lista de espera"
        courseName="Engenharia"
        action={
          <button type="button" onClick={onClaim}>
            Criar protocolo
          </button>
        }
      />,
    );

    await user.click(screen.getByRole("button", { name: "Criar protocolo" }));
    expect(onClaim).toHaveBeenCalledOnce();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("ProcessContextSelector", () => {
  const cycles = [
    { id: "cycle-2026-2", label: "2026/2 — Em execução" },
    { id: "cycle-2026-1", label: "2026/1 — Encerrado" },
  ];
  const calls = [
    { id: "call-2", label: "2ª chamada — Em execução" },
    { id: "call-1", label: "1ª chamada — Encerrada" },
    { id: "all", label: "Todas as chamadas" },
  ];

  it("mostra o contexto controlado e comunica alterações", async () => {
    const user = userEvent.setup();
    const onCycleChange = vi.fn();
    const onCallChange = vi.fn();

    render(
      <ProcessContextSelector
        cycles={cycles}
        calls={calls}
        cycleId="cycle-2026-2"
        callId="call-2"
        onCycleChange={onCycleChange}
        onCallChange={onCallChange}
      />,
    );

    expect(
      screen.getByRole("group", { name: "Contexto de trabalho" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Processo")).toHaveValue("cycle-2026-2");
    expect(screen.getByLabelText("Chamada")).toHaveValue("call-2");
    expect(screen.getByText("2026/2 — Em execução", { selector: "strong" })).toBeInTheDocument();
    expect(
      screen.getByText("2ª chamada — Em execução", { selector: "strong" }),
    ).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Processo"), "cycle-2026-1");
    await user.selectOptions(screen.getByLabelText("Chamada"), "all");

    expect(onCycleChange).toHaveBeenCalledWith("cycle-2026-1");
    expect(onCallChange).toHaveBeenCalledWith("all");
  });

  it("desabilita os controles como um conjunto", () => {
    render(
      <ProcessContextSelector
        cycles={cycles}
        calls={calls}
        cycleId="cycle-2026-2"
        callId="call-2"
        onCycleChange={vi.fn()}
        onCallChange={vi.fn()}
        disabled
      />,
    );

    expect(screen.getByLabelText("Processo")).toBeDisabled();
    expect(screen.getByLabelText("Chamada")).toBeDisabled();
  });

  it("respeita opções individualmente desabilitadas", () => {
    render(
      <ProcessContextSelector
        cycles={[...cycles, { id: "draft", label: "2027/1 — Rascunho", disabled: true }]}
        calls={calls}
        cycleId="cycle-2026-2"
        callId="call-2"
        onCycleChange={vi.fn()}
        onCallChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("option", { name: "2027/1 — Rascunho" })).toBeDisabled();
  });
});
