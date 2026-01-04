import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function AppLayout() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center font-bold text-sm">
                PF
              </div>
              <span className="text-xl font-bold">PlanFlow</span>
            </Link>

            <nav className="flex items-center space-x-1">
              <Link
                to="/"
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors',
                  isActive('/') && location.pathname === '/'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Home
              </Link>
              <Link
                to="/plans"
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors',
                  isActive('/plans')
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Plans
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
