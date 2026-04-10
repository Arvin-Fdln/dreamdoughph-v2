// ============= CUSTOMER INSIGHTS & LOYALTY SYSTEM =============
// Manages customer profiles, loyalty tracking, and marketing campaigns
// Requires customer login system to be implemented

const LOYALTY_CONFIG = {
    VIP_THRESHOLD: 5, // Orders to become VIP
    FREQUENT_BUYER_THRESHOLD: 3,
    INACTIVE_DAYS: 30,
    LOYALTY_POINTS_PER_PESO: 1 // 1 point per ₱1 spent
};

let customerDatabase = {};
let loyaltyTiers = {
    bronze: { name: 'Bronze', minSpend: 0, discount: 0 },
    silver: { name: 'Silver', minSpend: 5000, discount: 5 },
    gold: { name: 'Gold', minSpend: 15000, discount: 10 },
    platinum: { name: 'Platinum', minSpend: 30000, discount: 15 }
};

// ============= INITIALIZE CUSTOMER SYSTEM =============
function initializeCustomerSystem() {
    console.log('👥 Initializing Customer Insights System...');
    loadAllCustomers();
}

// ============= LOAD ALL CUSTOMERS FROM ORDERS =============
function loadAllCustomers() {
    database.ref('orders').once('value', snapshot => {
        customerDatabase = {};

        snapshot.forEach(orderSnapshot => {
            const order = orderSnapshot.val();
            const email = order.customerEmail || order.email;
            const phone = order.customerPhone || order.phone;
            const name = order.customerName || 'Unknown';

            // Create unique customer ID (use email as primary, phone as fallback)
            const customerId = email || phone;

            if (!customerId) return; // Skip if no contact info

            if (!customerDatabase[customerId]) {
                customerDatabase[customerId] = {
                    customerId: customerId,
                    name: name,
                    email: email,
                    phone: phone,
                    orders: [],
                    totalSpent: 0,
                    totalOrders: 0,
                    lastOrderDate: null,
                    favoriteProducts: {},
                    loyaltyPoints: 0,
                    tier: 'bronze',
                    status: 'active'
                };
            }

            // Add order to customer
            customerDatabase[customerId].orders.push({
                orderId: orderSnapshot.key,
                date: order.createdAt || order.date,
                total: order.total || 0,
                items: order.items || []
            });

            // Update customer stats
            customerDatabase[customerId].totalSpent += order.total || 0;
            customerDatabase[customerId].totalOrders += 1;
            customerDatabase[customerId].lastOrderDate = order.createdAt || order.date;
            customerDatabase[customerId].loyaltyPoints += Math.floor((order.total || 0) * LOYALTY_CONFIG.LOYALTY_POINTS_PER_PESO);

            // Track favorite products
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    if (!customerDatabase[customerId].favoriteProducts[item.name]) {
                        customerDatabase[customerId].favoriteProducts[item.name] = 0;
                    }
                    customerDatabase[customerId].favoriteProducts[item.name] += item.quantity || 1;
                });
            }
        });

        // Calculate loyalty tiers and status
        Object.values(customerDatabase).forEach(customer => {
            updateCustomerTier(customer);
            updateCustomerStatus(customer);
        });

        console.log('✅ Loaded', Object.keys(customerDatabase).length, 'unique customers');
        displayCustomerInsights();
    });
}

// ============= UPDATE CUSTOMER LOYALTY TIER =============
function updateCustomerTier(customer) {
    if (customer.totalSpent >= loyaltyTiers.platinum.minSpend) {
        customer.tier = 'platinum';
    } else if (customer.totalSpent >= loyaltyTiers.gold.minSpend) {
        customer.tier = 'gold';
    } else if (customer.totalSpent >= loyaltyTiers.silver.minSpend) {
        customer.tier = 'silver';
    } else {
        customer.tier = 'bronze';
    }
}

// ============= UPDATE CUSTOMER STATUS =============
function updateCustomerStatus(customer) {
    const lastOrder = new Date(customer.lastOrderDate);
    const daysSinceLastOrder = Math.floor((new Date() - lastOrder) / (1000 * 60 * 60 * 24));

    if (daysSinceLastOrder > LOYALTY_CONFIG.INACTIVE_DAYS) {
        customer.status = 'inactive';
    } else if (customer.totalOrders >= LOYALTY_CONFIG.VIP_THRESHOLD) {
        customer.status = 'vip';
    } else if (customer.totalOrders >= LOYALTY_CONFIG.FREQUENT_BUYER_THRESHOLD) {
        customer.status = 'frequent';
    } else {
        customer.status = 'active';
    }
}

