import React, { useState, useMemo } from 'react';
import { Oferta } from '../types.ts';
import { Search, ExternalLink, SlidersHorizontal, Tag, Layers, CheckCircle2, AlertCircle, Copy, Check, TrendingUp, Percent, Sparkles, Calculator } from 'lucide-react';
import OfferSimulator from './OfferSimulator.tsx';

interface RadarGridProps {
  initialOfertas: Oferta[];
  isConfigured: boolean;
  token: string | null;
}

export default function RadarGrid({ initialOfertas, isConfigured, token }: RadarGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('Todas');
  const [minDiscount, setMinDiscount] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'default' | 'discount' | 'price_asc' | 'price_desc'>('default');
  const [copiedLinkId, setCopiedLinkId] = useState<string | number | null>(null);
  const [activeSimulatorId, setActiveSimulatorId] = useState<string | number | null>(null);

  // Metrics Calculations (Global overview KPIs)
  const totalOfertas = initialOfertas.length;

  const maxDiscount = useMemo(() => {
    let max = 0;
    initialOfertas.forEach(o => {
      if (o.preco_original > o.preco_desconto) {
        const pct = ((o.preco_original - o.preco_desconto) / o.preco_original) * 100;
        if (pct > max) max = pct;
      }
    });
    return Math.round(max);
  }, [initialOfertas]);

  const avgDiscount = useMemo(() => {
    const discounted = initialOfertas.filter(o => o.preco_original > o.preco_desconto);
    if (discounted.length === 0) return 0;
    const sum = discounted.reduce((acc, o) => {
      const pct = ((o.preco_original - o.preco_desconto) / o.preco_original) * 100;
      return acc + pct;
    }, 0);
    return Math.round(sum / discounted.length);
  }, [initialOfertas]);

  const leaderPlatform = useMemo(() => {
    const counts: { [key: string]: number } = {};
    initialOfertas.forEach(o => {
      if (o.plataforma) {
        counts[o.plataforma] = (counts[o.plataforma] || 0) + 1;
      }
    });
    let leader = '-';
    let max = 0;
    Object.entries(counts).forEach(([platform, count]) => {
      if (count > max) {
        max = count;
        leader = platform;
      }
    });
    return leader;
  }, [initialOfertas]);

  // Extract platforms dynamically
  const platforms = useMemo(() => {
    const list = new Set(initialOfertas.map(o => o.plataforma).filter(Boolean));
    return ['Todas', ...Array.from(list)];
  }, [initialOfertas]);

  // Filter list
  const filteredOfertas = useMemo(() => {
    return initialOfertas.filter(oferta => {
      const matchSearch = oferta.titulo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPlatform = selectedPlatform === 'Todas' || oferta.plataforma === selectedPlatform;
      
      let matchDiscount = true;
      if (minDiscount !== null && oferta.preco_original > oferta.preco_desconto) {
        const discountPercent = ((oferta.preco_original - oferta.preco_desconto) / oferta.preco_original) * 100;
        matchDiscount = discountPercent >= minDiscount;
      }

      return matchSearch && matchPlatform && matchDiscount;
    });
  }, [initialOfertas, searchTerm, selectedPlatform, minDiscount]);

  // Sort list
  const sortedOfertas = useMemo(() => {
    const offers = [...filteredOfertas];
    if (sortBy === 'discount') {
      offers.sort((a, b) => {
        const discA = a.preco_original > a.preco_desconto ? (a.preco_original - a.preco_desconto) / a.preco_original : 0;
        const discB = b.preco_original > b.preco_desconto ? (b.preco_original - b.preco_desconto) / b.preco_original : 0;
        return discB - discA;
      });
    } else if (sortBy === 'price_asc') {
      offers.sort((a, b) => a.preco_desconto - b.preco_desconto);
    } else if (sortBy === 'price_desc') {
      offers.sort((a, b) => b.preco_desconto - a.preco_desconto);
    }
    return offers;
  }, [filteredOfertas, sortBy]);

  // Copy Link handler
  const copyLink = (link: string, id: string | number) => {
    navigator.clipboard.writeText(link);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  // Helper to format currency
  const formatBRL = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Platform specific badge styles
  const getPlatformStyle = (plataforma: string) => {
    const p = plataforma.toLowerCase();
    if (p.includes('amazon')) {
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
    } else if (p.includes('mercado livre') || p.includes('mercado')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900/30';
    } else if (p.includes('shopee')) {
      return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30';
    } else {
      return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-850 dark:text-slate-350 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Status Notice (Subtle developer helper) */}
      {!isConfigured && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-sm text-amber-900 dark:text-amber-400 shadow-xs mb-4">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-semibold">Modo de Visualização (Massa de Testes)</span>
              <p className="text-xs text-amber-800 mt-0.5">
                O Supabase não foi configurado no .env. Mostrando demonstração em memória. Configure <code className="bg-amber-100/80 dark:bg-slate-800 px-1 py-0.5 rounded text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-slate-700">SUPABASE_SERVICE_ROLE_KEY</code> para persistir.
              </p>
            </div>
          </div>
          <div className="text-xs font-mono text-amber-700 dark:text-amber-450 bg-amber-100/50 dark:bg-amber-950/30 px-2 py-1 rounded border border-amber-200 dark:border-amber-900/30 shrink-0 self-end md:self-auto">
            Webhook API: /api/webhooks/ofertas (POST)
          </div>
        </div>
      )}

      {isConfigured && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/35 rounded-lg p-3 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-400 mb-4 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Sincronizado com banco de dados.</span>
        </div>
      )}

      {/* Metrics Dashboard Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Opportunities Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Monitorado</span>
            <div className="text-2xl font-black text-gray-900 dark:text-white">{totalOfertas}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-450 border border-blue-100 dark:border-blue-900/25">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Max Discount Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Maior Desconto</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">-{maxDiscount}%</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/25">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Average Discount Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Média de Desconto</span>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">-{avgDiscount}%</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-450 border border-blue-100 dark:border-blue-900/25">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        {/* Leader Platform Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Canal Líder</span>
            <div className="text-base font-extrabold text-gray-900 dark:text-white truncate max-w-[140px]">{leaderPlatform}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-450 border border-amber-100 dark:border-amber-900/25">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Tools Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Pesquisar produtos (ex: iPhone, Monitor, Cadeira...)"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-slate-800 rounded-xl leading-5 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all shadow-2xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {/* Sorting control */}
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 font-sans">
              <span className="font-bold uppercase tracking-wider text-[10px] text-gray-400 dark:text-slate-500">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg text-xs font-bold text-gray-700 dark:text-slate-350 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors"
              >
                <option value="default">Padrão</option>
                <option value="discount">Maior Desconto (%)</option>
                <option value="price_asc">Menor Preço (R$)</option>
                <option value="price_desc">Maior Preço (R$)</option>
              </select>
            </div>

            {/* Discount tiers */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-slate-400 font-sans">
              <SlidersHorizontal className="w-4 h-4 text-gray-450 mr-1 shrink-0" />
              <span className="font-bold uppercase tracking-wider text-[10px] text-gray-400 dark:text-slate-500">Desconto Mínimo:</span>
              <div className="flex bg-gray-100/90 dark:bg-slate-950/80 p-0.5 rounded-lg border border-gray-200 dark:border-slate-800/80">
                {[
                  { label: 'Todos', value: null },
                  { label: '10%+', value: 10 },
                  { label: '20%+', value: 20 },
                  { label: '30%+', value: 30 },
                  { label: '50%+', value: 50 },
                ].map(tier => (
                  <button
                    key={tier.label}
                    type="button"
                    onClick={() => setMinDiscount(tier.value)}
                    className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                      minDiscount === tier.value
                        ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-450 shadow-2xs'
                        : 'text-gray-650 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Platform Pill Selectors */}
        <div className="pt-3 border-t border-gray-100 dark:border-slate-800/85 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 font-bold font-sans tracking-wide uppercase">
            <Layers className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
            <span>Filtrar por canal de venda:</span>
          </div>
          <div className="flex bg-gray-200/70 dark:bg-slate-800/80 p-1 rounded-xl overflow-x-auto max-w-full">
            {platforms.map(platform => {
              const count = platform === 'Todas' 
                ? initialOfertas.length 
                : initialOfertas.filter(o => o.plataforma === platform).length;
              
              const isSelected = selectedPlatform === platform;

              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => setSelectedPlatform(platform)}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-450 shadow-xs'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span>{platform}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black leading-none ${
                    isSelected
                      ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-300/60 dark:bg-slate-750 text-gray-505 dark:text-slate-450'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid count display */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-slate-500 px-1 py-1">
        <span>
          Exibindo <strong className="text-gray-900 dark:text-white font-semibold">{filteredOfertas.length}</strong> {filteredOfertas.length === 1 ? 'oportunidade' : 'oportunidades'} encontradas
        </span>
        {filteredOfertas.length > 0 && (
          <span className="text-xs text-gray-400 dark:text-slate-600 font-mono">Atualizado na última rodada</span>
        )}
      </div>

      {/* Results grid */}
      {filteredOfertas.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-16 text-center shadow-xs">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-slate-950 flex items-center justify-center mx-auto border border-gray-100 dark:border-slate-850 shadow-xs">
              <Search className="w-5 h-5 text-gray-400 dark:text-slate-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Nenhum resultado encontrado</h3>
            <p className="text-sm text-gray-500 dark:text-slate-450">
              Tente redefinir os filtros de busca, reduzir o desconto mínimo, ou alternar entre canais de vendas.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedPlatform('Todas');
                setMinDiscount(null);
                setSortBy('default');
              }}
              className="mt-2 text-xs text-blue-600 dark:text-blue-450 font-semibold hover:underline"
            >
              Limpar todos os filtros
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedOfertas.map((oferta, index) => {
            const hasPrecoOriginal = oferta.preco_original && oferta.preco_original > oferta.preco_desconto;
            const discountPercent = hasPrecoOriginal
              ? Math.round(((oferta.preco_original - oferta.preco_desconto) / oferta.preco_original) * 100)
              : 0;

            return (
              <div
                key={oferta.id || `oferta-${index}`}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col group h-full transition-all hover:shadow-md duration-200"
              >
                {/* Image layout container */}
                <div className="h-40 bg-gray-50/50 dark:bg-slate-950/40 relative p-4 flex items-center justify-center border-b border-gray-100 dark:border-slate-800/80 overflow-hidden">
                  <img
                    src={oferta.imagem_url || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300'}
                    alt={oferta.titulo}
                    loading="lazy"
                    className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />

                  {/* Channel / Platform badge */}
                  <span className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-black tracking-wide rounded border uppercase shadow-xs ${getPlatformStyle(oferta.plataforma)}`}>
                    {oferta.plataforma}
                  </span>

                  {/* Discount percentage badge */}
                  {discountPercent > 0 && (
                    <span className="absolute top-2 right-2 bg-green-500 dark:bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-xs">
                      -{discountPercent}% OFF
                    </span>
                  )}
                </div>

                {/* Body Content */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-4">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-200 line-clamp-2 h-10 mb-2 leading-snug group-hover:text-blue-700 dark:group-hover:text-blue-450 transition-colors" title={oferta.titulo}>
                      {oferta.titulo}
                    </h3>

                    {/* Price structure */}
                    <div className="mt-auto">
                      {hasPrecoOriginal ? (
                        <div className="text-xs text-gray-400 dark:text-slate-500 line-through font-medium italic mb-0.5">
                          R$ {oferta.preco_original.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 dark:text-slate-500 opacity-0 italic mb-0.5">-</div>
                      )}
                      <div className="text-xl font-black text-green-600 dark:text-emerald-400 leading-none">
                        R$ {oferta.preco_desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Action Link button, Copy button & Precificar button */}
                  <div className="flex gap-2">
                    <a
                      href={oferta.url_afiliado}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center text-sm font-bold rounded-lg transition shadow-xs cursor-pointer"
                    >
                      Acessar Oferta
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        const uniqueId = oferta.id || index;
                        setActiveSimulatorId(activeSimulatorId === uniqueId ? null : uniqueId);
                      }}
                      className={`p-2 rounded-lg border transition cursor-pointer flex items-center justify-center ${
                        activeSimulatorId === (oferta.id || index)
                          ? 'bg-blue-50 border-blue-250 text-blue-650 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-400'
                          : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                      title="Simular precificação e orçamento"
                    >
                      <Calculator className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => copyLink(oferta.url_afiliado, oferta.id || index)}
                      className={`p-2 rounded-lg border transition cursor-pointer flex items-center justify-center ${
                        copiedLinkId === (oferta.id || index)
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-800 text-emerald-600'
                          : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                      title="Copiar link de afiliado"
                    >
                      {copiedLinkId === (oferta.id || index) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Pricing Simulator Section */}
                  {activeSimulatorId === (oferta.id || index) && (
                    <OfferSimulator
                      oferta={oferta}
                      token={token}
                      onClose={() => setActiveSimulatorId(null)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
