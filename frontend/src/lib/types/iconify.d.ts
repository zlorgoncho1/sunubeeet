import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "iconify-icon": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          icon?: string;
          width?: string | number;
          height?: string | number;
          rotate?: string | number;
          flip?: string;
          inline?: boolean;
        },
        HTMLElement
      >;
    }
  }
}

export {};
