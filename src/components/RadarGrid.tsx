import React, { useState, useMemo } from 'react';
import { Oferta } from '../types.ts';
import { Search, ExternalLink, SlidersHorizontal, Tag, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

interface RadarGridProps {
  initialOfertas: Oferta[];
  isConfigured: boolean;
  supabaseUrl?: string | null;
}

export default function RadarGrid({ initialOfertas, isConfigured, supabaseUrl }: RadarGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('Todas');
  const [minDiscount, setMinDiscount] = useState<number | null>(null);

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

  // Helper to format currency
  const formatBRL = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Platform specific badge styles
  const getPlatformStyle = (plataforma: string) => {
    const p = plataforma.toLowerCase();
    if (p.includes('amazon')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    } else if (p.includes('mercado livre') || p.includes('mercado')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else if (p.includes('shopee')) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    } else {
      return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Status Notice (Subtle developer helper) */}
      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-sm text-amber-900 shadow-xs mb-4">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-semibold">Modo de Visualização (Massa de Testes)</span>
              <p className="text-xs text-amber-800 mt-0.5">
                O Supabase não foi configurado no .env. Mostrando demonstração em memória. Configure <code className="bg-amber-100/80 px-1 py-0.5 rounded text-amber-900 border border-amber-200">SUPABASE_SERVICE_ROLE_KEY</code> para persistir.
              </p>
            </div>
          </div>
          <div className="text-xs font-mono text-amber-700 bg-amber-100/50 px-2 py-1 rounded border border-amber-200 shrink-0 self-end md:self-auto">
            Webhook API: /api/webhooks/ofertas (POST)
          </div>
        </div>
      )}

      {isConfigured && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2 text-xs text-emerald-800 mb-4 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Sincronizado com Supabase Database: <strong className="font-mono">{supabaseUrl}</strong></span>
        </div>
      )}

      {/* Filter and Tools Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Pesquisar produtos (ex: iPhone, Monitor, Cadeira...)"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all shadow-2xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-sans">
            <SlidersHorizontal className="w-4 h-4 text-gray-450 mr-1 shrink-0" />
            <span className="font-bold uppercase tracking-wider text-[10px] text-gray-400">Desconto Mínimo:</span>
            <div className="flex bg-gray-100/90 p-0.5 rounded-lg border border-gray-200">
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
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Platform Pill Selectors (Sleek Segmented Control Style) */}
        <div className="pt-3 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-bold font-sans tracking-wide uppercase">
            <Layers className="w-4 h-4 text-gray-400 shrink-0" />
            <span>Filtrar por canal de venda:</span>
          </div>
          <div className="flex bg-gray-200/70 p-1 rounded-xl overflow-x-auto max-w-full">
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
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>{platform}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black leading-none ${
                    isSelected
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-300/60 text-gray-505'
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
      <div className="flex items-center justify-between text-sm text-gray-500 px-1 py-1">
        <span>
          Exibindo <strong className="text-gray-900 font-semibold">{filteredOfertas.length}</strong> {filteredOfertas.length === 1 ? 'oportunidade' : 'oportunidades'} encontradas
        </span>
        {filteredOfertas.length > 0 && (
          <span className="text-xs text-gray-400 font-mono">Atualizado na última rodada</span>
        )}
      </div>

      {/* Results grid */}
      {filteredOfertas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-xs">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto border border-gray-100 shadow-xs">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Nenhum resultado encontrado</h3>
            <p className="text-sm text-gray-500">
              Tente redefinir os filtros de busca, reduzir o desconto mínimo, ou alternar entre canais de vendas.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedPlatform('Todas');
                setMinDiscount(null);
              }}
              className="mt-2 text-xs text-blue-600 font-semibold hover:underline"
            >
              Limpar todos os filtros
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredOfertas.map((oferta, index) => {
            const hasPrecoOriginal = oferta.preco_original && oferta.preco_original > oferta.preco_desconto;
            const discountPercent = hasPrecoOriginal
              ? Math.round(((oferta.preco_original - oferta.preco_desconto) / oferta.preco_original) * 100)
              : 0;

            return (
              <div
                key={oferta.id || `oferta-${index}`}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col group h-full transition-all hover:shadow-md duration-200"
              >
                {/* Image layout container */}
                <div className="h-40 bg-gray-50 relative p-4 flex items-center justify-center border-b border-gray-100 overflow-hidden">
                  <img
                    src={oferta.imagem_url || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300'}
                    alt={oferta.titulo}
                    loading="lazy"
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />

                  {/* Channel / Platform badge */}
                  <span className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-black tracking-wide rounded border uppercase shadow-xs ${getPlatformStyle(oferta.plataforma)}`}>
                    {oferta.plataforma}
                  </span>

                  {/* Discount percentage badge */}
                  {discountPercent > 0 && (
                    <span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-xs">
                      -{discountPercent}% OFF
                    </span>
                  )}
                </div>

                {/* Body Content */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-4">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 h-10 mb-2 leading-snug group-hover:text-blue-700 transition-colors" title={oferta.titulo}>
                      {oferta.titulo}
                    </h3>

                    {/* Price structure */}
                    <div className="mt-auto">
                      {hasPrecoOriginal ? (
                        <div className="text-xs text-gray-400 line-through font-medium italic mb-0.5">
                          R$ {oferta.preco_original.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 opacity-0 italic mb-0.5">-</div>
                      )}
                      <div className="text-xl font-black text-green-600 leading-none">
                        R$ {oferta.preco_desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Action Link button */}
                  <a
                    href={oferta.url_afiliado}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-center text-sm font-bold rounded-lg transition"
                  >
                    Acessar Oferta
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
