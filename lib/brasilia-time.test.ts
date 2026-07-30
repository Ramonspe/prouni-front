import { describe, expect, it } from "vitest";
import {
  BRASILIA_TIME_ZONE,
  BRASILIA_TIME_ZONE_LABEL,
  composeBrasiliaInstant,
  formatBrasiliaDate,
  formatBrasiliaDateTime,
  formatBrasiliaTime,
  getBrasiliaCivilParts,
  validateBrasiliaCivilDateTime,
} from "./brasilia-time";

describe("brasilia-time", () => {
  it("expõe o fuso IANA e o rótulo institucionais", () => {
    expect(BRASILIA_TIME_ZONE).toBe("America/Sao_Paulo");
    expect(BRASILIA_TIME_ZONE_LABEL).toBe("Horário de Brasília");
  });

  it("formata um instante UTC no dia e horário de Brasília", () => {
    const instant = "2026-07-24T21:00:00.000Z";

    expect(formatBrasiliaDate(instant)).toBe("24/07/2026");
    expect(formatBrasiliaTime(instant)).toBe("18:00");
    expect(formatBrasiliaDateTime(instant)).toBe("24/07/2026 às 18:00");
  });

  it("inclui segundos e identificação do fuso quando solicitado", () => {
    expect(
      formatBrasiliaDateTime("2026-07-24T21:00:09.000Z", {
        includeSeconds: true,
        includeTimeZone: true,
      }),
    ).toBe("24/07/2026 às 18:00:09 (Horário de Brasília)");
  });

  it("não usa o fuso local ao atravessar a meia-noite UTC", () => {
    const parts = getBrasiliaCivilParts("2026-07-25T01:30:00.000Z");

    expect(parts).toMatchObject({
      date: "2026-07-24",
      time: "22:30",
      year: 2026,
      month: 7,
      day: 24,
      hour: 22,
      minute: 30,
    });
  });

  it("aceita Date e epoch como instantes inequívocos", () => {
    const instant = Date.parse("2026-07-24T21:00:00.000Z");

    expect(formatBrasiliaTime(instant)).toBe("18:00");
    expect(formatBrasiliaTime(new Date(instant))).toBe("18:00");
  });

  it("rejeita strings sem Z ou offset explícito", () => {
    expect(() => formatBrasiliaDateTime("2026-07-24T18:00:00")).toThrow(
      "O instante deve incluir Z ou um offset explícito",
    );
    expect(() => formatBrasiliaDate("2026-07-24")).toThrow(
      "O instante deve incluir Z ou um offset explícito",
    );
  });

  it("rejeita instantes inválidos", () => {
    expect(() => formatBrasiliaDateTime("não-é-dataZ")).toThrow("Instante inválido.");
    expect(() => formatBrasiliaTime(Number.NaN)).toThrow("Instante inválido.");
  });

  it("compõe data e hora civil de Brasília em ISO UTC", () => {
    expect(composeBrasiliaInstant("2026-07-24", "18:00")).toBe(
      "2026-07-24T21:00:00.000Z",
    );
    expect(composeBrasiliaInstant("2026-07-24", "00:00")).toBe(
      "2026-07-24T03:00:00.000Z",
    );
  });

  it("preserva o offset histórico de verão de America/Sao_Paulo", () => {
    expect(composeBrasiliaInstant("2018-01-15", "18:00")).toBe(
      "2018-01-15T20:00:00.000Z",
    );
  });

  it("rejeita uma hora civil inexistente na mudança histórica de verão", () => {
    const result = validateBrasiliaCivilDateTime("2018-11-04", "00:30");

    expect(result.valid).toBe(false);
    if (result.valid) throw new Error("O caso deveria ser inválido.");
    expect(result.issues).toEqual([
      expect.objectContaining({
        field: "dateTime",
        message: expect.stringContaining("não existe"),
      }),
    ]);
  });

  it("faz round-trip entre instante e valores civis", () => {
    const instant = "2026-08-14T21:00:00.000Z";
    const civil = getBrasiliaCivilParts(instant);

    expect(composeBrasiliaInstant(civil.date, civil.time)).toBe(instant);
  });

  it("aceita 29 de fevereiro em ano bissexto", () => {
    const result = validateBrasiliaCivilDateTime("2028-02-29", "23:59");

    expect(result).toEqual({
      valid: true,
      date: "2028-02-29",
      time: "23:59",
      instant: "2028-03-01T02:59:00.000Z",
      issues: [],
    });
  });

  it.each([
    ["", "18:00", "date", "AAAA-MM-DD"],
    ["24/07/2026", "18:00", "date", "AAAA-MM-DD"],
    ["2026-13-01", "18:00", "date", "mês válido"],
    ["2026-04-31", "18:00", "date", "dia válido"],
    ["2026-02-29", "18:00", "date", "dia válido"],
    ["2026-07-24", "", "time", "HH:mm"],
    ["2026-07-24", "8:00", "time", "HH:mm"],
    ["2026-07-24", "24:00", "time", "hora entre 00 e 23"],
    ["2026-07-24", "18:60", "time", "minutos entre 00 e 59"],
  ])(
    "valida data/hora civil inválida: %s %s",
    (date, time, field, message) => {
      const result = validateBrasiliaCivilDateTime(date, time);

      expect(result.valid).toBe(false);
      if (result.valid) throw new Error("O caso deveria ser inválido.");
      expect(result.instant).toBeNull();
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field, message: expect.stringContaining(message) }),
        ]),
      );
    },
  );

  it("retorna simultaneamente erros de data e hora", () => {
    const result = validateBrasiliaCivilDateTime("", "");

    expect(result.valid).toBe(false);
    if (result.valid) throw new Error("O caso deveria ser inválido.");
    expect(result.issues.map((issue) => issue.field)).toEqual(["date", "time"]);
  });

  it("lança erro agregado ao compor valores civis inválidos", () => {
    expect(() => composeBrasiliaInstant("2026-02-30", "25:00")).toThrow(
      /dia válido.*hora entre 00 e 23/,
    );
  });
});
