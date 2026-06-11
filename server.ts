import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { getSupabaseClient } from './src/lib/supabase.ts';
import { Oferta } from './src/types.ts';

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Basic hardening: avoid exposing Express fingerprint.
app.disable('x-powered-by');

// Enable JSON body requests up to 10mb for mass inserts
app.use(express.json({ limit: '10mb' }));

// Memory fallback to ensure app functions and can be previewed immediately
// even if Supabase keys are not set yet.
let inMemoryOfertas: Oferta[] = [
  {
    titulo: "Smartphone Samsung Galaxy S24 Ultra 512GB Titanium Gray",
    preco_original: 6999.00,
    preco_desconto: 5499.00,
    url_afiliado: "https://www.mercadolivre.com.br",
    imagem_url: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400",
    plataforma: "Mercado Livre"
  },
  {
    titulo: "Notebook Dell Inspiron 15 AMD Ryzen 7 16GB 512GB SSD",
    preco_original: 4299.00,
    preco_desconto: 3499.00,
    url_afiliado: "https://www.amazon.com.br",
    imagem_url: "https://images.unsplash.com/photo-1496181130204-7552cc145cdb?w=400",
    plataforma: "Amazon"
  },
  {
    titulo: "Fone de Ouvido Noise Cancelling Sony WH-1000XM4 Bluetooth",
    preco_original: 1999.00,
    preco_desconto: 1499.00,
    url_afiliado: "https://shopee.com.br",
    imagem_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    plataforma: "Shopee"
  },
  {
    titulo: "Smart TV LG 55\" 4K UHD ThinQ AI HDR",
    preco_original: 4299.00,
    preco_desconto: 2999.00,
    url_afiliado: "https://www.mercadolivre.com.br",
    imagem_url: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=400",
    plataforma: "Mercado Livre"
  },
  {
    titulo: "Air Fryer Mondial Grand Family 5L Inox",
    preco_original: 499.00,
    preco_desconto: 399.00,
    url_afiliado: "https://shopee.com.br",
    imagem_url: "https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=400",
    plataforma: "Shopee"
  },
  {
    titulo: "Console PlayStation 5 Slim Edição Digital",
    preco_original: 3799.00,
    preco_desconto: 3299.00,
    url_afiliado: "https://www.amazon.com.br",
    imagem_url: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400",
    plataforma: "Amazon"
  }
];

// Helper to check if Supabase is configured
function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Session authentication variables
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const EXPECTED_SESSION_TOKEN = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest('hex');

// Middleware to enforce dashboard authentication
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acesso não autorizado. Sessão inválida.' });
  }
  const token = authHeader.split(' ')[1];
  if (token !== EXPECTED_SESSION_TOKEN) {
    return res.status(401).json({ error: 'Sessão expirada ou inválida.' });
  }
  next();
}

// 0. Endpoint to login and get session token
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Senha não fornecida.' });
  }
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  if (passwordHash === EXPECTED_SESSION_TOKEN) {
    return res.json({ success: true, token: EXPECTED_SESSION_TOKEN });
  } else {
    return res.status(401).json({ error: 'Senha incorreta.' });
  }
});

// 1. Endpoint to check configuration status
app.get('/api/status', requireAuth, (req, res) => {
  res.json({
    configured: isSupabaseConfigured(),
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
  });
});

// 2. Endpoint to fetch all offers
app.get('/api/ofertas', requireAuth, async (req, res) => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase configuration missing in .env. Returning in-memory demo data.');
    return res.json({
      configured: false,
      ofertas: inMemoryOfertas
    });
  }

  try {
    const supabaseClient = getSupabaseClient();
    const { data, error } = await supabaseClient
      .from('ofertas')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching from Supabase table "ofertas":', error);
      // Fallback if table doesn't exist yet or connection error
      return res.json({
        configured: true,
        error: error.message,
        warning: 'Não foi possível ler a tabela "ofertas". Certifique-se de que a tabela ofertas existe no banco.',
        ofertas: inMemoryOfertas
      });
    }

    return res.json({
      configured: true,
      ofertas: data || []
    });
  } catch (err: any) {
    console.error('Catch block fetching from Supabase:', err);
    return res.json({
      configured: true,
      error: err.message || 'Erro inesperado',
      ofertas: inMemoryOfertas
    });
  }
});

