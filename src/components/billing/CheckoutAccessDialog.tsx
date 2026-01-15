import React from "react";
import { ExternalLink, Copy } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string | null;
};

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Fallback
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function CheckoutAccessDialog({ open, onOpenChange, url }: Props) {
  const { toast } = useToast();

  if (!url) return null;

  const handleOpen = () => {
    window.open(url, "_blank");
  };

  const handleCopy = async () => {
    try {
      await copyToClipboard(url);
      toast({
        title: "Link copiado",
        description: "Cole em outro navegador/rede para concluir o pagamento.",
      });
    } catch {
      toast({
        title: "Não foi possível copiar",
        description: "Copie manualmente o link no campo.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pagamento PRO</DialogTitle>
          <DialogDescription>
            Se a página de cartão ficar em branco, provavelmente sua rede (ex.: Wi‑Fi corporativo) está bloqueando o provedor de pagamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">Link do pagamento</p>
            <Input value={url} readOnly onFocus={(e) => e.currentTarget.select()} />
            <p className="text-xs text-muted-foreground">
              Dica: tente abrir em 4G/roteador do celular, VPN, ou outra rede.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar link
          </Button>
          <Button type="button" variant="gradientCTA" onClick={handleOpen}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
