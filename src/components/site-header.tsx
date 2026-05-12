import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur px-6 md:px-10 py-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-serif font-semibold tracking-tight text-ink">
        Case<span className="text-accent italic">Coach</span>
      </Link>
      <nav className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground">
        <a href="/#methodology" className="hover:text-ink">Methodology</a>
        <a href="/#frameworks" className="hover:text-ink">Frameworks</a>
        <a href="/#how" className="hover:text-ink">How it works</a>
      </nav>
      <div className="flex gap-2 items-center">
        {user ? (
          <>
            <Link to="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
            <Button size="sm" variant="outline" onClick={() => signOut()}>Sign out</Button>
          </>
        ) : (
          <>
            <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/signup"><Button size="sm" className="bg-ink text-primary-foreground hover:bg-ink/90 rounded-sm">Sign up</Button></Link>
          </>
        )}
      </div>
    </header>
  );
}
