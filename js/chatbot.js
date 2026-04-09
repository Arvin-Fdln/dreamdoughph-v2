// DreamDoughPH AI Chatbot - IMPROVED VERSION
// Now with better product context including timestamps for identifying latest products
const GROQ_API_KEY = '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';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
let lastMessageTime = 0;
const MESSAGE_COOLDOWN = 3000; // 3 seconds between messages

let chatHistory = [];
let productsContext = '';
let allProductsData = []; // Store full product data for reference

// Load products from Firebase for AI context with timestamps
function loadProductsForAI() {
    database.ref('products').once('value', snapshot => {
        const products = [];
        allProductsData = [];
        
        snapshot.forEach(child => {
            const p = child.val();
            allProductsData.push({
                id: child.key,
                name: p.name,
                category: p.category,
                price: p.price,
                stock: p.stock !== undefined ? p.stock : 'N/A',
                description: p.description,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                image: p.image
            });
        });
        
        // Sort by creation date (newest first)
        allProductsData.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
        });
        
        // Build context with product information including timestamps
        products.push('=== LATEST PRODUCTS (Most Recently Added) ===');
        allProductsData.slice(0, 5).forEach((p, idx) => {
            const dateAdded = new Date(p.createdAt).toLocaleDateString('en-PH');
            products.push(`${idx + 1}. ${p.name} (${p.category}) - ₱${p.price} - Stock: ${p.stock} - Added: ${dateAdded} - ${p.description}`);
        });
        
        products.push('\n=== ALL PRODUCTS (Organized by Category) ===');
        const categories = {};
        allProductsData.forEach(p => {
            if (!categories[p.category]) categories[p.category] = [];
            categories[p.category].push(p);
        });
        
        Object.keys(categories).sort().forEach(cat => {
            products.push(`\n${cat.toUpperCase()}:`);
            categories[cat].forEach(p => {
                products.push(`  - ${p.name}: ₱${p.price} (Stock: ${p.stock}) - ${p.description}`);
            });
        });
        
        productsContext = products.join('\n');
    });
}

function getSystemPrompt() {
    return `You are DoughBot, a friendly and helpful AI assistant for DreamDoughPH, a bakery based in Antipolo, Rizal, Philippines.

ABOUT THE BAKERY:
- Name: DreamDoughPH
- Location: Antipolo, Rizal, Philippines
- Contact: 09206171784
- Email: hannahjaperwilson@gmail.com
- Hours: Mon-Sat 8:00AM-10:00PM, Sunday 9:00AM-9:00PM
- Facebook: https://www.facebook.com/DreamDoughPh
- Instagram: https://www.instagram.com/dreamdoughph

CURRENT PRODUCTS AND STOCK:
${productsContext}

YOUR RULES:
- When asked about "new products", "latest products", "newest items", or "recently added", refer to the "LATEST PRODUCTS" section at the top - these are sorted by most recent first
- The first 5 products listed are the NEWEST ones we've added
- Only answer questions related to DreamDoughPH, our products, orders, delivery, and bakery info
- Be friendly, warm, and use a casual but professional tone
- If asked about stock, refer to the stock numbers above
- If stock is 0, tell the customer that item is currently out of stock
- You can recommend products based on customer preferences
- For custom orders, direct them to the Custom Order section on the website
- Payment is arranged after order confirmation - we contact the customer
- Do NOT discuss topics unrelated to the bakery
- Keep responses concise and helpful
- Use Filipino-friendly language when appropriate (you can mix a little Tagalog naturally)
- Always end with an offer to help further
- When recommending products, prioritize the latest ones when appropriate`;
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    const now = Date.now();
    if (now - lastMessageTime < MESSAGE_COOLDOWN) {
        appendMessage('bot', "Please wait a moment before sending another message! 😊");
        return;
    }
    lastMessageTime = now;

    input.value = '';
    appendMessage('user', message);
    showTypingIndicator();

    try {
        // Build contents with system prompt as first user message if first time
        const contents = [];
        
        if (chatHistory.length === 0) {
            contents.push({
                role: 'user',
                parts: [{ text: getSystemPrompt() + '\n\nUser message: ' + message }]
            });
        } else {
            chatHistory.forEach(h => contents.push(h));
            contents.push({ role: 'user', parts: [{ text: message }] });
        }

        const response = await fetch(GROQ_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    { role: 'system', content: getSystemPrompt() },
                    ...chatHistory.map(h => ({
                        role: h.role === 'model' ? 'assistant' : h.role,
                        content: h.parts[0].text
                    })),
                    { role: 'user', content: message }
                ],
                max_tokens: 400,
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('Groq error:', data.error);
            hideTypingIndicator();
            appendMessage('bot', "Sorry, I'm having trouble connecting right now. Please try again! 😊");
            return;
        }

        const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that. Please try again!";

        hideTypingIndicator();
        appendMessage('bot', reply);

        // Store history
        chatHistory.push({ role: 'user', parts: [{ text: message }] });
        chatHistory.push({ role: 'model', parts: [{ text: reply }] });

        // Keep history manageable
        if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

    } catch (error) {
        console.error('Chat error:', error);
        hideTypingIndicator();
        appendMessage('bot', "Sorry, I'm having trouble connecting right now. Please try again in a moment! 😊");
    }
}

function appendMessage(sender, text) {
    const messages = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `chat-message ${sender}-message`;
    div.innerHTML = `<div class="message-bubble">${text.replace(/\n/g, '<br>')}</div>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function showTypingIndicator() {
    const messages = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'chat-message bot-message typing-indicator-container';
    div.id = 'typingIndicator';
    div.innerHTML = `<div class="message-bubble typing-indicator"><span></span><span></span><span></span></div>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

function toggleChat() {
    const widget = document.getElementById('chatWidget');
    const isOpen = widget.classList.contains('open');
    if (isOpen) {
        widget.classList.remove('open');
    } else {
        widget.classList.add('open');
        if (chatHistory.length === 0) {
            appendMessage('bot', "Hi! I'm DoughBot 🍰 How can I help you today? I can answer questions about our products, stock, prices, and more! Ask me about our latest products!");
        }
        document.getElementById('chatInput').focus();
    }
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProductsForAI();
});
