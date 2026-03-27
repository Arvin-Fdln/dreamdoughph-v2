// Keyboard shortcut handler for Alt+1 to Alt+6 to switch sections
function setupSectionShortcuts() {
    window.addEventListener('keydown', function(e) {
        // Prevent shortcut inside input, textarea, or contenteditable
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
        if (e.altKey) {
            switch (e.code) {
                case 'Digit1':
                case 'Numpad1':
                    switchSection('dashboard');
                    e.preventDefault();
                    break;
                case 'Digit2':
                case 'Numpad2':
                    switchSection('menu');
                    e.preventDefault();
                    break;
                case 'Digit3':
                case 'Numpad3':
                    switchSection('custom-items');
                    e.preventDefault();
                    break;
                case 'Digit4':
                case 'Numpad4':
                    switchSection('orders');
                    e.preventDefault();
                    break;
                case 'Digit5':
                case 'Numpad5':
                    switchSection('custom-orders');
                    e.preventDefault();
                    break;
                case 'Digit6':
                case 'Numpad6':
                    switchSection('analytics');
                    e.preventDefault();
                    break;
                case 'Digit7':
                case 'Numpad7':
                    switchSection('settings');
                    e.preventDefault();
                    break;
                default:
                    break;
            }
        }
    });
}
// Dream Dough Admin Panel - PROFESSIONAL REDESIGN

// Global variables
let currentUser = null;
let menuItemsData = [];
let ordersData = [];
let currentEditingItemId = null;
let currentEditingOrderId = null;
let timerInterval = null;
let currentDateFilter = 'today';
let customStartDate = null;
let customEndDate = null;
let isExpandedView = true;

// ============= INITIALIZE EVERYTHING =============
// Update the main initialization
document.addEventListener('DOMContentLoaded', () => {
    setupSectionShortcuts();
    checkAuth();
    setupEventListeners();
    startLiveTimer();
    updatePageTitle();
    initializePaymentTracking();
    initializeProductPerformance();
    finalizeSetup(); 

    setTimeout(() => {
        populateOrderImages();
    }, 3000);

    initializeMobileResponsive();
    
    optimizeForMobile();
    
    // Load custom items if on that section (optional)
    if (document.getElementById('custom-items').classList.contains('active')) {
        loadCustomItems();
    }

});

// Check authentication
function checkAuth() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            // Remove the old user email display
            // document.getElementById('userEmail').textContent = user.email;
            
            // Setup user dropdown
            setupUserDropdown();
            updateUserDropdown(user.email);
            
            trackAdminLogin(user.email);
            loadDashboardData();
            console.log('✅ User logged in:', user.email);
        } else {
            console.log('❌ No user logged in');
            window.location.href = 'login.html';
        }
    });
}
// ============= LIVE TIMER SYSTEM =============
function startLiveTimer() {
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    const msUntilMidnight = tomorrow - now;
    const hoursLeft = Math.floor(msUntilMidnight / (1000 * 60 * 60));
    const minutesLeft = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));
    const secondsLeft = Math.floor((msUntilMidnight % (1000 * 60)) / 1000);
    
    const timerElement = document.getElementById('liveTimer');
    if (timerElement) {
        timerElement.innerHTML = `
            <div class="current-time">${timeString}</div>
            <div class="reset-countdown">⏰ Resets in ${hoursLeft}h ${minutesLeft}m ${secondsLeft}s</div>
        `;
    }
    
    if (hoursLeft === 0 && minutesLeft === 0 && secondsLeft === 0) {
        console.log('🔄 Midnight reached! Refreshing dashboard...');
        if (document.getElementById('dashboard').classList.contains('active')) {
            loadDashboardData();
        }
    }
}

function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const body = document.body;
    const isActive = sidebar.classList.contains('active');
    
    if (isActive) {
        sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        body.classList.remove('sidebar-open');
        body.style.overflow = 'auto';
    } else {
        sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
        body.classList.add('sidebar-open');
        body.style.overflow = 'hidden';
    }
}

function closeMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const body = document.body;
    
    sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    body.classList.remove('sidebar-open');
    body.style.overflow = 'auto';
}

// ============= SETUP EVENT LISTENERS =============
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            switchSection(section);
            
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const titles = {
                dashboard: 'Dashboard Overview',
                menu: 'Menu Items Management',
                orders: 'Pre-Order Management',
                'custom-items': 'Custom Items Management',
                'custom-orders': 'Custom Orders Management', 
                analytics: 'Analytics & Reports',
                settings: 'Settings'
            };
            document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';
        });
    });

        // Custom items
    if (document.getElementById('addCustomItemBtn')) {
        document.getElementById('addCustomItemBtn').addEventListener('click', () => {
            currentEditingCustomItemId = null;
            document.getElementById('customItemModalTitle').textContent = 'Add New Custom Item';
            document.getElementById('customItemForm').reset();
            
            // Reset image preview
            document.getElementById('customImagePreview').innerHTML = `
                <span style="color: var(--light-brown); font-size: 3rem;">🎂</span>
            `;
            
            openCustomItemModal();
        });
    }

    if (document.getElementById('addCustomItemBtnEmpty')) {
        document.getElementById('addCustomItemBtnEmpty').addEventListener('click', () => {
            currentEditingCustomItemId = null;
            document.getElementById('customItemModalTitle').textContent = 'Add New Custom Item';
            document.getElementById('customItemForm').reset();
            
            // Reset image preview
            document.getElementById('customImagePreview').innerHTML = `
                <span style="color: var(--light-brown); font-size: 3rem;">🎂</span>
            `;
            
            openCustomItemModal();
        });
    }

    // Custom item search
    if (document.getElementById('customItemSearch')) {
        document.getElementById('customItemSearch').addEventListener('keyup', filterCustomItems);
    }

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Menu items
    if (document.getElementById('addProductBtn')) {
        document.getElementById('addProductBtn').addEventListener('click', () => {
            currentEditingItemId = null;
            document.getElementById('modalTitle').textContent = 'Add New Menu Item';
            document.getElementById('productForm').reset();
            openProductModal();
        });
    }

    // Product search and filter
    if (document.getElementById('productSearch')) {
        document.getElementById('productSearch').addEventListener('keyup', filterMenuItems);
    }
    if (document.getElementById('categoryFilter')) {
        document.getElementById('categoryFilter').addEventListener('change', filterMenuItems);
    }

    // Setup global modal backdrop click and ESC key to force-close active modals
    setupModalCloseHandlers();

    // Ensure product price input accepts only whole positive numbers (no cents)
    const productPrice = document.getElementById('productPrice');
    if (productPrice) {
        productPrice.setAttribute('min', '1');
        productPrice.setAttribute('step', '1');
        productPrice.setAttribute('max', '99999');
        productPrice.setAttribute('inputmode', 'numeric');

        // Prevent invalid keys for integer input (no decimals, no e, no signs)
        productPrice.addEventListener('keydown', function(e) {
            if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                e.preventDefault();
            }
        });

        // Sanitize pasted content: only digits allowed
        productPrice.addEventListener('paste', function(e) {
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            if (!/^\d+$/.test(paste.trim())) {
                e.preventDefault();
                showToast('Only whole numbers allowed for price', 'error');
            }
        });

        // Clean input on each change (allow only digits)
        // If user types/pastes more than 5 digits, keep the first 5 digits
        productPrice.addEventListener('input', function() {
            let v = this.value;
            v = v.replace(/[^0-9]/g, '');
            // Remove leading zeros except single zero
            v = v.replace(/^0+(\d)/, '$1');
            // Truncate to 5 digits (preserve what user typed)
            if (v.length > 5) {
                v = v.slice(0, 5);
            }
            this.value = v;
        });
    }

    // Also ensure custom item price field (in custom orders modal) allows only whole numbers
    const customItemPrice = document.getElementById('customItemPrice');
    if (customItemPrice) {
        customItemPrice.setAttribute('min', '1');
        customItemPrice.setAttribute('step', '1');
        customItemPrice.setAttribute('max', '99999');
        customItemPrice.setAttribute('inputmode', 'numeric');

        customItemPrice.addEventListener('keydown', function(e) {
            if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                e.preventDefault();
            }
        });

        customItemPrice.addEventListener('paste', function(e) {
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            if (!/^\d+$/.test(paste.trim())) {
                e.preventDefault();
                showToast('Only whole numbers allowed for price', 'error');
            }
        });

        customItemPrice.addEventListener('input', function() {
            let v = this.value;
            v = v.replace(/[^0-9]/g, '');
            v = v.replace(/^0+(\d)/, '$1');
            // Truncate to 5 digits (preserve what user typed)
            if (v.length > 5) {
                v = v.slice(0, 5);
            }
            this.value = v;
            // Update total if quantity or other logic exists elsewhere
            const qtyEl = document.getElementById('customQuantity') || { value: 1 };
            const qty = parseInt(qtyEl.value, 10) || 1;
            const totalEl = document.getElementById('customTotalPrice');
            if (totalEl) {
                let total = parseInt(v || '0', 10) * qty;
                if (total > 99999) {
                    total = 99999;
                }
                totalEl.value = total;
            }
        });
    }

    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Close mobile menu when clicking on a nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });
    });

    // Date filter buttons
    setupDateFilterListeners();

        // Menu items - update event listeners
    if (document.getElementById('addProductBtn')) {
        document.getElementById('addProductBtn').addEventListener('click', () => {
            currentEditingItemId = null;
            document.getElementById('modalTitle').textContent = 'Add New Menu Item';
            document.getElementById('productForm').reset();
            
            // Reset image preview
            document.getElementById('imagePreview').innerHTML = `
                <span style="color: var(--light-brown); font-size: 3rem;">🍰</span>
            `;
            
            openProductModal();
        });
    }
        
    // Product search and filter
    if (document.getElementById('productSearch')) {
        document.getElementById('productSearch').addEventListener('keyup', filterMenuItems);
    }
    if (document.getElementById('categoryFilter')) {
        document.getElementById('categoryFilter').addEventListener('change', filterMenuItems);
    }

}

function setupModalCloseHandlers() {
    if (window._modalBackdropHandlerAdded) return;

    // Click on backdrop (the modal element itself) closes the modal
    document.addEventListener('click', function(e) {
        // If clicked directly on an element with class 'modal' (backdrop), close it
        const target = e.target;
        if (target && target.classList && target.classList.contains('modal')) {
            // Prevent closing if the click originated from inside modal-content
            // (click target is the backdrop itself only when outside content)
            closeModalByElement(target);
        }
    }, true);

    // ESC key closes any active modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            const activeModals = document.querySelectorAll('.modal.active');
            activeModals.forEach(modal => closeModalByElement(modal));
        }
    });

    window._modalBackdropHandlerAdded = true;
}

function closeModalByElement(modal) {
    if (!modal) return;
    const handlers = {
        productModal: 'closeProductModal',
        orderModal: 'closeOrderModal',
        customOrderModal: 'closeCustomOrderModal',
        cropperModal: 'closeCropperModal',
        hoursModal: 'closeHoursModal',
        socialModal: 'closeSocialModal',
        imageFullscreenModal: 'closeImageFullscreen',
        customItemModal: 'closeCustomItemModal', // Add this
        customCropperModal: 'closeCustomCropperModal' // Add this
    };

    const fnName = handlers[modal.id];
    if (fnName && typeof window[fnName] === 'function') {
        try { window[fnName](); return; } catch (e) { /* fallthrough */ }
    }

    // Fallback: just remove active class and reset forms inside
    modal.classList.remove('active');
    const forms = modal.querySelectorAll('form');
    forms.forEach(f => { try { f.reset(); } catch (e) {} });
}

function setupDateFilterListeners() {
    setTimeout(() => {
        const presetButtons = document.querySelectorAll('.btn-date-preset');
        presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');
                setDateFilter(filter);
            });
        });
        
        const applyCustomBtn = document.getElementById('applyCustomDate');
        if (applyCustomBtn) {
            applyCustomBtn.addEventListener('click', applyCustomDateRange);
        }
    }, 500);
}

// ============= DATE FILTERING SYSTEM =============
function setDateFilter(filter) {
    currentDateFilter = filter;
    
    document.querySelectorAll('.btn-date-preset').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (filter !== 'custom') {
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    }
    
    if (document.getElementById('analytics').classList.contains('active')) {
        loadAnalytics();
    }
}

function applyCustomDateRange() {
    const startInput = document.getElementById('customStartDate');
    const endInput = document.getElementById('customEndDate');
    
    if (!startInput.value || !endInput.value) {
        showToast('⚠️ Please select both start and end dates', 'error');
        return;
    }
    
    customStartDate = new Date(startInput.value);
    customEndDate = new Date(endInput.value);
    customEndDate.setHours(23, 59, 59, 999);
    
    if (customStartDate > customEndDate) {
        showToast('⚠️ Start date must be before end date', 'error');
        return;
    }
    
    currentDateFilter = 'custom';
    document.querySelectorAll('.btn-date-preset').forEach(btn => {
        btn.classList.remove('active');
    });
    
    loadAnalytics();
    showToast('📅 Custom date range applied!');
}

function getDateRange() {
    const now = new Date();
    let startDate, endDate;
    
    switch(currentDateFilter) {
        case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            endDate = new Date(now.setHours(23, 59, 59, 999));
            break;
        case 'week':
            const dayOfWeek = now.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            startDate = new Date(now);
            startDate.setDate(now.getDate() - diff);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
        case 'custom':
            startDate = customStartDate;
            endDate = customEndDate;
            break;
        default:
            startDate = new Date(now.setHours(0, 0, 0, 0));
            endDate = new Date(now.setHours(23, 59, 59, 999));
    }
    
    return { startDate, endDate };
}

function filterOrdersByDate(orders) {
    const { startDate, endDate } = getDateRange();
    
    return orders.filter(order => {
        const orderDate = new Date(order.createdAt || order.date);
        return orderDate >= startDate && orderDate <= endDate;
    });
}

// ============= PAGE MANAGEMENT =============
function updatePageTitle() {
    const dashboardSection = document.getElementById('dashboard');
    if (dashboardSection && dashboardSection.classList.contains('active')) {
        document.getElementById('pageTitle').textContent = 'Dashboard Overview';
    }
}

function switchSection(sectionName) {
    const newSection = document.getElementById(sectionName);
    if (!newSection) return;
    
    // Close mobile menu when switching sections on mobile
    if (window.innerWidth <= 768) {
        closeMobileMenu();
    }
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show the selected section
    newSection.classList.add('active');
    
    // Update active navigation item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionName) {
            item.classList.add('active');
        }
    });
    
    // Update page title
    const titles = {
        dashboard: 'Dashboard Overview',
        menu: 'Menu Items Management',
        orders: 'Pre-Order Management',
        'custom-items': 'Custom Items Management',
        'custom-orders': 'Custom Orders Management',
        analytics: 'Analytics & Reports',
        settings: 'Settings'
    };
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = titles[sectionName] || 'Dashboard';
        
        // Truncate title on mobile
        if (window.innerWidth <= 480 && pageTitle.textContent.length > 20) {
            pageTitle.textContent = pageTitle.textContent.substring(0, 20) + '...';
        }
    }
    
 // Load section data
    trackPageView(sectionName);
    
    switch(sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'menu':
            loadMenuItems();
            break;
        case 'custom-items': // Add this case
            loadCustomItems();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'custom-orders':
            loadCustomOrders();
            break;
        case 'analytics':
            loadAnalytics();
            setupDateFilterListeners();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// ============= DASHBOARD - TODAY'S DATA =============
function loadDashboardData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Reset stats first
    document.getElementById('pendingOrders').textContent = '0';
    document.getElementById('confirmedOrders').textContent = '0';
    document.getElementById('totalRevenue').textContent = '0.00';
    document.getElementById('totalProducts').textContent = '0';
    
    database.ref('orders').once('value', (snapshot) => {
        ordersData = [];
        let todayPending = 0;
        let todayConfirmed = 0;
        let todayRevenue = 0;
        
        snapshot.forEach((childSnapshot) => {
            const order = childSnapshot.val();
            const orderData = {
                id: childSnapshot.key,
                ...order
            };
            ordersData.push(orderData);
            
            // Check if order is from today
            const orderDate = new Date(order.createdAt || order.date);
            
            if (orderDate >= today && orderDate < tomorrow) {
                if (order.status === 'pending') {
                    todayPending++;
                }
                if (order.status === 'confirmed') {
                    todayConfirmed++;
                }
                if (order.status === 'confirmed' || order.status === 'completed') {
                    todayRevenue += parseFloat(order.total || 0);
                }
            }
        });
        
        // Update the DOM elements
        document.getElementById('pendingOrders').textContent = todayPending;
        document.getElementById('confirmedOrders').textContent = todayConfirmed;
        document.getElementById('totalRevenue').textContent = todayRevenue.toFixed(2);
        
        displayRecentOrders();
        updatePaymentStats();
        loadTodayTimeline();
    }).catch(error => {
        console.error('Error loading orders:', error);
        showToast('Error loading dashboard data', 'error');
    });

    database.ref('products').once('value', (snapshot) => {
        let count = 0;
        menuItemsData = [];
        snapshot.forEach((childSnapshot) => {
            menuItemsData.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
            count++;
        });
        document.getElementById('totalProducts').textContent = count;
    }).catch(error => {
        console.error('Error loading products:', error);
    });
}

