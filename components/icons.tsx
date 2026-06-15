// Lucide-style inline SVG icons, ported from the prototype (components.jsx).
// Pure presentational — safe to render on the server.
import type { ReactElement, ReactNode, SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "stroke" | "d"> & {
  d?: ReactNode;
  size?: number;
  stroke?: number;
};

export const Icon = ({ d, size = 16, stroke = 1.75, fill, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill || "none"}
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    {d}
  </svg>
);

export const IconHome = (p: IconProps) => <Icon {...p} d={<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" /></>} />;
export const IconFile = (p: IconProps) => <Icon {...p} d={<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></>} />;
export const IconFolder = (p: IconProps) => <Icon {...p} d={<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />} />;
export const IconUpload = (p: IconProps) => <Icon {...p} d={<><path d="M21 15v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" /><path d="m17 8-5-5-5 5" /><path d="M12 3v12" /></>} />;
export const IconCheck = (p: IconProps) => <Icon {...p} d={<path d="m5 12 5 5L20 7" />} />;
export const IconX = (p: IconProps) => <Icon {...p} d={<><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>} />;
export const IconAlert = (p: IconProps) => <Icon {...p} d={<><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /></>} />;
export const IconInfo = (p: IconProps) => <Icon {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M12 8h.01" /><path d="M11 12h1v4h1" /></>} />;
export const IconBell = (p: IconProps) => <Icon {...p} d={<><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21a2 2 0 0 0 4 0" /></>} />;
export const IconSearch = (p: IconProps) => <Icon {...p} d={<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>} />;
export const IconUser = (p: IconProps) => <Icon {...p} d={<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>} />;
export const IconUsers = (p: IconProps) => <Icon {...p} d={<><circle cx="9" cy="8" r="3.5" /><path d="M3 20a6 6 0 0 1 12 0" /><circle cx="17" cy="9" r="2.5" /><path d="M21 18a5 5 0 0 0-6-4.5" /></>} />;
export const IconLock = (p: IconProps) => <Icon {...p} d={<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>} />;
export const IconEye = (p: IconProps) => <Icon {...p} d={<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>} />;
export const IconEyeOff = (p: IconProps) => <Icon {...p} d={<><path d="M2 2 22 22" /><path d="M6.7 6.7C4 8.5 2 12 2 12s3 7 10 7c2 0 3.8-.6 5.3-1.5" /><path d="M11 5.1A10 10 0 0 1 12 5c7 0 10 7 10 7a17 17 0 0 1-3.2 4.3" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>} />;
export const IconLogout = (p: IconProps) => <Icon {...p} d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>} />;
export const IconClock = (p: IconProps) => <Icon {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />;
export const IconCal = (p: IconProps) => <Icon {...p} d={<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18" /><path d="M8 3v4M16 3v4" /></>} />;
export const IconDoc = (p: IconProps) => <Icon {...p} d={<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h6" /></>} />;
export const IconDownload = (p: IconProps) => <Icon {...p} d={<><path d="M21 15v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" /><path d="m7 11 5 5 5-5" /><path d="M12 4v12" /></>} />;
export const IconFilter = (p: IconProps) => <Icon {...p} d={<path d="M3 5h18l-7 9v6l-4-2v-4z" />} />;
export const IconChev = (p: IconProps) => <Icon {...p} d={<path d="m6 9 6 6 6-6" />} />;
export const IconChevR = (p: IconProps) => <Icon {...p} d={<path d="m9 6 6 6-6 6" />} />;
export const IconChevL = (p: IconProps) => <Icon {...p} d={<path d="m15 6-6 6 6 6" />} />;
export const IconPlus = (p: IconProps) => <Icon {...p} d={<><path d="M12 5v14" /><path d="M5 12h14" /></>} />;
export const IconTrash = (p: IconProps) => <Icon {...p} d={<><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></>} />;
export const IconChart = (p: IconProps) => <Icon {...p} d={<><path d="M3 3v18h18" /><path d="M7 14l4-4 4 4 5-7" /></>} />;
export const IconShield = (p: IconProps) => <Icon {...p} d={<><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z" /><path d="m9 12 2 2 4-4" /></>} />;
export const IconHelp = (p: IconProps) => <Icon {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2.5-2.5 4" /><path d="M12 17h.01" /></>} />;
export const IconSettings = (p: IconProps) => <Icon {...p} d={<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .4 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.4 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.4l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .4-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.4-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.4H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.4l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.4 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>} />;
export const IconMessage = (p: IconProps) => <Icon {...p} d={<path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.4 8.5 8.5 0 0 1-3.7-.8L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 1 1 17 0Z" />} />;
export const IconHistory = (p: IconProps) => <Icon {...p} d={<><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></>} />;
export const IconArrowUp = (p: IconProps) => <Icon {...p} d={<path d="m7 14 5-5 5 5" />} />;
export const IconArrowDown = (p: IconProps) => <Icon {...p} d={<path d="m7 10 5 5 5-5" />} />;
export const IconCar = (p: IconProps) => <Icon {...p} d={<><path d="M5 17h14M5 17l1-7h12l1 7" /><circle cx="7.5" cy="17" r="2" /><circle cx="16.5" cy="17" r="2" /></>} />;
export const IconHouse = (p: IconProps) => <Icon {...p} d={<><path d="M3 11 12 4l9 7" /><path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" /></>} />;
export const IconWallet = (p: IconProps) => <Icon {...p} d={<><path d="M3 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M16 12h4" /></>} />;
export const IconGraduate = (p: IconProps) => <Icon {...p} d={<><path d="M2 9 12 4l10 5-10 5z" /><path d="M6 11v5c0 2 2.7 3 6 3s6-1 6-3v-5" /></>} />;
export const IconExternal = (p: IconProps) => <Icon {...p} d={<><path d="M15 3h6v6" /><path d="m10 14 11-11" /><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></>} />;
export const IconZoom = (p: IconProps) => <Icon {...p} d={<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /><path d="M11 8v6M8 11h6" /></>} />;
export const IconPrint = (p: IconProps) => <Icon {...p} d={<><path d="M6 9V3h12v6" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M6 17h12v4H6z" /></>} />;
export const IconLayers = (p: IconProps) => <Icon {...p} d={<><path d="m12 2 10 5-10 5L2 7z" /><path d="m2 12 10 5 10-5" /><path d="m2 17 10 5 10-5" /></>} />;
export const IconList = (p: IconProps) => <Icon {...p} d={<><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></>} />;

export type IconComponent = (p: IconProps) => ReactElement;
