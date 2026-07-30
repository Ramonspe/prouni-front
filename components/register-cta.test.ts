import { describe, expect, it } from "vitest";
import type { RegistrationStatusDto } from "@prouni/shared";
import {
  nextRegistrationBoundary,
  registrationDisplayPeriods,
} from "./register-cta";

const status: RegistrationStatusDto = {
  open: false,
  calls: [
    {
      value: "PRIMEIRA",
      label: "1ª chamada",
      start: "2026-07-15",
      end: "2026-07-24",
      open: false,
    },
  ],
  selectionCalls: [
    {
      call: {
        id: "call-1",
        cycle: { id: "cycle-1", label: "2026/2", year: 2026, term: 2 },
        code: "primeira-chamada",
        name: "1ª chamada",
        kind: "FIRST_CALL",
        sequence: 1,
        status: "PUBLISHED",
        timeZone: "America/Sao_Paulo",
      },
      startsAt: "2026-07-15T11:00:00.000Z",
      endsAt: "2026-07-24T21:00:00.000Z",
      open: false,
    },
  ],
};

describe("RegisterCta scheduling", () => {
  it("usa o cronograma canônico com horário quando ele existe", () => {
    expect(registrationDisplayPeriods(status)).toEqual([
      expect.objectContaining({
        source: "canonical",
        key: "call-1",
        startsAt: "2026-07-15T11:00:00.000Z",
        endsAt: "2026-07-24T21:00:00.000Z",
      }),
    ]);
  });

  it("agenda a atualização no próximo limite e trata fim como exclusivo", () => {
    expect(
      nextRegistrationBoundary(
        status,
        Date.parse("2026-07-15T10:59:59.999Z"),
      ),
    ).toBe(Date.parse("2026-07-15T11:00:00.000Z"));
    expect(
      nextRegistrationBoundary(
        status,
        Date.parse("2026-07-15T11:00:00.000Z"),
      ),
    ).toBe(Date.parse("2026-07-24T21:00:00.000Z"));
  });
});
