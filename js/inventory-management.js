// ============= INVENTORY MANAGEMENT SYSTEM =============
// Handles low-stock alerts, restock predictions, and bulk stock updates

const INVENTORY_CONFIG = {
    LOW_STOCK_THRESHOLD: 10,
    PREDICTION_DAYS: 7,
    ALERT_CHECK_INTERVAL: 60000 // Check every minute
};

let inventoryData = {};
let salesHistory = {}; // Track sales for predictions

// ============= INITIALIZE INVENTORY SYSTEM =============
function initializeInventorySystem() {
    console.log('📦 Initializing Inventory Management System...');
    loadInventoryData();
    startInventoryAlertCheck();
}

// ============= LOAD INVENTORY DATA =============
function loadInventoryData() {
    database.ref('products').on('value', snapshot => {
        inventoryData = {};
        snapshot.forEach(child => {
            inventoryData[child.key] = {
                id: child.key,
                ...child.val()
            };
        });
        updateInventoryUI();
    });
}

// ============= LOAD SALES HISTORY FOR PREDICTIONS =============
function loadSalesHistoryForPredictions() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - INVENTORY_CONFIG.PREDICTION_DAYS);

    database.ref('orders').once('value', snapshot => {
        salesHistory = {};
        
        snapshot.forEach(orderSnapshot => {
            const order = orderSnapshot.val();
            const orderDate = new Date(order.createdAt || order.date);
            
            // Only count orders from the last 7 days
            if (orderDate >= sevenDaysAgo) {
                if (order.items && Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        if (!salesHistory[item.id]) {
                            salesHistory[item.id] = 0;
                        }
                        salesHistory[item.id] += item.quantity || 1;
                    });
                }
            }
        });
        
        console.log('📊 Sales history loaded for predictions:', salesHistory);
    });
}

// ============= GET LOW STOCK PRODUCTS =============
function getLowStockProducts() {
    return Object.values(inventoryData).filter(product => 
        product.stock !== undefined && product.stock <= INVENTORY_CONFIG.LOW_STOCK_THRESHOLD
    ).sort((a, b) => a.stock - b.stock);
}

// ============= PREDICT RESTOCK NEED =============
function predictRestockNeed(productId) {
    const product = inventoryData[productId];
    if (!product || product.stock === undefined) return null;

    const dailySalesRate = (salesHistory[productId] || 0) / INVENTORY_CONFIG.PREDICTION_DAYS;
    const daysUntilStockout = dailySalesRate > 0 ? product.stock / dailySalesRate : Infinity;

    return {
        productId: productId,
        productName: product.name,
        currentStock: product.stock,
        dailyAverage: dailySalesRate.toFixed(2),
        daysUntilStockout: daysUntilStockout === Infinity ? 'N/A' : Math.ceil(daysUntilStockout),
        urgency: daysUntilStockout <= 3 ? 'CRITICAL' : daysUntilStockout <= 7 ? 'HIGH' : 'MEDIUM'
    };
}

// ============= START AUTOMATIC ALERT CHECK =============
function startInventoryAlertCheck() {
    // Check immediately
    checkInventoryAlerts();
    
    // Then check every minute
    setInterval(checkInventoryAlerts, INVENTORY_CONFIG.ALERT_CHECK_INTERVAL);
}

// ============= CHECK AND DISPLAY ALERTS =============
function checkInventoryAlerts() {
    const lowStockProducts = getLowStockProducts();
    const alertContainer = document.getElementById('inventoryAlertContainer');
    
    if (!alertContainer) return;

    if (lowStockProducts.length === 0) {
        alertContainer.innerHTML = '<p class="empty-message">✅ All products have healthy stock levels</p>';
        return;
    }

    const alertHTML = lowStockProducts.map(product => {
        const prediction = predictRestockNeed(product.id);
        const urgencyColor = prediction.urgency === 'CRITICAL' ? '#e74c3c' : 
                            prediction.urgency === 'HIGH' ? '#f39c12' : '#3498db';
        
        return `
            <div class="inventory-alert" style="border-left: 4px solid ${urgencyColor};">
                <div class="alert-header">
                    <span class="alert-urgency" style="background-color: ${urgencyColor};">${prediction.urgency}</span>
                    <span class="alert-product">${product.name}</span>
                </div>
                <div class="alert-details">
                    <div class="detail-row">
                        <span class="detail-label">Current Stock:</span>
                        <span class="detail-value">${product.stock} units</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Daily Average:</span>
                        <span class="detail-value">${prediction.dailyAverage} units/day</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Days Until Stockout:</span>
                        <span class="detail-value">${prediction.daysUntilStockout}</span>
                    </div>
                </div>
                <div class="alert-actions">
                    <button class="btn-small" onclick="openRestockModal('${product.id}')">📦 Restock</button>
                    <button class="btn-small" onclick="editProductStock('${product.id}')">✏️ Edit</button>
                </div>
            </div>
        `;
    }).join('');

    alertContainer.innerHTML = alertHTML;
}

// ============= OPEN RESTOCK MODAL =============
function openRestockModal(productId) {
    const product = inventoryData[productId];
    if (!product) return;

    const modal = document.getElementById('restockModal');
    if (!modal) {
        console.warn('Restock modal not found in DOM');
        return;
    }

    document.getElementById('restockProductName').textContent = product.name;
    document.getElementById('restockProductId').value = productId;
    document.getElementById('restockCurrentStock').textContent = product.stock;
    document.getElementById('restockQuantity').value = '';
    document.getElementById('restockNotes').value = '';

    modal.style.display = 'flex';
}

