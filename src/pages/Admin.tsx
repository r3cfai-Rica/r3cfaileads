import React, { useState, useEffect } from 'react';
import { useApp, User } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

// Mock users for demo
const mockUsers: User[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@empresa.com',
    plan: 'paid',
    role: 'user',
    searchesUsed: 45,
    leadsUsed: 387,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date('2024-03-10'),
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@startup.io',
    plan: 'free',
    role: 'user',
    searchesUsed: 1,
    leadsUsed: 10,
    isActive: true,
    createdAt: new Date('2024-02-20'),
    lastLogin: new Date('2024-03-09'),
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    email: 'carlos@tech.com',
    plan: 'paid',
    role: 'user',
    searchesUsed: 78,
    leadsUsed: 1250,
    isActive: false,
    createdAt: new Date('2023-11-05'),
    lastLogin: new Date('2024-02-15'),
  },
  {
    id: '4',
    name: 'Ana Costa',
    email: 'ana@marketing.co',
    plan: 'free',
    role: 'user',
    searchesUsed: 1,
    leadsUsed: 8,
    isActive: true,
    createdAt: new Date('2024-03-01'),
    lastLogin: new Date('2024-03-10'),
  },
];

const topNiches = [
  { name: 'Revestimento Industrial', searches: 156 },
  { name: 'Marketing Digital', searches: 142 },
  { name: 'Software SaaS', searches: 98 },
  { name: 'E-commerce', searches: 87 },
  { name: 'Consultoria Financeira', searches: 76 },
];

export const Admin: React.FC = () => {
  const { t, user, allUsers, setAllUsers } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load mock users on mount
    if (allUsers.length === 0) {
      setAllUsers(mockUsers);
    }
  }, [allUsers.length, setAllUsers]);

  // Redirect non-admins
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const stats = {
    totalUsers: allUsers.length,
    paidUsers: allUsers.filter(u => u.plan === 'paid').length,
    freeUsers: allUsers.filter(u => u.plan === 'free').length,
    revenue: allUsers.filter(u => u.plan === 'paid').length * 150, // R$150 per user
    totalSearches: allUsers.reduce((acc, u) => acc + u.searchesUsed, 0),
    totalLeads: allUsers.reduce((acc, u) => acc + u.leadsUsed, 0),
  };

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleActive = (userId: string) => {
    setAllUsers(allUsers.map(u => 
      u.id === userId ? { ...u, isActive: !u.isActive } : u
    ));
  };

  const handleDeleteUser = (userId: string) => {
    setAllUsers(allUsers.filter(u => u.id !== userId));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          {t.admin.title}
        </h1>
        <p className="text-muted-foreground mt-1">Gerencie usuários, métricas e configurações</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="stat">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.admin.totalUsers}</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card variant="stat">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.admin.paidUsers}</p>
                <p className="text-3xl font-bold text-success">{stats.paidUsers}</p>
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
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.admin.leadsGenerated}</p>
                <p className="text-3xl font-bold">{stats.totalLeads.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* User Management */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>{t.admin.userManagement}</CardTitle>
                <CardDescription>{filteredUsers.length} usuários encontrados</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
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
                    <TableHead>{t.admin.lastLogin}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
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
                        {u.lastLogin.toLocaleDateString()}
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
                  ))}
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
      <div className="grid md:grid-cols-3 gap-4">
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
                <p className="text-sm text-muted-foreground">Nichos Criados</p>
                <p className="text-2xl font-bold">127</p>
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
