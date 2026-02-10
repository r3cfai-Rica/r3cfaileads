import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  Search,
  MoreVertical,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  ArrowLeft,
  Shield,
  Calendar,
  CreditCard,
  Filter,
  X,
  Send,
  Clock,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Customer {
  id: string;
  user_id: string;
  name: string;
  email: string;
  plan: string;
  plan_type: string;
  created_at: string;
  last_login: string | null;
  is_active: boolean;
  leads_used: number;
  searches_used: number;
}

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  payment_type: string | null;
  installments: number | null;
  plan_type: string;
  status: string;
  created_at: string;
}

type PlanFilter = 'all' | 'free' | 'basic' | 'premium';
type StatusFilter = 'all' | 'active' | 'inactive';

export default function AdminCustomers() {
  const { user, language } = useApp();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [payments, setPayments] = useState<Record<string, Payment[]>>({});

  // Fetch all customers and payments from database
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [customersRes, paymentsRes] = await Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }),
          supabase.from('payments').select('*').order('created_at', { ascending: false }),
        ]);

        if (customersRes.error) {
          console.error('Error fetching customers:', customersRes.error);
          toast.error('Erro ao carregar clientes');
        } else if (customersRes.data) {
          setCustomers(customersRes.data);
        }

        if (!paymentsRes.error && paymentsRes.data) {
          const grouped: Record<string, Payment[]> = {};
          paymentsRes.data.forEach((p: any) => {
            if (!grouped[p.user_id]) grouped[p.user_id] = [];
            grouped[p.user_id].push(p);
          });
          setPayments(grouped);
        }
      } catch (err) {
        console.error('Error:', err);
        toast.error('Erro ao carregar clientes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Redirect non-admins
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlan = planFilter === 'all' || 
      (planFilter === 'free' && customer.plan === 'free') ||
      (planFilter === 'basic' && customer.plan === 'paid' && customer.plan_type === 'basic') ||
      (planFilter === 'premium' && customer.plan === 'paid' && customer.plan_type === 'premium');

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && customer.is_active) ||
      (statusFilter === 'inactive' && !customer.is_active);

    return matchesSearch && matchesPlan && matchesStatus;
  });

  const hasActiveFilters = planFilter !== 'all' || statusFilter !== 'all' || searchQuery !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setPlanFilter('all');
    setStatusFilter('all');
  };

  const handleContactCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setContactSubject('');
    setContactMessage('');
    setIsContactDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedCustomer || !contactSubject.trim() || !contactMessage.trim()) {
      toast.error('Preencha o assunto e a mensagem');
      return;
    }

    try {
      // For now, we'll just copy the email to clipboard and show instructions
      await navigator.clipboard.writeText(selectedCustomer.email);
      toast.success('Email copiado! Abra seu cliente de email para enviar.');
      
      // Open mailto link
      const mailtoLink = `mailto:${selectedCustomer.email}?subject=${encodeURIComponent(contactSubject)}&body=${encodeURIComponent(contactMessage)}`;
      window.open(mailtoLink, '_blank');
      
      setIsContactDialogOpen(false);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Erro ao preparar email');
    }
  };

  const handleToggleActive = async (customer: Customer) => {
    const newStatus = !customer.is_active;
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: newStatus })
      .eq('user_id', customer.user_id);
    if (error) {
      toast.error('Erro ao alterar status');
      return;
    }
    setCustomers(prev => prev.map(c => c.user_id === customer.user_id ? { ...c, is_active: newStatus } : c));
    toast.success(newStatus ? 'Usuário ativado' : 'Usuário desativado');
  };

  const handleCancelPlan = async (customer: Customer) => {
    const { error } = await supabase
      .from('profiles')
      .update({ plan: 'free', plan_type: 'basic' })
      .eq('user_id', customer.user_id);
    if (error) {
      toast.error('Erro ao cancelar plano');
      return;
    }
    setCustomers(prev => prev.map(c => c.user_id === customer.user_id ? { ...c, plan: 'free', plan_type: 'basic' } : c));
    toast.success('Plano cancelado - usuário voltou para Free');
  };

  const getPaymentMethodLabel = (method: string | null) => {
    switch (method) {
      case 'pix': return 'Pix';
      case 'credit_card': return 'Cartão de Crédito';
      case 'boleto': return 'Boleto';
      default: return method || '—';
    }
  };

  const getPaymentInfo = (userId: string) => {
    const userPayments = payments[userId];
    if (!userPayments || userPayments.length === 0) return null;
    return userPayments[0]; // most recent
  };

  const stats = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.is_active).length,
    freeTrial: customers.filter(c => c.plan === 'free').length,
    basicPlan: customers.filter(c => c.plan === 'paid' && c.plan_type === 'basic').length,
    premiumPlan: customers.filter(c => c.plan === 'paid' && c.plan_type === 'premium').length,
    totalRevenue: customers.reduce((acc, c) => {
      if (c.plan !== 'paid') return acc;
      // Basic = R$150 one-time, Premium = R$350/month
      return acc + (c.plan_type === 'premium' ? 350 : 150);
    }, 0),
  };

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
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            CRM de Clientes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e contate todos os seus usuários
          </p>
        </div>
        <Badge variant="gradient" className="w-fit">
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card variant="stat">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                <p className="text-xs text-muted-foreground">Total Clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeCustomers}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.freeTrial}</p>
                <p className="text-xs text-muted-foreground">Teste Grátis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.basicPlan}</p>
                <p className="text-xs text-muted-foreground">Plano Basic</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.premiumPlan}</p>
                <p className="text-xs text-muted-foreground">Plano Premium</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">R$ {stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Receita Mensal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Lista de Clientes</CardTitle>
              <CardDescription>
                {filteredCustomers.length} cliente{filteredCustomers.length !== 1 ? 's' : ''} encontrado{filteredCustomers.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as PlanFilter)}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <CreditCard className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="free">Teste Grátis</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? 'Nenhum cliente encontrado com os filtros aplicados'
                  : 'Nenhum usuário cadastrado ainda'}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Desde</TableHead>
                    <TableHead>Uso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => {
                    const payment = getPaymentInfo(customer.user_id);
                    return (
                    <TableRow key={customer.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            customer.plan === 'free' 
                              ? 'outline' 
                              : customer.plan_type === 'premium' 
                                ? 'gradient' 
                                : 'secondary'
                          }
                        >
                          {customer.plan === 'free' 
                            ? 'Teste Grátis' 
                            : customer.plan_type === 'premium' 
                              ? 'Premium' 
                              : 'Basic'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment ? (
                          <div className="text-sm">
                            <p className="font-medium">{getPaymentMethodLabel(payment.payment_method)}</p>
                            <p className="text-muted-foreground">
                              R$ {(payment.amount / 100).toFixed(2)}
                              {payment.installments && payment.installments > 1 ? ` (${payment.installments}x)` : ''}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.is_active ? 'success' : 'destructive'}>
                          {customer.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(customer.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{customer.searches_used} buscas</p>
                          <p className="text-muted-foreground">{customer.leads_used} leads</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleContactCustomer(customer)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Enviar Email
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                navigator.clipboard.writeText(customer.email);
                                toast.success('Email copiado!');
                              }}
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Copiar Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleActive(customer)}>
                              {customer.is_active ? (
                                <>
                                  <X className="w-4 h-4 mr-2" />
                                  Desativar Usuário
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Ativar Usuário
                                </>
                              )}
                            </DropdownMenuItem>
                            {customer.plan === 'paid' && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleCancelPlan(customer)}
                              >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Cancelar Plano
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Contatar Cliente
            </DialogTitle>
            <DialogDescription>
              Envie um email para {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Para:</label>
              <Input value={selectedCustomer?.email || ''} disabled />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Assunto:</label>
              <Input
                placeholder="Ex: Novidades do R3CF.ai"
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Mensagem:</label>
              <Textarea
                placeholder="Digite sua mensagem..."
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={5}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSendEmail}>
                <Send className="w-4 h-4 mr-2" />
                Enviar Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
