import React, { useState } from 'react';
import { useApp, Folder, Lead } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FolderKanban,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
  ChevronRight,
  Search,
  Mail,
  Phone,
  MessageCircle,
  Bookmark,
  History,
  ArrowLeft,
} from 'lucide-react';

export const CRM: React.FC = () => {
  const { t, folders, setFolders, leads, setLeads, ctas, searchHistory } = useApp();
  
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      leadCount: 0,
      createdAt: new Date(),
    };
    
    setFolders([...folders, newFolder]);
    setNewFolderName('');
    setShowNewFolderDialog(false);
  };

  const handleUpdateFolder = () => {
    if (!editingFolder || !editingFolder.name.trim()) return;
    
    setFolders(folders.map(f => 
      f.id === editingFolder.id ? editingFolder : f
    ));
    setEditingFolder(null);
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders(folders.filter(f => f.id !== folderId));
    setLeads(leads.filter(l => l.folderId !== folderId));
    if (selectedFolder?.id === folderId) {
      setSelectedFolder(null);
    }
  };

  const getFolderLeads = (folderId: string) => {
    return leads.filter(l => l.folderId === folderId);
  };

  const getFolderCTAs = (folderId: string) => {
    return ctas.filter(c => c.folderId === folderId);
  };

  const getFolderHistory = (folderId: string) => {
    return searchHistory.filter(s => s.folderId === folderId);
  };

  const filteredLeads = selectedFolder
    ? getFolderLeads(selectedFolder.id).filter(lead => {
        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
        const matchesSearch = !searchQuery || 
          lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.intentSignal.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
      })
    : [];

  const statusVariant = {
    new: 'new' as const,
    contacted: 'contacted' as const,
    qualified: 'qualified' as const,
    converted: 'converted' as const,
  };

  if (selectedFolder) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Folder Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedFolder(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{selectedFolder.name}</h1>
              <p className="text-muted-foreground">
                {getFolderLeads(selectedFolder.id).length} {t.crm.leads}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2">
          <Button variant="ghost" className="gap-2">
            <Users className="w-4 h-4" />
            Leads ({getFolderLeads(selectedFolder.id).length})
          </Button>
          <Button variant="ghost" className="gap-2">
            <Bookmark className="w-4 h-4" />
            {t.crm.savedCTAs} ({getFolderCTAs(selectedFolder.id).length})
          </Button>
          <Button variant="ghost" className="gap-2">
            <History className="w-4 h-4" />
            {t.crm.nicheHistory} ({getFolderHistory(selectedFolder.id).length})
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-[180px]">
              <SelectValue placeholder={t.crm.allStatus} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.crm.allStatus}</SelectItem>
              <SelectItem value="new">{t.crm.new}</SelectItem>
              <SelectItem value="contacted">{t.crm.contacted}</SelectItem>
              <SelectItem value="qualified">{t.crm.qualified}</SelectItem>
              <SelectItem value="converted">{t.crm.converted}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leads Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} variant="interactive">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{lead.name}</h4>
                    <p className="text-sm text-muted-foreground">{lead.position}</p>
                  </div>
                  <Badge variant={statusVariant[lead.status]}>{lead.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{lead.intentSignal}</p>
                <div className="flex items-center gap-2">
                  {lead.email && (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Mail className="w-4 h-4" />
                    </Button>
                  )}
                  {lead.phone && (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Phone className="w-4 h-4" />
                    </Button>
                  )}
                  {lead.whatsapp && (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <Card className="py-12">
            <CardContent className="text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">Nenhum lead encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-primary-foreground" />
            </div>
            {t.crm.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.crm.subtitle}</p>
        </div>
        <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
          <DialogTrigger asChild>
            <Button variant="gradient" className="gap-2">
              <Plus className="w-4 h-4" />
              {t.crm.newFolder}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.crm.newFolder}</DialogTitle>
              <DialogDescription>Crie uma pasta para organizar leads por nicho</DialogDescription>
            </DialogHeader>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Ex: Revestimento Industrial"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                {t.common.cancel}
              </Button>
              <Button onClick={handleCreateFolder}>
                {t.common.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Folders Grid */}
      {folders.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <Card
              key={folder.id}
              variant="interactive"
              className="cursor-pointer"
              onClick={() => setSelectedFolder(folder)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <FolderKanban className="w-6 h-6 text-primary" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setEditingFolder(folder);
                      }}>
                        <Pencil className="w-4 h-4 mr-2" />
                        {t.common.edit}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t.common.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="font-semibold text-lg mb-1">{folder.name}</h3>
                <div className="flex items-center justify-between">
                  <Badge variant="count">{folder.leadCount} {t.crm.leads}</Badge>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-16">
          <CardContent className="text-center">
            <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <FolderKanban className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t.crm.noFolders}</h3>
            <p className="text-muted-foreground mb-4">{t.crm.createFirst}</p>
            <Button variant="gradient" onClick={() => setShowNewFolderDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t.crm.newFolder}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Folder Dialog */}
      <Dialog open={!!editingFolder} onOpenChange={(open) => !open && setEditingFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pasta</DialogTitle>
          </DialogHeader>
          <Input
            value={editingFolder?.name || ''}
            onChange={(e) => setEditingFolder(editingFolder ? { ...editingFolder, name: e.target.value } : null)}
            placeholder="Nome da pasta"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFolder(null)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleUpdateFolder}>
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRM;
