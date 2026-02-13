import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PremiumReport() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-black print:p-0">
      {/* Print button - hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-50">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-1" /> Salvar como PDF
        </Button>
      </div>

      <div className="max-w-3xl mx-auto p-8 print:p-6">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-gray-800 pb-6">
          <h1 className="text-3xl font-bold text-gray-900">LeadPilot Premium</h1>
          <p className="text-lg text-gray-600 mt-1">Relatório de Custos e Projeção de Lucros</p>
          <p className="text-sm text-gray-400 mt-2">
            Gerado em: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Section 1: Limites Mensais */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            📬 Limites Mensais por Canal (por cliente)
          </h2>
          <p className="text-sm text-gray-500 mb-3">Cada cliente Premium possui os seguintes limites de disparo mensal:</p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Canal</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Limite Mensal</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Custo Unitário</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Custo Máximo/mês</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2 font-medium">Email (Resend)</td>
                <td className="border border-gray-300 px-3 py-2">500 msgs</td>
                <td className="border border-gray-300 px-3 py-2">R$ 0,015/msg</td>
                <td className="border border-gray-300 px-3 py-2">~R$ 7,50</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 font-medium">SMS (Twilio)</td>
                <td className="border border-gray-300 px-3 py-2">100 msgs</td>
                <td className="border border-gray-300 px-3 py-2">R$ 0,25/msg</td>
                <td className="border border-gray-300 px-3 py-2">~R$ 25,00 + R$ 7,50 = <strong>R$ 32,50</strong></td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 font-medium">WhatsApp (Meta)</td>
                <td className="border border-gray-300 px-3 py-2">200 conversas</td>
                <td className="border border-gray-300 px-3 py-2">R$ 0,40/conversa</td>
                <td className="border border-gray-300 px-3 py-2">~R$ 80,00</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 font-medium">Google Places API</td>
                <td className="border border-gray-300 px-3 py-2">~550 leads*</td>
                <td className="border border-gray-300 px-3 py-2">R$ 0,08/lead</td>
                <td className="border border-gray-300 px-3 py-2">~R$ 44,00</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-2 italic">
            * O Google oferece $200/mês de crédito gratuito. O custo só incide após esse crédito esgotar.
          </p>
        </section>

        {/* Section 2: Estrutura de Custos */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">📊 Estrutura de Custos (por cliente Premium/mês)</h2>
          <p className="text-sm text-gray-500 mb-3">Pior cenário (uso máximo de todos os canais):</p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Item</th>
                <th className="border border-gray-300 px-3 py-2 text-right font-semibold">Custo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2">Email (Resend)</td>
                <td className="border border-gray-300 px-3 py-2 text-right">R$ 7,50</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-3 py-2">SMS (Twilio)</td>
                <td className="border border-gray-300 px-3 py-2 text-right">R$ 32,50</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">WhatsApp (Meta)</td>
                <td className="border border-gray-300 px-3 py-2 text-right">R$ 80,00</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-3 py-2">Google Places API</td>
                <td className="border border-gray-300 px-3 py-2 text-right">R$ 44,00</td>
              </tr>
              <tr className="bg-red-50 font-bold">
                <td className="border border-gray-300 px-3 py-2">Total Máximo / cliente</td>
                <td className="border border-gray-300 px-3 py-2 text-right text-red-700">R$ 164,00</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-2 italic">
            Na prática, o custo médio real fica em torno de R$ 44/mês por cliente (poucos usam 100% de todos os canais).
          </p>
        </section>

        {/* Section 3: Projeção de Lucro */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">📈 Projeção de Lucro (Premium)</h2>
          <p className="text-sm text-gray-500 mb-3">Valores do plano: Setup R$ 250 + R$ 223/mês</p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Métrica</th>
                <th className="border border-gray-300 px-3 py-2 text-right font-semibold">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2">Receita mensal / cliente</td>
                <td className="border border-gray-300 px-3 py-2 text-right">R$ 223,00</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-3 py-2">Custo operacional médio / cliente</td>
                <td className="border border-gray-300 px-3 py-2 text-right">~R$ 44,00</td>
              </tr>
              <tr className="bg-green-50 font-bold">
                <td className="border border-gray-300 px-3 py-2 text-green-800">Lucro bruto / cliente (cenário médio)</td>
                <td className="border border-gray-300 px-3 py-2 text-right text-green-800">~R$ 179,00/mês</td>
              </tr>
              <tr className="bg-green-50">
                <td className="border border-gray-300 px-3 py-2 text-green-800 font-bold">Margem bruta (cenário médio)</td>
                <td className="border border-gray-300 px-3 py-2 text-right text-green-800 font-bold">~80%</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-3 py-2">Custo máximo / cliente (pior caso)</td>
                <td className="border border-gray-300 px-3 py-2 text-right">R$ 164,00</td>
              </tr>
              <tr className="bg-yellow-50 font-bold">
                <td className="border border-gray-300 px-3 py-2 text-yellow-800">Lucro mínimo / cliente (pior caso)</td>
                <td className="border border-gray-300 px-3 py-2 text-right text-yellow-800">~R$ 59,00/mês</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">Setup (lucro único por cliente)</td>
                <td className="border border-gray-300 px-3 py-2 text-right">R$ 250,00</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section 4: Cenários de Escala */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">🚀 Cenários de Escala</h2>
          <p className="text-sm text-gray-500 mb-3">Projeção de receita com base no cenário médio de custo (R$ 44/cliente):</p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Clientes</th>
                <th className="border border-gray-300 px-3 py-2 text-right font-semibold">Receita Mensal</th>
                <th className="border border-gray-300 px-3 py-2 text-right font-semibold">Custo Mensal</th>
                <th className="border border-gray-300 px-3 py-2 text-right font-semibold">Lucro Mensal</th>
                <th className="border border-gray-300 px-3 py-2 text-right font-semibold">Setup (único)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2 font-medium">10 clientes</td>
                <td className="border border-gray-300 px-3 py-2 text-right">R$ 2.230</td>
                <td className="border border-gray-300 px-3 py-2 text-right">R$ 440</td>
                <td className="border border-gray-300 px-3 py-2 text-right font-bold text-green-700">R$ 1.790</td>
                <td className="border border-gray-300 px-3 py-2 text-right">R$ 2.500</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 font-medium">25 clientes</td>
                <td className="border border-gray-300 px-3 py-2 text-right">R$ 5.575</td>
                <td className="border border-gray-300 px-3 py-2 text-right">R$ 1.100</td>
                <td className="border border-gray-300 px-3 py-2 text-right font-bold text-green-700">R$ 4.475</td>
                <td className="border border-gray-300 px-3 py-2 text-right">R$ 6.250</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 font-medium">50 clientes</td>
                <td className="border border-gray-300 px-3 py-2 text-right">R$ 11.150</td>
                <td className="border border-gray-300 px-3 py-2 text-right">R$ 2.200</td>
                <td className="border border-gray-300 px-3 py-2 text-right font-bold text-green-700">R$ 8.950</td>
                <td className="border border-gray-300 px-3 py-2 text-right">R$ 12.500</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 font-medium">100 clientes</td>
                <td className="border border-gray-300 px-3 py-2 text-right">R$ 22.300</td>
                <td className="border border-gray-300 px-3 py-2 text-right">R$ 4.400</td>
                <td className="border border-gray-300 px-3 py-2 text-right font-bold text-green-700">R$ 17.900</td>
                <td className="border border-gray-300 px-3 py-2 text-right">R$ 25.000</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Footer */}
        <div className="border-t-2 border-gray-800 pt-4 mt-8 text-center">
          <p className="text-xs text-gray-400">
            LeadPilot © {new Date().getFullYear()} — Documento confidencial para uso interno
          </p>
        </div>
      </div>
    </div>
  );
}
