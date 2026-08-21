import Image from "next/image";

type BrandLogoProps = {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  inverted?: boolean;
};

export default function BrandLogo({
  size = 40,
  className = "",
  showWordmark = false,
  inverted = false,
}: BrandLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/valora-logo.png"
        alt="Valora"
        width={size}
        height={size}
        className="brand-logo-mark"
        priority
      />
      {showWordmark ? (
        <span
          className={`brand-mark text-2xl font-bold tracking-tight ${
            inverted ? "text-white" : "text-ink"
          }`}
        >
          Valora
        </span>
      ) : null}
    </div>
  );
}
