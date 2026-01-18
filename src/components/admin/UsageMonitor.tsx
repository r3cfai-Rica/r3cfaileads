import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  AlertTriangle,
  Settings2,
  Loader2,
  Crown,
  User as UserIcon,
  TrendingUp
} from 'lucide-react';

interface UserUsage {
  user_id: string;
  user_name: string;
  user_email: string;
  plan_type: string;
  whatsapp_used: number;
  whatsapp_limit: number;
  sms_used: number;
  sms_limit: number;
  email_used: number;
  email_limit: number;
  billing_cycle_start: string;
}

interface EditLimitsData {
  user_id: string;
  user_name: string;
  whatsapp_limit: number;
  sms_limit: number;
  email_limit: number;
}

export const UsageMonitor: React.FC = () => {
  const [usageData, setUsageData] = useState<UserUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [editData, setEditData] = useState<EditLimitsData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsageData();
  }, []);

  const loadUsageData = async () => {
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, email, plan')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // For now, create mock usage data based on profiles
      // The real usage data will be available once types are regenerated
      const combined: UserUsage[] = (profiles || []).map((profile: any) => ({
        user_id: profile.user_id,
        user_name: profile.name,
        user_email: profile.email,
        plan_type: profile.plan === 'paid' ? 'premium' : 'basic',
        whatsapp_used: 0,
        whatsapp_limit: profile.plan === 'paid' ? 1000 : 0,
        sms_used: 0,
        sms_limit: profile.plan === 'paid' ? 500 : 0,
        email_used: 0,
        email_limit: profile.plan === 'paid' ? 2000 : 0,
        billing_cycle_start: new Date().toISOString(),
      }));

      setUsageData(combined);
    } catch (error) {
      console.error('Error loading usage data:', error);
      toast.error('Erro ao carregar dados de uso');
    } finally {
      setLoading(false);
    }
  };

  const handleEditLimits = (user: UserUsage) => {
    setEditData({
      user_id: user.user_id,
      user_name: user.user_name,
      whatsapp_limit: user.whatsapp_limit,
      sms_limit: user.sms_limit,
      email_limit: user.email_limit,
    });
    setEditDialog(true);
  };

  const handleSaveLimits = async () => {
    if (!editData) return;
    
    setSaving(true);
    try {
      // Update local state for now
      setUsageData(prev => prev.map(u => 
        u.user_id === editData.user_id 
          ? { ...u, whatsapp_limit: editData.whatsapp_limit, sms_limit: editData.sms_limit, email_limit: editData.email_limit }
          : u
      ));

      toast.success('Limites atualizados!');
      setEditDialog(false);
    } catch (error) {
      console.error('Error saving limits:', error);
      toast.error('Erro ao salvar limites');
    } finally {
      setSaving(false);
    }
  };

  const getUsagePercent = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const isLowCredits = (user: UserUsage) => {
    if (user.plan_type === 'basic') return false;
    const checkLimit = (used: number, limit: number) => limit > 0 && used >= limit * 0.8;
    return checkLimit(user.whatsapp_used, user.whatsapp_limit) ||
           checkLimit(user.sms_used, user.sms_limit) ||
           checkLimit(user.email_used, user.email_limit);
  };

  const premiumUsers = usageData.filter(u => u.plan_type === 'premium');
  const basicUsers = usageData.filter(u => u.plan_type === 'basic');
  const lowCreditUsers = usageData.filter(isLowCredits);

  const totalStats = {
    whatsapp: usageData.reduce((sum, u) => sum + u.whatsapp_used, 0),
    sms: usageData.reduce((sum, u) => sum + u.sms_used, 0),
    email: usageData.reduce((sum, u) => sum + u.email_used, 0),
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{premiumUsers.length}</p>
                <p className="text-sm text-muted-foreground">Clientes Premium</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <UserIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{basicUsers.length}</p>
                <p className="text-sm text-muted-foreground">Clientes Básicos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowCreditUsers.length}</p>
                <p className="text-sm text-muted-foreground">Créditos Baixos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.whatsapp + totalStats.sms + totalStats.email}</p>
                <p className="text-sm text-muted-foreground">Mensagens Enviadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage by Channel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-green-500" />
              <span className="font-medium">WhatsApp</span>
            </div>
            <p className="text-3xl font-bold">{totalStats.whatsapp}</p>
            <p className="text-sm text-muted-foreground">mensagens este mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-blue-500" />
              <span className="font-medium">SMS</span>
            </div>
            <p className="text-3xl font-bold">{totalStats.sms}</p>
            <p className="text-sm text-muted-foreground">mensagens este mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-orange-500" />
              <span className="font-medium">Email</span>
            </div>
            <p className="text-3xl font-bold">{totalStats.email}</p>
            <p className="text-sm text-muted-foreground">emails este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Uso por Cliente</CardTitle>
          <CardDescription>
            Monitore o uso de mensagens de cada cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>SMS</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageData.map(user => (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.user_name}</p>
                      <p className="text-sm text-muted-foreground">{user.user_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.plan_type === 'premium' ? 'default' : 'secondary'}>
                      {user.plan_type === 'premium' ? (
                        <><Crown className="w-3 h-3 mr-1" /> Premium</>
                      ) : (
                        'Básico'
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <MessageSquare className="w-3 h-3 text-green-500" />
                        {user.whatsapp_used} / {user.whatsapp_limit || '∞'}
                      </div>
                      {user.whatsapp_limit > 0 && (
                        <Progress 
                          value={getUsagePercent(user.whatsapp_used, user.whatsapp_limit)} 
                          className="h-1"
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-3 h-3 text-blue-500" />
                        {user.sms_used} / {user.sms_limit || '∞'}
                      </div>
                      {user.sms_limit > 0 && (
                        <Progress 
                          value={getUsagePercent(user.sms_used, user.sms_limit)} 
                          className="h-1"
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-3 h-3 text-orange-500" />
                        {user.email_used} / {user.email_limit || '∞'}
                      </div>
                      {user.email_limit > 0 && (
                        <Progress 
                          value={getUsagePercent(user.email_used, user.email_limit)} 
                          className="h-1"
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.plan_type === 'premium' && (
                      <Button size="sm" variant="ghost" onClick={() => handleEditLimits(user)}>
                        <Settings2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Limits Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Limites</DialogTitle>
            <DialogDescription>
              Ajuste os limites de envio para {editData?.user_name}
            </DialogDescription>
          </DialogHeader>
          {editData && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp_limit">Limite WhatsApp (0 = ilimitado)</Label>
                <Input
                  id="whatsapp_limit"
                  type="number"
                  min="0"
                  value={editData.whatsapp_limit}
                  onChange={(e) => setEditData({ ...editData, whatsapp_limit: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sms_limit">Limite SMS (0 = ilimitado)</Label>
                <Input
                  id="sms_limit"
                  type="number"
                  min="0"
                  value={editData.sms_limit}
                  onChange={(e) => setEditData({ ...editData, sms_limit: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_limit">Limite Email (0 = ilimitado)</Label>
                <Input
                  id="email_limit"
                  type="number"
                  min="0"
                  value={editData.email_limit}
                  onChange={(e) => setEditData({ ...editData, email_limit: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveLimits} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsageMonitor;
