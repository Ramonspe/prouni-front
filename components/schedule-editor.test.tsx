import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ScheduleEditor,
  createEmptyScheduleEditorValue,
  scheduleWindowsToEditorValue,
  validateScheduleEditorValue,
  type ScheduleEditorValue,
} from "./schedule-editor";

const validValue: ScheduleEditorValue = {
  REGISTRATION: {
    startDate: "2026-07-15",
    startTime: "08:00",
    endDate: "2026-07-24",
    endTime: "18:00",
  },
  INITIAL_SUBMISSION: {
    startDate: "2026-07-15",
    startTime: "08:00",
    endDate: "2026-07-28",
    endTime: "23:59",
  },
  PENDING_CORRECTION: {
    startDate: "2026-07-29",
    startTime: "08:00",
    endDate: "2026-07-31",
    endTime: "18:00",
  },
};

describe("ScheduleEditor", () => {
  it("mostra as três janelas e identifica explicitamente o fuso", () => {
    render(
      <ScheduleEditor value={validValue} onChange={() => undefined} />,
    );

    expect(
      screen.getByRole("heading", { name: "Novas inscrições" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Ficha e primeiro envio de documentos",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Correção de pendências" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Fuso horário do cronograma"),
    ).toHaveTextContent("America/Sao_Paulo");
  });

  it("mantém o editor controlado ao alterar um campo", () => {
    const onChange = vi.fn();
    render(<ScheduleEditor value={validValue} onChange={onChange} />);

    fireEvent.change(
      screen.getByLabelText("Horário de fim — Novas inscrições"),
      { target: { value: "19:30" } },
    );

    expect(onChange).toHaveBeenCalledWith({
      ...validValue,
      REGISTRATION: {
        ...validValue.REGISTRATION,
        endTime: "19:30",
      },
    });
  });

  it("converte os valores civis de Brasília antes de salvar o rascunho", () => {
    const onSaveDraft = vi.fn();
    render(
      <ScheduleEditor
        value={validValue}
        onChange={() => undefined}
        onSaveDraft={onSaveDraft}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Salvar rascunho" }));

    expect(onSaveDraft).toHaveBeenCalledWith({
      windows: [
        {
          kind: "REGISTRATION",
          startsAt: "2026-07-15T11:00:00.000Z",
          endsAt: "2026-07-24T21:00:00.000Z",
        },
        {
          kind: "INITIAL_SUBMISSION",
          startsAt: "2026-07-15T11:00:00.000Z",
          endsAt: "2026-07-29T02:59:00.000Z",
        },
        {
          kind: "PENDING_CORRECTION",
          startsAt: "2026-07-29T11:00:00.000Z",
          endsAt: "2026-07-31T21:00:00.000Z",
        },
      ],
    });
  });

  it("bloqueia as ações e explica quando o fim não é posterior ao início", () => {
    const invalidValue: ScheduleEditorValue = {
      ...validValue,
      REGISTRATION: {
        ...validValue.REGISTRATION,
        endDate: "2026-07-15",
        endTime: "07:59",
      },
    };

    render(
      <ScheduleEditor
        value={invalidValue}
        onChange={() => undefined}
        onSaveDraft={() => undefined}
        onPublish={() => undefined}
        canPublish
      />,
    );

    expect(screen.getByText("O fim deve ser posterior ao início.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Salvar rascunho" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Publicar cronograma" }),
    ).toBeDisabled();
  });

  it("só habilita publicação quando existe um rascunho salvo sem alterações", () => {
    const onPublish = vi.fn();
    const { rerender } = render(
      <ScheduleEditor
        value={validValue}
        onChange={() => undefined}
        onPublish={onPublish}
        draftVersion={2}
        canPublish={false}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Publicar cronograma" }),
    ).toBeDisabled();

    rerender(
      <ScheduleEditor
        value={validValue}
        onChange={() => undefined}
        onPublish={onPublish}
        draftVersion={2}
        canPublish
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Publicar cronograma" }),
    );

    expect(onPublish).toHaveBeenCalledOnce();
  });

  it("decompõe instantes da API em campos civis de Brasília", () => {
    expect(
      scheduleWindowsToEditorValue([
        {
          kind: "REGISTRATION",
          startsAt: "2026-07-15T11:00:00.000Z",
          endsAt: "2026-07-24T21:00:00.000Z",
        },
      ]),
    ).toEqual({
      ...createEmptyScheduleEditorValue(),
      REGISTRATION: {
        startDate: "2026-07-15",
        startTime: "08:00",
        endDate: "2026-07-24",
        endTime: "18:00",
      },
    });
  });

  it("mantém vazia uma janela inválida recebida da API", () => {
    const value = scheduleWindowsToEditorValue([
      {
        kind: "REGISTRATION",
        startsAt: "sem-offset",
        endsAt: "2026-07-24T21:00:00.000Z",
      },
    ]);

    expect(value.REGISTRATION).toEqual(
      createEmptyScheduleEditorValue().REGISTRATION,
    );
    expect(validateScheduleEditorValue(value).valid).toBe(false);
  });
});
