import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Search,
  FolderKanban,
  Megaphone,
  Send,
  Settings,
  Shield,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { t, user, setUser, folders } = useApp();
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: t.nav.dashboard, path: '/dashboard' },
    { icon: Search, label: t.nav.prospecting, path: '/prospecting' },
    { icon: FolderKanban, label: t.nav.crm, path: '/crm', badge: folders.length },
    { icon: Megaphone, label: t.nav.campaigns, path: '/campaigns' },
    { icon: Send, label: t.nav.messaging, path: '/messaging' },
    { icon: Settings, label: t.nav.settings, path: '/settings' },
  ];

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-sidebar-primary">LeadFlow</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                      : 'hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge variant="count" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Admin Console */}
        {user?.role === 'admin' && (
          <div className="mt-6 pt-4 border-t border-sidebar-border">
            <Link
              to="/admin"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                location.pathname === '/admin'
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                  : 'hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground'
              )}
            >
              <Shield className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t.nav.admin}</span>}
            </Link>
          </div>
        )}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        {!isCollapsed && user && (
          <div className="mb-3 px-2">
            <p className="font-medium text-sm text-sidebar-foreground truncate">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
            <Badge
              variant={user.plan === 'paid' ? 'gradient' : 'muted'}
              className="mt-1"
            >
              {user.plan === 'paid' ? 'PRO' : 'FREE'}
            </Badge>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            'w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive',
            isCollapsed && 'justify-center px-0'
          )}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>{t.nav.logout}</span>}
        </Button>
      </div>
    </aside>
  );
};
