import type { UserDto } from "@prouni/shared";
import { Badge } from "./ui";

export function UserSchedulePermissionControl({
  user,
  pending: _pending = false,
  onToggle: _onToggle,
}: {
  user: UserDto;
  /** Compatibilidade com cópias locais da tela de usuários. */
  pending?: boolean;
  /** Não tem efeito: a gestão de cronograma passou a ser definida pelo perfil. */
  onToggle?: (user: UserDto) => void;
}) {
  if (user.role === "ADMIN" || user.role === "ANALYST") {
    return (
      <Badge tone="success" dot={false}>
        Pode gerenciar
      </Badge>
    );
  }
  return <span className="muted small">Somente consulta</span>;
}
