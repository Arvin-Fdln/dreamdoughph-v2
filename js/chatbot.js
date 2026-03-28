// DreamDoughPH AI Chatbot
const GEMINI_API_KEY = 'AIzaSyAPEPoZnLe-HomHaWe7NqElKk2t_Z0H-FQ';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

let chatHistory = [];
let productsContext = '';

// Load products from Firebase for AI context
function loadProductsForAI() {
    database.ref('products').once('value', snapshot => {
        const products = [];
        snapshot.forEach(child => {
            const p = child.val();
            products.push(`${p.name} (${p.category}) - ₱${p.price} - Stock: ${p.stock !== undefined ? p.stock : 'N/A'} - ${p.description}`);
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
- Always end with an offer to help further`;
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

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

        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: contents,
                generationConfig: { 
                    maxOutputTokens: 400, 
                    temperature: 0.7 
                }
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error('Gemini error:', data.error);
            hideTypingIndicator();
            appendMessage('bot', "Sorry, I'm having trouble connecting right now. Please try again! 😊");
            return;
        }

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that. Please try again!";

        hideTypingIndicator();
        appendMessage('bot', reply);

        // Store history properly
        if (chatHistory.length === 0) {
            chatHistory.push({ role: 'user', parts: [{ text: getSystemPrompt() + '\n\nUser message: ' + message }] });
        } else {
            chatHistory.push({ role: 'user', parts: [{ text: message }] });
        }
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
            appendMessage('bot', "Hi! I'm DoughBot 🍰 How can I help you today? I can answer questions about our products, stock, prices, and more!");
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
