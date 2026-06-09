# 🎁 Oportunidades Infore - MVP

**Plataforma de agregação inteligente de oportunidades de compras** com integração de IA generativa (Gemini) para análise e descoberta de produtos com melhor relação custo-benefício.

[![Status](https://img.shields.io/badge/Status-MVP_Active-brightgreen)]()
[![Language](https://img.shields.io/badge/Language-TypeScript-3178C6)]()
[![Framework](https://img.shields.io/badge/Framework-React-61DAFB)]()
[![Runtime](https://img.shields.io/badge/Runtime-Node.js-339933)]()

---

## 🎯 Visão Geral

**Oportunidades Infore** é uma MVP (Minimum Viable Product) desenvolvida para automatizar a descoberta e análise de oportunidades de compras em múltiplas plataformas e-commerce. A plataforma integra:

- **🤖 IA Generativa**: Google Gemini para análise inteligente de produtos
- **🛒 Múltiplas Plataformas**: Mercado Livre, Amazon, Shopee e outras
- **💾 Banco de Dados**: Supabase para persistência de ofertas
- **⚡ Webhooks**: Integração com n8n para automação de fluxos
- **🎨 Interface Moderna**: React + Tailwind CSS com animações fluidas

---

## 🚀 Funcionalidades

### Core Features

| Funcionalidade | Descrição |
|---|---|
| 📊 **Agregação de Ofertas** | Coleta automática de produtos em desconto de múltiplas plataformas |
| 🤖 **Análise com IA** | Uso de Google Gemini para recomendações e insights sobre produtos |
| 🔍 **Busca & Filtros** | Busca semântica e filtros por categoria, preço, plataforma |
| 📱 **Dashboard Responsivo** | Interface moderna em React, otimizada para desktop e mobile |
| 🔐 **Autenticação** | Sistema de sessão com token para acesso ao painel administrativo |
| 🔗 **Webhooks** | Recebimento de atualizações de ofertas via webhook (n8n compatible) |
| 💾 **Persistência** | Sincronização com Supabase + fallback em memória |
| 🏷️ **Afiliados** | Suporte para links de afiliação por plataforma |

---

## 🛠️ Stack Tecnológico

### Backend
- **Express.js** - Framework web e API REST
- **TypeScript** - Type-safety na codebase
- **Node.js** - Runtime JavaScript server-side
- **Supabase** - Banco de dados PostgreSQL + cliente
- **Google Generative AI** - Integração com Gemini API

### Frontend
- **React 19** - Framework de UI
- **TypeScript** - Type-safety
- **Vite** - Build tool moderno
- **Tailwind CSS 4** - Estilização utilitária
- **Motion** - Animações fluidas
- **Lucide React** - Ícones SVG

### DevOps & Deployment
- **Docker** - Containerização
- **ESBuild** - Bundler otimizado para produção
- **npm** - Gerenciador de dependências

---

## 📋 Estrutura do Projeto

```
oportunidadesInfore/
├── src/
│   ├── lib/
│   │   └── supabase.ts          # Cliente Supabase configurado
│   ├── types.ts                 # Tipos TypeScript (Oferta, etc)
│   ├── components/              # Componentes React
│   ├── pages/                   # Páginas da aplicação
│   └── App.tsx                  # Componente raiz
│
├── n8n/                         # Workflows n8n (automação)
├── assets/                      # Logos e imagens estáticas
│
├── server.ts                    # Servidor Express principal
├── index.html                   # HTML entry point
├── vite.config.ts               # Configuração Vite
├── tsconfig.json                # Configuração TypeScript
├── Dockerfile                   # Build Docker
├── package.json                 # Dependências e scripts
├── .env.example                 # Template de variáveis de ambiente
├── logo-com-medalha.png         # Logo Infore com medalha
└── README.md                    # Este arquivo
```

---

## 🔧 Instalação & Setup

### Pré-requisitos

- **Node.js** 18+ 
- **npm** ou **yarn**
- **Conta Google Cloud** com Gemini API habilitada
- **Conta Supabase** (opcional, com fallback em memória)

### 1️⃣ Clonar Repositório

```bash
git clone https://github.com/joabeoliveira/oportunidadesInfore.git
cd oportunidadesInfore
```

### 2️⃣ Instalar Dependências

```bash
npm install
```

### 3️⃣ Configurar Variáveis de Ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Configure as seguintes variáveis:

```env
# Google Gemini API
GEMINI_API_KEY=sua_chave_api_aqui

# Supabase (opcional)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_chave_servico_aqui

# Autenticação
ADMIN_PASSWORD=sua_senha_admin

# Webhook
WEBHOOK_SECRET=Bearer INFORE_MVP_TOKEN_2026

# Servidor
PORT=3000
NODE_ENV=development
```

### 4️⃣ Executar em Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

---

## 📖 Guia de Uso

### 🔐 Acesso ao Dashboard

1. Acesse a página de login
2. Use a senha configurada em `ADMIN_PASSWORD`
3. Você receberá um token de sessão (válido durante a sessão)

### 📊 Visualizar Ofertas

```bash
# GET /api/ofertas
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/ofertas
```

Retorna:
```json
{
  "configured": true,
  "ofertas": [
    {
      "titulo": "Smartphone Samsung Galaxy S24 Ultra 512GB",
      "preco_original": 6999.00,
      "preco_desconto": 5499.00,
      "plataforma": "Mercado Livre",
      "url_afiliado": "https://www.mercadolivre.com.br",
      "imagem_url": "https://..."
    }
  ]
}
```

### 🔗 Webhook para Atualizar Ofertas

**POST** `/api/webhooks/ofertas`

```bash
curl -X POST http://localhost:3000/api/webhooks/ofertas \
  -H "Authorization: Bearer INFORE_MVP_TOKEN_2026" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "titulo": "Produto Novo",
      "preco_original": 1000,
      "preco_desconto": 800,
      "plataforma": "Amazon",
      "url_afiliado": "https://amazon.com.br",
      "imagem_url": "https://..."
    }
  ]'
```

### 🔍 Status da Configuração

```bash
# GET /api/status
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/status
```

---

## 🐳 Docker

### Build da Imagem

```bash
docker build -t oportunidades-infore .
```

### Executar Container

```bash
docker run -p 3000:3000 \
  -e GEMINI_API_KEY=sua_chave \
  -e ADMIN_PASSWORD=senha \
  oportunidades-infore
```

---

## 🔄 Integração com n8n

A plataforma suporta webhooks para integração com **n8n**, permitindo:

- ✅ Automação de coleta de produtos
- ✅ Processamento com IA antes de armazenar
- ✅ Atualização automática de ofertas
- ✅ Notificações de novas oportunidades

### Exemplo de Workflow n8n

```
[API de E-commerce] 
    ↓
[n8n Webhook Trigger]
    ↓
[Processa com Gemini]
    ↓
[POST /api/webhooks/ofertas]
    ↓
[Supabase Atualizado]
```

---

## 📚 Scripts NPM

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor em desenvolvimento |
| `npm run build` | Build para produção |
| `npm run start` | Inicia servidor produção (requer build antes) |
| `npm run clean` | Remove arquivos compilados |
| `npm run lint` | Verifica tipos TypeScript |

---

## 🔐 Segurança

### Implementações de Segurança

- ✅ **Autenticação de Sessão**: Token SHA-256 derivado de senha
- ✅ **Webhook Secret**: Validação de autorização em webhooks
- ✅ **CORS**: Configurado para produção
- ✅ **Helmet**: Headers de segurança
- ✅ **Rate Limiting**: Recomendado em produção

### Recomendações

1. **Altere `ADMIN_PASSWORD`** antes de colocar em produção
2. **Use HTTPS** em produção
3. **Implemente rate limiting** (API Gateway)
4. **Mantenha `WEBHOOK_SECRET` seguro**
5. **Rotacione credenciais** regularmente

---

## 📊 Tipos de Dados

### Oferta (Oferta)

```typescript
interface Oferta {
  id?: number;                    // Auto-incrementado pelo Supabase
  titulo: string;                 // Título do produto
  preco_original: number;         // Preço original em reais
  preco_desconto: number;         // Preço com desconto
  url_afiliado: string;           // URL do produto com afiliação
  imagem_url: string;             // URL da imagem do produto
  plataforma: string;             // Ex: "Mercado Livre", "Amazon"
  created_at?: string;            // Timestamp de criação
}
```

---

## 🤖 Integração Google Gemini

A plataforma pode usar Gemini para:

- 📊 **Análise de Preços**: Determinar se o desconto é realmente bom
- 🏷️ **Categorização**: Classificar produtos automaticamente
- 🎯 **Recomendações**: Sugerir produtos baseado em preferências
- 💬 **Chat**: Conversa natural sobre ofertas

### Exemplo de Prompt

```
Analise esta oferta:
- Produto: Smartphone Samsung Galaxy S24 Ultra 512GB
- Preço Original: R$ 6999
- Preço Desconto: R$ 5499
- Desconto: 21.4%

Essa é uma boa oportunidade?
```

---

## 🚀 Deploy

### Vercel (Recomendado)

```bash
# 1. Push para GitHub
git push origin main

# 2. Conectar no Vercel
# Vercel > Add New > Project > Import Git Repository

# 3. Configurar variáveis de ambiente
# Vercel Dashboard > Settings > Environment Variables
```

### Heroku

```bash
heroku create oportunidades-infore
heroku config:set GEMINI_API_KEY=...
git push heroku main
```

### Auto-hospedagem

```bash
npm run build
npm run start
```

---

## 📈 Performance

### Otimizações Implementadas

- ⚡ **Vite Build**: Build 10x+ rápido que Webpack
- 📦 **Code Splitting**: Lazy loading de componentes
- 🗜️ **Asset Optimization**: Minificação automática
- 💾 **In-Memory Cache**: Fallback quando Supabase indisponível
- 🔄 **Batch Operations**: Inserção eficiente no banco

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch para sua feature: `git checkout -b feature/minha-feature`
3. Commit suas mudanças: `git commit -m 'Add minha-feature'`
4. Push para a branch: `git push origin feature/minha-feature`
5. Abra um Pull Request

---

## 📝 Roadmap

- [ ] 🔐 OAuth2 com Google/GitHub
- [ ] 📊 Dashboard com análise de tendências
- [ ] 🤖 Chat com Gemini integrado
- [ ] 📧 Notificações por email
- [ ] 📱 App mobile (React Native)
- [ ] 🌍 Multi-idioma (i18n)
- [ ] 💳 Sistema de afiliação próprio
- [ ] 📈 Relatórios e analytics avançados

---

## ❓ FAQ

**P: Preciso do Supabase?**  
R: Não! A aplicação funciona com dados em memória se Supabase não estiver configurado.

**P: Como funciona a API do Gemini?**  
R: A integração padrão usa `@google/genai` para chamadas diretas à API. Configure em `.env.local`.

**P: Posso usar isso em produção?**  
R: Sim! Esta é uma MVP, mas pode ser expandida para produção com melhorias de segurança e escalabilidade.

**P: Como atualizar ofertas via n8n?**  
R: Use o webhook `POST /api/webhooks/ofertas` com o `WEBHOOK_SECRET` correto no header.

---

## 📞 Suporte

- 📧 Email: joabeantonio@gmail.com
- 🐙 GitHub Issues: [oportunidadesInfore/issues](https://github.com/joabeoliveira/oportunidadesInfore/issues)
- 💬 Discussões: [GitHub Discussions](https://github.com/joabeoliveira/oportunidadesInfore/discussions)

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para detalhes.

---

## 👨‍💻 Autor

**Joabe Oliveira**  
- GitHub: [@joabeoliveira](https://github.com/joabeoliveira)
- LinkedIn: [Joabe Oliveira](https://linkedin.com/in/joabeoliveira)

---

## 🏢 Sobre Infore

Infore é uma plataforma de supply chain inteligente que utiliza IA generativa para otimizar operações de abastecimento, precificação e relacionamento com fornecedores.

**Base de Conhecimento Relacionada**: [infore-base-conhecimento](https://github.com/joabeoliveira/infore-base-conhecimento)

---

**Última Atualização**: Junho 2026

*Desenvolvido com ❤️ para otimizar oportunidades de compras com IA*
