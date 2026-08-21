import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <BrandLogo size={36} showWordmark />
        <div className="landing-nav-actions">
          <Link href="/sign-in" className="landing-link">
            Zaloguj się
          </Link>
          <Link href="/sign-up" className="landing-cta-nav">
            Załóż konto
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-brand brand-mark">Valora</p>
          <h1 className="landing-headline">
            Portfel kryptowalut w jednym rytmie
          </h1>
          <p className="landing-lead">
            Śledź zakupy, średnią cenę i aktualną wartość — przejrzyście, po
            polsku, bez chaosu arkuszy.
          </p>
          <div className="landing-cta-row">
            <Link href="/sign-up" className="landing-cta-primary">
              Zacznij za darmo
            </Link>
            <Link href="/sign-in" className="landing-cta-secondary">
              Mam już konto
            </Link>
          </div>
        </div>

        <div className="landing-hero-visual" aria-hidden>
          <div className="landing-orb landing-orb-a" />
          <div className="landing-orb landing-orb-b" />
          <div className="landing-mark-wrap">
            <BrandLogo size={220} />
          </div>
        </div>
      </section>

      <section className="landing-section">
        <p className="section-label">Po co Valora</p>
        <h2 className="landing-section-title brand-mark">
          Widzisz portfel, nie tylko transakcje
        </h2>
        <p className="landing-section-lead">
          Jedno miejsce na Revolut/Kraken, import z innych giełd i live wartość
          w PLN oraz EUR.
        </p>

        <ul className="landing-points">
          <li>
            <span className="landing-point-index">01</span>
            <div>
              <p className="landing-point-title">Live wartość portfela</p>
              <p className="landing-point-text">
                Ceny rynkowe i kurs NBP odświeżane automatycznie.
              </p>
            </div>
          </li>
          <li>
            <span className="landing-point-index">02</span>
            <div>
              <p className="landing-point-title">Średnia zakupu</p>
              <p className="landing-point-text">
                Ważona średnia PLN/EUR i jasny zysk albo strata.
              </p>
            </div>
          </li>
          <li>
            <span className="landing-point-index">03</span>
            <div>
              <p className="landing-point-title">Historia pod kontrolą</p>
              <p className="landing-point-text">
                Filtruj, edytuj i dopisuj zakupy albo importy w sekundę.
              </p>
            </div>
          </li>
        </ul>
      </section>

      <footer className="landing-footer">
        <BrandLogo size={28} showWordmark />
        <p>Valora · Twój portfel w jednym rytmie</p>
      </footer>
    </div>
  );
}
