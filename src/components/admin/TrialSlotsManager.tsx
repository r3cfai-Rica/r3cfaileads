import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  UserPlus, 
  UserMinus, 
  Clock, 
  Crown,
  RefreshCw,
  Search,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDistanceToNow, addDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TrialSlot {
  id: string;
  slot_number: number;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  granted_at: string | null;
  expires_at: string | null;
}

interface UserSearchResult {
  user_id: string;
  name: string;
  email: string;
  plan: string;
}

export const TrialSlotsManager: React.FC = () => {
  const [slots, setSlots] = useState<TrialSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<TrialSlot | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('trial_slots')
        .select('*')
        .order('slot_number');

      if (error) throw error;
      setSlots(data || []);
    } catch (error) {
      console.error('Error fetching trial slots:', error);
      toast.error('Erro ao carregar slots de teste');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const searchUsers = async () => {
    if (!searchEmail.trim()) return;
    
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, email, plan')
        .ilike('email', `%${searchEmail}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Erro ao buscar usuários');
    } finally {
      setSearching(false);
    }
  };

  const assignUserToSlot = async (user: UserSearchResult) => {
    if (!selectedSlot) return;
    
    setActionLoading(true);
    try {
      const now = new Date();
      const expiresAt = addDays(now, 2);

      const { error } = await supabase
        .from('trial_slots')
        .update({
          user_id: user.user_id,
          user_email: user.email,
          user_name: user.name,
          granted_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', selectedSlot.id);

      if (error) throw error;

      toast.success(`Acesso concedido a ${user.name} por 2 dias!`);
      setIsAddDialogOpen(false);
      setSelectedSlot(null);
      setSearchEmail('');
      setSearchResults([]);
      fetchSlots();
    } catch (error) {
      console.error('Error assigning user:', error);
      toast.error('Erro ao conceder acesso');
    } finally {
      setActionLoading(false);
    }
  };

  const removeUserFromSlot = async () => {
    if (!selectedSlot) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('trial_slots')
        .update({
          user_id: null,
          user_email: null,
          user_name: null,
          granted_at: null,
          expires_at: null,
        })
        .eq('id', selectedSlot.id);

      if (error) throw error;

      toast.success('Acesso removido com sucesso!');
      setIsRemoveDialogOpen(false);
      setSelectedSlot(null);
      fetchSlots();
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Erro ao remover acesso');
    } finally {
      setActionLoading(false);
    }
  };

  const getSlotStatus = (slot: TrialSlot) => {
    if (!slot.user_id) return 'empty';
    if (slot.expires_at && isPast(new Date(slot.expires_at))) return 'expired';
    return 'active';
  };

  const getTimeRemaining = (expiresAt: string) => {
    const expDate = new Date(expiresAt);
    if (isPast(expDate)) return 'Expirado';
    return formatDistanceToNow(expDate, { addSuffix: true, locale: ptBR });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Slots de Teste VIP
              </CardTitle>
              <CardDescription>
                Gerencie até 5 usuários com acesso ilimitado por 2 dias
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchSlots}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {slots.map((slot) => {
              const status = getSlotStatus(slot);
              
              return (
                <div
                  key={slot.id}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    status === 'active' 
                      ? 'border-green-500/50 bg-green-500/5' 
                      : status === 'expired'
                        ? 'border-red-500/50 bg-red-500/5'
                        : 'border-dashed border-muted-foreground/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        status === 'active' 
                          ? 'bg-green-500 text-white' 
                          : status === 'expired'
                            ? 'bg-red-500 text-white'
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {slot.slot_number}
                      </div>
                      
                      {slot.user_id ? (
                        <div>
                          <p className="font-medium">{slot.user_name || 'Usuário'}</p>
                          <p className="text-sm text-muted-foreground">{slot.user_email}</p>
                          {slot.expires_at && (
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              <span className={`text-xs ${
                                status === 'expired' ? 'text-red-500' : 'text-green-500'
                              }`}>
                                {getTimeRemaining(slot.expires_at)}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-muted-foreground">Slot vazio</p>
                          <p className="text-xs text-muted-foreground">Clique para adicionar um usuário</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {status === 'active' && (
                        <Badge variant="default" className="bg-green-500">
                          Ativo
                        </Badge>
                      )}
                      {status === 'expired' && (
                        <Badge variant="destructive">
                          Expirado
                        </Badge>
                      )}
                      
                      {slot.user_id ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSlot(slot);
                            setIsRemoveDialogOpen(true);
                          }}
                        >
                          <UserMinus className="w-4 h-4 mr-1" />
                          Remover
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedSlot(slot);
                            setIsAddDialogOpen(true);
                          }}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Adicionar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Usuário ao Slot {selectedSlot?.slot_number}</DialogTitle>
            <DialogDescription>
              Busque um usuário pelo e-mail para conceder acesso ilimitado por 2 dias.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Digite o e-mail do usuário..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              />
              <Button onClick={searchUsers} disabled={searching}>
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.user_id}
                    className="p-3 border rounded-lg flex items-center justify-between hover:bg-accent cursor-pointer"
                    onClick={() => assignUserToSlot(user)}
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant={user.plan === 'paid' ? 'default' : 'secondary'}>
                      {user.plan === 'paid' ? 'PRO' : 'FREE'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {searchEmail && searchResults.length === 0 && !searching && (
              <div className="flex items-center gap-2 text-muted-foreground p-3 border rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>Nenhum usuário encontrado</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove User Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Acesso</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover o acesso de {selectedSlot?.user_name}?
              O usuário perderá o acesso ilimitado imediatamente.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={removeUserFromSlot}
              disabled={actionLoading}
            >
              {actionLoading ? 'Removendo...' : 'Remover Acesso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
