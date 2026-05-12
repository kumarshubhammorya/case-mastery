import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const { signOut, user } = useAuth();
  return (
    <header className="border-b border-border bg-surface px-6 md:px-10 py-4 flex justify-between items-center">
      <div className="flex items-center gap-10">
        <Link to="/dashboard" className="text-xl font-serif font-semibold tracking-tight text-ink">
          Case<span className="text-accent italic">Coach</span>
        </Link>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
          <Link to="/dashboard" className="hover:text-ink" activeProps={{ className: "text-ink" }}>Dashboard</Link>
          <Link to="/cases" className="hover:text-ink" activeProps={{ className: "text-ink" }}>Library</Link>
          <Link to="/sessions" className="hover:text-ink" activeProps={{ className: "text-ink" }}>History</Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden md:inline text-xs text-muted-foreground">{user?.email}</span>
        <Button size="sm" variant="outline" onClick={() => signOut()}>Sign out</Button>
      </div>
    </header>
  );
}