function closeRestockModal() {
    const modal = document.getElementById('restockModal');
    if (modal) modal.style.display = 'none';
}

function submitRestock(event) {
    event.preventDefault();
    
    const productId = document.getElementById('restockProductId').value;
    const quantity = parseInt(document.getElementById('restockQuantity').value);
    const notes = document.getElementById('restockNotes').value;

    if (!quantity || quantity <= 0) {
        showToast('⚠️ Please enter a valid quantity', 'error');
        return;
    }

    const product = inventoryData[productId];
    const newStock = product.stock + quantity;

    database.ref('products/' + productId + '/stock').set(newStock).then(() => {
        // Log this activity
        logActivity(`Restocked ${product.name}: +${quantity} units. Notes: ${notes || 'None'}`);
        showToast(`✅ ${product.name} restocked! New stock: ${newStock}`);
        closeRestockModal();
        checkInventoryAlerts();
    }).catch(err => {
        showToast('❌ Error updating stock: ' + err.message, 'error');
    });
}

// ============= BULK STOCK UPDATE =============
function openBulkStockUpdateModal() {
    const modal = document.getElementById('bulkStockModal');
    if (!modal) {
        console.warn('Bulk stock modal not found in DOM');
        return;
    }

    // Populate the product list
    const productList = document.getElementById('bulkProductsList');
    const products = Object.values(inventoryData).sort((a, b) => a.name.localeCompare(b.name));

    productList.innerHTML = products.map(product => `
        <div class="bulk-stock-item">
            <div class="bulk-product-info">
                <span class="bulk-product-name">${product.name}</span>
                <span class="bulk-product-category">${product.category}</span>
            </div>
            <div class="bulk-stock-input">
                <input type="number" class="bulk-stock-field" data-product-id="${product.id}" value="${product.stock}" min="0">
            </div>
        </div>
    `).join('');

    modal.style.display = 'flex';
}

function closeBulkStockModal() {
    const modal = document.getElementById('bulkStockModal');
    if (modal) modal.style.display = 'none';
}

function submitBulkStockUpdate() {
    const inputs = document.querySelectorAll('.bulk-stock-field');
    let updateCount = 0;
    let errors = 0;

    inputs.forEach(input => {
        const productId = input.getAttribute('data-product-id');
        const newStock = parseInt(input.value);
        const oldStock = inventoryData[productId].stock;

        if (newStock !== oldStock) {
            database.ref('products/' + productId + '/stock').set(newStock).then(() => {
                updateCount++;
                if (updateCount === inputs.length - errors) {
                    showToast(`✅ Updated ${updateCount} product(s)!`);
                    closeBulkStockModal();
                    checkInventoryAlerts();
                }
            }).catch(err => {
                errors++;
                console.error('Error updating stock for ' + productId, err);
            });
        }
    });

    if (updateCount === 0 && errors === 0) {
        showToast('ℹ️ No changes made', 'info');
    }
}

// ============= UPDATE INVENTORY UI =============
function updateInventoryUI() {
    // Add low-stock badges to menu items
    const menuItems = document.querySelectorAll('[data-product-id]');
    menuItems.forEach(item => {
        const productId = item.getAttribute('data-product-id');
        const product = inventoryData[productId];
        
        if (product && product.stock <= INVENTORY_CONFIG.LOW_STOCK_THRESHOLD) {
            let badge = item.querySelector('.low-stock-badge');
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'low-stock-badge';
                item.appendChild(badge);
            }
            badge.textContent = `⚠️ ${product.stock}`;
            badge.style.display = 'block';
        }
    });

    // Update the inventory dashboard
    checkInventoryAlerts();
}

// ============= EDIT PRODUCT STOCK DIRECTLY =============
function editProductStock(productId) {
    const product = inventoryData[productId];
    if (!product) return;

    const newStock = prompt(`Update stock for ${product.name}\n\nCurrent: ${product.stock}`, product.stock);
    
    if (newStock === null) return; // User cancelled
    
    const quantity = parseInt(newStock);
    if (isNaN(quantity) || quantity < 0) {
        showToast('⚠️ Please enter a valid number', 'error');
        return;
    }

    database.ref('products/' + productId + '/stock').set(quantity).then(() => {
        logActivity(`Updated ${product.name} stock: ${product.stock} → ${quantity}`);
        showToast(`✅ Stock updated to ${quantity}`);
        checkInventoryAlerts();
    }).catch(err => {
        showToast('❌ Error: ' + err.message, 'error');
    });
}

// ============= EXPORT INVENTORY REPORT =============
function exportInventoryReport() {
    const products = Object.values(inventoryData);
    let csv = 'Product Name,Category,Current Stock,Low Stock Alert,Daily Average,Days Until Stockout\n';

    products.forEach(product => {
        const prediction = predictRestockNeed(product.id);
        csv += `"${product.name}","${product.category}",${product.stock},"${product.stock <= INVENTORY_CONFIG.LOW_STOCK_THRESHOLD ? 'YES' : 'NO'}",${prediction.dailyAverage},${prediction.daysUntilStockout}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showToast('📥 Inventory report downloaded!');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        loadSalesHistoryForPredictions();
        initializeInventorySystem();
    }, 1000);
});