function displayRecentOrders() {
    const container = document.getElementById('recentOrdersList');
    
    if (ordersData.length === 0) {
        container.innerHTML = '<p class="empty-message">No pre-orders yet</p>';
        return;
    }

    const recent = ordersData.slice(-5).reverse();
    container.innerHTML = recent.map(order => `
        <div class="order-item">
            <div class="order-info">
                <div class="order-id">Order #${order.id.substring(0, 8)}</div>
                <div class="order-customer">${order.customerName || 'Unknown Customer'}</div>
            </div>
            <div class="order-amount">₱${Math.round(order.total || 0)}</div>
            <span class="order-status status-${order.status || 'pending'}">${order.status || 'pending'}</span>
        </div>
    `).join('');
}

// ============= ORDERS - LAYERED BY STATUS =============

// Update addExportButton to prevent duplicates
function addExportButton() {
    const ordersHeader = document.querySelector('#orders .orders-header-controls');
    if (ordersHeader && !document.querySelector('.export-data-btn')) {
        const exportBtn = document.createElement('button');
        exportBtn.className = 'export-data-btn bulk-delete-btn';
        exportBtn.innerHTML = '<span class="icon">📊</span><span>Export Data</span>';
        exportBtn.onclick = exportOrderData;
        ordersHeader.appendChild(exportBtn);
    }
}

function toggleViewMode() {
    isExpandedView = !isExpandedView;
    const sections = document.querySelectorAll('.order-section-container');
    const btn = document.querySelector('.view-toggle-btn');
    
    if (isExpandedView) {
        sections.forEach(section => section.classList.remove('collapsed'));
        btn.innerHTML = '<span class="icon">📂</span><span>Collapse All</span>';
    } else {
        sections.forEach(section => section.classList.add('collapsed'));
        btn.innerHTML = '<span class="icon">📁</span><span>Expand All</span>';
    }
}

function toggleSection(sectionElement) {
    sectionElement.classList.toggle('collapsed');
}

function displayOrdersBySections() {
    const container = document.getElementById('ordersList');
    
    const ordersByStatus = {
        pending: ordersData.filter(o => o.status === 'pending'),
        confirmed: ordersData.filter(o => o.status === 'confirmed'),
        adjustment: ordersData.filter(o => o.status === 'adjustment'),
        completed: ordersData.filter(o => o.status === 'completed'),
        cancelled: ordersData.filter(o => o.status === 'cancelled')
    };
    
    const statusConfig = {
        pending: { icon: '⏳', title: 'Pending Review', color: 'warning' },
        confirmed: { icon: '✅', title: 'Confirmed Orders', color: 'info' },
        adjustment: { icon: '✏️', title: 'Needs Adjustment', color: 'warning' },
        completed: { icon: '🎉', title: 'Completed Orders', color: 'success' },
        cancelled: { icon: '❌', title: 'Cancelled Orders', color: 'danger' }
    };
    
    let html = '';
    
    for (const [status, orders] of Object.entries(ordersByStatus)) {
        const config = statusConfig[status];
        const collapsedClass = isExpandedView ? '' : 'collapsed';
        
        html += `
            <div class="order-section-container status-${status} ${collapsedClass}">
                <div class="order-section-header" onclick="toggleSection(this.parentElement)">
                    <div class="order-section-title">
                        <span class="icon">${config.icon}</span>
                        <h3>${config.title}</h3>
                        <span class="order-count-badge">${orders.length}</span>
                    </div>
                    <span class="section-toggle-icon">▼</span>
                </div>
                <div class="order-section-content">
                    ${orders.length === 0 ? 
                        '<div class="empty-section-message">No orders in this category</div>' :
                        generateOrdersTable(orders)
                    }
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function generateOrdersTable(orders) {
    return `
        <div class="orders-table">
            <table>
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Total</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr>
                            <td><strong>#${order.id.substring(0, 8)}</strong></td>
                            <td>${order.customerName || 'Unknown'}</td>
                            <td>${order.customerEmail || 'Not provided'}</td>
                            <td>${order.customerPhone || 'N/A'}</td>
                            <td><strong>₱${Math.round(order.total || 0)}</strong></td>
                            <td>${formatOrderDate(order.createdAt || order.date)}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-review" onclick="editOrder('${order.id}')">Review</button>
                                    ${(order.status === 'cancelled' || order.status === 'completed') ? 
                                        `<button class="btn-delete" onclick="deleteOrder('${order.id}', '${order.customerName}')">Delete</button>` 
                                        : ''}
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function formatOrderDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function bulkDeleteCompletedOrders() {
    const deletableOrders = window.orderDataCache.filter(order => 
        order.orderType !== 'custom' &&
        (order.status === 'cancelled' || order.status === 'completed')
    );
    
    if (deletableOrders.length === 0) {
        showToast('No cancelled or completed orders to delete', 'error');
        return;
    }
    
    const confirmMessage = `⚠️ BULK DELETE\n\nThis will permanently delete ${deletableOrders.length} order(s) that are either cancelled or completed.\n\nThis action cannot be undone!\n\nContinue?`;
    
    if (confirm(confirmMessage)) {
        showLoading(true);
        
        let deleteCount = 0;
        const deletePromises = deletableOrders.map(order => 
            database.ref('orders/' + order.id).remove()
                .then(() => {
                    deleteCount++;
                    // Remove from cache
                    window.orderDataCache = window.orderDataCache.filter(o => o.id !== order.id);
                })
        );
        
        Promise.all(deletePromises)
            .then(() => {
                showToast(`✅ Successfully deleted ${deleteCount} order(s)!`);
                showLoading(false);
                
                // Refresh display
                if (isOrderCardView) {
                    displayOrdersGrid(window.orderDataCache.filter(o => o.orderType !== 'custom'));
                } else {
                    displayOrdersTable(window.orderDataCache.filter(o => o.orderType !== 'custom'));
                }
                
                loadDashboardData();
            })
            .catch(error => {
                showToast('❌ Error during bulk delete: ' + error.message, 'error');
                showLoading(false);
            });
    }
}

// Delete single order
function deleteOrder(orderId, customerName) {
    const order = window.orderDataCache.find(o => o.id === orderId);
    
    if (!order) {
        showToast('❌ Order not found', 'error');
        return;
    }
    
    if (order.status !== 'cancelled' && order.status !== 'completed') {
        showToast('❌ Can only delete cancelled or completed orders', 'error');
        return;
    }
    
    const confirmMessage = `⚠️ Are you sure you want to permanently delete this order?\n\nCustomer: ${customerName}\nOrder ID: #${orderId.substring(0, 8)}\nStatus: ${order.status}\n\nThis action cannot be undone!`;
    
    if (confirm(confirmMessage)) {
        showLoading(true);
        
        database.ref('orders/' + orderId).remove()
            .then(() => {
                // Remove from cache
                window.orderDataCache = window.orderDataCache.filter(o => o.id !== orderId);
                
                trackOrderAction('delete', orderId, order.status);
                showToast('✅ Order deleted successfully!');
                showLoading(false);
                
                // Refresh display
                if (isOrderCardView) {
                    displayOrdersGrid(window.orderDataCache.filter(o => o.orderType !== 'custom'));
                } else {
                    displayOrdersTable(window.orderDataCache.filter(o => o.orderType !== 'custom'));
                }
                
                loadDashboardData();
            })
            .catch(error => {
                showToast('❌ Error deleting order: ' + error.message, 'error');
                showLoading(false);
            });
    }
}

// ============= SIMPLIFIED ORDER FUNCTIONS =============
function editOrder(id) {
    const order = ordersData.find(o => o.id === id);
    if (!order) return;

    currentEditingOrderId = id;
    
    // Customer Info
    document.getElementById('customerNameDisplay').textContent = order.customerName || 'Unknown Customer';
    document.getElementById('customerPhoneDisplay').textContent = order.customerPhone ? `📱 ${order.customerPhone}` : '📱 No phone provided';
    document.getElementById('customerEmailDisplay').textContent = order.customerEmail ? `📧 ${order.customerEmail}` : '📧 No email provided';
    
    // Order Items
    displayOrderItems(order);
    
    // Order Total
    document.getElementById('orderTotalDisplay').textContent = `₱${(order.total || 0).toFixed(2)}`;
    
    // Status
    document.getElementById('orderStatus').value = order.status || 'pending';
    updateStatusDisplay(order.status);
    
    // Notes
    document.getElementById('orderNotes').value = order.notes || '';
    document.getElementById('orderReply').value = '';

    openOrderModal();
}

// Update displayOrderItems to show product images
function displayOrderItems(order) {
    const container = document.getElementById('orderItemsDisplay');
    
    if (!order.items || !Array.isArray(order.items)) {
        container.innerHTML = '<div class="order-item-line"><span class="item-name">No items details available</span></div>';
        return;
    }
    
    container.innerHTML = order.items.map(item => {
        // Try to get image
        const imageUrl = item.image || getProductImage(item.name);
        const imageHtml = imageUrl ? 
            `<img src="${imageUrl}" alt="${item.name}" class="modal-item-image" onerror="this.style.display='none'">` : 
            '';
        
        return `
                <div class="order-item-line">
                <div style="display: flex; align-items: flex-start; gap: 1rem;">
                    ${imageUrl ? `
                        <div style="width: 60px; height: 60px; flex-shrink: 0;">
                            <img src="${imageUrl}" alt="${item.name}" 
                                 style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px; border: 1px solid #E0E0E0;"
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIzMCIgZmlsbD0iI0Y4RjlGQSIvPjxwYXRoIGQ9Ik0zMCAzNUMzMy44ODYgMzUgMzcgMzEuODg2IDM3IDI4QzM3IDI0LjExNCAzMy44ODYgMjEgMzAgMjFDMjYuMTE0IDIxIDIzIDI0LjExNCAyMyAyOEMyMyAzMS44ODYgMjYuMTE0IDM1IDMwIDM1Wk0zMCAzOEMyMi4yNjggMzggMTYgNDEuMzggMTYgNDVINDNDNDMgNDEuMzggMzYuNzMyIDM4IDMwIDM4WiIgZmlsbD0iI0JEQzNCNyIvPjwvc3ZnPgo='">
                        </div>
                    ` : ''}
                    <div>
                        <div class="item-name">${item.name || 'Unknown Item'}</div>
                        <div class="item-details">
                            ${item.quantity ? `Qty: ${item.quantity}` : ''}
                            ${item.size ? ` • Size: ${item.size}` : ''}
                            ${item.customizations ? ` • Custom: ${item.customizations}` : ''}
                        </div>
                    </div>
                </div>
                <div class="item-price">₱${Math.round((item.price || 0) * (item.quantity || 1))}</div>
            </div>
        `;
    }).join('');
}

// Add CSS for modal item images
const modalImageStyle = document.createElement('style');
modalImageStyle.textContent = `
    .modal-item-image {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 6px;
        border: 1px solid #E0E0E0;
        background: #F8F9FA;
    }
    
    .modal .order-item-line {
        align-items: center;
    }
`;
document.head.appendChild(modalImageStyle);

function updateStatusDisplay(status) {
    const statusDisplay = document.getElementById('currentStatusDisplay');
    const statusText = {
        'pending': '📝 Pending Review',
        'confirmed': '✅ Confirmed', 
        'adjustment': '✏️ Needs Adjustment',
        'completed': '🎉 Completed',
        'cancelled': '❌ Cancelled'
    }[status] || '📝 Pending Review';
    
    statusDisplay.innerHTML = `<span class="status-badge status-${status}">${statusText}</span>`;
}

function quickAction(action) {
    const statusMap = {
        'confirm': 'confirmed',
        'adjustment': 'adjustment', 
        'complete': 'completed',
        'cancel': 'cancelled'
    };
    
    document.getElementById('orderStatus').value = statusMap[action];
    updateStatusDisplay(statusMap[action]);
    
    // Auto-fill helpful messages
    const messages = {
        'confirm': 'Great news! Your order has been confirmed and we\'re preparing it for you. We\'ll notify you when it\'s ready for pickup!',
        'adjustment': 'Hi there! We need to discuss some details about your order. Please contact us at your earliest convenience.',
        'complete': 'Thank you for your order! We hope you enjoy your treats from Dream Dough! 🍰',
        'cancel': 'We\'ve processed the cancellation of your order as requested. Please let us know if you have any questions.'
    };
    
    document.getElementById('orderReply').value = messages[action] || '';
}

function updateOrder() {
    showLoading(true);

    const orderUpdate = {
        status: document.getElementById('orderStatus').value,
        notes: document.getElementById('orderNotes').value,
        updatedAt: new Date().toISOString()
    };
    
    const replyMessage = document.getElementById('orderReply').value.trim();
    const order = ordersData.find(o => o.id === currentEditingOrderId);

    database.ref('orders/' + currentEditingOrderId).update(orderUpdate)
        .then(() => {
            trackOrderAction('update', currentEditingOrderId, orderUpdate.status);
            
            if (replyMessage && order && order.customerEmail) {
                return sendEmailToCustomer(
                    order.customerEmail, 
                    order.customerName, 
                    currentEditingOrderId.substring(0, 8), 
                    replyMessage, 
                    orderUpdate.status
                ).then(response => {
                    if (response.ok) {
                        showToast('✅ Order updated and email sent!');
                    } else {
                        showToast('✅ Order updated but email failed to send', 'error');
                    }
                }).catch(() => {
                    showToast('✅ Order updated but email failed to send', 'error');
                });
            } else {
                showToast('✅ Order updated successfully!');
            }
        })
        .then(() => {
            showLoading(false);
            closeOrderModal();
            loadOrders();
            loadDashboardData();
        })
        .catch(error => {
            showToast('❌ Error updating order: ' + error.message, 'error');
            showLoading(false);
        });
}

function handleOrderSubmit(event) {
    event.preventDefault();
    showLoading(true);

    const orderUpdate = {
        status: document.getElementById('orderStatus').value,
        notes: document.getElementById('orderNotes').value,
        updatedAt: new Date().toISOString()
    };
    
    const replyMessage = document.getElementById('orderReply').value.trim();
    const customerEmail = document.getElementById('customerEmail').value;
    const customerName = document.getElementById('customerName').value;
    const orderId = document.getElementById('orderId').value;

    database.ref('orders/' + currentEditingOrderId).update(orderUpdate)
        .then(() => {
            trackOrderAction('update', currentEditingOrderId, orderUpdate.status);
            
            if (replyMessage && customerEmail) {
                return sendEmailToCustomer(
                    customerEmail, 
                    customerName, 
                    orderId, 
                    replyMessage, 
                    orderUpdate.status
                ).then(response => {
                    if (response.ok) {
                        showToast('✅ Pre-order updated and email sent!');
                    } else {
                        showToast('✅ Pre-order updated but email failed to send', 'error');
                    }
                }).catch(() => {
                    showToast('✅ Pre-order updated but email failed to send', 'error');
                });
            } else {
                showToast('✅ Pre-order updated successfully!');
            }
        })
        .then(() => {
            showLoading(false);
            closeOrderModal();
            loadOrders();
            loadDashboardData();
        })
        .catch(error => {
            showToast('❌ Error updating order: ' + error.message, 'error');
            showLoading(false);
        });
}

function openOrderModal() {
    document.getElementById('orderModal').classList.add('active');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

// Global variables for menu
let currentMenuView = 'grid';
let menuStats = {
    total: 0,
    cakes: 0,
    cookies: 0,
    cupcakes: 0
};

// Update loadMenuItems function
function loadMenuItems() {
    database.ref('products').once('value', (snapshot) => {
        menuItemsData = [];
        menuStats = {
            total: 0,
            cakes: 0,
            cookies: 0,
            cupcakes: 0
        };
        
        let totalPrice = 0;
        let mostExpensiveItem = { name: '-', price: 0 };
        let lastUpdated = null;
        
        snapshot.forEach((childSnapshot) => {
            const item = {
                id: childSnapshot.key,
                ...childSnapshot.val()
            };
            menuItemsData.push(item);
            
            // Update stats
            menuStats.total++;
            
            // Count by category
            if (item.category === 'cakes') menuStats.cakes++;
            else if (item.category === 'cookies') menuStats.cookies++;
            else if (item.category === 'cupcakes') menuStats.cupcakes++;
            
            // Calculate average price
            totalPrice += item.price || 0;
            
            // Find most expensive
            if (item.price > mostExpensiveItem.price) {
                mostExpensiveItem = {
                    name: item.name,
                    price: item.price
                };
            }
            
            // Find last updated
            const updatedAt = item.updatedAt || item.createdAt;
            if (updatedAt) {
                const updateDate = new Date(updatedAt);
                if (!lastUpdated || updateDate > lastUpdated) {
                    lastUpdated = updateDate;
                }
            }
        });
        
        // Update stats display
        updateMenuStats();
        
        // Update quick stats
        const averagePrice = menuStats.total > 0 ? totalPrice / menuStats.total : 0;
        document.getElementById('averagePrice').textContent = averagePrice.toFixed(2);
        
        document.getElementById('mostExpensive').textContent = 
            mostExpensiveItem.name !== '-' ? 
            `${mostExpensiveItem.name} (₱${mostExpensiveItem.price.toFixed(2)})` : 
            '-';
        
        document.getElementById('lastUpdated').textContent = lastUpdated ? 
            formatDate(lastUpdated) : '-';
        
        // Display items
        filterMenuItems();
        
    }).catch(error => {
        showToast('Error loading menu items: ' + error.message, 'error');
    });
}

// Update menu stats display
function updateMenuStats() {
    document.getElementById('totalMenuItems').textContent = menuStats.total;
    document.getElementById('cakesCount').textContent = menuStats.cakes;
    document.getElementById('cookiesCount').textContent = menuStats.cookies;
    document.getElementById('cupcakesCount').textContent = menuStats.cupcakes;
}

// Format date for display
function formatDate(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}


// Display menu items in grid view
function displayMenuItemsGrid(items) {
    const container = document.getElementById('menuItemsGrid');
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🍰</div>
                <h3>No menu items found</h3>
                <p>Try changing your search or add a new item</p>
                <button class="btn-primary btn-add-first" onclick="openAddItemModal()">
                    + Add New Item
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map(item => createMenuItemCard(item)).join('');
}

// Create menu item card
function createMenuItemCard(item) {
    const categoryClass = item.category ? `category-${item.category}` : '';
    const categoryText = item.category ? 
        item.category.charAt(0).toUpperCase() + item.category.slice(1) : 
        'Uncategorized';
    
    return `
        <div class="menu-item-card">
            <div class="menu-item-image">
                ${item.image ? 
                    `<img src="${item.image}" alt="${item.name}" loading="lazy">` :
                    `<div class="no-image-placeholder">🍰</div>`
                }
                <span class="category-badge ${item.category || ''}">${categoryText}</span>
            </div>
            
            <div class="menu-item-content">
                <div class="menu-item-header">
                    <h3 class="menu-item-name">${item.name || 'Unnamed Item'}</h3>
                    <p class="menu-item-description">${item.description || 'No description available'}</p>
                </div>
                
                <div class="menu-item-footer">
                    <div class="menu-item-price">
                            <span class="currency">₱</span>${Math.round(item.price || 0)}
                        </div>
                    
                    <div class="menu-item-actions">
                        <button class="menu-item-action-btn edit" onclick="editMenuItem('${item.id}', event)">
                            ✏️
                        </button>
                        <button class="menu-item-action-btn delete" onclick="deleteMenuItem('${item.id}', event)">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}


// Update filtered menu stats
function updateFilteredMenuStats(filteredItems) {
    const filteredStats = {
        total: filteredItems.length,
        cakes: 0,
        cookies: 0,
        cupcakes: 0
    };
    
    filteredItems.forEach(item => {
        if (item.category === 'cakes') filteredStats.cakes++;
        else if (item.category === 'cookies') filteredStats.cookies++;
        else if (item.category === 'cupcakes') filteredStats.cupcakes++;
    });
    
    // Update display (temporary stats for filtered view)
    document.getElementById('totalMenuItems').textContent = filteredStats.total;
    document.getElementById('cakesCount').textContent = filteredStats.cakes;
    document.getElementById('cookiesCount').textContent = filteredStats.cookies;
    document.getElementById('cupcakesCount').textContent = filteredStats.cupcakes;
}



// Add status badge style
const style = document.createElement('style');
style.textContent = `
    .status-badge.status-active {
        background: #D4EDDA;
        color: #155724;
        padding: 0.3rem 0.8rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
    }
`;
document.head.appendChild(style);

function displayMenuItems(items) {
    const container = document.getElementById('productsList');

    if (items.length === 0) {
        container.innerHTML = '<p class="empty-message">No menu items found</p>';
        return;
    }

    const html = `
        <table>
            <thead>
                <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Description</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td><strong>${item.name}</strong></td>
                        <td>${item.category}</td>
                        <td>₱${(item.price || 0).toFixed(2)}</td>
                        <td>${item.description ? item.description.substring(0, 40) + '...' : 'N/A'}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-review" onclick="editMenuItem('${item.id}')">Edit</button>
                                <button class="btn-delete" onclick="deleteMenuItem('${item.id}')">Delete</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = html;
}

// Update filterMenuItems function
function filterMenuItems() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;

    const filtered = menuItemsData.filter(item => {
        const matchName = item.name.toLowerCase().includes(searchTerm);
        const matchDescription = item.description ? 
            item.description.toLowerCase().includes(searchTerm) : false;
        const matchCategory = category === '' || item.category === category;
        
        return (matchName || matchDescription) && matchCategory;
    });

    // Update stats for filtered items
    updateFilteredMenuStats(filtered);
    
    // Display ONLY grid view
    displayMenuItemsGrid(filtered);
}

// Update editMenuItem function to prevent event bubbling
function editMenuItem(id, event) {
    if (event) event.stopPropagation();
    
    const item = menuItemsData.find(i => i.id === id);
    if (!item) return;

    currentEditingItemId = id;
    document.getElementById('modalTitle').textContent = 'Edit Menu Item';
    document.getElementById('productName').value = item.name;
    document.getElementById('productDescription').value = item.description;
    document.getElementById('productCategory').value = item.category;
    document.getElementById('productPrice').value = item.price;
    document.getElementById('productImage').value = item.image || '';

    // Update image preview
    const preview = document.getElementById('imagePreview');
    if (item.image) {
        preview.innerHTML = `
            <img src="${item.image}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">
        `;
    } else {
        preview.innerHTML = `
            <span style="color: var(--light-brown); font-size: 3rem;">🍰</span>
        `;
    }

    openProductModal();
}

// Update deleteMenuItem function to prevent event bubbling
function deleteMenuItem(id, event) {
    if (event) event.stopPropagation();
    
    const item = menuItemsData.find(i => i.id === id);
    
    if (confirm('Are you sure you want to delete this menu item?')) {
        showLoading(true);
        database.ref('products/' + id).remove()
            .then(() => {
                trackProductAction('delete', item ? item.name : 'Unknown');
                showToast('✅ Menu item deleted successfully!');
                showLoading(false);
                loadMenuItems();
            })
            .catch(error => {
                showToast('❌ Error deleting item: ' + error.message, 'error');
                showLoading(false);
            });
    }
}

function handleProductSubmit(event) {
    event.preventDefault();
    showLoading(true);

    const name = document.getElementById('productName').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const category = document.getElementById('productCategory').value;
    const priceEl = document.getElementById('productPrice');
    const priceStr = priceEl ? priceEl.value.trim() : '';
    const priceNum = parseFloat(priceStr);

    // Validate price: must be an integer number between 1 and 99999
    if (!priceStr || !/^\d+$/.test(priceStr) || isNaN(priceNum) || priceNum < 1 || priceNum > 99999) {
        showToast('❌ Please enter a valid whole number price between 1 and 99,999', 'error');
        showLoading(false);
        return;
    }

    const itemData = {
        name: name,
        description: description,
        category: category,
        price: parseInt(priceNum, 10),
        image: document.getElementById('productImage').value,
        updatedAt: new Date().toISOString()
    };

    let savePromise;
    const action = currentEditingItemId ? 'edit' : 'add';

    if (currentEditingItemId) {
        savePromise = database.ref('products/' + currentEditingItemId).update(itemData);
    } else {
        itemData.createdAt = new Date().toISOString();
        savePromise = database.ref('products').push(itemData);
    }

    savePromise
        .then(() => {
            trackProductAction(action, itemData.name);
            showToast(currentEditingItemId ? '✅ Menu item updated!' : '✅ Menu item added!');
            showLoading(false);
            closeProductModal();
            loadMenuItems();
        })
        .catch(error => {
            showToast('❌ Error saving item: ' + error.message, 'error');
            showLoading(false);
        });
}

function openProductModal() {
    document.getElementById('productModal').classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    document.getElementById('productForm').reset();
}

// ============= ANALYTICS WITH DATE FILTERS =============
let monthlySalesChart = null;
let categorySalesChart = null;
let revenuePieChart = null;

function loadAnalytics() {
    database.ref('orders').once('value', (snapshot) => {
        ordersData = [];
        snapshot.forEach((childSnapshot) => {
            ordersData.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        const filteredOrders = filterOrdersByDate(ordersData);
        const confirmedOrders = filteredOrders.filter(o => o.status === 'confirmed' || o.status === 'completed');

        updateOrderSummaryStats(confirmedOrders);
        generateMonthlySalesChart(confirmedOrders);
        generateCategorySalesChart(confirmedOrders);
        generateRevenuePieChart(filteredOrders);
        loadProductPerformance(); // NEW
        initializeSmartNotifications(); // NEW

    }).catch(error => {
        showToast('Error loading analytics: ' + error.message, 'error');
    });
}

function updateOrderSummaryStats(confirmedOrders) {
    const totalRevenue = confirmedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue = confirmedOrders.length > 0 ? totalRevenue / confirmedOrders.length : 0;
    
    const allFilteredOrders = filterOrdersByDate(ordersData);
    const pendingCount = allFilteredOrders.filter(o => o.status === 'pending').length;
    const confirmedCount = allFilteredOrders.filter(o => o.status === 'confirmed').length;
    const completedCount = allFilteredOrders.filter(o => o.status === 'completed').length;

    const stats = [
        { label: 'Total Orders', value: allFilteredOrders.length },
        { label: 'Total Revenue', value: `₱${totalRevenue.toFixed(2)}` },
        { label: 'Avg Order Value', value: `₱${avgOrderValue.toFixed(2)}` },
        { label: 'Pending', value: pendingCount },
        { label: 'Confirmed', value: confirmedCount },
        { label: 'Completed', value: completedCount }
    ];

    const container = document.getElementById('orderSummaryStats');
    if (!container) return;

    container.innerHTML = stats.map((stat, index) => `
        <div class="stat-item ${index === 3 ? 'stat-pending' : index === 4 ? 'stat-confirmed' : index === 5 ? 'stat-completed' : ''}">
            <span class="stat-label">${stat.label}</span>
            <span class="stat-value">${stat.value}</span>
        </div>
    `).join('');
}

function generateMonthlySalesChart(confirmedOrders) {
    const ctx = document.getElementById('monthlySalesChart');
    if (!ctx) return;

    const months = [];
    const salesData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        months.push(monthName);
        
        const monthSales = confirmedOrders
            .filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate.getMonth() === date.getMonth() && 
                       orderDate.getFullYear() === date.getFullYear();
            })
            .reduce((sum, order) => sum + (order.total || 0), 0);
        
        salesData.push(monthSales);
    }

    if (monthlySalesChart) {
        monthlySalesChart.destroy();
    }

    monthlySalesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Revenue (₱)',
                data: salesData,
                borderColor: '#3498DB',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#3498DB',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#2C3E50',
                    titleColor: '#ECF0F1',
                    bodyColor: '#ECF0F1',
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return '₱' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₱' + value.toLocaleString();
                        }
                    },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

