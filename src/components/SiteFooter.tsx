import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

type SiteFooterProps = {
  variant?: "landing" | "app" | "auth";
};

export default function SiteFooter({variant = "landing"}: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={`site-footer site-footer-${variant}`}>
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <BrandLogo size={variant === "app" ? 24 : 28} showWordmark />
          <p className="site-footer-tagline">
            Twój portfel w jednym rytmie
          </p>
        </div>

        <nav className="site-footer-nav" aria-label="Stopka">
          {variant === "landing" || variant === "auth" ? (
            <>
              <Link href="/sign-in">Logowanie</Link>
              <Link href="/sign-up">Rejestracja</Link>
              <Link href="/forgot-password">Odzyskaj hasło</Link>
            </>
          ) : (
            <>
              <span>Ceny: giełdy + NBP</span>
              <span>Dane tylko Twoje</span>
            </>
          )}
        </nav>

        <p className="site-footer-copy">
          © {year} Valora. Tracking kryptowalut po polsku.
        </p>
      </div>
    </footer>
  );
}
