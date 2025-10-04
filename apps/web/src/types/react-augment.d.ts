/**
 * Type augmentation to fix React 18 vs React 19 type incompatibilities
 * This resolves JSX component type errors for lucide-react and other libraries
 */

declare module 'react' {
  // Extend ReactNode to include bigint (React 19 feature)
  type ReactNode =
    | React.ReactElement
    | string
    | number
    | bigint
    | boolean
    | React.ReactFragment
    | React.ReactPortal
    | null
    | undefined;
}

export {};