function generateCategorySalesChart(confirmedOrders) {
    const ctx = document.getElementById('categorySalesChart');
    if (!ctx) return;

    const categoryTotals = {};
    confirmedOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const category = item.category || 'Other';
                categoryTotals[category] = (categoryTotals[category] || 0) + (item.price * item.quantity);
            });
        }
    });

    const categories = Object.keys(categoryTotals);
    const totals = Object.values(categoryTotals);

    if (categorySalesChart) {
        categorySalesChart.destroy();
    }

    categorySalesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
            datasets: [{
                label: 'Sales (₱)',
                data: totals,
                backgroundColor: [
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(155, 89, 182, 0.8)',
                    'rgba(241, 196, 15, 0.8)'
                ],
                borderColor: ['#3498DB', '#2ECC71', '#9B59B6', '#F1C40F'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#2C3E50',
                    titleColor: '#ECF0F1',
                    bodyColor: '#ECF0F1',
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return '₱' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₱' + value.toLocaleString();
                        }
                    },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

function generateRevenuePieChart(filteredOrders) {
    const ctx = document.getElementById('revenuePieChart');
    if (!ctx) return;

    const statusCounts = {
        'Confirmed': filteredOrders.filter(o => o.status === 'confirmed').length,
        'Completed': filteredOrders.filter(o => o.status === 'completed').length,
        'Pending': filteredOrders.filter(o => o.status === 'pending').length,
        'Cancelled': filteredOrders.filter(o => o.status === 'cancelled').length
    };

    const labels = Object.keys(statusCounts).filter(key => statusCounts[key] > 0);
    const data = labels.map(key => statusCounts[key]);

    if (revenuePieChart) {
        revenuePieChart.destroy();
    }

    revenuePieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(241, 196, 15, 0.8)',
                    'rgba(231, 76, 60, 0.8)'
                ],
                borderColor: ['#3498DB', '#2ECC71', '#F1C40F', '#E74C3C'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 12,
                        font: { size: 11, family: 'Segoe UI' }
                    }
                },
                tooltip: {
                    backgroundColor: '#2C3E50',
                    titleColor: '#ECF0F1',
                    bodyColor: '#ECF0F1',
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

function generateTopProductsList(confirmedOrders) {
    const container = document.getElementById('topProductsList');
    if (!container) return;

    const itemStats = {};
    confirmedOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                if (!itemStats[item.name]) {
                    itemStats[item.name] = { count: 0, revenue: 0 };
                }
                itemStats[item.name].count += item.quantity || 1;
                itemStats[item.name].revenue += item.price * (item.quantity || 1);
            });
        }
    });

    const topProducts = Object.entries(itemStats)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5);

    if (topProducts.length === 0) {
        container.innerHTML = '<p class="empty-message">No sales data yet</p>';
        return;
    }

    container.innerHTML = topProducts.map(([name, stats], index) => `
        <div class="top-product-item">
            <div class="top-product-rank">#${index + 1}</div>
            <div class="top-product-info">
                <div class="top-product-name">${name}</div>
                <div class="top-product-sales">${stats.count} sold</div>
            </div>
            <div class="top-product-revenue">₱${stats.revenue.toFixed(2)}</div>
        </div>
    `).join('');
}

// ============= SETTINGS =============
function loadSettings() {
    database.ref('settings/business').once('value', (snapshot) => {
        if (snapshot.exists()) {
            const settings = snapshot.val();
            document.getElementById('businessEmail').value = settings.businessEmail || '';
            document.getElementById('businessPhone').value = settings.businessPhone || '';
            document.getElementById('businessAddress').value = settings.businessAddress || '';
        }
    });

    loadStoreHours();
    loadSocialLinks();
}

function loadStoreHours() {
    database.ref('settings/storeHours').once('value', (snapshot) => {
        const display = document.getElementById('storeHoursDisplay');
        if (!display) return;
        
        if (!snapshot.exists() || !snapshot.val()) {
            display.className = 'hours-display empty';
            display.textContent = 'No store hours set yet';
            return;
        }

        const hoursText = snapshot.val();
        display.className = 'hours-display';
        display.textContent = hoursText;
    });
}

