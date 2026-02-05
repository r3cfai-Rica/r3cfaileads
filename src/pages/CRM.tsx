import React, { useState, useEffect, useCallback } from 'react';
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
  Eye,
  Download,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { LeadDetailDialog } from '@/components/crm/LeadDetailDialog';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import { useFolders } from '@/hooks/useFolders';
import { useLeads } from '@/hooks/useLeads';

const CRM_STORAGE_KEY = 'crm_view_state';

interface CRMState {
  selectedFolderId: string | null;
  statusFilter: string;
  searchQuery: string;
}

export const CRM: React.FC = () => {
  const { t, language, ctas, searchHistory } = useApp();
  const { folders, createFolder, updateFolder, deleteFolder } = useFolders();
  const { leads, deleteLead } = useLeads();
  
  // Load persisted state from sessionStorage
  const loadPersistedState = useCallback((): CRMState | null => {
    try {
      const saved = sessionStorage.getItem(CRM_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading CRM state:', e);
    }
    return null;
  }, []);

  const persistedState = loadPersistedState();
  const initialFolder = persistedState?.selectedFolderId 
    ? folders.find(f => f.id === persistedState.selectedFolderId) || null
    : null;

  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(initialFolder);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(persistedState?.statusFilter || 'all');
  const [searchQuery, setSearchQuery] = useState(persistedState?.searchQuery || '');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadDetail, setShowLeadDetail] = useState(false);

  // Sync selectedFolder when folders load (for initial page load)
  useEffect(() => {
    if (!selectedFolder && persistedState?.selectedFolderId && folders.length > 0) {
      const folder = folders.find(f => f.id === persistedState.selectedFolderId);
      if (folder) setSelectedFolder(folder);
    }
  }, [folders, persistedState?.selectedFolderId, selectedFolder]);

  // Persist state to sessionStorage whenever it changes
  useEffect(() => {
    const stateToSave: CRMState = {
      selectedFolderId: selectedFolder?.id || null,
      statusFilter,
      searchQuery,
    };
    sessionStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [selectedFolder, statusFilter, searchQuery]);

  // Clear search/filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
  }, []);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    const newFolder = await createFolder(newFolderName);
    if (newFolder) {
      setNewFolderName('');
      setShowNewFolderDialog(false);
    }
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !editingFolder.name.trim()) return;
    
    await updateFolder(editingFolder.id, editingFolder.name);
    setEditingFolder(null);
  };

  const handleDeleteFolder = async (folderId: string) => {
    const success = await deleteFolder(folderId);
    if (success && selectedFolder?.id === folderId) {
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

  const handleExportToExcel = async (folder: Folder) => {
    const folderLeads = getFolderLeads(folder.id);
    
    if (folderLeads.length === 0) {
      toast.error(language === 'pt-BR' ? 'Nenhum lead para exportar' : 'No leads to export');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Leads');

      // Define columns
      worksheet.columns = [
        { header: 'Nome', key: 'nome', width: 25 },
        { header: 'Cargo/Posição', key: 'cargo', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Telefone', key: 'telefone', width: 15 },
        { header: 'WhatsApp', key: 'whatsapp', width: 15 },
        { header: 'Localização', key: 'localizacao', width: 20 },
        { header: 'Sinal de Intenção', key: 'sinal', width: 40 },
        { header: 'Urgência', key: 'urgencia', width: 10 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Concorrente', key: 'concorrente', width: 12 },
        { header: 'Fontes', key: 'fontes', width: 30 },
        { header: 'Data de Criação', key: 'data', width: 15 },
      ];

      // Add data
      folderLeads.forEach((lead) => {
        worksheet.addRow({
          nome: lead.name,
          cargo: lead.position || '',
          email: lead.email || '',
          telefone: lead.phone || '',
          whatsapp: lead.whatsapp || '',
          localizacao: lead.location || '',
          sinal: lead.intentSignal,
          urgencia: lead.urgency,
          status: lead.status,
          concorrente: lead.isCompetitor ? 'Sim' : 'Não',
          fontes: lead.sources?.join(', ') || '',
          data: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-BR') : '',
        });
      });

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      
      const date = new Date().toISOString().split('T')[0];
      const sanitizedFolderName = folder.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `CRM_${sanitizedFolderName}_${date}.xlsx`;
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(language === 'pt-BR' ? `${folderLeads.length} leads exportados!` : `${folderLeads.length} leads exported!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(language === 'pt-BR' ? 'Erro ao exportar' : 'Export error');
    }
  };

  const handleExportAllLeads = async () => {
    if (leads.length === 0) {
      toast.error(language === 'pt-BR' ? 'Nenhum lead para exportar' : 'No leads to export');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Todos os Leads');

      // Define columns
      worksheet.columns = [
        { header: 'Pasta', key: 'pasta', width: 20 },
        { header: 'Nome', key: 'nome', width: 25 },
        { header: 'Cargo/Posição', key: 'cargo', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Telefone', key: 'telefone', width: 15 },
        { header: 'WhatsApp', key: 'whatsapp', width: 15 },
        { header: 'Localização', key: 'localizacao', width: 20 },
        { header: 'Sinal de Intenção', key: 'sinal', width: 40 },
        { header: 'Urgência', key: 'urgencia', width: 10 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Concorrente', key: 'concorrente', width: 12 },
        { header: 'Fontes', key: 'fontes', width: 30 },
        { header: 'Data de Criação', key: 'data', width: 15 },
      ];

      // Add data
      leads.forEach((lead) => {
        const folder = folders.find(f => f.id === lead.folderId);
        worksheet.addRow({
          pasta: folder?.name || 'Sem pasta',
          nome: lead.name,
          cargo: lead.position || '',
          email: lead.email || '',
          telefone: lead.phone || '',
          whatsapp: lead.whatsapp || '',
          localizacao: lead.location || '',
          sinal: lead.intentSignal,
          urgencia: lead.urgency,
          status: lead.status,
          concorrente: lead.isCompetitor ? 'Sim' : 'Não',
          fontes: lead.sources?.join(', ') || '',
          data: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-BR') : '',
        });
      });

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      
      const date = new Date().toISOString().split('T')[0];
      const filename = `CRM_Todos_Leads_${date}.xlsx`;
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(language === 'pt-BR' ? `${leads.length} leads exportados!` : `${leads.length} leads exported!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(language === 'pt-BR' ? 'Erro ao exportar' : 'Export error');
    }
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
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => handleExportToExcel(selectedFolder)}
            disabled={getFolderLeads(selectedFolder.id).length === 0}
          >
            <FileSpreadsheet className="w-4 h-4" />
            {language === 'pt-BR' ? 'Exportar Excel' : 'Export Excel'}
          </Button>
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
          {(searchQuery || statusFilter !== 'all') && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleClearFilters}
              title={language === 'pt-BR' ? 'Limpar filtros' : 'Clear filters'}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Leads Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <Card 
              key={lead.id} 
              variant="interactive"
              className="cursor-pointer group"
              onClick={() => {
                setSelectedLead(lead);
                setShowLeadDetail(true);
              }}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium group-hover:text-primary transition-colors">{lead.name}</h4>
                      <Eye className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm text-muted-foreground">{lead.position}</p>
                  </div>
                  <Badge variant={statusVariant[lead.status]}>{lead.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{lead.intentSignal}</p>
                <div className="flex items-center gap-2">
                  {lead.email && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `mailto:${lead.email}`;
                      }}
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                  )}
                  {lead.phone && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `tel:${lead.phone}`;
                      }}
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  )}
                  {lead.whatsapp && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://wa.me/${lead.whatsapp?.replace(/\D/g, '')}`, '_blank');
                      }}
                    >
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

        {/* Lead Detail Dialog */}
        <LeadDetailDialog
          lead={selectedLead}
          open={showLeadDetail}
          onOpenChange={setShowLeadDetail}
          language={language}
        />
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
        <div className="flex gap-2">
          {leads.length > 0 && (
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleExportAllLeads}
            >
              <Download className="w-4 h-4" />
              {language === 'pt-BR' ? 'Exportar Todos' : 'Export All'}
            </Button>
          )}
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
