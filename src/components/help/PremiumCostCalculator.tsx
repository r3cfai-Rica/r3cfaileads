import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calculator, Mail, MessageSquare, Phone, TrendingUp, DollarSign } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// Custos de referência (valores médios)
const COSTS = {
  // Resend: $0.003 per email after 3000 free
  email: {
    costPerUnit: 0.015, // R$ 0.015 por email (aprox $0.003 * 5)
    freeQuota: 3000,
    unitName: 'email',
  },
  // Twilio SMS: ~$0.05 per SMS
  sms: {
    costPerUnit: 0.25, // R$ 0.25 por SMS (aprox $0.05 * 5)
    monthlyNumber: 7.5, // R$ 7.50/mês pelo número (aprox $1.50 * 5)
    unitName: 'SMS',
  },
  // WhatsApp: $0.05-0.15 per conversation
  whatsapp: {
    costPerUnit: 0.40, // R$ 0.40 por conversa (média)
    unitName: 'conversa',
  },
};

// Margem de lucro sugerida
const PROFIT_MARGINS = [
  { label: 'Mínima (30%)', value: 0.30 },
  { label: 'Padrão (50%)', value: 0.50 },
  { label: 'Premium (70%)', value: 0.70 },
  { label: 'Alto valor (100%)', value: 1.00 },
];

export default function PremiumCostCalculator() {
  const [emailVolume, setEmailVolume] = useState(1000);
  const [smsVolume, setSmsVolume] = useState(500);
  const [whatsappVolume, setWhatsappVolume] = useState(200);
  const [profitMargin, setProfitMargin] = useState(0.50);
  const [setupFee, setSetupFee] = useState(150);

  const costs = useMemo(() => {
    // Email cost (considera quota gratuita)
    const billableEmails = Math.max(0, emailVolume - COSTS.email.freeQuota);
    const emailCost = billableEmails * COSTS.email.costPerUnit;

    // SMS cost (inclui custo do número)
    const smsCost = (smsVolume * COSTS.sms.costPerUnit) + COSTS.sms.monthlyNumber;

    // WhatsApp cost
    const whatsappCost = whatsappVolume * COSTS.whatsapp.costPerUnit;

    // Total cost
    const totalCost = emailCost + smsCost + whatsappCost;

    // Preço sugerido com margem
    const suggestedPrice = totalCost * (1 + profitMargin);

    // Lucro
    const profit = suggestedPrice - totalCost;

    // Preço total com setup
    const totalWithSetup = suggestedPrice + setupFee;

    return {
      email: emailCost,
      sms: smsCost,
      whatsapp: whatsappCost,
      totalCost,
      suggestedPrice,
      profit,
      totalWithSetup,
      billableEmails,
    };
  }, [emailVolume, smsVolume, whatsappVolume, profitMargin, setupFee]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <CardTitle>Calculadora de Custos Premium</CardTitle>
        </div>
        <CardDescription>
          Calcule quanto cobrar de cada cliente Premium baseado no volume de mensagens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Volume Inputs */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Email Volume */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-orange-500" />
              <Label className="font-medium">Volume de Emails/mês</Label>
            </div>
            <Input
              type="number"
              value={emailVolume}
              onChange={(e) => setEmailVolume(Number(e.target.value))}
              min={0}
              className="text-lg font-medium"
            />
            <Slider
              value={[emailVolume]}
              onValueChange={(v) => setEmailVolume(v[0])}
              max={50000}
              step={100}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground">
              {costs.billableEmails > 0 
                ? `${costs.billableEmails.toLocaleString()} emails cobráveis (após 3.000 grátis)`
                : 'Dentro da quota gratuita (3.000 emails)'}
            </p>
          </div>

          {/* SMS Volume */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-500" />
              <Label className="font-medium">Volume de SMS/mês</Label>
            </div>
            <Input
              type="number"
              value={smsVolume}
              onChange={(e) => setSmsVolume(Number(e.target.value))}
              min={0}
              className="text-lg font-medium"
            />
            <Slider
              value={[smsVolume]}
              onValueChange={(v) => setSmsVolume(v[0])}
              max={10000}
              step={50}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground">
              + R$ {COSTS.sms.monthlyNumber.toFixed(2)}/mês pelo número Twilio
            </p>
          </div>

          {/* WhatsApp Volume */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-500" />
              <Label className="font-medium">Conversas WhatsApp/mês</Label>
            </div>
            <Input
              type="number"
              value={whatsappVolume}
              onChange={(e) => setWhatsappVolume(Number(e.target.value))}
              min={0}
              className="text-lg font-medium"
            />
            <Slider
              value={[whatsappVolume]}
              onValueChange={(v) => setWhatsappVolume(v[0])}
              max={5000}
              step={25}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground">
              Conversas = threads de 24h com um lead
            </p>
          </div>
        </div>

        <Separator />

        {/* Margin & Setup */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <Label className="font-medium">Margem de Lucro</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {PROFIT_MARGINS.map((margin) => (
                <button
                  key={margin.value}
                  onClick={() => setProfitMargin(margin.value)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    profitMargin === margin.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted hover:bg-muted/80 border-border'
                  }`}
                >
                  {margin.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <Label className="font-medium">Taxa de Setup (R$)</Label>
            </div>
            <Input
              type="number"
              value={setupFee}
              onChange={(e) => setSetupFee(Number(e.target.value))}
              min={0}
              className="text-lg font-medium"
            />
            <p className="text-xs text-muted-foreground">
              Cobrado uma vez na contratação
            </p>
          </div>
        </div>

        <Separator />

        {/* Results */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Cost Breakdown */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Seu Custo (Provedores)
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-orange-500" />
                  Email (Resend)
                </span>
                <span className="font-medium">{formatCurrency(costs.email)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-blue-500" />
                  SMS (Twilio)
                </span>
                <span className="font-medium">{formatCurrency(costs.sms)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-green-500" />
                  WhatsApp (Meta)
                </span>
                <span className="font-medium">{formatCurrency(costs.whatsapp)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total Custo/mês</span>
                <span className="text-destructive">{formatCurrency(costs.totalCost)}</span>
              </div>
            </div>
          </div>

          {/* Suggested Price */}
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg p-4 space-y-3 border border-primary/20">
            <h4 className="font-semibold text-sm text-primary uppercase tracking-wide">
              Preço Sugerido
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Mensalidade</span>
                <span className="font-medium">{formatCurrency(costs.suggestedPrice)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Seu Lucro/mês</span>
                <span className="font-medium">+{formatCurrency(costs.profit)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Taxa Setup (1x)</span>
                <span className="font-medium">{formatCurrency(setupFee)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Primeiro Mês</span>
                <span className="text-primary">{formatCurrency(costs.totalWithSetup)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Recorrente: {formatCurrency(costs.suggestedPrice)}/mês
              </p>
            </div>
          </div>
        </div>

        {/* Reference Table */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-3">📊 Referência de Custos por Unidade</h4>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <p className="font-medium text-orange-500">Email (Resend)</p>
              <p className="text-muted-foreground">~R$ 0,015/email</p>
              <p className="text-muted-foreground">3.000 grátis/mês</p>
            </div>
            <div>
              <p className="font-medium text-blue-500">SMS (Twilio)</p>
              <p className="text-muted-foreground">~R$ 0,25/SMS</p>
              <p className="text-muted-foreground">+R$ 7,50/mês número</p>
            </div>
            <div>
              <p className="font-medium text-green-500">WhatsApp (Meta)</p>
              <p className="text-muted-foreground">~R$ 0,40/conversa</p>
              <p className="text-muted-foreground">24h = 1 conversa</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