// 3. Webhook endpoint to clear and batch insert offers
app.post('/api/webhooks/ofertas', async (req, res) => {
  try {
    const expectedAuthorization = process.env.WEBHOOK_SECRET || 'Bearer INFORE_MVP_TOKEN_2026';

    if (req.headers.authorization !== expectedAuthorization) {
      return res.status(401).json({ error: 'Acesso não autorizado' });
    }

    const ofertasPayload = req.body;

    if (!Array.isArray(ofertasPayload)) {
      return res.status(400).json({
        error: 'O payload de envio precisa ser um array de ofertas.'
      });
    }

    // Clean and normalize input
    const normalizedOfertas: Oferta[] = ofertasPayload.map((o: any) => ({
      titulo: String(o.titulo || 'Produto sem título').trim(),
      preco_original: Number(o.preco_original) || 0,
      preco_desconto: Number(o.preco_desconto) || 0,
      url_afiliado: String(o.url_afiliado || '#').trim(),
      imagem_url: String(o.imagem_url || '').trim(),
      plataforma: String(o.plataforma || 'Desconhecido').trim()
    }));

    // Identify unique platforms to update in this payload
    const platformsToUpdate = Array.from(new Set(normalizedOfertas.map(o => o.plataforma)));

    if (!isSupabaseConfigured()) {
      console.log('Updating in-memory offers (unconfigured Supabase mode) for platforms:', platformsToUpdate);
      inMemoryOfertas = [
        ...inMemoryOfertas.filter(o => !platformsToUpdate.includes(o.plataforma)),
        ...normalizedOfertas
      ];
      return res.json({
        success: true,
        configured: false,
        message: 'Atualizado em memória (Supabase não configurado no .env)',
        total: normalizedOfertas.length
      });
    }

    const supabaseClient = getSupabaseClient();

    // Delete existing records only for the platforms present in the incoming payload
    const { error: deleteError } = await supabaseClient
      .from('ofertas')
      .delete()
      .in('plataforma', platformsToUpdate);

    if (deleteError) {
      console.error('Error clearing "ofertas" table in Supabase:', deleteError);
      return res.status(500).json({
        error: 'Erro ao limpar dados anteriores do Supabase.',
        details: deleteError.message
      });
    }

    if (normalizedOfertas.length === 0) {
      return res.json({
        success: true,
        message: 'Tabela limpa com sucesso. Nenhuma oferta enviada para inserção.',
        total: 0
      });
    }

    // Insert new records in batch
    const { error: insertError } = await supabaseClient
      .from('ofertas')
      .insert(normalizedOfertas);

    if (insertError) {
      console.error('Error batch inserting into Supabase:', insertError);
      return res.status(500).json({
        error: 'Erro ao inserir novas ofertas no Supabase.',
        details: insertError.message
      });
    }

    // Also update in-memory cache to sync immediate fetches
    inMemoryOfertas = [
      ...inMemoryOfertas.filter(o => !platformsToUpdate.includes(o.plataforma)),
      ...normalizedOfertas
    ];

    return res.json({
      success: true,
      configured: true,
      message: 'Ofertas sincronizadas com sucesso no Supabase.',
      total: normalizedOfertas.length
    });

  } catch (err: any) {
    console.error('Webhook error:', err);
    return res.status(500).json({
      error: 'Erro interno durante processamento do webhook',
      details: err.message
    });
  }
});

// 4. Bitrix24 Integration: Search Contacts
app.get('/api/bitrix/search-contacts', requireAuth, async (req, res) => {
  const query = (req.query.query as string || '').trim();
  const webhookUrl = process.env.BITRIX24_WEBHOOK_URL;

  if (!webhookUrl) {
    // Return mock contacts in simulation mode
    const mockContacts = [
      { ID: 'mock-1', NAME: 'Carlos', LAST_NAME: 'Silva (Infore Demo)', PHONE: '+55 11 98888-8888', EMAIL: 'carlos.silva@demo.com' },
      { ID: 'mock-2', NAME: 'Ana', LAST_NAME: 'Souza (Infore Demo)', PHONE: '+55 21 97777-7777', EMAIL: 'ana.souza@demo.com' },
      { ID: 'mock-3', NAME: 'Roberto', LAST_NAME: 'Santos (Infore Demo)', PHONE: '+55 31 96666-6666', EMAIL: 'roberto.santos@demo.com' }
    ];
    const filtered = mockContacts.filter(c => 
      c.NAME.toLowerCase().includes(query.toLowerCase()) || 
      c.LAST_NAME.toLowerCase().includes(query.toLowerCase())
    );
    return res.json(filtered);
  }

  try {
    const response = await fetch(`${webhookUrl}/crm.contact.list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filter: { '%NAME': query },
        select: ['ID', 'NAME', 'LAST_NAME', 'PHONE', 'EMAIL']
      })
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP no Bitrix24: ${response.status}`);
    }

    const data = await response.json();
    const contacts = (data.result || []).map((c: any) => ({
      ID: c.ID,
      NAME: c.NAME || '',
      LAST_NAME: c.LAST_NAME || '',
      PHONE: c.PHONE && c.PHONE[0] ? c.PHONE[0].VALUE : '',
      EMAIL: c.EMAIL && c.EMAIL[0] ? c.EMAIL[0].VALUE : ''
    }));

    return res.json(contacts);
  } catch (err: any) {
    console.error('Error searching contacts in Bitrix24:', err);
    return res.status(500).json({ error: 'Erro ao buscar contatos no Bitrix24', details: err.message });
  }
});

