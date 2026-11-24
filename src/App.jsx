import { useVault } from "./state/VaultContext";
import { LockScreen } from "./components/LockScreen";
import { Vault } from "./components/Vault";
import { EmptyState } from "./components/ui";

/** Picks the screen from the vault status. */
export default function App() {
  const { status, error } = useVault();
  if (status === "loading") return null; // only for a moment while storage is read
  if (status === "error") {
    return (
      <EmptyState>
        <h1 className="text-lg font-semibold text-ink">The vault can't be opened</h1>
        <p className="max-w-[420px]">{error}</p>
        <p className="max-w-[420px]">Nothing was changed. Restore the file from a backup, then open the app again.</p>
      </EmptyState>
    );
  }
  if (status === "unlocked") return <Vault />;
  return <LockScreen />; // "setup" or "locked"
}