function openEditHoursModal() {
    database.ref('settings/storeHours').once('value', (snapshot) => {
        const hoursText = snapshot.val() || '';
        document.getElementById('storeHoursText').value = hoursText;
        document.getElementById('hoursModal').classList.add('active');
    });
}

function closeHoursModal() {
    document.getElementById('hoursModal').classList.remove('active');
    document.getElementById('hoursForm').reset();
}

function handleHoursSubmit(event) {
    event.preventDefault();
    showLoading(true);

    const hoursText = document.getElementById('storeHoursText').value.trim();

    if (!hoursText) {
        showToast('❌ Please enter store hours', 'error');
        showLoading(false);
        return;
    }

    database.ref('settings/storeHours').set(hoursText)
        .then(() => {
            trackSettingsUpdate('store_hours');
            showToast('✅ Store hours saved successfully!');
            closeHoursModal();
            loadStoreHours();
            showLoading(false);
        })
        .catch(error => {
            showToast('❌ Error saving hours: ' + error.message, 'error');
            showLoading(false);
        });
}

function loadSocialLinks() {
    database.ref('settings/socialLinks').once('value', (snapshot) => {
        const container = document.getElementById('socialLinksList');
        
        if (!snapshot.exists() || snapshot.numChildren() === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="icon">📱</span>
                    <p>No social media links added yet</p>
                </div>
            `;
            return;
        }

        const iconMap = {
            Facebook: '📘',
            Instagram: '📷',
            Twitter: '🦅',
            TikTok: '🎵',
            YouTube: '📺',
            LinkedIn: '💼'
        };

        let linksHtml = '';
        snapshot.forEach((childSnapshot) => {
            const platform = childSnapshot.key;
            const url = childSnapshot.val();
            linksHtml += `
                <div class="social-link-item">
                    <span class="icon">${iconMap[platform] || '🌐'}</span>
                    <div class="social-link-info">
                        <div class="platform">${platform}</div>
                        <div class="url">${url}</div>
                    </div>
                    <div class="social-link-actions">
                        <button class="btn-edit-small" onclick="editSocialLink('${platform}', '${url}')">Edit</button>
                        <button class="btn-delete-small" onclick="deleteSocialLink('${platform}')">Remove</button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = linksHtml;
    });
}

function openAddSocialModal() {
    document.getElementById('socialModalTitle').textContent = 'Add Social Media';
    document.getElementById('socialForm').reset();
    document.getElementById('socialPlatform').disabled = false;
    document.getElementById('socialModal').classList.add('active');
}

function editSocialLink(platform, url) {
    document.getElementById('socialModalTitle').textContent = 'Edit Social Media';
    document.getElementById('socialPlatform').value = platform;
    document.getElementById('socialPlatform').disabled = true;
    document.getElementById('socialUrl').value = url;
    document.getElementById('socialModal').classList.add('active');
}

function closeSocialModal() {
    document.getElementById('socialModal').classList.remove('active');
    document.getElementById('socialForm').reset();
    document.getElementById('socialPlatform').disabled = false;
}

function handleSocialSubmit(event) {
    event.preventDefault();
    showLoading(true);

    const platform = document.getElementById('socialPlatform').value;
    const url = document.getElementById('socialUrl').value;

    database.ref(`settings/socialLinks/${platform}`).set(url)
        .then(() => {
            trackSettingsUpdate('social_links');
            showToast('✅ Social media link saved!');
            closeSocialModal();
            loadSocialLinks();
            showLoading(false);
        })
        .catch(error => {
            showToast('❌ Error saving link: ' + error.message, 'error');
            showLoading(false);
        });
}

function deleteSocialLink(platform) {
    if (confirm(`Remove ${platform} link?`)) {
        showLoading(true);
        database.ref(`settings/socialLinks/${platform}`).remove()
            .then(() => {
                showToast('✅ Social link removed!');
                loadSocialLinks();
                showLoading(false);
            })
            .catch(error => {
                showToast('❌ Error removing link: ' + error.message, 'error');
                showLoading(false);
            });
    }
}

function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('❌ Please fill in all password fields', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast('❌ New passwords do not match', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showToast('❌ Password must be at least 6 characters', 'error');
        return;
    }

    showLoading(true);

    const credential = firebase.auth.EmailAuthProvider.credential(currentUser.email, currentPassword);

    currentUser.reauthenticateWithCredential(credential)
        .then(() => {
            return currentUser.updatePassword(newPassword);
        })
        .then(() => {
            trackSettingsUpdate('password');
            showToast('✅ Password updated successfully!');
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
            showLoading(false);
        })
        .catch(error => {
            let errorMessage = error.message;
            if (error.code === 'auth/wrong-password') {
                errorMessage = 'Current password is incorrect';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak';
            }
            showToast('❌ Error: ' + errorMessage, 'error');
            showLoading(false);
        });
}

function saveBusinessSettings() {
    showLoading(true);
    const settings = {
        businessEmail: document.getElementById('businessEmail').value,
        businessPhone: document.getElementById('businessPhone').value,
        businessAddress: document.getElementById('businessAddress').value,
        updatedAt: new Date().toISOString()
    };

    database.ref('settings/business').set(settings)
        .then(() => {
            trackSettingsUpdate('business');
            showToast('✅ Business information saved!');
            showLoading(false);
        })
        .catch(error => {
            showToast('❌ Error saving settings: ' + error.message, 'error');
            showLoading(false);
        });
}

// ============= UTILITY FUNCTIONS =============
// ============= USER DROPDOWN FUNCTIONS =============
function setupUserDropdown() {
    const userAvatar = document.getElementById('userAvatar');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userAvatar && userDropdown) {
        // Toggle dropdown on avatar click
        userAvatar.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            userDropdown.classList.remove('show');
        });
        
        // Prevent dropdown from closing when clicking inside it
        userDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
}

function getTimeAgo(timestamp) {
    const now = new Date().getTime();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

function closeUserDropdown() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        userDropdown.classList.remove('show');
    }
}

// Update user dropdown with actual email
function updateUserDropdown(email) {
    const dropdownEmail = document.getElementById('dropdownEmail');
    if (dropdownEmail && email) {
        dropdownEmail.textContent = email;
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        showLoading(true);
        auth.signOut().then(() => {
            console.log('✅ User logged out');
            window.location.href = 'login.html';
        }).catch(error => {
            showToast('Error logging out: ' + error.message, 'error');
            showLoading(false);
        });
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = type === 'error' ? 'toast active error' : 'toast active';
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 4000);
}

function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (show) {
        spinner.classList.add('active');
    } else {
        spinner.classList.remove('active');
    }
}

// ============= ANALYTICS TRACKING =============
function trackPageView(sectionName) {
    analytics.logEvent('page_view', {
        page_title: sectionName,
        page_location: window.location.href,
        page_path: `/${sectionName}`
    });
}

function trackProductAction(action, productName) {
    analytics.logEvent('product_action', {
        action: action,
        product_name: productName,
        timestamp: new Date().toISOString()
    });
}

function trackOrderAction(action, orderId, status) {
    analytics.logEvent('order_action', {
        action: action,
        order_id: orderId,
        order_status: status,
        timestamp: new Date().toISOString()
    });
}

function trackSettingsUpdate(settingType) {
    analytics.logEvent('settings_updated', {
        setting_type: settingType,
        timestamp: new Date().toISOString()
    });
}

function trackAdminLogin(email) {
    analytics.logEvent('admin_login', {
        admin_email: email,
        timestamp: new Date().toISOString()
    });
}

// ============= EMAIL AND IMAGE FUNCTIONS =============
function sendEmailToCustomer(customerEmail, customerName, orderId, replyMessage, orderStatus) {
    const EMAILJS_SERVICE_ID = 'service_xos9a3s';
    const EMAILJS_TEMPLATE_ID = 'template_wnvqm1c';
    const EMAILJS_PUBLIC_KEY = 'fKs5iZtkJ6MKWWN7I';
    
    const templateParams = {
        to_email: customerEmail,
        to_name: customerName,
        order_id: orderId,
        order_status: orderStatus,
        reply_message: replyMessage,
        from_name: 'Dream Dough Bakery'
    };
    
    return fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            service_id: EMAILJS_SERVICE_ID,
            template_id: EMAILJS_TEMPLATE_ID,
            user_id: EMAILJS_PUBLIC_KEY,
            template_params: templateParams
        })
    });
}

// Image cropper functions
let cropper = null;
const CLOUDINARY_CLOUD_NAME = 'dgi195c7t';
const CLOUDINARY_UPLOAD_PRESET = 'dreamdough_products';

function openImageCropper() {
    document.getElementById('cropperModal').classList.add('active');
}

function closeCropperModal() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    document.getElementById('cropperContainer').style.display = 'none';
    document.getElementById('cropperActions').style.display = 'none';
    document.getElementById('imageUploadInput').value = '';
    document.getElementById('cropperModal').classList.remove('active');
}

function loadImageToCrop(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('❌ Please select an image file', 'error');
        return;
    }
    
    if (cropper) {
        cropper.destroy();
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const image = document.getElementById('imageToCrop');
        image.src = e.target.result;
        
        document.getElementById('cropperContainer').style.display = 'block';
        document.getElementById('cropperActions').style.display = 'flex';
        
        cropper = new Cropper(image, {
            aspectRatio: 1,
            viewMode: 1,
            guides: true,
            center: true,
            highlight: true,
            background: true,
            autoCropArea: 0.8,
            responsive: true,
            cropBoxResizable: true,
            cropBoxMovable: true,
            dragMode: 'move'
        });
    };
    reader.readAsDataURL(file);
}

function uploadCroppedImage() {
    if (!cropper) {
        showToast('❌ Please select an image first', 'error');
        return;
    }
    
    showLoading(true);
    
    const canvas = cropper.getCroppedCanvas({
        width: 800,
        height: 800,
        imageSmoothingQuality: 'high'
    });
    
    canvas.toBlob(function(blob) {
        const formData = new FormData();
        formData.append('file', blob);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', 'products');
        
        fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.secure_url) {
                document.getElementById('productImage').value = data.secure_url;
                document.getElementById('imagePreview').innerHTML = `
                    <img src="${data.secure_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">
                `;
                
                showToast('✅ Image uploaded successfully!');
                closeCropperModal();
                showLoading(false);
            } else {
                throw new Error('Upload failed');
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            showToast('❌ Error uploading image. Please try again.', 'error');
            showLoading(false);
        });
    }, 'image/jpeg', 0.9);
}

// ============= WEBSITE PREVIEW FUNCTIONS =============
function refreshPreview() {
    const iframe = document.getElementById('websitePreview');
    if (iframe) {
        iframe.src = iframe.src;
        showToast('Preview refreshed!');
    }
}

function openWebsite() {
    window.open('index.html', '_blank');
    showToast('Opening website in new tab...');
}

// ============= WINDOW RESIZE HANDLER =============
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        closeMobileMenu();
        document.body.style.overflow = 'auto';
    }
    
    // Re-optimize for mobile
    optimizeForMobile();
});

// ============= PAYMENT TRACKING SYSTEM =============
function initializePaymentTracking() {
    // Add payment status to all orders
    database.ref('orders').once('value').then((snapshot) => {
        const updates = {};
        snapshot.forEach((childSnapshot) => {
            const order = childSnapshot.val();
            if (!order.paymentStatus) {
                updates[`${childSnapshot.key}/paymentStatus`] = 'unpaid';
            }
        });
        
        if (Object.keys(updates).length > 0) {
            database.ref('orders').update(updates);
        }
    });
}

function updatePaymentStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let paidCount = 0;
    let unpaidCount = 0;
    let todayRevenue = 0;
    
    ordersData.forEach(order => {
        const orderDate = new Date(order.createdAt || order.date);
        if (orderDate >= today) {
            if (order.paymentStatus === 'paid') {
                paidCount++;
                todayRevenue += order.total || 0;
            } else {
                unpaidCount++;
            }
        }
    });
    
    document.getElementById('paidCount').textContent = paidCount;
    document.getElementById('unpaidCount').textContent = unpaidCount;
    document.getElementById('todayRevenue').textContent = todayRevenue.toFixed(2);
}

function togglePaymentStatus(orderId, currentStatus) {
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    
    database.ref(`orders/${orderId}/paymentStatus`).set(newStatus)
        .then(() => {
            showToast(`Payment status updated to ${newStatus}`);
            loadOrders();
            loadDashboardData();
        })
        .catch(error => {
            showToast('Error updating payment status', 'error');
        });
}

// ============= QUICK ORDER ACTIONS =============
function bulkMarkReady() {
    const confirmedOrders = ordersData.filter(order => order.status === 'confirmed');
    
    if (confirmedOrders.length === 0) {
        showToast('No confirmed orders to mark as ready', 'info');
        return;
    }
    
    if (confirm(`Mark ${confirmedOrders.length} orders as ready for pickup?`)) {
        showLoading(true);
        
        const updates = {};
        confirmedOrders.forEach(order => {
            updates[`${order.id}/status`] = 'ready';
            updates[`${order.id}/updatedAt`] = new Date().toISOString();
        });
        
        database.ref('orders').update(updates)
            .then(() => {
                showToast(`✅ Marked ${confirmedOrders.length} orders as ready!`);
                loadOrders();
                loadDashboardData();
                showLoading(false);
            })
            .catch(error => {
                showToast('Error updating orders', 'error');
                showLoading(false);
            });
    }
}

function sendPaymentReminders() {
    const unpaidOrders = ordersData.filter(order => 
        order.paymentStatus === 'unpaid' && 
        order.status !== 'cancelled'
    );
    
    if (unpaidOrders.length === 0) {
        showToast('No unpaid orders found', 'info');
        return;
    }
    
    if (confirm(`Send payment reminders to ${unpaidOrders.length} customers?`)) {
        showLoading(true);
        
        let sentCount = 0;
        const sendPromises = unpaidOrders.map(order => {
            const message = `Hi ${order.customerName}! Friendly reminder to settle payment for your order. Total: ₱${order.total}. Thank you!`;
            
            return sendEmailToCustomer(
                order.customerEmail,
                order.customerName,
                order.id.substring(0, 8),
                message,
                'payment_reminder'
            ).then(response => {
                if (response.ok) sentCount++;
            });
        });
        
        Promise.all(sendPromises)
            .then(() => {
                showToast(`📧 Sent ${sentCount} payment reminders!`);
                showLoading(false);
            })
            .catch(error => {
                showToast('Error sending reminders', 'error');
                showLoading(false);
            });
    }
}

// ============= TEMPLATE MESSAGES SYSTEM =============
const messageTemplates = {
    confirm_standard: "Hi {name}! Your order #{orderId} has been confirmed! 🎉 We'll have it ready for pickup by {pickupTime}. Thank you for choosing Dream Dough!",
    
    confirm_custom: "Hi {name}! Your custom {item} order has been confirmed! ✨ We'll send you progress updates. Expected pickup: {pickupTime}",
    
    payment_reminder: "Hi {name}! Friendly reminder to settle payment for order #{orderId}. Total amount: ₱{amount}. You can pay via GCash or bank transfer. Thank you!",
    
    ready_standard: "Hi {name}! Great news! 🎂 Your order is ready for pickup! Please collect at Dream Dough before {pickupTime}.",
    
    completion: "Hi {name}! Thank you for your order! We hope you enjoy your treats from Dream Dough! 🍰 Come back soon!",
    
    adjustment: "Hi {name}! We need to discuss some details about your order #{orderId}. Please contact us at your earliest convenience. Thank you!"
};

function openTemplateManager() {
    document.getElementById('templateModal').classList.add('active');
}

function closeTemplateModal() {
    document.getElementById('templateModal').classList.remove('active');
}

function useTemplate(templateKey) {
    const template = messageTemplates[templateKey];
    if (template) {
        // If we're in order modal, auto-fill the message
        const replyTextarea = document.getElementById('orderReply');
        if (replyTextarea) {
            replyTextarea.value = template;
            closeTemplateModal();
            showToast('Template applied!');
        }
    }
}

