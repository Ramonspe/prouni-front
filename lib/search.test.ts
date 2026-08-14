import { describe, expect, it } from "vitest";
import { matchesPersonSearch } from "./search";

const candidate = {
  name: "Maria Eduarda Augusto Alves",
  cpf: "490.673.298-43",
  protocol: "PRN-2026-0034",
};

describe("matchesPersonSearch", () => {
  it("não mantém a lista inteira quando o nome pesquisado não corresponde", () => {
    expect(matchesPersonSearch(candidate, "Julia Dieb")).toBe(false);
  });

  it("não considera todo CPF compatível com uma busca somente textual", () => {
    expect(matchesPersonSearch(candidate, "Fernando")).toBe(false);
  });

  it("busca nome sem depender de caixa ou acentuação", () => {
    expect(matchesPersonSearch({ ...candidate, name: "João da Silva" }, "joao")).toBe(true);
  });

  it("busca CPF com ou sem pontuação", () => {
    expect(matchesPersonSearch(candidate, "490673")).toBe(true);
    expect(matchesPersonSearch(candidate, "490.673.298-43")).toBe(true);
  });

  it("busca protocolo e aceita consulta vazia", () => {
    expect(matchesPersonSearch(candidate, "PRN-2026-0034")).toBe(true);
    expect(matchesPersonSearch(candidate, "  ")).toBe(true);
  });
});
