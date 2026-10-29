import { requireProfile } from "@/lib/auth";
import {
  getAllProfiles,
  getAccounts,
  getBudgets,
  getCategories,
  getRecurring,
  getTransactions,
} from "@/lib/data";
import { getRates } from "@/lib/rates";
import { ProfileForm } from "@/components/profile-form";
import { ModeToggle } from "@/components/mode-toggle";
import { RatesCard } from "@/components/rates-card";
import { CategoriesManager } from "@/components/categories-manager";
import { BudgetsManager } from "@/components/budgets-manager";
import { RecurringManager } from "@/components/recurring-manager";
import { UsersManager } from "@/components/users-manager";
import { BackupSection } from "@/components/backup-section";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <h2 className="mb-3 text-sm font-medium">{title}</h2>
      {children}
    </div>
  );
}

export default async function AjustesPage() {
  const profile = await requireProfile();
  const admin = profile.role === "admin";

  const [categories, budgets, recurring, accounts, transactions, rates] =
    await Promise.all([
      getCategories(),
      getBudgets(),
      getRecurring(),
      getAccounts(),
      getTransactions(),
      getRates(),
    ]);

  const profiles = admin ? await getAllProfiles() : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Ajustes</h1>
        <p className="text-sm text-muted-foreground">
          Configura tu cuenta y preferencias.
        </p>
      </div>

      <Section title="Perfil">
        <ProfileForm profile={profile} />
      </Section>

      <Section title="Apariencia">
        <ModeToggle />
      </Section>

      <Section title="Tasas de cambio">
        <RatesCard rates={rates} />
        <p className="mt-2 text-xs text-muted-foreground">
          Las tasas se actualizan automáticamente desde DolarApi (BCV y
          paralelo/Binance).
        </p>
      </Section>

      <Section title="Categorías">
        <CategoriesManager categories={categories} />
      </Section>

      <Section title="Presupuestos por mes">
        <BudgetsManager
          budgets={budgets}
          categories={categories}
          transactions={transactions}
        />
      </Section>

      <Section title="Movimientos recurrentes">
        <RecurringManager
          recurring={recurring}
          accounts={accounts}
          categories={categories}
        />
      </Section>

      {admin && (
        <Section title="Usuarios">
          <UsersManager profiles={profiles} />
        </Section>
      )}

      <Section title="Respaldo">
        <BackupSection />
      </Section>
    </div>
  );
}
