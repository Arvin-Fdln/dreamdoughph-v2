

const ADMIN_GROQ_API_KEY = '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';
const ADMIN_GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

let adminChatHistory = [];
let adminLastMessageTime = 0;
const ADMIN_MESSAGE_COOLDOWN = 3000;

async function getAdminContext() {
    const context = { products: [], orders: [], revenue: 0, pendingOrders: 0, lowStockProducts: [], recentProducts: [] };

    const productsSnap = await database.ref('products').once('value');
    const allProducts = [];
    productsSnap.forEach(child => {
        const p = child.val();
        allProducts.push({
            name: p.name,
            category: p.category,
            price: p.price,
            stock: p.stock !== undefined ? p.stock : 'N/A',
            description: p.description,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt
        });
        if (p.stock !== undefined && p.stock <= 10) {
            context.lowStockProducts.push(`${p.name} (${p.stock} left)`);
        }
    });
    
    
    allProducts.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
    });
    
    
    context.recentProducts = allProducts.slice(0, 5).map(p => 
        `${p.name} (${p.category}) - ₱${p.price} - Added: ${new Date(p.createdAt).toLocaleDateString('en-PH')}`
    );
    
    context.products = allProducts;

    
    const ordersSnap = await database.ref('orders').once('value');
    ordersSnap.forEach(child => {
        const o = child.val();
        context.orders.push({
            customer: o.customerName,
            status: o.status,
            paymentStatus: o.paymentStatus,
            total: o.total,
            items: o.items ? o.items.map(i => `${i.quantity}x ${i.name}`).join(', ') : '',
            date: o.date,
            pickupDate: o.pickupDate
        });
        if (o.paymentStatus === 'paid') context.revenue += (o.total || 0);
        if (o.status === 'pending') context.pendingOrders++;
    });

    return context;
}

function getAdminSystemPrompt(context) {
    const productList = context.products.map(p =>
        `${p.name} (${p.category}) - ₱${p.price} - Stock: ${p.stock} - Added: ${new Date(p.createdAt).toLocaleDateString('en-PH')}`
    ).join('\n');

    const recentProductsList = context.recentProducts.length > 0
        ? context.recentProducts.join('\n')
        : 'None';

    const orderList = context.orders.map(o =>
        `${o.customer} | ${o.status} | ${o.paymentStatus} | ₱${o.total} | Items: ${o.items} | Date: ${o.date}`
    ).join('\n');

    const lowStock = context.lowStockProducts.length > 0
        ? context.lowStockProducts.join(', ')
        : 'None';

    return `You are an intelligent admin assistant for DreamDoughPH bakery. You help the admin analyze business data and make decisions.

CURRENT BUSINESS DATA:

RECENT PRODUCTS (5 Most Recently Added):
${recentProductsList}

ALL PRODUCTS (${context.products.length} total):
${productList}

ALL ORDERS (${context.orders.length} total):
${orderList}

SUMMARY:
- Total Revenue (paid orders): ₱${context.revenue}
- Pending Orders: ${context.pendingOrders}
- Low Stock Products (10 or less): ${lowStock}

YOUR CAPABILITIES:
- Analyze sales and revenue data
- Identify best and worst selling products
- Flag low stock items
- Summarize order statuses
- Answer questions about specific products or orders
- Give business insights and suggestions
- Track which products are newly added
- Provide product performance analysis

YOUR RULES:
- Only discuss bakery business related topics
- Be concise and give actionable insights
- Use data above to answer accurately
- When asked about new or recent products, refer to the "RECENT PRODUCTS" section
- If asked about something not in the data, say you don't have that info
- You CANNOT modify, add or delete products or orders - you are read-only
- Format numbers with peso sign and commas where appropriate
- When analyzing product performance, consider both sales volume and stock levels`;
}

async function sendAdminMessage() {
    const input = document.getElementById('adminChatInput');
    const message = input.value.trim();
    if (!message) return;

    const now = Date.now();
    if (now - adminLastMessageTime < ADMIN_MESSAGE_COOLDOWN) {
        appendAdminMessage('bot', 'Please wait a moment before sending another message!');
        return;
    }
    adminLastMessageTime = now;

    input.value = '';
    appendAdminMessage('user', message);
    showAdminTyping();

    try {
        const context = await getAdminContext();
        const response = await fetch(ADMIN_GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ADMIN_GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    { role: 'system', content: getAdminSystemPrompt(context) },
                    ...adminChatHistory.map(h => ({
                        role: h.role === 'model' ? 'assistant' : h.role,
                        content: h.content
                    })),
                    { role: 'user', content: message }
                ],
                max_tokens: 500,
                temperature: 0.5
            })
        });

        const data = await response.json();

        if (data.error) {
            hideAdminTyping();
            appendAdminMessage('bot', 'Sorry, I am having trouble connecting. Please try again!');
            return;
        }

        const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that.";
        hideAdminTyping();
        appendAdminMessage('bot', reply);

        adminChatHistory.push({ role: 'user', content: message });
        adminChatHistory.push({ role: 'assistant', content: reply });

        if (adminChatHistory.length > 20) adminChatHistory = adminChatHistory.slice(-20);

    } catch (error) {
        hideAdminTyping();
        appendAdminMessage('bot', 'Connection error. Please try again!');
    }
}

function appendAdminMessage(sender, text) {
    const messages = document.getElementById('adminChatMessages');
    const div = document.createElement('div');
    div.className = `admin-chat-message ${sender}-message`;
    div.innerHTML = `<div class="admin-message-bubble">${text.replace(/\n/g, '<br>')}</div>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function showAdminTyping() {
    const messages = document.getElementById('adminChatMessages');
    const div = document.createElement('div');
    div.className = 'admin-chat-message bot-message';
    div.id = 'adminTypingIndicator';
    div.innerHTML = `<div class="admin-message-bubble typing-indicator"><span></span><span></span><span></span></div>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function hideAdminTyping() {
    const el = document.getElementById('adminTypingIndicator');
    if (el) el.remove();
}

function toggleAdminChat() {
    const widget = document.getElementById('adminChatWidget');
    const isOpen = widget.classList.contains('open');
    if (isOpen) {
        widget.classList.remove('open');
    } else {
        widget.classList.add('open');
        if (adminChatHistory.length === 0) {
            appendAdminMessage('bot', "Hi Admin! 👋 I'm your AI assistant. Ask me anything about your products, orders, stock, revenue, or recent additions!");
        }
        document.getElementById('adminChatInput').focus();
    }
}

function handleAdminChatKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendAdminMessage();
    }
}
