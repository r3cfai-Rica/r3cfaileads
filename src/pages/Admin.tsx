import React, { useState, useEffect } from 'react';
import { useApp, User } from '@/contexts/AppContext';
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
} from '@/components/ui/dropdown-menu';
import {
  Shield,
  Users,
  CreditCard,
  TrendingUp,
  Search,
  Target,
  MoreVertical,
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  BarChart3,
  FolderKanban,
  Calendar,
  Filter,
  ArrowUpRight,
  MessageSquare,
} from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AdminNotifications } from '@/components/admin/AdminNotifications';
import { useAdminStats } from '@/hooks/useAdminStats';
import { TrialSlotsManager } from '@/components/admin/TrialSlotsManager';

// No mock users — all data comes from the database

const topNiches = [
  { name: 'Revestimento Industrial', searches: 156 },
  { name: 'Marketing Digital', searches: 142 },
  { name: 'Software SaaS', searches: 98 },
  { name: 'E-commerce', searches: 87 },
  { name: 'Consultoria Financeira', searches: 76 },
];

type PlanFilter = 'all' | 'free' | 'paid';
type StatusFilter = 'all' | 'active' | 'inactive';
type DateFilter = 'all' | '7days' | '30days' | '90days';

export const Admin: React.FC = () => {
  const { t, user, allUsers, setAllUsers } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  // Use the custom hook for real stats
  const adminStats = useAdminStats();

  // Fetch real users from database
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching profiles:', error);
        } else if (profiles) {
          const mappedUsers: User[] = profiles.map(p => ({
            id: p.user_id,
            name: p.name,
            email: p.email,
            plan: p.plan as 'free' | 'paid',
            role: 'user' as const,
            searchesUsed: p.searches_used,
            leadsUsed: p.leads_used,
            isActive: p.is_active,
            createdAt: new Date(p.created_at),
            lastLogin: p.last_login ? new Date(p.last_login) : new Date(p.created_at),
          }));
          
          setDbUsers(mappedUsers);
          setAllUsers(mappedUsers);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Redirect non-admins
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const usersToShow = dbUsers.length > 0 ? dbUsers : allUsers;

  // Use real stats from hook, fall back to calculated from users
  const stats = {
    totalUsers: adminStats.totalUsers || usersToShow.length,
    paidUsers: adminStats.paidUsers || usersToShow.filter(u => u.plan === 'paid').length,
    freeUsers: adminStats.freeUsers || usersToShow.filter(u => u.plan === 'free').length,
    activeUsers: adminStats.activeUsers || usersToShow.filter(u => u.isActive).length,
    inactiveUsers: usersToShow.filter(u => !u.isActive).length,
    revenue: adminStats.totalRevenue || usersToShow.filter(u => u.plan === 'paid').length * 150,
    totalSearches: adminStats.totalSearches || usersToShow.reduce((acc, u) => acc + u.searchesUsed, 0),
    totalLeads: adminStats.totalLeads || usersToShow.reduce((acc, u) => acc + u.leadsUsed, 0),
    conversionRate: adminStats.conversionRate || (usersToShow.length > 0 
      ? Math.round((usersToShow.filter(u => u.plan === 'paid').length / usersToShow.length) * 100)
      : 0),
  };

  // Conversion data for pie chart
  const conversionData = [
    { name: 'Free', value: 100 - stats.conversionRate, color: 'hsl(var(--muted-foreground))' },
    { name: 'Convertidos', value: stats.conversionRate, color: 'hsl(var(--primary))' },
  ];

  // Apply filters
  const filteredUsers = usersToShow.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPlan = planFilter === 'all' || u.plan === planFilter;
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && u.isActive) ||
      (statusFilter === 'inactive' && !u.isActive);
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const now = new Date();
      const days = dateFilter === '7days' ? 7 : dateFilter === '30days' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      matchesDate = u.createdAt >= cutoffDate;
    }
    
    return matchesSearch && matchesPlan && matchesStatus && matchesDate;
  });

  const handleToggleActive = async (userId: string) => {
    const targetUser = usersToShow.find(u => u.id === userId);
    if (!targetUser) return;
    const newStatus = !targetUser.isActive;
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: newStatus })
      .eq('user_id', userId);
    if (!error) {
      const updated = usersToShow.map(u => u.id === userId ? { ...u, isActive: newStatus } : u);
      setDbUsers(updated);
      setAllUsers(updated);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false, plan: 'free' })
      .eq('user_id', userId);
    if (!error) {
      const updated = usersToShow.map(u => u.id === userId ? { ...u, isActive: false, plan: 'free' as const } : u);
      setDbUsers(updated);
      setAllUsers(updated);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setPlanFilter('all');
    setStatusFilter('all');
    setDateFilter('all');
  };

  const hasActiveFilters = planFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all' || searchQuery !== '';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            {t.admin.title}
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie usuários, métricas e configurações</p>
        </div>
        <div className="flex items-center gap-3">
          <AdminNotifications />
          <Link to="/admin/usage">
            <Button variant="outline" size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Monitor de Uso
            </Button>
          </Link>
          <Badge variant="gradient" className="w-fit">
            Admin Dashboard
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="stat" className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all" onClick={() => { setPlanFilter('all'); setStatusFilter('all'); }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.admin.totalUsers}</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">Clique para ver todos</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card variant="stat" className={`cursor-pointer hover:ring-2 hover:ring-success/50 transition-all ${planFilter === 'paid' ? 'ring-2 ring-success' : ''}`} onClick={() => setPlanFilter(planFilter === 'paid' ? 'all' : 'paid')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.admin.paidUsers}</p>
                <p className="text-3xl font-bold text-success">{stats.paidUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">{planFilter === 'paid' ? '✓ Filtrado' : 'Clique para filtrar'}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.admin.revenue}</p>
                <p className="text-3xl font-bold">R$ {stats.revenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Receita estimada</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat" className={`cursor-pointer hover:ring-2 hover:ring-muted-foreground/50 transition-all ${planFilter === 'free' ? 'ring-2 ring-muted-foreground' : ''}`} onClick={() => setPlanFilter(planFilter === 'free' ? 'all' : 'free')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuários Free</p>
                <p className="text-3xl font-bold">{stats.freeUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">{planFilter === 'free' ? '✓ Filtrado' : 'Clique para filtrar'}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Receita Mensal
            </CardTitle>
            <CardDescription>Evolução da receita nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {adminStats.isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={adminStats.revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `R$${value / 1000}k`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`R$ ${value.toLocaleString()}`, 'Receita']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Conversão Free → Pro
            </CardTitle>
            <CardDescription>Taxa de conversão atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={conversionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {conversionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value}%`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                <span className="text-sm">Free ({stats.freeUsers})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm">Pro ({stats.paidUsers})</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trial Slots Manager */}
      <TrialSlotsManager />

      {/* New Users Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Novos Usuários por Dia
          </CardTitle>
          <CardDescription>Cadastros da última semana por tipo de plano</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            {adminStats.isLoading ? (
              <div className="h-full flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={adminStats.newUsersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="free" name="Free" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="paid" name="Pro" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* User Management */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>{t.admin.userManagement}</CardTitle>
                  <CardDescription>{filteredUsers.length} usuários encontrados</CardDescription>
                </div>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="w-fit">
                    <XCircle className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </Button>
                )}
              </div>
              
              {/* Filters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="relative col-span-2 sm:col-span-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as PlanFilter)}>
                  <SelectTrigger>
                    <CreditCard className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Planos</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Pro</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                  <SelectTrigger>
                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Data" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Qualquer Data</SelectItem>
                    <SelectItem value="7days">Últimos 7 dias</SelectItem>
                    <SelectItem value="30days">Últimos 30 dias</SelectItem>
                    <SelectItem value="90days">Últimos 90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>{t.admin.plan}</TableHead>
                    <TableHead>{t.admin.status}</TableHead>
                    <TableHead>Buscas</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">Carregando usuários...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{u.name}</p>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.plan === 'paid' ? 'gradient' : 'muted'}>
                            {u.plan === 'paid' ? 'PRO' : 'FREE'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.isActive ? 'success' : 'destructive'}>
                            {u.isActive ? t.admin.active : t.admin.inactive}
                          </Badge>
                        </TableCell>
                        <TableCell>{u.searchesUsed}</TableCell>
                        <TableCell>{u.leadsUsed}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.createdAt.toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleToggleActive(u.id)}>
                                {u.isActive ? (
                                  <>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    {t.admin.deactivate}
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {t.admin.activate}
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reativar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteUser(u.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t.admin.delete}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Top Niches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {t.admin.topNiches}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topNiches.map((niche, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{niche.name}</p>
                    <div className="w-full bg-muted rounded-full h-2 mt-1">
                      <div
                        className="gradient-primary h-2 rounded-full"
                        style={{ width: `${(niche.searches / topNiches[0].searches) * 100}%` }}
                      />
                    </div>
                  </div>
                  <Badge variant="count">{niche.searches}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
                <Search className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.admin.searches}</p>
                <p className="text-2xl font-bold">{stats.totalSearches}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Leads Gerados</p>
                <p className="text-2xl font-bold">{stats.totalLeads.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.admin.freeUsers}</p>
                <p className="text-2xl font-bold">{stats.freeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
