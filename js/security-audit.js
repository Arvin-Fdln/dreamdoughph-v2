// ============= SECURITY & AUDIT LOG SYSTEM =============
// Tracks all admin activities, database backups, and security events

const AUDIT_CONFIG = {
    MAX_LOG_ENTRIES: 1000,
    LOG_RETENTION_DAYS: 90
};

let currentAdminEmail = '';

// ============= INITIALIZE SECURITY SYSTEM =============
function initializeSecuritySystem() {
    console.log('🔒 Initializing Security & Audit System...');
    
    // Get current admin email
    auth.onAuthStateChanged(user => {
        if (user) {
            currentAdminEmail = user.email;
            console.log('📝 Audit logs will be recorded for:', currentAdminEmail);
        }
    });

    // Clean up old logs periodically
    cleanupOldLogs();
}

// ============= LOG ACTIVITY =============
function logActivity(action, details = '') {
    if (!currentAdminEmail) return;

    const logEntry = {
        timestamp: new Date().toISOString(),
        admin: currentAdminEmail,
        action: action,
        details: details,
        ipInfo: 'Browser-based' // Can be enhanced with server-side IP tracking
    };

    database.ref('auditLogs').push(logEntry).then(() => {
        console.log('✅ Activity logged:', action);
    }).catch(err => {
        console.error('❌ Error logging activity:', err);
    });
}

// ============= LOAD ACTIVITY LOGS =============
function loadActivityLogs(limit = 50) {
    return new Promise((resolve, reject) => {
        database.ref('auditLogs').orderByChild('timestamp').limitToLast(limit).once('value', snapshot => {
            const logs = [];
            snapshot.forEach(child => {
                logs.unshift({
                    id: child.key,
                    ...child.val()
                });
            });
            resolve(logs);
        }).catch(reject);
    });
}

// ============= DISPLAY ACTIVITY LOG IN UI =============
async function displayActivityLogs() {
    const container = document.getElementById('activityLogsContainer');
    if (!container) return;

    container.innerHTML = '<p class="loading-message">Loading activity logs...</p>';

    try {
        const logs = await loadActivityLogs(100);

        if (logs.length === 0) {
            container.innerHTML = '<p class="empty-message">No activity logs yet</p>';
            return;
        }

        const logsHTML = logs.map(log => {
            const date = new Date(log.timestamp);
            const timeString = date.toLocaleString('en-PH');
            const actionIcon = getActionIcon(log.action);

            return `
                <div class="activity-log-item">
                    <div class="log-icon">${actionIcon}</div>
                    <div class="log-content">
                        <div class="log-action">${log.action}</div>
                        <div class="log-meta">
                            <span class="log-admin">👤 ${log.admin}</span>
                            <span class="log-time">🕐 ${timeString}</span>
                        </div>
                        ${log.details ? `<div class="log-details">${log.details}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = logsHTML;
    } catch (error) {
        container.innerHTML = `<p class="error-message">Error loading logs: ${error.message}</p>`;
    }
}

// ============= GET ACTION ICON =============
function getActionIcon(action) {
    if (action.includes('stock') || action.includes('Restock')) return '📦';
    if (action.includes('product') || action.includes('Product')) return '🍰';
    if (action.includes('order') || action.includes('Order')) return '📋';
    if (action.includes('customer') || action.includes('Customer')) return '👥';
    if (action.includes('settings') || action.includes('Settings')) return '⚙️';
    if (action.includes('password') || action.includes('security')) return '🔐';
    if (action.includes('backup') || action.includes('export')) return '💾';
    return '📝';
}

// ============= DATABASE BACKUP & EXPORT =============
function exportDatabaseBackup() {
    console.log('💾 Starting database backup...');
    
    const backupData = {
        exportDate: new Date().toISOString(),
        exportedBy: currentAdminEmail,
        data: {}
    };

    // Collect all data
    Promise.all([
        database.ref('products').once('value'),
        database.ref('orders').once('value'),
        database.ref('customItems').once('value'),
        database.ref('categories').once('value'),
        database.ref('settings').once('value')
    ]).then(snapshots => {
        backupData.data.products = snapshots[0].val() || {};
        backupData.data.orders = snapshots[1].val() || {};
        backupData.data.customItems = snapshots[2].val() || {};
        backupData.data.categories = snapshots[3].val() || {};
        backupData.data.settings = snapshots[4].val() || {};

        // Create and download JSON file
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dreamdough-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);

        logActivity('Database backup exported', `Backup file: dreamdough-backup-${new Date().toISOString().split('T')[0]}.json`);
        showToast('✅ Database backup downloaded successfully!');
    }).catch(err => {
        console.error('❌ Backup error:', err);
        showToast('❌ Error creating backup: ' + err.message, 'error');
    });
}

// ============= EXPORT DATA AS CSV =============
function exportDataAsCSV(dataType = 'all') {
    console.log('📊 Exporting data as CSV...');

    Promise.all([
        database.ref('products').once('value'),
        database.ref('orders').once('value'),
        database.ref('customItems').once('value')
    ]).then(snapshots => {
        let csv = '';

        if (dataType === 'all' || dataType === 'products') {
            csv += '=== PRODUCTS ===\n';
            csv += 'Product ID,Name,Category,Price,Stock,Description,Created Date\n';
            snapshots[0].forEach(child => {
                const p = child.val();
                csv += `"${child.key}","${p.name}","${p.category}",${p.price},${p.stock},"${p.description}","${p.createdAt}"\n`;
            });
            csv += '\n\n';
        }

        if (dataType === 'all' || dataType === 'orders') {
            csv += '=== ORDERS ===\n';
            csv += 'Order ID,Customer Name,Customer Email,Status,Payment Status,Total,Items,Order Date\n';
            snapshots[1].forEach(child => {
                const o = child.val();
                const items = o.items ? o.items.map(i => `${i.quantity}x ${i.name}`).join('; ') : '';
                csv += `"${child.key}","${o.customerName}","${o.customerEmail}","${o.status}","${o.paymentStatus}",${o.total},"${items}","${o.createdAt}"\n`;
            });
            csv += '\n\n';
        }

        if (dataType === 'all' || dataType === 'custom-items') {
            csv += '=== CUSTOM ITEMS ===\n';
            csv += 'Item ID,Name,Description,Created Date\n';
            snapshots[2].forEach(child => {
                const c = child.val();
                csv += `"${child.key}","${c.name}","${c.description}","${c.createdAt}"\n`;
            });
        }

        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dreamdough-export-${dataType}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        logActivity('Data exported as CSV', `Export type: ${dataType}`);
        showToast('✅ Data exported successfully!');
    }).catch(err => {
        console.error('❌ Export error:', err);
        showToast('❌ Error exporting data: ' + err.message, 'error');
    });
}

// ============= CLEANUP OLD LOGS =============
function cleanupOldLogs() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - AUDIT_CONFIG.LOG_RETENTION_DAYS);
    const cutoffTimestamp = cutoffDate.toISOString();

    database.ref('auditLogs').orderByChild('timestamp').endAt(cutoffTimestamp).once('value', snapshot => {
        let deletedCount = 0;
        snapshot.forEach(child => {
            child.ref.remove().then(() => {
                deletedCount++;
            });
        });

        if (deletedCount > 0) {
            console.log(`🧹 Cleaned up ${deletedCount} old audit logs`);
        }
    });
}