function useCustomTemplate() {
    const customTemplate = document.getElementById('customTemplate').value;
    if (customTemplate) {
        const replyTextarea = document.getElementById('orderReply');
        if (replyTextarea) {
            replyTextarea.value = customTemplate;
            closeTemplateModal();
            showToast('Custom template applied!');
        }
    }
}

// ============= ORDER TIMELINE SYSTEM =============
function loadTodayTimeline() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Exclude cancelled orders by default
    const todayOrders = ordersData.filter(order => {
        const orderDate = new Date(order.createdAt || order.date);
        return orderDate >= today && order.status !== 'cancelled';
    }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    displayTimeline(todayOrders);
}

function displayTimeline(orders) {
    const container = document.getElementById('todayTimeline');
    
    if (orders.length === 0) {
        container.innerHTML = '<p class="empty-message">No orders for today</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="timeline-item ${order.status}">
            <div class="timeline-info">
                <h4>${order.customerName || 'Unknown Customer'}</h4>
                <div class="timeline-meta">
                    ₱${(order.total || 0).toFixed(2)} • 
                    <span class="payment-status payment-${order.paymentStatus || 'unpaid'}">
                        ${order.paymentStatus || 'unpaid'}
                    </span>
                </div>
            </div>
            <div class="timeline-actions">
                <button class="btn-review" onclick="editOrder('${order.id}')">Review</button>
                <button class="btn-edit" onclick="togglePaymentStatus('${order.id}', '${order.paymentStatus}')">
                    ${order.paymentStatus === 'paid' ? '❌ Unpay' : '✅ Paid'}
                </button>
            </div>
        </div>
    `).join('');
}

function filterTimeline(filter) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Update active state on filter buttons (use data-filter when available)
    try {
        const btns = document.querySelectorAll('.timeline-filters .filter-btn');
        btns.forEach(btn => {
            const btnFilter = btn.dataset && btn.dataset.filter ? btn.dataset.filter : (btn.getAttribute('onclick') || '').match(/filterTimeline\('([^']+)'\)/)?.[1];
            if (btnFilter) {
                btn.classList.toggle('active', btnFilter === filter);
            } else {
                // fallback: compare text
                btn.classList.toggle('active', btn.textContent.trim().toLowerCase() === filter);
            }
        });
    } catch (e) {
        // if DOM isn't ready, ignore
    }

    let filteredOrders = ordersData.filter(order => {
        const orderDate = new Date(order.createdAt || order.date);
        if (filter === 'cancelled') {
            return orderDate >= today && order.status === 'cancelled';
        } else {
            return orderDate >= today && order.status !== 'cancelled';
        }
    });
    if (filter !== 'all' && filter !== 'cancelled') {
        filteredOrders = filteredOrders.filter(order => order.status === filter);
    }
    displayTimeline(filteredOrders);
}

// ============= UPDATE EXISTING FUNCTIONS =============
// Update loadDashboardData to include new features
function loadDashboardData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    database.ref('orders').once('value', (snapshot) => {
        ordersData = [];
        let todayPending = 0;
        let todayConfirmed = 0;
        let todayRevenue = 0;
        
        snapshot.forEach((childSnapshot) => {
            const order = childSnapshot.val();
            const orderData = {
                id: childSnapshot.key,
                ...order
            };
            ordersData.push(orderData);
            
            const orderDate = new Date(order.createdAt || order.date);
            
            if (orderDate >= today && orderDate < tomorrow) {
                if (order.status === 'pending') todayPending++;
                if (order.status === 'confirmed') todayConfirmed++;
                if (order.status === 'confirmed' || order.status === 'completed') {
                    todayRevenue += order.total || 0;
                }
            }
        });
        
        document.getElementById('pendingOrders').textContent = todayPending;
        document.getElementById('confirmedOrders').textContent = todayConfirmed;
        document.getElementById('totalRevenue').textContent = todayRevenue.toFixed(2);
        
        displayRecentOrders();
        updatePaymentStats();
        loadTodayTimeline();
    });

    database.ref('products').once('value', (snapshot) => {
        let count = 0;
        menuItemsData = [];
        snapshot.forEach((childSnapshot) => {
            menuItemsData.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
            count++;
        });
        document.getElementById('totalProducts').textContent = count;
    });
}

// Update the order display to show payment status
function generateOrdersTable(orders) {
    return `
        <div class="orders-table">
            <table>
                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Contact</th>
                        <th>Total</th>
                        <th>Payment</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr>
                            <td><strong>${order.customerName || 'Unknown'}</strong></td>
                            <td>${order.customerPhone || 'N/A'}</td>
                            <td><strong>₱${(order.total || 0).toFixed(2)}</strong></td>
                            <td>
                                <span class="payment-status payment-${order.paymentStatus || 'unpaid'}">
                                    ${order.paymentStatus || 'unpaid'}
                                </span>
                            </td>
                            <td><span class="order-status status-${order.status || 'pending'}">${order.status || 'pending'}</span></td>
                            <td>${formatOrderDate(order.createdAt || order.date)}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-review" onclick="editOrder('${order.id}')">Review</button>
                                    <button class="btn-edit" onclick="togglePaymentStatus('${order.id}', '${order.paymentStatus}')">
                                        ${order.paymentStatus === 'paid' ? '❌' : '✅'}
                                    </button>
                                    ${(order.status === 'cancelled' || order.status === 'completed') ? 
                                        `<button class="btn-delete" onclick="deleteOrder('${order.id}', '${order.customerName}')">Delete</button>` 
                                        : ''}
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}


// ============= PRODUCT PERFORMANCE ANALYTICS =============
let productPerformanceChart = null;
let currentPerformanceFilter = 'revenue';

function initializeProductPerformance() {
    loadProductPerformance();
    setupPerformanceFilters();
}

function setupPerformanceFilters() {
    document.querySelectorAll('.performance-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.performance-filters .filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentPerformanceFilter = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            loadProductPerformance();
        });
    });
}

function loadProductPerformance() {
    const confirmedOrders = ordersData.filter(o => o.status === 'confirmed' || o.status === 'completed');
    calculateProductPerformance(confirmedOrders);
    updatePerformanceMetrics(confirmedOrders);
}

function calculateProductPerformance(orders) {
    const productStats = {};
    let totalRevenue = 0;
    let totalItems = 0;
    
    // Calculate product statistics
    orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const productName = item.name || 'Unknown Product';
                const quantity = item.quantity || 1;
                const revenue = (item.price || 0) * quantity;
                
                if (!productStats[productName]) {
                    productStats[productName] = {
                        quantity: 0,
                        revenue: 0,
                        orders: 0
                    };
                }
                
                productStats[productName].quantity += quantity;
                productStats[productName].revenue += revenue;
                productStats[productName].orders += 1;
                
                totalRevenue += revenue;
                totalItems += quantity;
            });
        }
    });
    
    // Convert to array and sort
    const productArray = Object.entries(productStats).map(([name, stats]) => ({
        name,
        ...stats,
        avgPrice: stats.revenue / stats.quantity
    }));
    
    // Sort based on current filter
    const sortField = {
        'revenue': 'revenue',
        'quantity': 'quantity', 
        'profit': 'revenue' // Using revenue as proxy for profit
    }[currentPerformanceFilter];
    
    productArray.sort((a, b) => b[sortField] - a[sortField]);
    
    displayProductPerformance(productArray);
    updatePerformanceMetrics(orders, productArray, totalRevenue, totalItems);
}

function displayProductPerformance(products) {
    const container = document.getElementById('productPerformanceDetails');
    
    if (products.length === 0) {
        container.innerHTML = '<p class="empty-message">No product performance data available</p>';
        return;
    }
    
    const header = `
        <div class="performance-item performance-item-header">
            <div>Product Name</div>
            <div>Quantity Sold</div>
            <div>Total Revenue</div>
            <div>Avg Price</div>
        </div>
    `;
    
    const productsHTML = products.map(product => `
        <div class="performance-item">
            <div class="product-name">${product.name}</div>
            <div class="product-metric">${product.quantity}</div>
            <div class="product-metric metric-positive">₱${product.revenue.toFixed(2)}</div>
            <div class="product-metric metric-neutral">₱${product.avgPrice.toFixed(2)}</div>
        </div>
    `).join('');
    
    container.innerHTML = header + productsHTML;
}

function updatePerformanceMetrics(orders, products = [], totalRevenue = 0, totalItems = 0) {
    // Average Order Value
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    document.getElementById('avgOrderValue').textContent = `₱${avgOrderValue.toFixed(2)}`;
    
    // Total Items Sold
    document.getElementById('totalItemsSold').textContent = totalItems;
    
    // Best Product
    const bestProduct = products.length > 0 ? products[0].name : '-';
    document.getElementById('bestProduct').textContent = bestProduct;
    
    // Unique Products
    const uniqueProducts = products.length;
    document.getElementById('uniqueProducts').textContent = uniqueProducts;
    
    // Update top products list with enhanced data
    updateTopProductsList(products.slice(0, 5));
}

function updateTopProductsList(topProducts) {
    const container = document.getElementById('topProductsList');
    
    if (topProducts.length === 0) {
        container.innerHTML = '<p class="empty-message">No sales data yet</p>';
        return;
    }
    
    container.innerHTML = topProducts.map((product, index) => `
        <div class="top-product-item">
            <div class="top-product-rank">#${index + 1}</div>
            <div class="top-product-info">
                <div class="top-product-name">${product.name}</div>
                <div class="top-product-sales">${product.quantity} sold • ₱${product.revenue.toFixed(2)}</div>
            </div>
            <div class="top-product-revenue">${getPerformanceTrend(product)}</div>
        </div>
    `).join('');
}

function getPerformanceTrend(product) {
    // Simple trend indicator (in real app, compare with previous period)
    const revenuePerOrder = product.revenue / product.orders;
    if (revenuePerOrder > 500) return '🔥';
    if (revenuePerOrder > 200) return '⭐';
    return '📈';
}

function filterPerformance(filter) {
    currentPerformanceFilter = filter;
    loadProductPerformance();
}

// ============= FINAL ENHANCEMENTS =============

// Weekly stats calculation
function calculateWeeklyStats() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weeklyOrders = ordersData.filter(order => {
        const orderDate = new Date(order.createdAt || order.date);
        return orderDate >= startOfWeek && 
               (order.status === 'confirmed' || order.status === 'completed');
    });
    
    const weeklyRevenue = weeklyOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const avgPrepTime = calculateAveragePreparationTime(weeklyOrders);
    
    document.getElementById('weeklyRevenue').textContent = weeklyRevenue.toFixed(2);
    document.getElementById('weeklyOrders').textContent = weeklyOrders.length;
    document.getElementById('avgPreparation').textContent = avgPrepTime;
}

function calculateAveragePreparationTime(orders) {
    if (orders.length === 0) return '-';
    
    const prepTimes = orders.map(order => {
        if (order.createdAt && order.updatedAt) {
            const created = new Date(order.createdAt);
            const updated = new Date(order.updatedAt);
            return (updated - created) / (1000 * 60 * 60); // hours
        }
        return 0;
    }).filter(time => time > 0);
    
    if (prepTimes.length === 0) return '-';
    
    const avgHours = prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length;
    return avgHours < 1 ? 
        `${Math.round(avgHours * 60)}m` : 
        `${avgHours.toFixed(1)}h`;
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K for quick search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('productSearch');
            if (searchInput) searchInput.focus();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            closeAllModals();
        }
        
        // Number keys for quick section switching
        if (e.altKey && e.key >= '1' && e.key <= '5') {
            e.preventDefault();
            const sections = ['dashboard', 'menu', 'orders', 'analytics', 'settings'];
            const sectionIndex = parseInt(e.key) - 1;
            if (sections[sectionIndex]) {
                switchSection(sections[sectionIndex]);
            }
        }
    });
}

function closeAllModals() {
    document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
    });
    closeUserDropdown();
}

// Data export functionality
function exportOrderData() {
    const csvContent = convertOrdersToCSV(ordersData);
    downloadCSV(csvContent, `dreamdough-orders-${new Date().toISOString().split('T')[0]}.csv`);
}

function convertOrdersToCSV(orders) {
    const headers = ['Order ID', 'Customer Name', 'Email', 'Phone', 'Total', 'Status', 'Payment Status', 'Date'];
    const csvRows = [headers.join(',')];
    
    orders.forEach(order => {
        const row = [
            order.id.substring(0, 8),
            `"${order.customerName || ''}"`,
            `"${order.customerEmail || ''}"`,
            `"${order.customerPhone || ''}"`,
            order.total || 0,
            order.status || 'pending',
            order.paymentStatus || 'unpaid',
            new Date(order.createdAt || order.date).toLocaleDateString()
        ];
        csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('📊 Data exported successfully!');
}

// Auto-save functionality for forms
function setupAutoSave() {
    const forms = ['productForm', 'profileForm', 'hoursForm', 'socialForm'];
    
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            let saveTimeout;
            
            form.addEventListener('input', () => {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    if (form.checkValidity()) {
                        showToast('💾 Auto-saved!', 'info');
                    }
                }, 2000);
            });
        }
    });
}

// Performance monitoring
function trackPerformance() {
    const navigationStart = performance.getEntriesByType('navigation')[0];
    if (navigationStart) {
        const loadTime = navigationStart.loadEventEnd - navigationStart.navigationStart;
        console.log(`🔄 Page loaded in ${loadTime.toFixed(2)}ms`);
        
        if (loadTime > 3000) {
            createSmartNotification({
                title: '⚠️ Performance Notice',
                message: 'Page load time is slower than expected. Consider optimizing images or data.',
                type: 'system',
                priority: 'low',
                autoDismiss: true
            });
        }
    }
}

// Final initialization
function finalizeSetup() {
    calculateWeeklyStats();
    setupKeyboardShortcuts();
    setupAutoSave();
    trackPerformance();
    
    // Update stats every minute
    setInterval(() => {
        calculateWeeklyStats();
        updatePaymentStats();
    }, 60000);
}

// ============= CUSTOM ORDERS MANAGEMENT =============
let currentEditingCustomOrderId = null;
let isCardView = true;

// Load and display custom orders in card layout
function loadCustomOrders() {
    database.ref('orders').once('value', (snapshot) => {
        const customOrders = [];
        const statusCounts = {
            pending_quote: 0,
            quoted: 0,
            pending: 0,
            confirmed: 0,
            adjustment: 0,
            completed: 0,
            cancelled: 0
        };
        
        snapshot.forEach((childSnapshot) => {
            const order = childSnapshot.val();
            if (order.orderType === 'custom') {
                const customOrder = {
                    id: childSnapshot.key,
                    ...order
                };
                customOrders.push(customOrder);
                
                // Count by status
                const status = order.status || 'pending_quote';
                if (statusCounts[status] !== undefined) {
                    statusCounts[status]++;
                }
            }
        });
        
        // Update statistics
        updateCustomStats(customOrders.length, statusCounts);
        
        // Display based on current view
        if (isCardView) {
            displayCustomOrdersGrid(customOrders);
        } else {
            displayCustomOrdersTable(customOrders);
        }
        
        // Store for filtering
        window.customOrdersData = customOrders;
        
        // Setup search and filter
        setupCustomOrderFilters();
    }).catch(error => {
        showToast('Error loading custom orders: ' + error.message, 'error');
    });
}

// Update statistics bar
function updateCustomStats(total, counts) {
    document.getElementById('totalCustomOrders').textContent = total;
    document.getElementById('awaitingQuote').textContent = counts.pending_quote;
    document.getElementById('quotedOrders').textContent = counts.quoted;
    document.getElementById('pendingCustom').textContent = counts.pending;
}

// Display custom orders in grid (card) view
function displayCustomOrdersGrid(orders) {
    const container = document.getElementById('customOrdersGrid');
    const listContainer = document.getElementById('customOrdersList');
    
    // Show grid, hide list
    container.style.display = 'grid';
    listContainer.style.display = 'none';
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="custom-orders-grid empty">
                <div class="empty-grid-icon">🎨</div>
                <h3>No Custom Orders Found</h3>
                <p>When customers submit custom orders, they'll appear here.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => createCustomOrderCard(order)).join('');
}

