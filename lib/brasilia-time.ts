/**
 * Conversões de prazo do processo PROUNI.
 *
 * Datas e horas de configuração são valores civis de Brasília. Instantes recebidos
 * por estas funções precisam ser inequívocos (epoch, Date ou ISO com Z/offset).
 * Nenhuma operação depende do fuso configurado no navegador ou no servidor.
 */

export const BRASILIA_TIME_ZONE = "America/Sao_Paulo";
export const BRASILIA_TIME_ZONE_LABEL = "Horário de Brasília";

export type InstantInput = Date | number | string;

export type BrasiliaDateTimeField = "date" | "time" | "dateTime";

export interface BrasiliaDateTimeIssue {
  field: BrasiliaDateTimeField;
  message: string;
}

export type BrasiliaCivilDateTimeValidation =
  | {
      valid: true;
      date: string;
      time: string;
      instant: string;
      issues: [];
    }
  | {
      valid: false;
      date: string;
      time: string;
      instant: null;
      issues: BrasiliaDateTimeIssue[];
    };

export interface BrasiliaCivilParts {
  date: string;
  time: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export interface FormatBrasiliaDateTimeOptions {
  includeSeconds?: boolean;
  includeTimeZone?: boolean;
}

interface NumericCivilParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;
const EXPLICIT_INSTANT_PATTERN = /(?:[zZ]|[+-]\d{2}:\d{2})$/;
const ONE_DAY_MS = 86_400_000;

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BRASILIA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

function parseCivilDate(date: string): {
  parts: Pick<NumericCivilParts, "year" | "month" | "day"> | null;
  issue?: BrasiliaDateTimeIssue;
} {
  const match = DATE_PATTERN.exec(date);
  if (!match) {
    return {
      parts: null,
      issue: { field: "date", message: "Informe a data no formato AAAA-MM-DD." },
    };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1 || year > 9999) {
    return {
      parts: null,
      issue: { field: "date", message: "Informe um ano entre 0001 e 9999." },
    };
  }
  if (month < 1 || month > 12) {
    return {
      parts: null,
      issue: { field: "date", message: "Informe um mês válido." },
    };
  }
  if (day < 1 || day > daysInMonth(year, month)) {
    return {
      parts: null,
      issue: { field: "date", message: "Informe um dia válido para o mês selecionado." },
    };
  }

  return { parts: { year, month, day } };
}

function parseCivilTime(time: string): {
  parts: Pick<NumericCivilParts, "hour" | "minute" | "second"> | null;
  issue?: BrasiliaDateTimeIssue;
} {
  const match = TIME_PATTERN.exec(time);
  if (!match) {
    return {
      parts: null,
      issue: { field: "time", message: "Informe o horário no formato HH:mm." },
    };
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23) {
    return {
      parts: null,
      issue: { field: "time", message: "Informe uma hora entre 00 e 23." },
    };
  }
  if (minute < 0 || minute > 59) {
    return {
      parts: null,
      issue: { field: "time", message: "Informe os minutos entre 00 e 59." },
    };
  }

  return { parts: { hour, minute, second: 0 } };
}

function numericPartsAt(instantMs: number): NumericCivilParts {
  const values: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const part of partsFormatter.formatToParts(new Date(instantMs))) {
    if (part.type !== "literal") values[part.type] = part.value;
  }

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function sameCivilParts(left: NumericCivilParts, right: NumericCivilParts): boolean {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute &&
    left.second === right.second
  );
}

function civilPartsAsUtc(parts: NumericCivilParts): number {
  const date = new Date(0);
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  date.setUTCHours(parts.hour, parts.minute, parts.second, 0);
  return date.getTime();
}

/**
 * Offset do fuso no instante informado. A conta parte apenas de epoch UTC e das
 * partes retornadas pelo Intl com `timeZone` explícito.
 */
function offsetAt(instantMs: number): number {
  const roundedInstant = Math.trunc(instantMs / 1000) * 1000;
  const parts = numericPartsAt(roundedInstant);
  const sameWallClockInUtc = civilPartsAsUtc(parts);
  return sameWallClockInUtc - roundedInstant;
}