// 5. Bitrix24 Integration: Create Quote
app.post('/api/bitrix/create-quote', requireAuth, async (req, res) => {
  const {
    title,
    productName,
    costPrice,
    profitMargin,
    shipping,
    finalPrice,
    link,
    clientType,
    clientId,
    clientName,
    clientPhone,
    clientEmail,
    assignedById,
    quantity
  } = req.body;

  const webhookUrl = process.env.BITRIX24_WEBHOOK_URL;
  const itemQuantity = Number(quantity) || 1;
  const totalOpportunity = Math.round((Number(finalPrice) * itemQuantity + Number(shipping || 0)) * 100) / 100;

  if (!webhookUrl) {
    // Simulation Mode
    console.log('Running in Bitrix24 simulation mode...');
    const simulatedContactId = clientType === 'new' ? 'mock-contact-999' : clientId;
    const simulatedQuoteId = Math.floor(Math.random() * 90000) + 10000;
    return res.json({
      success: true,
      simulated: true,
      quoteId: simulatedQuoteId,
      url: `https://infore.bitrix24.com/crm/quote/show/${simulatedQuoteId}/`
    });
  }

  try {
    let contactId = clientId;

    // Create contact if new
    if (clientType === 'new') {
      const contactResponse = await fetch(`${webhookUrl}/crm.contact.add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            NAME: clientName,
            OPENED: 'Y',
            TYPE_ID: 'CLIENT',
            PHONE: clientPhone ? [{ VALUE: clientPhone, VALUE_TYPE: 'WORK' }] : [],
            EMAIL: clientEmail ? [{ VALUE: clientEmail, VALUE_TYPE: 'WORK' }] : [],
            ...(assignedById ? { ASSIGNED_BY_ID: assignedById } : {})
          }
        })
      });

      if (!contactResponse.ok) {
        const errText = await contactResponse.text();
        throw new Error(`Erro ao cadastrar contato no Bitrix24: ${errText}`);
      }

      const contactData = await contactResponse.json();
      contactId = contactData.result;
    }

    // Create Quote
    const quoteResponse = await fetch(`${webhookUrl}/crm.quote.add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          TITLE: title,
          STATUS_ID: 'DRAFT',
          CURRENCY_ID: 'BRL',
          OPPORTUNITY: totalOpportunity,
          CONTACT_ID: contactId,
          COMMENTS: `Link de Compra: <a href="${link}" target="_blank">${link}</a>`,
          ...(assignedById ? { ASSIGNED_BY_ID: assignedById } : {})
        }
      })
    });

    if (!quoteResponse.ok) {
      const errText = await quoteResponse.text();
      throw new Error(`Erro ao cadastrar orçamento no Bitrix24: ${errText}`);
    }

    const quoteData = await quoteResponse.json();
    const quoteId = quoteData.result;

    // Set Product Rows
    const rows = [
      {
        PRODUCT_NAME: productName,
        PRICE: finalPrice,
        QUANTITY: itemQuantity
      }
    ];

    if (Number(shipping) > 0) {
      rows.push({
        PRODUCT_NAME: 'Frete',
        PRICE: Number(shipping),
        QUANTITY: 1
      });
    }

    const productResponse = await fetch(`${webhookUrl}/crm.quote.productrows.set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: quoteId,
        rows
      })
    });

    if (!productResponse.ok) {
      console.error('Warning: Failed to set product rows for quote:', quoteId);
    }

    // Extract domain name
    let domain = 'infore.bitrix24.com';
    try {
      const urlObj = new URL(webhookUrl);
      domain = urlObj.hostname;
    } catch (e) {
      // ignore
    }

    return res.json({
      success: true,
      quoteId,
      url: `https://${domain}/crm/quote/show/${quoteId}/`
    });

  } catch (err: any) {
    console.error('Error creating quote in Bitrix24:', err);
    return res.status(500).json({ error: 'Erro ao criar orçamento no Bitrix24', details: err.message });
  }
});

// 6. Bitrix24 Integration: Get Users
app.get('/api/bitrix/users', requireAuth, async (req, res) => {
  const webhookUrl = process.env.BITRIX24_WEBHOOK_URL;

  if (!webhookUrl) {
    // Return mock users/sellers in simulation mode
    return res.json([
      { ID: 'mock-user-1', NAME: 'Carlos', LAST_NAME: 'Oliveira', WORK_POSITION: 'Vendedor Sênior' },
      { ID: 'mock-user-2', NAME: 'Renata', LAST_NAME: 'Mendes', WORK_POSITION: 'Vendedora Pleno' },
      { ID: 'mock-user-3', NAME: 'Marcos', LAST_NAME: 'Sales', WORK_POSITION: 'Supervisor de Vendas' }
    ]);
  }

  try {
    const response = await fetch(`${webhookUrl}/user.get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sort: 'NAME',
        order: 'ASC',
        filter: { ACTIVE: true }
      })
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP no Bitrix24: ${response.status}`);
    }

    const data = await response.json();
    const users = (data.result || []).map((u: any) => ({
      ID: u.ID,
      NAME: u.NAME || '',
      LAST_NAME: u.LAST_NAME || '',
      WORK_POSITION: u.WORK_POSITION || ''
    }));

    return res.json(users);
  } catch (err: any) {
    console.error('Error fetching users from Bitrix24:', err);
    return res.status(500).json({ error: 'Erro ao buscar usuários do Bitrix24', details: err.message });
  }
});

// Configure Vite or production static serving
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setupViteOrStatic();
