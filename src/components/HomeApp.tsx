"use client";

import {useSession} from "next-auth/react";
import {ReactNode, useEffect, useState} from "react";
import BrandLogo from "@/components/BrandLogo";
import Dashboard from "@/components/Dashboard";
import PurchaseGuide from "@/components/PurchaseGuide";
import Sidebar, {AppView} from "@/components/Sidebar";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import {Transaction} from "@/types/transaction";

const LOCAL_STORAGE_KEY = "transactions";
const MIGRATION_FLAG_KEY = "transactions_migrated_to_mongo";

function AppChrome({
  activeView,
  onChangeView,
  historyCount,
  children,
}: {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  historyCount: number;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const title =
    activeView.type === "dashboard"
      ? "Pulpit"
      : activeView.type === "history"
        ? "Historia"
        : activeView.type === "guide"
          ? "Instrukcja"
          : "Dodaj";

  return (
    <div className="app-shell">
      <Sidebar
        activeView={activeView}
        onChangeView={onChangeView}
        historyCount={historyCount}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="app-content">
        <header className="mobile-topbar">
          <button
            type="button"
            className="mobile-topbar-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Otwórz menu"
          >
            <span className="mobile-topbar-burger" aria-hidden />
          </button>
          <div className="flex min-w-0 items-center justify-center gap-2">
            <BrandLogo size={28} />
            <div className="min-w-0 text-left">
              <p className="brand-mark text-base font-bold leading-tight text-ink">
                Valora
              </p>
              <p className="truncate text-xs text-muted">{title}</p>
            </div>
          </div>
          <button
            type="button"
            className="mobile-topbar-btn mobile-topbar-add"
            onClick={() => onChangeView({type: "add"})}
            aria-label="Dodaj transakcję"
          >
            +
          </button>
        </header>

        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}

export default function HomeApp() {
  const {status} = useSession();
  const isAuthLoaded = status !== "loading";
  const isSignedIn = status === "authenticated";
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [activeView, setActiveView] = useState<AppView>({type: "dashboard"});

  useEffect(() => {
    if (!isAuthLoaded || !isSignedIn) {
      return;
    }

    let cancelled = false;

    async function loadTransactions() {
      setLoadError(null);

      try {
        const response = await fetch("/api/transactions");
        if (!response.ok) {
          throw new Error("Nie udało się pobrać transakcji z serwera.");
        }

        let data: Transaction[] = await response.json();

        const alreadyMigrated =
          localStorage.getItem(MIGRATION_FLAG_KEY) === "1";
        const localRaw = localStorage.getItem(LOCAL_STORAGE_KEY);

        if (!alreadyMigrated && localRaw && data.length === 0) {
          const localData = JSON.parse(localRaw) as Transaction[];
          if (localData.length > 0) {
            const migrateResponse = await fetch("/api/transactions", {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify(localData),
            });

            if (migrateResponse.ok) {
              data = await migrateResponse.json();
              localStorage.setItem(MIGRATION_FLAG_KEY, "1");
            }
          } else {
            localStorage.setItem(MIGRATION_FLAG_KEY, "1");
          }
        }

        if (!cancelled) {
          setTransactions(data);
          setIsLoaded(true);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Błąd połączenia z bazą danych.",
          );
          setIsLoaded(true);
        }
      }
    }

    void loadTransactions();

    return () => {
      cancelled = true;
    };
  }, [isAuthLoaded, isSignedIn]);

  const handleChangeView = (view: AppView) => {
    setEditingTransaction(null);
    setActiveView(view);
  };

  const saveTransaction = async (transaction: Transaction) => {
    const exists = transactions.some((item) => item.id === transaction.id);
    const response = await fetch(
      exists
        ? `/api/transactions/${transaction.id}`
        : "/api/transactions",
      {
        method: exists ? "PUT" : "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(transaction),
      },
    );

    if (!response.ok) {
      setLoadError("Nie udało się zapisać transakcji.");
      return;
    }

    const saved: Transaction = await response.json();

    setTransactions((prev) => {
      const already = prev.some((item) => item.id === saved.id);
      if (already) {
        return prev.map((item) => (item.id === saved.id ? saved : item));
      }
      return [...prev, saved];
    });

    setEditingTransaction(null);
    setActiveView({type: "history"});
  };

  const deleteTransaction = async (id: string) => {
    const previous = transactions;
    setTransactions((prev) => prev.filter((transaction) => transaction.id !== id));

    const response = await fetch(`/api/transactions/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setTransactions(previous);
      setLoadError("Nie udało się usunąć transakcji.");
    }
  };

  const updateTransaction = async (updatedTransaction: Transaction) => {
    const previous = transactions;
    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === updatedTransaction.id
          ? updatedTransaction
          : transaction,
      ),
    );

    const response = await fetch(
      `/api/transactions/${updatedTransaction.id}`,
      {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(updatedTransaction),
      },
    );

    if (!response.ok) {
      setTransactions(previous);
      setLoadError("Nie udało się zaktualizować transakcji.");
      return;
    }

    const saved: Transaction = await response.json();
    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === saved.id ? saved : transaction,
      ),
    );
  };

  const startEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setActiveView({type: "add"});
  };

  const cancelEdit = () => {
    setEditingTransaction(null);
    setActiveView({type: "history"});
  };

  const pageKey =
    activeView.type === "add"
      ? `add-${editingTransaction?.id ?? "new"}`
      : activeView.type;

  if (!isAuthLoaded || (isSignedIn && !isLoaded)) {
    return (
      <AppChrome
        activeView={activeView}
        onChangeView={handleChangeView}
        historyCount={transactions.length}
      >
        <p className="text-muted">Ładowanie portfela…</p>
      </AppChrome>
    );
  }

  return (
    <AppChrome
      activeView={activeView}
      onChangeView={handleChangeView}
      historyCount={transactions.length}
    >
      {loadError ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {loadError}
        </div>
      ) : null}

      <div key={pageKey} className="page-enter mx-auto max-w-6xl">
        {activeView.type === "dashboard" ? (
          <>
            <p className="section-label">Przegląd live</p>
            <h1 className="page-title">Pulpit</h1>
            <p className="page-lead">
              Aktualna wartość portfela, porównanie ze średnią zakupu i czytelny
              obraz każdej pozycji.
            </p>
            <div className="mt-6 sm:mt-8">
              <Dashboard transactions={transactions} />
            </div>
          </>
        ) : activeView.type === "guide" ? (
          <>
            <p className="section-label">Poradnik</p>
            <h1 className="page-title">Instrukcja zakupu</h1>
            <p className="page-lead">
              Krok po kroku: przelew PLN na Revolut, wymiana na EUR, przelew na
              Kraken i zakup kryptowaluty.
            </p>
            <div className="mt-6 sm:mt-8">
              <PurchaseGuide
                onAddTransaction={() => handleChangeView({type: "add"})}
              />
            </div>
          </>
        ) : activeView.type === "history" ? (
          <>
            <p className="section-label">Historia</p>
            <h1 className="page-title">Historia transakcji</h1>
            <p className="page-lead">
              Wszystkie zapisane transakcje w jednym miejscu. Filtruj po
              kryptowalucie zakładkami poniżej.
            </p>
            <div className="mt-6 sm:mt-8">
              <TransactionList
                transactions={transactions}
                onDeleteTransaction={deleteTransaction}
                onUpdateTransaction={updateTransaction}
                onEditTransaction={startEditTransaction}
              />
            </div>
          </>
        ) : (
          <>
            <p className="section-label">
              {editingTransaction ? "Edycja" : "Nowa pozycja"}
            </p>
            <h1 className="page-title">
              {editingTransaction ? "Edytuj transakcję" : "Dodaj transakcję"}
            </h1>
            <p className="page-lead">
              {editingTransaction
                ? "Popraw dane i zapisz zmiany."
                : "Zakup przez Revolut/Kraken albo import z innej giełdy. Po zapisie wrócisz do historii."}
            </p>
            <div className="mt-6 sm:mt-8">
              <TransactionForm
                key={editingTransaction?.id ?? "new"}
                initialTransaction={editingTransaction}
                onSaveTransaction={saveTransaction}
                onCancelEdit={editingTransaction ? cancelEdit : undefined}
              />
            </div>
          </>
        )}
      </div>
    </AppChrome>
  );
}