function instantForCivilParts(parts: NumericCivilParts): number | null {
  const civilAsUtc = civilPartsAsUtc(parts);

  // Consultar antes, durante e depois cobre mudanças históricas de horário de
  // verão. Se houver duas ocorrências da mesma hora civil, escolhemos a primeira.
  const offsets = new Set([
    offsetAt(civilAsUtc - ONE_DAY_MS),
    offsetAt(civilAsUtc),
    offsetAt(civilAsUtc + ONE_DAY_MS),
  ]);
  const matches = [...offsets]
    .map((offset) => civilAsUtc - offset)
    .filter((candidate) => sameCivilParts(numericPartsAt(candidate), parts))
    .sort((left, right) => left - right);

  return matches[0] ?? null;
}

function toInstantDate(input: InstantInput): Date {
  if (typeof input === "string" && !EXPLICIT_INSTANT_PATTERN.test(input)) {
    throw new RangeError("O instante deve incluir Z ou um offset explícito, como -03:00.");
  }

  const date =
    input instanceof Date
      ? new Date(input.getTime())
      : new Date(input);

  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Instante inválido.");
  }
  return date;
}

export function validateBrasiliaCivilDateTime(
  date: string,
  time: string,
): BrasiliaCivilDateTimeValidation {
  const parsedDate = parseCivilDate(date);
  const parsedTime = parseCivilTime(time);
  const issues = [parsedDate.issue, parsedTime.issue].filter(
    (issue): issue is BrasiliaDateTimeIssue => Boolean(issue),
  );

  if (issues.length > 0 || !parsedDate.parts || !parsedTime.parts) {
    return { valid: false, date, time, instant: null, issues };
  }

  const parts: NumericCivilParts = {
    ...parsedDate.parts,
    ...parsedTime.parts,
  };
  const instantMs = instantForCivilParts(parts);
  if (instantMs === null) {
    return {
      valid: false,
      date,
      time,
      instant: null,
      issues: [
        {
          field: "dateTime",
          message: `A combinação de data e hora não existe em ${BRASILIA_TIME_ZONE_LABEL.toLowerCase()}.`,
        },
      ],
    };
  }

  return {
    valid: true,
    date,
    time,
    instant: new Date(instantMs).toISOString(),
    issues: [],
  };
}

/**
 * Converte data e hora de inputs HTML (`YYYY-MM-DD` + `HH:mm`) em um instante ISO.
 */
export function composeBrasiliaInstant(date: string, time: string): string {
  const validation = validateBrasiliaCivilDateTime(date, time);
  if (!validation.valid) {
    throw new RangeError(validation.issues.map((issue) => issue.message).join(" "));
  }
  return validation.instant;
}

/**
 * Decompõe um instante em valores próprios para `<input type="date">` e
 * `<input type="time">`, sempre em Brasília.
 */
export function getBrasiliaCivilParts(input: InstantInput): BrasiliaCivilParts {
  const parts = numericPartsAt(toInstantDate(input).getTime());
  return {
    date: `${String(parts.year).padStart(4, "0")}-${pad(parts.month)}-${pad(parts.day)}`,
    time: `${pad(parts.hour)}:${pad(parts.minute)}`,
    ...parts,
  };
}

export function formatBrasiliaDate(input: InstantInput): string {
  const parts = getBrasiliaCivilParts(input);
  return `${pad(parts.day)}/${pad(parts.month)}/${String(parts.year).padStart(4, "0")}`;
}

export function formatBrasiliaTime(
  input: InstantInput,
  options: Pick<FormatBrasiliaDateTimeOptions, "includeSeconds"> = {},
): string {
  const parts = getBrasiliaCivilParts(input);
  const seconds = options.includeSeconds ? `:${pad(parts.second)}` : "";
  return `${pad(parts.hour)}:${pad(parts.minute)}${seconds}`;
}

export function formatBrasiliaDateTime(
  input: InstantInput,
  options: FormatBrasiliaDateTimeOptions = {},
): string {
  const formatted = `${formatBrasiliaDate(input)} às ${formatBrasiliaTime(input, options)}`;
  return options.includeTimeZone
    ? `${formatted} (${BRASILIA_TIME_ZONE_LABEL})`
    : formatted;
}