// ============= DISPLAY CUSTOMER INSIGHTS =============
function displayCustomerInsights() {
    const container = document.getElementById('customerInsightsContainer');
    if (!container) return;

    const customers = Object.values(customerDatabase);
    
    // Calculate summary stats
    const totalCustomers = customers.length;
    const vipCustomers = customers.filter(c => c.status === 'vip').length;
    const inactiveCustomers = customers.filter(c => c.status === 'inactive').length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgOrderValue = totalRevenue / customers.reduce((sum, c) => sum + c.totalOrders, 0);

    // Summary stats HTML
    let html = `
        <div class="customer-stats-grid">
            <div class="customer-stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-info">
                    <div class="stat-value">${totalCustomers}</div>
                    <div class="stat-label">Total Customers</div>
                </div>
            </div>
            <div class="customer-stat-card">
                <div class="stat-icon">⭐</div>
                <div class="stat-info">
                    <div class="stat-value">${vipCustomers}</div>
                    <div class="stat-label">VIP Customers</div>
                </div>
            </div>
            <div class="customer-stat-card">
                <div class="stat-icon">💤</div>
                <div class="stat-info">
                    <div class="stat-value">${inactiveCustomers}</div>
                    <div class="stat-label">Inactive</div>
                </div>
            </div>
            <div class="customer-stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-info">
                    <div class="stat-value">₱${totalRevenue.toFixed(0)}</div>
                    <div class="stat-label">Total Revenue</div>
                </div>
            </div>
            <div class="customer-stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-info">
                    <div class="stat-value">₱${avgOrderValue.toFixed(0)}</div>
                    <div class="stat-label">Avg Order Value</div>
                </div>
            </div>
        </div>

        <div class="customer-filters">
            <button class="filter-btn active" onclick="filterCustomers('all')">All</button>
            <button class="filter-btn" onclick="filterCustomers('vip')">⭐ VIP</button>
            <button class="filter-btn" onclick="filterCustomers('frequent')">🔄 Frequent</button>
            <button class="filter-btn" onclick="filterCustomers('inactive')">💤 Inactive</button>
        </div>

        <div id="customerListContainer" class="customer-list-container">
            <!-- Customer list will be populated here -->
        </div>
    `;

    container.innerHTML = html;
    
    // Display all customers initially
    displayCustomerList(customers);
}

