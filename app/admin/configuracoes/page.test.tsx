import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ConfiguracoesPage from "./page";

let staffRole = "ADMIN";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/process-context-selector", () => ({
  ProcessContextSelector: () => <div>Contexto de pré-selecionados</div>,
}));

vi.mock("@/lib/use-require-auth", () => ({
  useRequireStaff: () => ({ user: { role: staffRole } }),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ setSession: vi.fn() }),
}));

vi.mock("@/lib/use-admin-process-context", () => ({
  useAdminProcessContext: () => ({
    cycleId: "cycle-2026-2",
    callId: "all",
    cycles: [],
    calls: [],
    cycleOptions: [{ id: "cycle-2026-2", label: "2026/2 — Em execução" }],
    callOptions: [{ id: "all", label: "Todas as chamadas" }],
    selectedCycle: {
      id: "cycle-2026-2",
      label: "2026/2",
      year: 2026,
      term: 2,
      status: "ACTIVE",
    },
    selectedCall: null,
    setCycleId: vi.fn(),
    setCallId: vi.fn(),
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@/lib/api", () => ({
  authApi: {},
  coursesApi: {
    campuses: vi.fn().mockResolvedValue([]),
    courses: vi.fn().mockResolvedValue([]),
  },
  preselectionApi: {
    list: vi.fn().mockResolvedValue([]),
  },
  selectionCallsApi: {
    create: vi.fn(),
  },
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ConfiguracoesPage />
    </QueryClientProvider>,
  );
}

describe("Pré-selecionados", () => {
  beforeEach(() => {
    staffRole = "ADMIN";
  });

  it("orienta a criar uma chamada no próprio fluxo quando apenas o histórico está selecionado", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(
      screen.getByText(/modo “Todas as chamadas” é apenas para consulta/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Novo pré-selecionado" }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Criar chamada" }));

    expect(
      screen.getByRole("heading", { name: "Nova chamada" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ciclo 2026\/2/i)).toBeInTheDocument();
  });

  it("permite a importação pelo analista sem exibir aviso", () => {
    staffRole = "ANALYST";
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Importar planilha (CSV ou Excel)" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Importação de pré-selecionados")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Novo pré-selecionado" }),
    ).not.toBeInTheDocument();
  });
});