// ============= SECURITY SETTINGS =============
function openSecuritySettings() {
    const modal = document.getElementById('securitySettingsModal');
    if (!modal) {
        console.warn('Security settings modal not found');
        return;
    }

    // Display current admin info
    document.getElementById('currentAdminEmail').textContent = currentAdminEmail;
    
    // Get last backup date
    database.ref('auditLogs').orderByChild('action').equalTo('Database backup exported').limitToLast(1).once('value', snapshot => {
        if (snapshot.exists()) {
            const lastBackup = Object.values(snapshot.val())[0];
            const date = new Date(lastBackup.timestamp).toLocaleString('en-PH');
            document.getElementById('lastBackupDate').textContent = date;
        } else {
            document.getElementById('lastBackupDate').textContent = 'Never';
        }
    });

    modal.style.display = 'flex';
}

function closeSecuritySettings() {
    const modal = document.getElementById('securitySettingsModal');
    if (modal) modal.style.display = 'none';
}

// ============= CHANGE PASSWORD =============
function changeAdminPassword() {
    const currentPassword = document.getElementById('currentAdminPassword').value;
    const newPassword = document.getElementById('newAdminPassword').value;
    const confirmPassword = document.getElementById('confirmAdminPassword').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('⚠️ Please fill in all password fields', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast('⚠️ New passwords do not match', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showToast('⚠️ New password must be at least 6 characters', 'error');
        return;
    }

    const user = auth.currentUser;
    
    // Re-authenticate first
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
    user.reauthenticateWithCredential(credential).then(() => {
        // Update password
        user.updatePassword(newPassword).then(() => {
            logActivity('Password changed', 'Admin password updated');
            showToast('✅ Password changed successfully!');
            
            // Clear form
            document.getElementById('currentAdminPassword').value = '';
            document.getElementById('newAdminPassword').value = '';
            document.getElementById('confirmAdminPassword').value = '';
        }).catch(err => {
            showToast('❌ Error changing password: ' + err.message, 'error');
        });
    }).catch(err => {
        showToast('❌ Current password is incorrect', 'error');
    });
}

// ============= INITIALIZE ON PAGE LOAD =============
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initializeSecuritySystem();
    }, 1000);
});