// Create a custom order card
function createCustomOrderCard(order) {
    const item = order.items?.[0] || {};
    const hasImage = order.referenceImageUrl;
    const status = order.status || 'pending_quote';
    const price = item.price || 0;
    const quantity = item.quantity || 1;
    const totalPrice = price * quantity;
    
    // Format date
    const orderDate = formatOrderDate(order.createdAt || order.date);
    
    // Get initials for avatar
    const initials = getInitials(order.customerName || 'C');
    
    // Truncate description for preview
    const description = (item.designDescription || 'No description provided').substring(0, 80);
    
    // Status badge text
    const statusText = {
        'pending_quote': 'Awaiting Quote',
        'quoted': 'Quoted',
        'pending': 'Pending',
        'confirmed': 'Confirmed',
        'adjustment': 'Needs Adjust',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    }[status] || 'Pending';
    
    // Price display
    let priceHtml = '';
    if (price > 0) {
        priceHtml = `<div class="price-display quoted">₱${totalPrice.toFixed(2)}</div>`;
    } else {
        priceHtml = `<div class="price-display unquoted"><span class="currency">₱</span>--.--</div>`;
    }
    
    return `
        <div class="custom-order-card" onclick="editCustomOrder('${order.id}')">
            <div class="card-header">
                <!-- Customer Info -->
                <div class="customer-info">
                    <div class="customer-avatar-small">${initials}</div>
                    <div class="customer-details">
                        <h4>${order.customerName || 'Unknown Customer'}</h4>
                        <div class="customer-contact-small">
                            <span>${order.customerPhone || 'No phone'}</span>
                            ${order.customerEmail ? '<span>•</span><span>📧</span>' : ''}
                        </div>
                    </div>
                </div>
                
                <!-- Order Meta -->
                <div class="order-meta">
                    <span class="order-date">${orderDate}</span>
                    <span class="order-id">#${order.id.substring(0, 8)}</span>
                </div>
            </div>
            
            <div class="card-content">
                <!-- Reference Image -->
                <div class="card-image-section">
                    ${hasImage ? 
                        `<img src="${order.referenceImageUrl}" alt="Reference" class="reference-thumbnail" onclick="event.stopPropagation(); openImageFullscreen('${order.referenceImageUrl}')">
                         <div class="image-indicator">📷 Has Reference</div>` :
                        `<div class="no-image">No Reference Image</div>`
                    }
                </div>
                
                <!-- Order Details -->
                <div class="order-details-grid">
                    <div class="detail-card">
                        <div class="detail-label-small">Product Type</div>
                        <div class="detail-value-small">${item.category || 'Custom'}</div>
                    </div>
                    <div class="detail-card">
                        <div class="detail-label-small">Quantity</div>
                        <div class="detail-value-small">${quantity}</div>
                    </div>
                    <div class="detail-card">
                        <div class="detail-label-small">Size</div>
                        <div class="detail-value-small">${item.size || '-'}</div>
                    </div>
                    <div class="detail-card">
                        <div class="detail-label-small">Pickup</div>
                        <div class="detail-value-small">${order.pickupDate || '-'}</div>
                    </div>
                </div>
                
                <!-- Design Preview -->
                <div class="design-preview">
                    <h5><span>✨</span> Design Description</h5>
                    <p class="preview-text">${description}${description.length >= 80 ? '...' : ''}</p>
                </div>
            </div>
            
            <div class="card-footer">
                <!-- Status Badge -->
                <span class="status-badge-card status-${status}">${statusText}</span>
                
                <!-- Price Display -->
                ${priceHtml}
                
                <!-- Action Buttons -->
                <div class="card-actions" onclick="event.stopPropagation()">
                    ${status === 'pending_quote' ? 
                        `<button class="card-action-btn primary" onclick="quickQuote('${order.id}', '${order.customerName}')">
                            💰 Quote
                        </button>` : ''
                    }
                    <button class="card-action-btn secondary" onclick="editCustomOrder('${order.id}')">
                        👁️ View
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Toggle between grid and list view
function toggleCustomViewMode() {
    isCardView = !isCardView;
    const btn = document.querySelector('#custom-orders .view-toggle-btn');
    
    if (isCardView) {
        btn.innerHTML = '<span class="icon">📋</span><span>List View</span>';
        displayCustomOrdersGrid(window.customOrdersData || []);
    } else {
        btn.innerHTML = '<span class="icon">🎨</span><span>Card View</span>';
        displayCustomOrdersTable(window.customOrdersData || []);
    }
    
    // Show toast on mobile for user feedback
    if (window.innerWidth <= 768) {
        showToast(`Switched to ${isCardView ? 'Card' : 'List'} View`);
    }
}


// Display custom orders in table view
function displayCustomOrdersTable(orders) {
    const container = document.getElementById('customOrdersList');
    const gridContainer = document.getElementById('customOrdersGrid');
    
    // Show list, hide grid
    container.style.display = 'block';
    gridContainer.style.display = 'none';
    
    // Create table structure (using your existing table styling)
    let html = '';
    
    // Group by status for table view
    const statusConfig = {
        pending_quote: { icon: '💰', title: 'Awaiting Quote' },
        quoted: { icon: '💬', title: 'Quoted to Customer' },
        pending: { icon: '⏳', title: 'Pending Review' },
        confirmed: { icon: '✅', title: 'Confirmed Orders' },
        adjustment: { icon: '✏️', title: 'Needs Adjustment' },
        completed: { icon: '🎉', title: 'Completed Orders' },
        cancelled: { icon: '❌', title: 'Cancelled Orders' }
    };
    
    for (const [status, config] of Object.entries(statusConfig)) {
        const filteredOrders = orders.filter(o => o.status === status);
        
        if (filteredOrders.length === 0) continue;
        
        html += `
            <div class="order-section-container status-${status}">
                <div class="order-section-header">
                    <div class="order-section-title">
                        <span class="icon">${config.icon}</span>
                        <h3>${config.title}</h3>
                        <span class="order-count-badge">${filteredOrders.length}</span>
                    </div>
                </div>
                <div class="order-section-content">
                    <div class="orders-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Product Type</th>
                                    <th>Reference</th>
                                    <th>Quote Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredOrders.map(order => {
                                    const hasImage = order.referenceImageUrl ? '📷' : '📄';
                                    const quoteStatus = order.status === 'quoted' ? 
                                        `<span class="payment-status payment-quoted">Quoted</span>` :
                                        `<span class="payment-status payment-pending">Need Quote</span>`;
                                    
                                    return `
                                    <tr>
                                        <td><strong>${order.customerName || 'Unknown'}</strong></td>
                                        <td>${order.items?.[0]?.category || 'Custom'}</td>
                                        <td>${hasImage}</td>
                                        <td>${quoteStatus}</td>
                                        <td>${formatOrderDate(order.createdAt || order.date)}</td>
                                        <td>
                                            <div class="action-buttons">
                                                <button class="btn-review" onclick="editCustomOrder('${order.id}')">Review</button>
                                                ${(order.status === 'cancelled' || order.status === 'completed') ? 
                                                    `<button class="btn-delete" onclick="deleteCustomOrder('${order.id}', '${order.customerName}')">Delete</button>` 
                                                    : ''}
                                            </div>
                                        </td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html || '<p class="empty-message">No custom orders found</p>';
}

// Setup search and filter functionality
function setupCustomOrderFilters() {
    const searchInput = document.getElementById('customOrderSearch');
    const filterSelect = document.getElementById('customOrderFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterCustomOrders();
        });
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            filterCustomOrders();
        });
    }
}

// Filter custom orders
function filterCustomOrders() {
    const searchTerm = document.getElementById('customOrderSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('customOrderFilter')?.value || '';
    
    const filtered = (window.customOrdersData || []).filter(order => {
        const matchesSearch = 
            (order.customerName?.toLowerCase().includes(searchTerm)) ||
            (order.customerPhone?.includes(searchTerm)) ||
            (order.customerEmail?.toLowerCase().includes(searchTerm)) ||
            (order.items?.[0]?.category?.toLowerCase().includes(searchTerm)) ||
            (order.items?.[0]?.designDescription?.toLowerCase().includes(searchTerm));
        
        const matchesStatus = !statusFilter || order.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    // Display filtered results
    if (isCardView) {
        displayCustomOrdersGrid(filtered);
    } else {
        displayCustomOrdersTable(filtered);
    }
    
    // Update stats for filtered results
    const statusCounts = {
        pending_quote: 0,
        quoted: 0,
        pending: 0,
        confirmed: 0,
        adjustment: 0,
        completed: 0,
        cancelled: 0
    };
    
    filtered.forEach(order => {
        const status = order.status || 'pending_quote';
        if (statusCounts[status] !== undefined) {
            statusCounts[status]++;
        }
    });
    
    updateCustomStats(filtered.length, statusCounts);
}

// Quick quote from card
function quickQuote(orderId, customerName) {
    const order = (window.customOrdersData || []).find(o => o.id === orderId);
    if (!order) return;
    
    // Set focus to price input
    editCustomOrder(orderId);
    
    // Auto-focus price field
    setTimeout(() => {
        const priceInput = document.getElementById('customItemPrice');
        if (priceInput) {
            priceInput.focus();
            priceInput.select();
        }
    }, 100);
    
    showToast(`📝 Ready to quote for ${customerName}`);
}

// Get initials from name
function getInitials(name) {
    if (!name) return 'C';
    return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// Edit custom order - keep this 
function editCustomOrder(id) {
    let isModalOpen = false;

    const order = ordersData.find(o => o.id === id && o.orderType === 'custom');
    if (!order) return;

    currentEditingCustomOrderId = id;
    
    // Customer Info
    document.getElementById('customCustomerNameDisplay').textContent = order.customerName || 'Unknown Customer';
    document.getElementById('customCustomerPhoneDisplay').textContent = order.customerPhone ? `📱 ${order.customerPhone}` : '📱 No phone provided';
    document.getElementById('customCustomerEmailDisplay').textContent = order.customerEmail ? `📧 ${order.customerEmail}` : '📧 No email provided';
    
    // Reference Image
    const imageSection = document.getElementById('referenceImageSection');
    const imagePreview = document.getElementById('referenceImagePreview');
    const imageNote = document.getElementById('imageNote');
    
    if (order.referenceImageUrl) {
        imagePreview.src = order.referenceImageUrl;
        imageNote.textContent = 'Click image to view full size';
        imageSection.style.display = 'block';
    } else {
        imageSection.style.display = 'none';
    }
    
    // Order Details
    const item = order.items?.[0] || {};
    document.getElementById('customProductType').textContent = item.category || 'Custom';
    document.getElementById('customQuantity').textContent = item.quantity || 1;
    document.getElementById('customSize').textContent = item.size || '-';
    document.getElementById('customFlavor').textContent = item.flavor || '-';
    document.getElementById('customPickupDate').textContent = order.pickupDate || '-';
    document.getElementById('customPickupTime').textContent = order.pickupTime || '-';
    
    // Design Description
    document.getElementById('customDesignDescription').textContent = 
        item.designDescription || order.designDescription || 'No description provided';
    
    // Additional Notes
    const notesSection = document.getElementById('additionalNotesSection');
    const notesContent = document.getElementById('customAdditionalNotes');
    if (order.notes || order.additionalNotes) {
        notesContent.textContent = order.notes || order.additionalNotes || '';
        notesSection.style.display = 'block';
    } else {
        notesSection.style.display = 'none';
    }
    
    // Price & Quote
    const itemPrice = item.price || 0;
    const quantity = item.quantity || 1;
    const totalPrice = itemPrice * quantity;
    
    document.getElementById('customItemPrice').value = itemPrice;
    document.getElementById('customTotalPrice').value = totalPrice.toFixed(2);
    
    // Auto-calculate total when item price changes
    document.getElementById('customItemPrice').addEventListener('input', function() {
        const newItemPrice = parseFloat(this.value) || 0;
        const newTotal = newItemPrice * quantity;
        document.getElementById('customTotalPrice').value = newTotal.toFixed(2);
    });
    
    // Quote Message
    const defaultMessage = `Hi ${order.customerName}! Here's your quote for the custom ${item.category || 'order'}:\n\n` +
                          `Item: Custom ${item.category || 'Product'}\n` +
                          `Quantity: ${quantity}\n` +
                          `Size: ${item.size || 'Custom'}\n` +
                          `Total Price: ₱${totalPrice.toFixed(2)}\n\n` +
                          `Please reply to confirm your order!`;
    
    document.getElementById('customQuoteMessage').value = defaultMessage;
    
    // Status
    document.getElementById('customOrderStatus').value = order.status || 'pending_quote';
    updateCustomStatusDisplay(order.status);
    
    // Notes
    document.getElementById('customOrderNotes').value = order.notes || '';
    
    openCustomOrderModal();
}

// Update custom status display
function updateCustomStatusDisplay(status) {
    const statusDisplay = document.getElementById('customCurrentStatusDisplay');
    const statusText = {
        'pending_quote': '💰 Awaiting Quote',
        'quoted': '💬 Quoted to Customer',
        'pending': '📝 Pending Review',
        'confirmed': '✅ Confirmed',
        'adjustment': '✏️ Needs Adjustment',
        'completed': '🎉 Completed',
        'cancelled': '❌ Cancelled'
    }[status] || '💰 Awaiting Quote';
    
    statusDisplay.innerHTML = `<span class="status-badge status-${status}">${statusText}</span>`;
}

// Custom quick actions
function customQuickAction(action) {
    const statusMap = {
        'quote': 'quoted',
        'confirm': 'confirmed',
        'adjust': 'adjustment',
        'cancel': 'cancelled'
    };
    
    document.getElementById('customOrderStatus').value = statusMap[action];
    updateCustomStatusDisplay(statusMap[action]);
    
    // Auto-fill helpful messages
    const messages = {
        'quote': 'Hi {name}! Here is your quote for the custom order. Total price: ₱{price}. Please confirm if you\'d like to proceed!',
        'confirm': 'Great news! Your custom order has been confirmed. We\'ll start working on it right away!',
        'adjust': 'Hi there! We need to discuss some details about your custom order. Please contact us at your earliest convenience.',
        'cancel': 'We\'ve processed the cancellation of your custom order as requested. Please let us know if you have any questions.'
    };
    
    document.getElementById('customQuoteMessage').value = messages[action] || '';
}

// Update custom order
function updateCustomOrder() {
    showLoading(true);

    const status = document.getElementById('customOrderStatus').value;
    const itemPrice = parseFloat(document.getElementById('customItemPrice').value) || 0;
    const quantity = parseInt(document.getElementById('customQuantity').textContent) || 1;
    const totalPrice = itemPrice * quantity;
    const notes = document.getElementById('customOrderNotes').value.trim();
    const quoteMessage = document.getElementById('customQuoteMessage').value.trim();
    
    const order = ordersData.find(o => o.id === currentEditingCustomOrderId);
    if (!order) {
        showToast('Order not found', 'error');
        showLoading(false);
        return;
    }

    // Update item price
    if (order.items && order.items.length > 0) {
        order.items[0].price = itemPrice;
        order.subtotal = totalPrice;
        order.total = totalPrice;
    }

    const orderUpdate = {
        status: status,
        notes: notes,
        items: order.items,
        subtotal: totalPrice,
        total: totalPrice,
        updatedAt: new Date().toISOString()
    };

    database.ref('orders/' + currentEditingCustomOrderId).update(orderUpdate)
        .then(() => {
            trackOrderAction('update', currentEditingCustomOrderId, status);
            
            // Send email if status changed to quoted
            if (status === 'quoted' && quoteMessage && order.customerEmail) {
                const message = quoteMessage
                    .replace(/{name}/g, order.customerName)
                    .replace(/{price}/g, totalPrice.toFixed(2));
                
                return sendEmailToCustomer(
                    order.customerEmail, 
                    order.customerName, 
                    currentEditingCustomOrderId.substring(0, 8), 
                    message, 
                    'quoted'
                ).then(response => {
                    if (response.ok) {
                        showToast('✅ Order updated and quote sent!');
                    } else {
                        showToast('✅ Order updated but email failed to send', 'error');
                    }
                }).catch(() => {
                    showToast('✅ Order updated but email failed to send', 'error');
                });
            } else {
                showToast('✅ Custom order updated!');
            }
        })
        .then(() => {
            showLoading(false);
            closeCustomOrderModal();
            loadCustomOrders();
            loadOrders(); // Refresh regular orders too
            loadDashboardData();
        })
        .catch(error => {
            showToast('❌ Error updating order: ' + error.message, 'error');
            showLoading(false);
        });
}

// Send bulk quotes
function bulkSendQuotes() {
    const pendingQuotes = ordersData.filter(order => 
        order.orderType === 'custom' && 
        order.status === 'pending_quote'
    );
    
    if (pendingQuotes.length === 0) {
        showToast('No custom orders awaiting quotes', 'info');
        return;
    }
    
    if (confirm(`Send quotes to ${pendingQuotes.length} customers?`)) {
        showLoading(true);
        
        let sentCount = 0;
        const sendPromises = pendingQuotes.map(order => {
            // Update status to quoted
            return database.ref(`orders/${order.id}/status`).set('quoted')
                .then(() => sentCount++)
                .catch(() => {});
        });
        
        Promise.all(sendPromises)
            .then(() => {
                showToast(`📧 Marked ${sentCount} orders as quoted!`);
                showLoading(false);
                loadCustomOrders();
            })
            .catch(error => {
                showToast('Error sending quotes', 'error');
                showLoading(false);
            });
    }
}

// Bulk delete custom orders
function bulkDeleteCustomOrders() {
    database.ref('orders').once('value', (snapshot) => {
        const deletableOrders = [];
        
        snapshot.forEach((childSnapshot) => {
            const order = childSnapshot.val();
            if (order.orderType === 'custom' && 
                (order.status === 'cancelled' || order.status === 'completed')) {
                deletableOrders.push({
                    id: childSnapshot.key,
                    ...order
                });
            }
        });
        
        if (deletableOrders.length === 0) {
            showToast('No cancelled or completed custom orders to delete', 'error');
            return;
        }
        
        const confirmMessage = `⚠️ BULK DELETE CUSTOM ORDERS\n\nThis will permanently delete ${deletableOrders.length} custom order(s) that are either cancelled or completed.\n\nThis action cannot be undone!\n\nContinue?`;
        
        if (confirm(confirmMessage)) {
            showLoading(true);
            
            let deleteCount = 0;
            const deletePromises = deletableOrders.map(order => 
                database.ref('orders/' + order.id).remove().then(() => deleteCount++)
            );
            
            Promise.all(deletePromises)
                .then(() => {
                    showToast(`✅ Successfully deleted ${deleteCount} custom order(s)!`);
                    showLoading(false);
                    loadCustomOrders();
                    loadDashboardData();
                })
                .catch(error => {
                    showToast('❌ Error during bulk delete: ' + error.message, 'error');
                    showLoading(false);
                });
        }
    });
}

// Delete single custom order
function deleteCustomOrder(orderId, customerName) {
    database.ref('orders/' + orderId).once('value', (snapshot) => {
        const order = snapshot.val();
        
        if (!order) {
            showToast('❌ Order not found', 'error');
            return;
        }
        
        if (order.status !== 'cancelled' && order.status !== 'completed') {
            showToast('❌ Can only delete cancelled or completed custom orders', 'error');
            return;
        }
        
        const confirmMessage = `⚠️ Delete Custom Order\n\nCustomer: ${customerName}\nOrder ID: #${orderId.substring(0, 8)}\n\nThis action cannot be undone!`;
        
        if (confirm(confirmMessage)) {
            showLoading(true);
            
            database.ref('orders/' + orderId).remove()
                .then(() => {
                    trackOrderAction('delete', orderId, order.status);
                    showToast('✅ Custom order deleted successfully!');
                    showLoading(false);
                    loadCustomOrders();
                    loadDashboardData();
                })
                .catch(error => {
                    showToast('❌ Error deleting order: ' + error.message, 'error');
                    showLoading(false);
                });
        }
    }).catch(error => {
        showToast('❌ Error accessing order: ' + error.message, 'error');
    });
}

// Open custom order modal
function openCustomOrderModal() {
    document.getElementById('customOrderModal').classList.add('active');
}

// Close custom order modal
function closeCustomOrderModal() {
    document.getElementById('customOrderModal').classList.remove('active');
}

// Open image fullscreen
function openImageFullscreen(imageSrc) {
    document.getElementById('fullscreenImage').src = imageSrc;
    document.getElementById('imageFullscreenModal').classList.add('active');
}

// Close image fullscreen
function closeImageFullscreen() {
    document.getElementById('imageFullscreenModal').classList.remove('active');
}


// ============= REGULAR ORDERS CARD LAYOUT =============
let isOrderCardView = true;
window.orderDataCache = [];

// Load and display orders in card layout
function loadOrders() {
    // First, load menu items to have the cache ready
    database.ref('products').once('value').then((menuSnapshot) => {
        // Cache menu items
        window.menuItemsCache = {};
        menuSnapshot.forEach((childSnapshot) => {
            const item = childSnapshot.val();
            if (item.name && item.image) {
                window.menuItemsCache[item.name] = item.image;
            }
        });
        
        // Then load orders
        return database.ref('orders').once('value');
    }).then((snapshot) => {
        const allOrders = [];
        const regularOrders = [];
        const statusCounts = {
            pending: 0,
            confirmed: 0,
            adjustment: 0,
            completed: 0,
            cancelled: 0
        };
        let unpaidCount = 0;
        
        snapshot.forEach((childSnapshot) => {
            const order = {
                id: childSnapshot.key,
                ...childSnapshot.val()
            };
            allOrders.push(order);
            
            // Count regular orders
            if (order.orderType !== 'custom') {
                regularOrders.push(order);
                
                // Count by status
                const status = order.status || 'pending';
                if (statusCounts[status] !== undefined) {
                    statusCounts[status]++;
                }
                
                // Count unpaid
                if (order.paymentStatus === 'unpaid') {
                    unpaidCount++;
                }
            }
        });
        
        // Store for filtering
        window.orderDataCache = allOrders;
        
        // Update statistics
        updateOrderStats(regularOrders.length, statusCounts, unpaidCount);
        
        // Display based on current view
        if (isOrderCardView) {
            displayOrdersGrid(regularOrders);
        } else {
            displayOrdersTable(regularOrders);
        }
        
        // Setup search and filter
        setupOrderFilters();
    }).catch(error => {
        showToast('Error loading orders: ' + error.message, 'error');
    });
}

// Update order statistics bar
function updateOrderStats(total, counts, unpaid, revenue) {
    document.getElementById('totalOrders').textContent = total;
    document.getElementById('pendingOrdersCount').textContent = counts.pending;
    document.getElementById('confirmedOrdersCount').textContent = counts.confirmed;
    document.getElementById('completedOrdersCount').textContent = counts.completed;
    document.getElementById('unpaidOrdersCount').textContent = unpaid;
}

// Display orders in grid (card) view
function displayOrdersGrid(orders) {
    const container = document.getElementById('ordersGrid');
    const listContainer = document.getElementById('ordersList');
    
    // Show grid, hide list
    container.style.display = 'grid';
    listContainer.style.display = 'none';
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="custom-orders-grid empty">
                <div class="empty-grid-icon">📦</div>
                <h3>No Orders Found</h3>
                <p>When customers place orders, they'll appear here.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => createOrderCard(order)).join('');
}

// Update createOrderCard function to show product images
function getProductImage(productName) {
    if (!window.menuItemsCache) {
        // Cache menu items for faster lookup
        window.menuItemsCache = {};
        menuItemsData.forEach(item => {
            if (item.name && item.image) {
                window.menuItemsCache[item.name] = item.image;
            }
        });
    }
    return window.menuItemsCache[productName] || null;
}

// Update createOrderCard function to use product images
function createOrderCard(order) {
    const status = order.status || 'pending';
    const paymentStatus = order.paymentStatus || 'unpaid';
    const totalAmount = order.total || 0;
    const items = order.items || [];
    const orderDate = formatOrderDate(order.createdAt || order.date);
    
    // Get initials for avatar
    const initials = getInitials(order.customerName || 'C');
    
    // Status badge text
    const statusText = {
        'pending': 'Pending',
        'confirmed': 'Confirmed',
        'adjustment': 'Needs Adjust',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    }[status] || 'Pending';
    
    // Payment status text
    const paymentText = paymentStatus === 'paid' ? 'Paid' : 'Unpaid';
    
    // Get product images from menu items
    let productImageHtml = '';
    let productImageUrl = null;
    let productNames = [];
    if (items.length === 0) {
        productImageHtml = `
            <div class="no-product-image">
                <span class="icon">📦</span>
                <span>No items</span>
            </div>
        `;
        productNames = ['No items'];
    } else {
        const firstItem = items[0];
        productNames = items.map(item => `${item.quantity || 1}x ${item.name || 'Product'}`);
        // Try to get image in this order:
        // 1. From order item itself (if stored during order creation)
        // 2. From menu items cache
        // 3. Fallback icon
        if (firstItem.image) {
            productImageUrl = firstItem.image;
        } else {
            productImageUrl = getProductImage(firstItem.name);
        }
        if (productImageUrl) {
            productImageHtml = `
                <div class="product-image-section">
                    <span class="quantity-display">${firstItem.quantity || 1}x</span>
                    <img src="${productImageUrl}" alt="${firstItem.name || 'Product'}" class="product-thumbnail${items.length > 1 ? ' multiple' : ''}" 
                         onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'no-product-image\\'><span class=\\'icon\\'>🍰</span><span>No image</span></div>';">
                    ${items.length > 1 ? `<span class="multiple-items-indicator">+${items.length - 1}</span>` : ''}
                </div>
            `;
        } else {
            productImageHtml = `
                <div class="product-image-section">
                    <div class="no-product-image">
                        <span class="icon">🍰</span>
                        <span>No image</span>
                    </div>
                </div>
            `;
        }
    }
    
    return `
        <div class="order-card" onclick="editOrder('${order.id}')">
            ${order.orderType === 'custom' ? 
                '<div class="order-type-indicator">Custom</div>' : 
                '<div class="order-type-indicator regular">Regular</div>'
            }
            
            <div class="card-header">
                <!-- Customer Info -->
                <div class="customer-info">
                    <div class="customer-avatar-small">${initials}</div>
                    <div class="customer-details">
                        <h4>${order.customerName || 'Unknown Customer'}</h4>
                        <div class="customer-contact-small">
                            <span>${order.customerPhone || 'No phone'}</span>
                            ${order.customerEmail ? '<span>•</span><span>📧</span>' : ''}
                        </div>
                    </div>
                </div>
                
                <!-- Order Meta -->
                <div class="order-meta">
                    <span class="order-date">${orderDate}</span>
                    <span class="order-id">#${order.id.substring(0, 8)}</span>
                </div>
            </div>
            
            <div class="card-content">
                <!-- Product Image -->
                ${productImageHtml}
                <!-- Product Names -->
                <div class="product-name-display">
                    ${productNames.length === 1 ? productNames[0] : productNames.join('<br>')}
                </div>
            </div>
            
            <div class="card-footer">
                <!-- Status & Payment -->
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <span class="status-badge-card status-${status}">${statusText}</span>
                    <span class="payment-status-card ${paymentStatus}">${paymentText}</span>
                </div>
                
                <!-- Total Amount -->
                <div class="order-total-card">
                    ₱${totalAmount.toFixed(2)}
                </div>
                
                <!-- Action Buttons -->
                <div class="card-actions" onclick="event.stopPropagation()">
                    <button class="card-action-btn primary" onclick="editOrder('${order.id}')">
                        👁️ View
                    </button>
                    <button class="card-action-btn ${paymentStatus === 'paid' ? 'warning' : 'secondary'}" 
                            onclick="togglePaymentStatus('${order.id}', '${paymentStatus}')">
                        ${paymentStatus === 'paid' ? '❌ Unpay' : '✅ Paid'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Toggle between grid and list view for orders
function toggleOrderViewMode() {
    isOrderCardView = !isOrderCardView;
    const btn = document.querySelector('#orders .view-toggle-btn');
    
    if (isOrderCardView) {
        btn.innerHTML = '<span class="icon">📋</span><span>List View</span>';
        displayOrdersGrid(window.orderDataCache.filter(o => o.orderType !== 'custom'));
    } else {
        btn.innerHTML = '<span class="icon">📦</span><span>Card View</span>';
        displayOrdersTable(window.orderDataCache.filter(o => o.orderType !== 'custom'));
    }
    
    // Show toast on mobile for user feedback
    if (window.innerWidth <= 768) {
        showToast(`Switched to ${isOrderCardView ? 'Card' : 'List'} View`);
    }
}


// Display orders in table view
function displayOrdersTable(orders) {
    const container = document.getElementById('ordersList');
    const gridContainer = document.getElementById('ordersGrid');
    
    // Show list, hide grid
    container.style.display = 'block';
    gridContainer.style.display = 'none';
    
    // Group by status for table view
    const statusConfig = {
        pending: { icon: '⏳', title: 'Pending Review' },
        confirmed: { icon: '✅', title: 'Confirmed Orders' },
        adjustment: { icon: '✏️', title: 'Needs Adjustment' },
        completed: { icon: '🎉', title: 'Completed Orders' },
        cancelled: { icon: '❌', title: 'Cancelled Orders' }
    };
    
    let html = '';
    
    for (const [status, config] of Object.entries(statusConfig)) {
        const filteredOrders = orders.filter(o => o.status === status);
        
        if (filteredOrders.length === 0) continue;
        
        html += `
            <div class="order-section-container status-${status}">
                <div class="order-section-header">
                    <div class="order-section-title">
                        <span class="icon">${config.icon}</span>
                        <h3>${config.title}</h3>
                        <span class="order-count-badge">${filteredOrders.length}</span>
                    </div>
                </div>
                <div class="order-section-content">
                    <div class="orders-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Contact</th>
                                    <th>Total</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredOrders.map(order => {
                                    return `
                                    <tr>
                                        <td><strong>${order.customerName || 'Unknown'}</strong></td>
                                        <td>${order.customerPhone || 'N/A'}</td>
                                        <td><strong>₱${(order.total || 0).toFixed(2)}</strong></td>
                                        <td>
                                            <span class="payment-status payment-${order.paymentStatus || 'unpaid'}">
                                                ${order.paymentStatus || 'unpaid'}
                                            </span>
                                        </td>
                                        <td><span class="order-status status-${order.status || 'pending'}">${order.status || 'pending'}</span></td>
                                        <td>${formatOrderDate(order.createdAt || order.date)}</td>
                                        <td>
                                            <div class="action-buttons">
                                                <button class="btn-review" onclick="editOrder('${order.id}')">Review</button>
                                                <button class="btn-edit" onclick="togglePaymentStatus('${order.id}', '${order.paymentStatus}')">
                                                    ${order.paymentStatus === 'paid' ? '❌' : '✅'}
                                                </button>
                                                ${(order.status === 'cancelled' || order.status === 'completed') ? 
                                                    `<button class="btn-delete" onclick="deleteOrder('${order.id}', '${order.customerName}')">Delete</button>` 
                                                    : ''}
                                            </div>
                                        </td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html || '<p class="empty-message">No orders found</p>';
}

// Setup search and filter functionality for orders
function setupOrderFilters() {
    const searchInput = document.getElementById('orderSearch');
    const statusFilter = document.getElementById('orderFilter');
    const paymentFilter = document.getElementById('paymentFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterOrders();
        });
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            filterOrders();
        });
    }
    
    if (paymentFilter) {
        paymentFilter.addEventListener('change', function() {
            filterOrders();
        });
    }
}

// Filter orders
function filterOrders() {
    const searchTerm = document.getElementById('orderSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('orderFilter')?.value || '';
    const paymentFilter = document.getElementById('paymentFilter')?.value || '';
    
    const filtered = (window.orderDataCache || []).filter(order => {
        if (order.orderType === 'custom') return false; // Only show regular orders
        
        const matchesSearch = 
            (order.customerName?.toLowerCase().includes(searchTerm)) ||
            (order.customerPhone?.includes(searchTerm)) ||
            (order.customerEmail?.toLowerCase().includes(searchTerm)) ||
            (order.items?.some(item => item.name?.toLowerCase().includes(searchTerm)));
        
        const matchesStatus = !statusFilter || order.status === statusFilter;
        const matchesPayment = !paymentFilter || order.paymentStatus === paymentFilter;
        
        return matchesSearch && matchesStatus && matchesPayment;
    });
    
    // Display filtered results
    if (isOrderCardView) {
        displayOrdersGrid(filtered);
    } else {
        displayOrdersTable(filtered);
    }
    
    // Update stats for filtered results
    const statusCounts = {
        pending: 0,
        confirmed: 0,
        adjustment: 0,
        completed: 0,
        cancelled: 0
    };
    let unpaidCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    filtered.forEach(order => {
        const status = order.status || 'pending';
        if (statusCounts[status] !== undefined) {
            statusCounts[status]++;
        }
        
        if (order.paymentStatus === 'unpaid') {
            unpaidCount++;
        }
        
        const orderDate = new Date(order.createdAt || order.date);
        if (orderDate >= today && 
            (order.status === 'confirmed' || order.status === 'completed')) {
            todayRevenue += order.total || 0;
        }
    });
    
    updateOrderStats(filtered.length, statusCounts, unpaidCount, todayRevenue);
}

// Quick toggle payment status from card
function togglePaymentStatus(orderId, currentStatus) {
    event.stopPropagation();
    
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    
    database.ref(`orders/${orderId}/paymentStatus`).set(newStatus)
        .then(() => {
            showToast(`Payment status updated to ${newStatus}`);
            
            // Update local cache
            const orderIndex = window.orderDataCache.findIndex(o => o.id === orderId);
            if (orderIndex !== -1) {
                window.orderDataCache[orderIndex].paymentStatus = newStatus;
            }
            
            // Refresh display
            if (isOrderCardView) {
                displayOrdersGrid(window.orderDataCache.filter(o => o.orderType !== 'custom'));
            } else {
                displayOrdersTable(window.orderDataCache.filter(o => o.orderType !== 'custom'));
            }
            
            // Update dashboard
            loadDashboardData();
        })
        .catch(error => {
            showToast('Error updating payment status', 'error');
        });
}
// Add this function to populate missing images in orders
function populateOrderImages() {
    database.ref('orders').once('value').then((ordersSnapshot) => {
        database.ref('products').once('value').then((productsSnapshot) => {
            // Create product image map
            const productImageMap = {};
            productsSnapshot.forEach((childSnapshot) => {
                const product = childSnapshot.val();
                if (product.name && product.image) {
                    productImageMap[product.name] = product.image;
                }
            });
            
            // Update orders with missing images
            const updates = {};
            ordersSnapshot.forEach((orderSnapshot) => {
                const order = orderSnapshot.val();
                if (order.items && Array.isArray(order.items)) {
                    const items = order.items.map(item => {
                        if (!item.image && item.name && productImageMap[item.name]) {
                            return {
                                ...item,
                                image: productImageMap[item.name]
                            };
                        }
                        return item;
                    });
                    
                    // Check if items changed
                    if (JSON.stringify(items) !== JSON.stringify(order.items)) {
                        updates[`${orderSnapshot.key}/items`] = items;
                    }
                }
            });
            
            // Apply updates if needed
            if (Object.keys(updates).length > 0) {
                return database.ref('orders').update(updates);
            }
        });
    }).then(() => {
        console.log('✅ Order images updated');
    }).catch(error => {
        console.error('Error updating order images:', error);
    });
}
// Initialize mobile responsive features
function initializeMobileResponsive() {
    setupTouchGestures();
    setupOrientationChange();
    optimizeForMobile();
}

// Setup touch gestures for mobile
function setupTouchGestures() {
    if ('ontouchstart' in window) {
        // Add touch-specific optimizations
        document.addEventListener('touchstart', function() {}, {passive: true});
        
        // Improve scrolling performance
        document.querySelectorAll('.sidebar-nav, .modal-content, .timeline-container').forEach(element => {
            element.style.webkitOverflowScrolling = 'touch';
        });
    }
}

// Handle orientation changes
function setupOrientationChange() {
    window.addEventListener('orientationchange', function() {
        // Force a reflow to fix layout issues
        setTimeout(function() {
            if (document.getElementById('dashboard').classList.contains('active')) {
                loadDashboardData();
            } else if (document.getElementById('orders').classList.contains('active')) {
                loadOrders();
            } else if (document.getElementById('custom-orders').classList.contains('active')) {
                loadCustomOrders();
            }
        }, 100);
    });
}

// Optimize for mobile devices
function optimizeForMobile() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Hide unnecessary elements on mobile
        const liveTimer = document.querySelector('.live-timer');
        if (liveTimer) {
            liveTimer.style.display = 'none';
        }
        
        // Simplify charts on mobile
        simplifyChartsForMobile();
        
        // Adjust modal sizes
        adjustModalsForMobile();
    }
}

// Simplify charts for mobile
function simplifyChartsForMobile() {
    // Reduce chart complexity on mobile
    Chart.defaults.font.size = window.innerWidth < 480 ? 10 : 12;
    
    // Destroy and recreate charts if they exist
    if (monthlySalesChart) {
        monthlySalesChart.destroy();
        monthlySalesChart = null;
    }
    
    if (categorySalesChart) {
        categorySalesChart.destroy();
        categorySalesChart = null;
    }
    
    if (revenuePieChart) {
        revenuePieChart.destroy();
        revenuePieChart = null;
    }
}

// Adjust modals for mobile
function adjustModalsForMobile() {
    const modals = document.querySelectorAll('.modal-content');
    modals.forEach(modal => {
        modal.style.maxWidth = '95%';
        modal.style.margin = '10px';
        modal.style.maxHeight = '85vh';
    });
}

// Mobile-optimized timeline filter for touch devices
function setupMobileTimelineFilters() {
    if ('ontouchstart' in window) {
        const timelineContainer = document.querySelector('.timeline-container');
        const filtersContainer = document.querySelector('.timeline-filters');
        
        if (timelineContainer && filtersContainer) {
            // Make filters swipeable on mobile
            let isSwiping = false;
            let startX = 0;
            let scrollLeft = 0;
            
            filtersContainer.addEventListener('touchstart', (e) => {
                isSwiping = true;
                startX = e.touches[0].pageX - filtersContainer.offsetLeft;
                scrollLeft = filtersContainer.scrollLeft;
            });
            
            filtersContainer.addEventListener('touchmove', (e) => {
                if (!isSwiping) return;
                e.preventDefault();
                const x = e.touches[0].pageX - filtersContainer.offsetLeft;
                const walk = (x - startX) * 1.5; // Scroll speed
                filtersContainer.scrollLeft = scrollLeft - walk;
            });
            
            filtersContainer.addEventListener('touchend', () => {
                isSwiping = false;
            });
            
            // Add click outside to close any open dropdowns
            document.addEventListener('touchstart', (e) => {
                if (!filtersContainer.contains(e.target)) {
                    // Close any active dropdowns
                }
            });
        }
    }
}

// Initialize mobile timeline filters
document.addEventListener('DOMContentLoaded', function() {
    if (window.innerWidth <= 768) {
        setupMobileTimelineFilters();
    }
});

// Also trigger on resize
window.addEventListener('resize', function() {
    if (window.innerWidth <= 768) {
        setupMobileTimelineFilters();
    }
});

// Keyboard shortcut handler for Alt+1 to Alt+6 to switch sections
function setupSectionShortcuts() {
    window.addEventListener('keydown', function(e) {
        // Prevent shortcut inside input, textarea, or contenteditable
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
        if (e.altKey) {
            console.log('[Shortcut] Alt+Key pressed:', e.code);
            switch (e.code) {
                case 'Digit1':
                case 'Numpad1':
                    console.log('[Shortcut] Switching to dashboard');
                    switchSection('dashboard');
                    e.preventDefault();
                    break;
                case 'Digit2':
                case 'Numpad2':
                    console.log('[Shortcut] Switching to menu');
                    switchSection('menu');
                    e.preventDefault();
                    break;
                case 'Digit3':
                case 'Numpad3':
                    console.log('[Shortcut] Switching to custom-items');
                    switchSection('custom-items');
                    e.preventDefault();
                    break;
                case 'Digit4':
                case 'Numpad4':
                    console.log('[Shortcut] Switching to orders');
                    switchSection('orders');
                    e.preventDefault();
                    break;
                case 'Digit5':
                case 'Numpad5':
                    console.log('[Shortcut] Switching to custom-orders');
                    switchSection('custom-orders');
                    e.preventDefault();
                    break;
                case 'Digit6':
                case 'Numpad6':
                    console.log('[Shortcut] Switching to analytics');
                    switchSection('analytics');
                    e.preventDefault();
                    break;
                case 'Digit7':
                case 'Numpad7':
                    console.log('[Shortcut] Switching to settings');
                    switchSection('settings');
                    e.preventDefault();
                    break;
                default:
                    break;
            }
        }
    });
}

// ============= CUSTOM ITEMS MANAGEMENT =============
let currentEditingCustomItemId = null;
let customCropper = null;

function openCustomItemModal() {
    document.getElementById('customItemModal').classList.add('active');
}

function closeCustomItemModal() {
    document.getElementById('customItemModal').classList.remove('active');
    document.getElementById('customItemForm').reset();
}

function handleCustomItemSubmit(event) {
    event.preventDefault();
    showLoading(true);

    const name = document.getElementById('customItemName').value.trim();
    const description = document.getElementById('customItemDescription').value.trim();
    const notes = document.getElementById('customItemNotes').value.trim();

    if (!name || !description) {
        showToast('❌ Please fill in all required fields', 'error');
        showLoading(false);
        return;
    }

    const itemData = {
        name: name,
        description: description,
        notes: notes || '',
        image: document.getElementById('customItemImage').value,
        type: 'custom',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    let savePromise;
    const action = currentEditingCustomItemId ? 'edit' : 'add';

    if (currentEditingCustomItemId) {
        savePromise = database.ref('customItems/' + currentEditingCustomItemId).update(itemData);
    } else {
        savePromise = database.ref('customItems').push(itemData);
    }

    savePromise
        .then(() => {
            trackProductAction(action + '_custom', itemData.name);
            showToast(currentEditingCustomItemId ? '✅ Custom item updated!' : '✅ Custom item added!');
            showLoading(false);
            closeCustomItemModal();
            loadCustomItems();
        })
        .catch(error => {
            showToast('❌ Error saving custom item: ' + error.message, 'error');
            showLoading(false);
        });
}

// Load custom items
function loadCustomItems() {
    database.ref('customItems').once('value', (snapshot) => {
        const customItems = [];
        snapshot.forEach((childSnapshot) => {
            const item = {
                id: childSnapshot.key,
                ...childSnapshot.val()
            };
            customItems.push(item);
        });
        
        // Update stats
        document.getElementById('totalCustomItems').textContent = customItems.length;
        
        // Display items
        displayCustomItemsGrid(customItems);
        
        // Store for filtering
        window.customItemsData = customItems;
        
    }).catch(error => {
        showToast('Error loading custom items: ' + error.message, 'error');
    });
}

// Display custom items grid
function displayCustomItemsGrid(items) {
    const container = document.getElementById('customItemsGrid');
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎂</div>
                <h3>No custom items found</h3>
                <p>Try changing your search or add a new custom item</p>
                <button class="btn-primary btn-add-first" id="addCustomItemBtnEmpty">
                    + Add New Custom Item
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map(item => createCustomItemCard(item)).join('');
}

// Create custom item card
function createCustomItemCard(item) {
    return `
        <div class="menu-item-card">
            <div class="menu-item-image">
                ${item.image ? 
                    `<img src="${item.image}" alt="${item.name}" loading="lazy">` :
                    `<div class="no-image-placeholder">🎂</div>`
                }
                <span class="category-badge custom">Custom</span>
            </div>
            
            <div class="menu-item-content">
                <div class="menu-item-header">
                    <h3 class="menu-item-name">${item.name || 'Unnamed Custom Item'}</h3>
                    <p class="menu-item-description">${item.description || 'No description available'}</p>
                </div>
                
                ${item.notes ? `
                    <div class="menu-item-notes">
                        <strong>Notes:</strong> ${item.notes}
                    </div>
                ` : ''}
                
                <div class="menu-item-footer">
                    <div class="menu-item-type">
                        <span class="type-badge">🎨 Custom Design</span>
                    </div>
                    
                    <div class="menu-item-actions">
                        <button class="menu-item-action-btn edit" onclick="editCustomItem('${item.id}', event)">
                            ✏️
                        </button>
                        <button class="menu-item-action-btn delete" onclick="deleteCustomItem('${item.id}', event)">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Edit custom item
function editCustomItem(id, event) {
    if (event) event.stopPropagation();
    
    database.ref('customItems/' + id).once('value')
        .then((snapshot) => {
            const item = snapshot.val();
            if (!item) return;

            currentEditingCustomItemId = id;
            document.getElementById('customItemModalTitle').textContent = 'Edit Custom Item';
            document.getElementById('customItemName').value = item.name;
            document.getElementById('customItemDescription').value = item.description;
            document.getElementById('customItemNotes').value = item.notes || '';
            document.getElementById('customItemImage').value = item.image || '';

            // Update image preview
            const preview = document.getElementById('customImagePreview');
            if (item.image) {
                preview.innerHTML = `
                    <img src="${item.image}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">
                `;
            } else {
                preview.innerHTML = `
                    <span style="color: var(--light-brown); font-size: 3rem;">🎂</span>
                `;
            }

            openCustomItemModal();
        })
        .catch(error => {
            showToast('Error loading custom item: ' + error.message, 'error');
        });
}

// Delete custom item
function deleteCustomItem(id, event) {
    if (event) event.stopPropagation();
    
    const item = window.customItemsData?.find(i => i.id === id);
    
    if (confirm('Are you sure you want to delete this custom item?')) {
        showLoading(true);
        database.ref('customItems/' + id).remove()
            .then(() => {
                trackProductAction('delete_custom', item ? item.name : 'Unknown');
                showToast('✅ Custom item deleted successfully!');
                showLoading(false);
                loadCustomItems();
            })
            .catch(error => {
                showToast('❌ Error deleting custom item: ' + error.message, 'error');
                showLoading(false);
            });
    }
}

// Filter custom items
function filterCustomItems() {
    const searchTerm = document.getElementById('customItemSearch').value.toLowerCase();
    
    const filtered = (window.customItemsData || []).filter(item => {
        const matchName = item.name.toLowerCase().includes(searchTerm);
        const matchDescription = item.description ? 
            item.description.toLowerCase().includes(searchTerm) : false;
        const matchNotes = item.notes ? 
            item.notes.toLowerCase().includes(searchTerm) : false;
        
        return matchName || matchDescription || matchNotes;
    });
    
    // Update stats for filtered items
    document.getElementById('totalCustomItems').textContent = filtered.length;
    
    // Display filtered items
    displayCustomItemsGrid(filtered);
}

// Custom image cropper functions
function openCustomImageCropper() {
    document.getElementById('customCropperModal').classList.add('active');
}

function closeCustomCropperModal() {
    if (customCropper) {
        customCropper.destroy();
        customCropper = null;
    }
    document.getElementById('customCropperContainer').style.display = 'none';
    document.getElementById('customCropperActions').style.display = 'none';
    document.getElementById('customImageUploadInput').value = '';
    document.getElementById('customCropperModal').classList.remove('active');
}

function loadCustomImageToCrop(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('❌ Please select an image file', 'error');
        return;
    }
    
    if (customCropper) {
        customCropper.destroy();
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const image = document.getElementById('customImageToCrop');
        image.src = e.target.result;
        
        document.getElementById('customCropperContainer').style.display = 'block';
        document.getElementById('customCropperActions').style.display = 'flex';
        
        customCropper = new Cropper(image, {
            aspectRatio: 1,
            viewMode: 1,
            guides: true,
            center: true,
            highlight: true,
            background: true,
            autoCropArea: 0.8,
            responsive: true,
            cropBoxResizable: true,
            cropBoxMovable: true,
            dragMode: 'move'
        });
    };
    reader.readAsDataURL(file);
}

function uploadCustomCroppedImage() {
    if (!customCropper) {
        showToast('❌ Please select an image first', 'error');
        return;
    }
    
    showLoading(true);
    
    const canvas = customCropper.getCroppedCanvas({
        width: 800,
        height: 800,
        imageSmoothingQuality: 'high'
    });
    
    canvas.toBlob(function(blob) {
        const formData = new FormData();
        formData.append('file', blob);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', 'custom_items');
        
        fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.secure_url) {
                document.getElementById('customItemImage').value = data.secure_url;
                document.getElementById('customImagePreview').innerHTML = `
                    <img src="${data.secure_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">
                `;
                
                showToast('✅ Image uploaded successfully!');
                closeCustomCropperModal();
                showLoading(false);
            } else {
                throw new Error('Upload failed');
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            showToast('❌ Error uploading image. Please try again.', 'error');
            showLoading(false);
        });
    }, 'image/jpeg', 0.9);
}

console.log('✅ Admin.js loaded successfully!');