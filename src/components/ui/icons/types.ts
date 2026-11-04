import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

export function iconBase(
  props: IconProps,
  defaults: { viewBox?: string; width?: number; height?: number } = {},
) {
  const { title, ...rest } = props;
  return {
    viewBox: defaults.viewBox ?? "0 0 48 48",
    width: defaults.width ?? 40,
    height: defaults.height ?? 40,
    fill: "none",
    "aria-hidden": title ? undefined : (true as const),
    role: title ? ("img" as const) : undefined,
    ...rest,
  };
}