// ============= FILTER AND DISPLAY CUSTOMERS =============
function filterCustomers(filter) {
    const customers = Object.values(customerDatabase);
    let filtered = customers;

    switch(filter) {
        case 'vip':
            filtered = customers.filter(c => c.status === 'vip');
            break;
        case 'frequent':
            filtered = customers.filter(c => c.status === 'frequent');
            break;
        case 'inactive':
            filtered = customers.filter(c => c.status === 'inactive');
            break;
        default:
            filtered = customers;
    }

    // Update active button
    document.querySelectorAll('.customer-filters .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    displayCustomerList(filtered);
}

// ============= DISPLAY CUSTOMER LIST =============
function displayCustomerList(customers) {
    const container = document.getElementById('customerListContainer');
    if (!container) return;

    if (customers.length === 0) {
        container.innerHTML = '<p class="empty-message">No customers found</p>';
        return;
    }

    // Sort by total spent (descending)
    customers.sort((a, b) => b.totalSpent - a.totalSpent);

    const html = customers.map(customer => {
        const statusIcon = getCustomerStatusIcon(customer.status);
        const tierColor = getTierColor(customer.tier);
        const lastOrder = new Date(customer.lastOrderDate).toLocaleDateString('en-PH');
        const topProduct = Object.entries(customer.favoriteProducts)
            .sort((a, b) => b[1] - a[1])[0];

        return `
            <div class="customer-card" onclick="openCustomerProfile('${customer.customerId}')">
                <div class="customer-header">
                    <div class="customer-info">
                        <div class="customer-name">${customer.name}</div>
                        <div class="customer-contact">${customer.email || customer.phone}</div>
                    </div>
                    <div class="customer-status">
                        <span class="status-badge ${customer.status}">${statusIcon} ${customer.status.toUpperCase()}</span>
                        <span class="tier-badge" style="background-color: ${tierColor};">${customer.tier.toUpperCase()}</span>
                    </div>
                </div>
                <div class="customer-stats">
                    <div class="stat">
                        <span class="stat-label">Orders</span>
                        <span class="stat-value">${customer.totalOrders}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Total Spent</span>
                        <span class="stat-value">₱${customer.totalSpent.toFixed(0)}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Points</span>
                        <span class="stat-value">${customer.loyaltyPoints}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Last Order</span>
                        <span class="stat-value">${lastOrder}</span>
                    </div>
                </div>
                ${topProduct ? `
                    <div class="customer-favorite">
                        <span class="favorite-label">❤️ Favorite: ${topProduct[0]} (${topProduct[1]}x)</span>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

// ============= OPEN CUSTOMER PROFILE =============
function openCustomerProfile(customerId) {
    const customer = customerDatabase[customerId];
    if (!customer) return;

    const modal = document.getElementById('customerProfileModal');
    if (!modal) {
        console.warn('Customer profile modal not found');
        return;
    }

    // Populate modal with customer data
    document.getElementById('customerProfileName').textContent = customer.name;
    document.getElementById('customerProfileEmail').textContent = customer.email || 'N/A';
    document.getElementById('customerProfilePhone').textContent = customer.phone || 'N/A';
    document.getElementById('customerProfileTier').textContent = customer.tier.toUpperCase();
    document.getElementById('customerProfileStatus').textContent = customer.status.toUpperCase();
    document.getElementById('customerProfileOrders').textContent = customer.totalOrders;
    document.getElementById('customerProfileSpent').textContent = `₱${customer.totalSpent.toFixed(2)}`;
    document.getElementById('customerProfilePoints').textContent = customer.loyaltyPoints;

    // Display order history
    const orderHistory = customer.orders.map(order => {
        const date = new Date(order.date).toLocaleDateString('en-PH');
        const items = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
        return `
            <div class="order-history-item">
                <div class="order-date">${date}</div>
                <div class="order-items">${items}</div>
                <div class="order-total">₱${order.total.toFixed(2)}</div>
            </div>
        `;
    }).join('');

    document.getElementById('customerOrderHistory').innerHTML = orderHistory;

    // Display favorite products
    const favorites = Object.entries(customer.favoriteProducts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([product, count]) => `<div class="favorite-item">${product} (${count}x)</div>`)
        .join('');

    document.getElementById('customerFavorites').innerHTML = favorites;

    modal.style.display = 'flex';
}

function closeCustomerProfile() {
    const modal = document.getElementById('customerProfileModal');
    if (modal) modal.style.display = 'none';
}

// ============= SEND MARKETING MESSAGE =============
function sendMarketingMessage(customerId, messageType) {
    const customer = customerDatabase[customerId];
    if (!customer) return;

    const messages = {
        comeback: `Hi ${customer.name}! 👋 We miss you! Come back and enjoy a special 10% discount on your next order. Use code: COMEBACK10`,
        vip: `Hi ${customer.name}! 🌟 Thank you for being a VIP customer! Enjoy 15% off on all items this week!`,
        loyalty: `Hi ${customer.name}! 🎉 You've earned ${customer.loyaltyPoints} loyalty points! Redeem them for exclusive rewards.`
    };

    const message = messages[messageType];
    
    // Log the marketing action
    logActivity(`Marketing message sent to ${customer.name}`, `Type: ${messageType}, Message: ${message}`);
    
    showToast(`✅ Message prepared for ${customer.name}\n\n"${message}"\n\nYou can send this via WhatsApp or SMS`);
}

// ============= GET CUSTOMER STATUS ICON =============
function getCustomerStatusIcon(status) {
    const icons = {
        vip: '⭐',
        frequent: '🔄',
        active: '✅',
        inactive: '💤'
    };
    return icons[status] || '👤';
}

// ============= GET TIER COLOR =============
function getTierColor(tier) {
    const colors = {
        bronze: '#CD7F32',
        silver: '#C0C0C0',
        gold: '#FFD700',
        platinum: '#E5E4E2'
    };
    return colors[tier] || '#95a5a6';
}

// ============= EXPORT CUSTOMER LIST =============
function exportCustomerList() {
    const customers = Object.values(customerDatabase);
    let csv = 'Customer Name,Email,Phone,Total Orders,Total Spent,Loyalty Tier,Status,Last Order Date,Loyalty Points\n';

    customers.forEach(customer => {
        const lastOrder = new Date(customer.lastOrderDate).toLocaleDateString('en-PH');
        csv += `"${customer.name}","${customer.email || ''}","${customer.phone || ''}",${customer.totalOrders},${customer.totalSpent},"${customer.tier}","${customer.status}","${lastOrder}",${customer.loyaltyPoints}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-list-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showToast('📥 Customer list exported!');
}

// ============= INITIALIZE ON PAGE LOAD =============
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initializeCustomerSystem();
    }, 2000);
});
