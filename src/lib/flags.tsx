import { CL, CO, EC, MX, UY } from "country-flag-icons/react/3x2";

const FLAGS = {
  CL,
  CO,
  EC,
  MX,
  UY,
} as const;

type FlagCode = keyof typeof FLAGS;

export function FlagIcon({
  code,
  title,
  className,
}: {
  code: string;
  title?: string;
  className?: string;
}) {
  const Flag = FLAGS[code as FlagCode];
  if (!Flag) return null;
  return <Flag title={title} className={className} />;
}
