import React, { useState, useEffect, useRef } from 'react';
import { Oferta } from '../types.ts';
import { 
  Calculator, 
  Users, 
  UserPlus, 
  Phone, 
  Mail, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Search,
  MessageSquare
} from 'lucide-react';

interface Contact {
  ID: string;
  NAME: string;
  LAST_NAME: string;
  PHONE: string;
  EMAIL: string;
}

interface Seller {
  ID: string;
  NAME: string;
  LAST_NAME: string;
  WORK_POSITION: string;
}

interface OfferSimulatorProps {
  oferta: Oferta;
  token: string | null;
  onClose: () => void;
}

export default function OfferSimulator({ oferta, token, onClose }: OfferSimulatorProps) {
  // Simulator inputs
  const [margin, setMargin] = useState<number>(35); // standard 35% margin
  const [shippingType, setShippingType] = useState<string>('médio');
  const [customShipping, setCustomShipping] = useState<number>(150);
  const [quoteTitle, setQuoteTitle] = useState<string>(`Orçamento - ${oferta.titulo.substring(0, 30)}...`);
  const [quantity, setQuantity] = useState<number>(1);

  // Client Selection states
  const [clientType, setClientType] = useState<'existing' | 'new'>('existing');
  
  // Existing client search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  // New client inputs
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  // Seller/User assignment states
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string>('');
  const [isLoadingSellers, setIsLoadingSellers] = useState(false);
  const [sellerErrorMsg, setSellerErrorMsg] = useState('');

  // API Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepMessage, setStepMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<{ quoteId: number | string; url: string } | null>(null);

  // Debounce search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-update custom shipping when shippingType changes
  useEffect(() => {
    switch (shippingType) {
      case 'leve':
        setCustomShipping(50);
        break;
      case 'médio':
        setCustomShipping(150);
        break;
      case 'grande':
        setCustomShipping(300);
        break;
      case 'pesado':
        setCustomShipping(500);
        break;
      default:
        break; // custom input remains unchanged
    }
  }, [shippingType]);

  // Load active sellers from Bitrix24
  useEffect(() => {
    const fetchSellers = async () => {
      setIsLoadingSellers(true);
      setSellerErrorMsg('');
      try {
        const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch('/api/bitrix/users', { headers });
        if (res.ok) {
          const data = await res.json();
          setSellers(data);
          if (data.length > 0) {
            setSelectedSellerId(data[0].ID);
          }
        } else {
          const errData = await res.json();
          if (res.status === 500 && errData.details?.includes('401')) {
            setSellerErrorMsg('Erro 401: Falta a permissão "User (user)" no seu webhook do Bitrix24.');
          } else {
            setSellerErrorMsg(errData.error || 'Erro ao carregar vendedores.');
          }
        }
      } catch (err) {
        console.error('Failed fetching sellers:', err);
        setSellerErrorMsg('Falha de rede ao carregar vendedores.');
      } finally {
        setIsLoadingSellers(false);
      }
    };
    fetchSellers();
  }, [token]);

  // Handle Contact search API call
  useEffect(() => {
    if (clientType !== 'existing' || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`/api/bitrix/search-contacts?query=${encodeURIComponent(searchQuery)}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error('Failed searching contacts:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, clientType, token]);

  // Calculated Pricing Values
  const precoCusto = oferta.preco_desconto;
  const precoComMargem = precoCusto * (1 + margin / 100);
  const precoFinal = precoComMargem + customShipping;
  const lucroNominal = precoComMargem - precoCusto;
  const valorTotalOrcamento = precoFinal * quantity;

  // Handle Form Submission to create Quote
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessData(null);

    // Validations
    if (!quoteTitle.trim()) {
      setErrorMsg('Por favor, informe o título do orçamento.');
      return;
    }
    if (clientType === 'existing' && !selectedContact) {
      setErrorMsg('Por favor, busque e selecione um cliente cadastrado.');
      return;
    }
    if (clientType === 'new' && !newClientName.trim()) {
      setErrorMsg('Por favor, preencha o nome do novo cliente.');
      return;
    }

    setIsSubmitting(true);
    setStepMessage(clientType === 'new' ? 'Cadastrando novo cliente no Bitrix24...' : 'Verificando cliente selecionado...');

    try {
      const headers: HeadersInit = { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const payload = {
        title: quoteTitle,
        productName: oferta.titulo,
        costPrice: precoCusto,
        profitMargin: margin,
        shipping: customShipping,
        finalPrice: Math.round(precoFinal * 100) / 100,
        link: oferta.url_afiliado,
        clientType,
        clientId: selectedContact?.ID || null,
        clientName: newClientName,
        clientPhone: newClientPhone,
        clientEmail: newClientEmail,
        assignedById: selectedSellerId || null,
        quantity
      };

      // Simulated loader change to make it feel premium
      if (clientType === 'new') {
        setTimeout(() => {
          setStepMessage('Cliente registrado! Gerando orçamento...');
        }, 1200);
      } else {
        setTimeout(() => {
          setStepMessage('Criando orçamento vinculando o cliente no Bitrix24...');
        }, 800);
      }

      const res = await fetch('/api/bitrix/create-quote', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao processar cotação no servidor.');
      }

      const data = await res.json();
      setSuccessData({
        quoteId: data.quoteId,
        url: data.url
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao se conectar com a API.');
    } finally {
      setIsSubmitting(false);
      setStepMessage('');
    }
  };

  // WhatsApp share string formatter
  const handleWhatsAppShare = () => {
    if (!successData) return;

    const activeSeller = sellers.find(s => s.ID === selectedSellerId);
    const sellerName = activeSeller ? `${activeSeller.NAME} ${activeSeller.LAST_NAME}` : 'Não atribuído';

    const msg = `📦 *ORÇAMENTO DE OPORTUNIDADE - INFORE*
-----------------------------------------
👤 *Cliente:* ${clientType === 'existing' ? `${selectedContact?.NAME} ${selectedContact?.LAST_NAME}` : newClientName}
🛍️ *Item:* ${oferta.titulo}
🔢 *Quantidade:* ${quantity}
💵 *Preço de Custo (Un):* R$ ${precoCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
📈 *Margem Aplicada:* ${margin}%
🚚 *Frete:* R$ ${customShipping.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
💰 *Preço Unitário (Venda):* R$ ${precoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
💵 *Valor Total:* R$ ${valorTotalOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
👤 *Vendedor Responsável:* ${sellerName}
-----------------------------------------
🔗 *Link de Compra:* ${oferta.url_afiliado}
📌 *Orçamento no Bitrix24:* ${successData.url}
🔢 *ID no Bitrix24:* #${successData.quoteId}`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 space-y-4 text-left font-sans transition-all duration-300">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
          <Calculator className="w-4 h-4" />
          Simulador de Precificação
        </h4>
        <button
          onClick={onClose}
          className="text-[10px] font-bold text-gray-400 dark:text-slate-500 hover:text-gray-650 dark:hover:text-slate-350 cursor-pointer"
        >
          Cancelar
        </button>
      </div>

      {successData ? (
        // Success panel
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-850/65 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Orçamento Criado com Sucesso!</span>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-450 leading-snug">
                Os dados de precificação foram exportados para o Bitrix24 e a cotação <strong className="font-extrabold text-emerald-950 dark:text-white">#{successData.quoteId}</strong> foi criada.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1.5">
            <a
              href={successData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir no Bitrix24
            </a>
            <button
              onClick={handleWhatsAppShare}
              className="py-1.5 px-3 bg-white dark:bg-slate-900 border border-emerald-250 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Grupo WhatsApp
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-900/35 rounded-xl p-3 flex items-start gap-2 text-xs text-rose-800 dark:text-rose-450 shadow-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Pricing parameters */}
          <div className="grid grid-cols-2 gap-3">
            {/* Profit margin */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Margem de Lucro</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={margin}
                  onChange={e => setMargin(Number(e.target.value))}
                  disabled={isSubmitting}
                  className="w-full pl-3 pr-7 py-1.5 border border-gray-300 dark:border-slate-800 rounded-lg text-xs font-bold bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
              </div>
              
              {/* quick margin selectors */}
              <div className="flex gap-1">
                {[30, 40, 100].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setMargin(pct)}
                    className={`flex-1 py-0.5 rounded border text-[9px] font-bold transition cursor-pointer ${
                      margin === pct
                        ? 'bg-blue-50 border-blue-250 text-blue-650 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-400'
                        : 'bg-white border-gray-200 text-gray-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    +{pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Freight */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Frete Estimado</label>
              <select
                value={shippingType}
                onChange={e => setShippingType(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-800 rounded-lg text-xs font-semibold bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="leve">Leve (R$ 50)</option>
                <option value="médio">Médio (R$ 150)</option>
                <option value="grande">Grande (R$ 300)</option>
                <option value="pesado">Pesado (R$ 500)</option>
                <option value="custom">Personalizado</option>
              </select>

              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">R$</span>
                <input
                  type="number"
                  min="0"
                  value={customShipping}
                  onChange={e => {
                    setShippingType('custom');
                    setCustomShipping(Number(e.target.value));
                  }}
                  disabled={isSubmitting}
                  className="w-full pl-7 pr-3 py-1 border border-gray-300 dark:border-slate-800 rounded-lg text-xs font-bold bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Quantity selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Quantidade de Itens</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
              disabled={isSubmitting}
              className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-800 rounded-lg text-xs font-bold bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Pricing Result Card */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800/80 rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 dark:text-slate-400 font-medium">Preço Unitário sugerido:</span>
              <span className="text-gray-900 dark:text-slate-150 font-bold">R$ {precoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 dark:text-slate-400 font-medium">Quantidade:</span>
              <span className="text-gray-950 dark:text-slate-300 font-bold">x{quantity}</span>
            </div>
            <div className="flex justify-between items-center text-xs pt-1.5 border-t border-dashed border-gray-200 dark:border-slate-850">
              <span className="text-gray-900 dark:text-slate-200 font-extrabold">Valor Total do Orçamento:</span>
              <span className="text-sm font-black text-green-600 dark:text-emerald-400">R$ {valorTotalOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Customer Selection Header */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Associação do Cliente</label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setClientType('existing');
                  setErrorMsg('');
                }}
                className={`flex-1 py-1.5 px-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                  clientType === 'existing'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-white border-gray-200 text-gray-650 dark:bg-slate-900 dark:border-slate-850 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Existente
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setClientType('new');
                  setErrorMsg('');
                }}
                className={`flex-1 py-1.5 px-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                  clientType === 'new'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-white border-gray-200 text-gray-650 dark:bg-slate-900 dark:border-slate-850 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Novo Cliente
              </button>
            </div>
          </div>

          {/* Customer Selection details */}
          {clientType === 'existing' ? (
            <div className="space-y-2 relative">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Pesquisar cliente por nome..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    if (selectedContact) setSelectedContact(null);
                  }}
                  disabled={isSubmitting}
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-300 dark:border-slate-800 rounded-lg text-xs font-semibold bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                {isSearching && (
                  <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 animate-spin" />
                )}
              </div>

              {/* Autocomplete suggestion drop list */}
              {searchResults.length > 0 && !selectedContact && (
                <div className="absolute z-30 w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1 divide-y divide-gray-100 dark:divide-slate-850">
                  {searchResults.map(c => (
                    <button
                      key={c.ID}
                      type="button"
                      onClick={() => {
                        setSelectedContact(c);
                        setSearchQuery(`${c.NAME} ${c.LAST_NAME}`);
                        setSearchResults([]);
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-900 text-gray-800 dark:text-slate-200 font-medium block cursor-pointer transition-colors"
                    >
                      <div className="font-bold">{c.NAME} {c.LAST_NAME}</div>
                      {c.PHONE && <div className="text-[10px] text-gray-400 mt-0.5">{c.PHONE}</div>}
                    </button>
                  ))}
                </div>
              )}

              {/* Selected contact badge */}
              {selectedContact && (
                <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-150 dark:border-blue-900/30 rounded-lg p-2.5 flex items-center justify-between text-xs text-blue-900 dark:text-blue-300">
                  <div>
                    <span className="font-extrabold">{selectedContact.NAME} {selectedContact.LAST_NAME}</span>
                    {selectedContact.PHONE && <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-0.5">📞 {selectedContact.PHONE}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedContact(null);
                      setSearchQuery('');
                    }}
                    className="text-[10px] font-black text-rose-500 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>
          ) : (
            // New client form fields
            <div className="space-y-2.5 bg-slate-50/50 dark:bg-slate-950/20 border border-gray-150 dark:border-slate-800/80 rounded-xl p-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Nome do Cliente</label>
                <input
                  type="text"
                  placeholder="Ex: João Silva da Cruz"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-800 rounded-lg text-xs font-semibold bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Telefone/WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
                    <input
                      type="text"
                      placeholder="Ex: (11) 98888-8888"
                      value={newClientPhone}
                      onChange={e => setNewClientPhone(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full pl-7 pr-3 py-1.5 border border-gray-300 dark:border-slate-800 rounded-lg text-xs font-semibold bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
                    <input
                      type="email"
                      placeholder="Ex: joao@email.com"
                      value={newClientEmail}
                      onChange={e => setNewClientEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full pl-7 pr-3 py-1.5 border border-gray-300 dark:border-slate-800 rounded-lg text-xs font-semibold bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Seller selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Vendedor Responsável</label>
            {isLoadingSellers ? (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                <span>Carregando vendedores...</span>
              </div>
            ) : sellerErrorMsg ? (
              <div className="text-[11px] text-rose-600 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1.5 rounded-lg border border-rose-105 dark:border-rose-900/35 flex items-center gap-1.5 shadow-2xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                <span>{sellerErrorMsg}</span>
              </div>
            ) : (
              <select
                value={selectedSellerId}
                onChange={e => setSelectedSellerId(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-800 rounded-lg text-xs font-semibold bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer animate-fade-in"
              >
                <option value="">-- Selecione o Vendedor --</option>
                {sellers.map(s => (
                  <option key={s.ID} value={s.ID}>
                    {s.NAME} {s.LAST_NAME} {s.WORK_POSITION ? `(${s.WORK_POSITION})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quote document title */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Título do Orçamento (Bitrix24)</label>
            <input
              type="text"
              value={quoteTitle}
              onChange={e => setQuoteTitle(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-800 rounded-lg text-xs font-semibold bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Submit action button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:dark:bg-blue-900 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-[10px] tracking-wide animate-pulse">{stepMessage}</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Criar Orçamento no Bitrix24
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
