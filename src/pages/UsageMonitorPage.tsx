import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { Navigate, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UsageMonitor } from '@/components/admin/UsageMonitor';
import { MessageSquare, ArrowLeft, Shield } from 'lucide-react';

export const UsageMonitorPage: React.FC = () => {
  const { user } = useApp();

  // Redirect non-admins
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Admin
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            Monitor de Uso de Mensagens
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o uso de WhatsApp, SMS e Email de cada cliente
          </p>
        </div>
        <Badge variant="gradient" className="w-fit">
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      </div>

      {/* Usage Monitor Component */}
      <UsageMonitor />
    </div>
  );
};

export default UsageMonitorPage;
