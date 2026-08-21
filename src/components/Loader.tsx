import BrandLogo from "@/components/BrandLogo";

type LoaderProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: {logo: 28, ring: "size-10"},
  md: {logo: 40, ring: "size-14"},
  lg: {logo: 56, ring: "size-20"},
} as const;

export function Loader({
  label = "Ładowanie",
  size = "md",
  className = "",
}: LoaderProps) {
  const dims = sizeMap[size];

  return (
    <div className={`loader ${className}`} role="status" aria-live="polite">
      <div className={`loader-ring ${dims.ring}`}>
        <span className="loader-spin" aria-hidden />
        <BrandLogo size={dims.logo} />
      </div>
      {label ? <p className="loader-label">{label}</p> : null}
    </div>
  );
}

export function ButtonSpinner() {
  return <span className="btn-spinner" aria-hidden />;
}
