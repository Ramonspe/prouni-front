import type { UserDto } from "@prouni/shared";
import { Badge } from "./ui";

export function UserSchedulePermissionControl({
  user,
  pending = false,
  onToggle,
}: {
  user: UserDto;
  pending?: boolean;
  onToggle: (user: UserDto) => void;
}) {
  if (user.role === "ADMIN") {
    return (
      <Badge tone="success" dot={false}>
        Acesso implícito
      </Badge>
    );
  }
  if (user.role !== "ANALYST") {
    return <span className="muted small">Não aplicável</span>;
  }

  const granted = user.permissions.includes("MANAGE_SCHEDULE");
  return (
    <button
      className={granted ? "btn btn-secondary btn-sm" : "btn btn-ghost btn-sm"}
      type="button"
      aria-pressed={granted}
      aria-label={`${
        granted ? "Revogar" : "Conceder"
      } gestão de cronograma para ${user.fullName}`}
      disabled={pending}
      onClick={() => onToggle(user)}
    >
      {pending
        ? "Atualizando…"
        : granted
          ? "Pode gerenciar"
          : "Somente consulta"}
    </button>
  );
}
