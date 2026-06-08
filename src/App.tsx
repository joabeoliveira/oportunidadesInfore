import React, { useEffect, useState } from 'react';
import { Oferta } from './types.ts';
import RadarGrid from './components/RadarGrid.tsx';
import { Radio, RefreshCw, Send, HelpCircle, Copy, Check, Sparkles } from 'lucide-react';
import logoInfore from '../assets/logo.svg';

export default function App() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'docs'>('dashboard');
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  // Authentication states
  const [token, setToken] = useState<string | null>(localStorage.getItem('infore_session'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('infore_session', data.token);
        setToken(data.token);
        setIsAuthenticated(true);
      } else {
        const data = await res.json();
        setLoginError(data.error || 'Senha incorreta.');
      }
    } catch (err) {
      setLoginError('Falha ao se conectar com o servidor.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('infore_session');
    setToken(null);
    setIsAuthenticated(false);
    setPassword('');
  };

  // Load resources from Express backend
  const fetchData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);

    try {
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

      // Fetch status
      const statusRes = await fetch('/api/status', { headers });
      if (statusRes.status === 401) {
        handleLogout();
        return;
      }
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setIsConfigured(statusData.configured);
      }

      // Fetch offers
      const ofertasRes = await fetch('/api/ofertas', { headers });
      if (ofertasRes.status === 401) {
        handleLogout();
        return;
      }
      if (ofertasRes.ok) {
        const ofertasData = await ofertasRes.json();
        setOfertas(ofertasData.ofertas || []);
      }
    } catch (err) {
      console.error('Falha de conexão com a API backend:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchData();
      const interval = setInterval(() => {
        fetchData(false); // Fetch quietly in background
      }, 600000); // every 10 minutes
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token]);

  // Send interactive local mock n8n webhook payload to test
  const sendTestWebhook = async () => {
    setSendingTest(true);
    setTestSuccess(false);
    try {
      const testPayload = [
        {
          titulo: "🔥 [TEST] Echo Dot 5ª Geração com Relógio e Alexa Inteligente",
          preco_original: 449.00,
          preco_desconto: 329.00,
          url_afiliado: "https://www.amazon.com.br",
          imagem_url: "https://images.unsplash.com/photo-1543512214-318c7553f230?w=400",
          plataforma: "Amazon"
        },
        {
          titulo: "🔥 [TEST] Smartwatch Apple Watch SE (2ª Geração) GPS 40mm",
          preco_original: 3299.00,
          preco_desconto: 2499.00,
          url_afiliado: "https://www.mercadolivre.com.br",
          imagem_url: "https://images.unsplash.com/photo-1517502884422-41eaaced0168?w=400",
          plataforma: "Mercado Livre"
        }
      ];

      const res = await fetch('/api/webhooks/ofertas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer INFORE_MVP_TOKEN_2026'
        },
        body: JSON.stringify(testPayload)
      });

      if (res.ok) {
        setTestSuccess(true);
        // Reload data
        await fetchData(true);
        setTimeout(() => setTestSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Falha ao acionar webhook teste:', err);
    } finally {
      setSendingTest(false);
    }
  };

  const curlCommand = `curl -X POST -H "Content-Type: application/json" \\
-d '[
  {
    "titulo": "Smartphone Samsung S24 Ultra",
    "preco_original": 6999.00,
    "preco_desconto": 5499.00,
    "url_afiliado": "https://www.mercadolivre.com.br",
    "imagem_url": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400",
    "plataforma": "Mercado Livre"
  }
]' \\
\${window.location.protocol}//\${window.location.host}/api/webhooks/ofertas`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-radial from-slate-900 to-gray-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-6 relative z-10 text-white">
          <div className="flex flex-col items-center space-y-4 text-center">
            {/* Logo Infore */}
            <img src={logoInfore} alt="Infore Logo" className="h-10 w-auto object-contain" />
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold tracking-tight">Acesso Restrito</h2>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                Radar de Oportunidades • Painel Administrativo
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Senha de Acesso
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Insira a senha do painel"
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                required
                disabled={isLoggingIn}
              />
            </div>

            {loginError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold p-3 rounded-xl text-center">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 transition rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 active:scale-[0.98] duration-150 flex items-center justify-center gap-2 cursor-pointer text-white"
            >
              {isLoggingIn ? 'Verificando...' : 'Entrar no Painel'}
            </button>
          </form>

          <div className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            © {new Date().getFullYear()} INFORE TECNOLOGIA
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-sans">
      {/* Top Banner and Brand Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-xs backdrop-blur-md px-6 sm:px-8 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:h-20">
        {/* Logo Group */}
        <div className="flex items-center gap-4">
          <img
            src={logoInfore}
            alt="Infore Logo"
            className="h-8 w-auto object-contain hover:scale-105 transition-transform duration-300 cursor-pointer"
            style={{ filter: 'brightness(0)' }}
          />
          <div className="border-l border-gray-200 pl-4 py-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              Radar de Oportunidades
              <Radio className="w-5 h-5 text-blue-600 animate-pulse" />
            </h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">
              Monitoramento Interno • Atualizado diariamente
            </p>
          </div>
        </div>

        {/* Navigation & Actions */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex bg-gray-200/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Todas Ofertas
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'docs'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Configurar n8n
            </button>
          </div>

          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2 px-3 rounded-xl border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Atualizar ofertas"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-2 px-4 rounded-xl border border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-50 hover:border-rose-300 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Sair do Painel"
          >
            <span>Sair</span>
          </button>

          <div className="hidden lg:flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl ml-1 text-right">
            <div className="text-left">
              <div className="text-[10px] font-bold text-gray-400 tracking-widest leading-none">STATUS DO FEED</div>
              <div className="flex items-center gap-1 text-emerald-600 font-extrabold text-xs leading-none mt-1 uppercase">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                Operacional
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Banner Section */}
        <div className="bg-radial from-slate-900 to-gray-950 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/25 px-2.5 py-0.5 rounded-full text-xs text-blue-400 font-medium">
              <Sparkles className="w-3.5 h-3.5 animate-bounce" />
              <span>Conectado c/ Automação n8n</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Radar de Oportunidades
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Ofertas diárias selecionadas e organizadas de forma 100% autônoma. Buscamos as melhores opções das principais plataformas como Amazon, Mercado Livre e Shopee.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3 relative z-10">
            <button
              onClick={sendTestWebhook}
              disabled={sendingTest}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] duration-150"
            >
              <Send className={`w-3.5 h-3.5 ${sendingTest ? 'animate-bounce' : ''}`} />
              {sendingTest ? 'Enviando...' : 'Testar Envio n8n'}
            </button>
            
            <button
              onClick={() => setActiveTab('docs')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Guia API
            </button>
          </div>

          {/* Abstract geometric glass decor */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Dynamic Alert on Test Webhook Sent */}
        {testSuccess && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 flex items-center gap-3 text-sm text-blue-800 animate-fade-in shadow-xs">
            <Check className="w-5 h-5 text-blue-600" />
            <span>
              <strong>Sucesso!</strong> Payload simulado com sucesso. O radar foi atualizado instantaneamente via endpoint de webhook.
            </span>
          </div>
        )}

        {/* Tab content renderer */}
        {activeTab === 'dashboard' ? (
          <div>
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm text-gray-500 font-medium">Carregando painel de ofertas...</p>
              </div>
            ) : ofertas.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center max-w-lg mx-auto shadow-sm space-y-4">
                <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <Radio className="w-6 h-6 text-gray-400" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-gray-900">Aguardando ofertas...</h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-sans">
                    Nenhuma oferta ativa cadastrada. Assim que a integração com o n8n disparar o envio, elas serão exibidas aqui. Use o botão <strong>"Testar Envio n8n"</strong> acima para povoar dados demo instantaneamente!
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={sendTestWebhook}
                    disabled={sendingTest}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 mx-auto cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Ativar Primeiro Envio
                  </button>
                </div>
              </div>
            ) : (
              <RadarGrid
                initialOfertas={ofertas}
                isConfigured={isConfigured}
              />
            )}
          </div>
        ) : (
          /* Integrations Documentation tab */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-gray-950">Como integrar sua automação n8n</h2>
              <p className="text-xs text-gray-400">Desenvolvido sob o padrão Infore & Fazedor Confiável</p>
            </div>

            <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
              <p>
                Este painel está totalmente exposto e pronto para receber dados periódicos ou em tempo real. No n8n, configure um node de <strong className="text-gray-900">HTTP Request</strong> apontando para o endpoint abaixo usando o método POST.
              </p>

              {/* Endpoint card */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">ENDPOINT WEBHOOK</span>
                  <div className="font-mono text-xs font-bold text-gray-950 pt-1">
                    POST {window.location.protocol}//{window.location.host}/api/webhooks/ofertas
                  </div>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 self-stretch md:self-auto justify-center cursor-pointer transition-all"
                >
                  {copiedCurl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar CURL</span>
                    </>
                  )}
                </button>
              </div>

              {/* Payload requirements section */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Formato esperado do Array de Ofertas (Payload JSON)</h3>
                <pre className="bg-slate-950 text-slate-300 p-4 rounded-xl text-[11px] font-mono overflow-x-auto border border-slate-800 leading-normal">
{`[
  {
    "titulo": "Monitor Gamer LG UltraWide 29 IPS 75Hz",
    "preco_original": 1299.00,
    "preco_desconto": 999.00,
    "url_afiliado": "https://www.amazon.com.br/dp/B088M...",
    "imagem_url": "https://m.media-amazon.com/images/...",
    "plataforma": "Amazon"
  }
]`}
                </pre>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong>Nota sobre o Banco de Dados (Supabase):</strong>
                  <p className="text-blue-900/80 leading-normal">
                    Toda vez que este endpoint recebe uma nova lista, todos os registros anteriores são excluídos automaticamente (deletados) antes de gravar sob o novo payload recebido para garantir consistência pura diariamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Status */}
      <footer className="bg-white border-t border-gray-200 px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-4 mt-16 shadow-2xs">
        <div className="text-xs text-gray-400 font-medium font-sans">
          © {new Date().getFullYear()} INFORE TECNOLOGIA • PLATAFORMA INTERNA
        </div>
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
            Sincronização via n8n: OK
          </div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
            Base Supabase: {ofertas.length} {ofertas.length === 1 ? 'registro' : 'registros'}
          </div>
        </div>
      </footer>
    </div>
  );
}
