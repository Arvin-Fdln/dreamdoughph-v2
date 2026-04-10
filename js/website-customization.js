// ============= WEBSITE CUSTOMIZATION & CONTENT CONTROL =============
// Manages announcement bar, featured products, store status, and other frontend content

const CUSTOMIZATION_CONFIG = {
    STORAGE_KEY: 'dreamdough_customization'
};

let customizationData = {
    announcementBar: {
        enabled: false,
        text: '',
        backgroundColor: '#f39c12',
        textColor: '#ffffff'
    },
    storeStatus: {
        isOpen: true,
        message: 'Welcome to Dream Dough!'
    },
    featuredProduct: {
        manual: false,
        productId: null
    },
    heroSection: {
        title: 'Welcome to Dream Dough',
        subtitle: 'Freshly Baked Happiness'
    }
};

// ============= INITIALIZE CUSTOMIZATION SYSTEM =============
function initializeCustomizationSystem() {
    console.log('🎨 Initializing Website Customization System...');
    loadCustomizationSettings();
    applyCustomizationToWebsite();
}

// ============= LOAD CUSTOMIZATION SETTINGS =============
function loadCustomizationSettings() {
    database.ref('settings/customization').once('value', snapshot => {
        if (snapshot.exists()) {
            customizationData = { ...customizationData, ...snapshot.val() };
            console.log('✅ Customization settings loaded:', customizationData);
        }
        updateCustomizationUI();
    });
}

// ============= SAVE CUSTOMIZATION SETTINGS =============
function saveCustomizationSettings() {
    database.ref('settings/customization').set(customizationData).then(() => {
        logActivity('Website customization updated', JSON.stringify(customizationData));
        showToast('✅ Website customization saved!');
        applyCustomizationToWebsite();
    }).catch(err => {
        showToast('❌ Error saving customization: ' + err.message, 'error');
    });
}

// ============= ANNOUNCEMENT BAR MANAGEMENT =============
function updateAnnouncementBar() {
    const enabled = document.getElementById('announcementEnabled').checked;
    const text = document.getElementById('announcementText').value;
    const bgColor = document.getElementById('announcementBgColor').value;
    const textColor = document.getElementById('announcementTextColor').value;

    customizationData.announcementBar = {
        enabled: enabled,
        text: text,
        backgroundColor: bgColor,
        textColor: textColor
    };

    saveCustomizationSettings();
}

// ============= STORE STATUS MANAGEMENT =============
function updateStoreStatus() {
    const isOpen = document.getElementById('storeStatusOpen').checked;
    const message = document.getElementById('storeStatusMessage').value;

    customizationData.storeStatus = {
        isOpen: isOpen,
        message: message
    };

    saveCustomizationSettings();
}

// ============= FEATURED PRODUCT MANAGEMENT =============
function openFeaturedProductModal() {
    const modal = document.getElementById('featuredProductModal');
    if (!modal) {
        console.warn('Featured product modal not found');
        return;
    }

    // Populate product list
    database.ref('products').once('value', snapshot => {
        const products = [];
        snapshot.forEach(child => {
            products.push({
                id: child.key,
                ...child.val()
            });
        });

        const productList = document.getElementById('featuredProductsList');
        productList.innerHTML = products.map(product => `
            <div class="featured-product-option" onclick="selectFeaturedProduct('${product.id}')">
                <div class="featured-product-image">
                    ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '🍰'}
                </div>
                <div class="featured-product-info">
                    <div class="featured-product-name">${product.name}</div>
                    <div class="featured-product-category">${product.category}</div>
                    <div class="featured-product-price">₱${product.price}</div>
                </div>
            </div>
        `).join('');
    });

    modal.style.display = 'flex';
}

function closeFeaturedProductModal() {
    const modal = document.getElementById('featuredProductModal');
    if (modal) modal.style.display = 'none';
}

function selectFeaturedProduct(productId) {
    customizationData.featuredProduct = {
        manual: true,
        productId: productId
    };

    saveCustomizationSettings();
    closeFeaturedProductModal();
}

function resetFeaturedProduct() {
    customizationData.featuredProduct = {
        manual: false,
        productId: null
    };

    saveCustomizationSettings();
    showToast('✅ Featured product reset to automatic (latest product)');
}

// ============= HERO SECTION CUSTOMIZATION =============
function updateHeroSection() {
    const title = document.getElementById('heroTitle').value;
    const subtitle = document.getElementById('heroSubtitle').value;

    customizationData.heroSection = {
        title: title,
        subtitle: subtitle
    };

    saveCustomizationSettings();
}

// ============= APPLY CUSTOMIZATION TO WEBSITE =============
function applyCustomizationToWebsite() {
    // This function applies customization to the main website
    // It should be called on the main website (index.html) as well

    // Announcement Bar
    const announcementBar = document.getElementById('announcementBar');
    if (announcementBar && customizationData.announcementBar.enabled) {
        announcementBar.style.display = 'block';
        announcementBar.style.backgroundColor = customizationData.announcementBar.backgroundColor;
        announcementBar.style.color = customizationData.announcementBar.textColor;
        announcementBar.textContent = customizationData.announcementBar.text;
    } else if (announcementBar) {
        announcementBar.style.display = 'none';
    }

    // Store Status
    const storeStatusBanner = document.getElementById('storeStatusBanner');
    if (storeStatusBanner) {
        if (!customizationData.storeStatus.isOpen) {
            storeStatusBanner.style.display = 'block';
            storeStatusBanner.innerHTML = `
                <div class="store-closed-message">
                    <h2>🚪 Store Closed</h2>
                    <p>${customizationData.storeStatus.message}</p>
                </div>
            `;
        } else {
            storeStatusBanner.style.display = 'none';
        }
    }

    // Hero Section
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');
    if (heroTitle) heroTitle.textContent = customizationData.heroSection.title;
    if (heroSubtitle) heroSubtitle.textContent = customizationData.heroSection.subtitle;
}

// ============= UPDATE CUSTOMIZATION UI IN ADMIN =============
function updateCustomizationUI() {
    // Announcement Bar
    document.getElementById('announcementEnabled').checked = customizationData.announcementBar.enabled;
    document.getElementById('announcementText').value = customizationData.announcementBar.text;
    document.getElementById('announcementBgColor').value = customizationData.announcementBar.backgroundColor;
    document.getElementById('announcementTextColor').value = customizationData.announcementBar.textColor;

    // Store Status
    document.getElementById('storeStatusOpen').checked = customizationData.storeStatus.isOpen;
    document.getElementById('storeStatusMessage').value = customizationData.storeStatus.message;

    // Featured Product
    if (customizationData.featuredProduct.manual && customizationData.featuredProduct.productId) {
        database.ref('products/' + customizationData.featuredProduct.productId).once('value', snapshot => {
            if (snapshot.exists()) {
                const product = snapshot.val();
                document.getElementById('featuredProductDisplay').innerHTML = `
                    <div class="featured-product-display">
                        <div class="featured-product-image">
                            ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '🍰'}
                        </div>
                        <div class="featured-product-info">
                            <div class="featured-product-name">${product.name}</div>
                            <div class="featured-product-price">₱${product.price}</div>
                        </div>
                    </div>
                `;
            }
        });
    } else {
        document.getElementById('featuredProductDisplay').innerHTML = '<p class="info-text">Using automatic (latest product)</p>';
    }

    // Hero Section
    document.getElementById('heroTitle').value = customizationData.heroSection.title;
    document.getElementById('heroSubtitle').value = customizationData.heroSection.subtitle;
}

// ============= PREVIEW CHANGES =============
function previewCustomization() {
    const previewWindow = window.open('index.html', 'preview', 'width=800,height=600');
    setTimeout(() => {
        applyCustomizationToWebsite();
    }, 1000);
}

// ============= QUICK TOGGLES =============
function toggleStoreOpen() {
    customizationData.storeStatus.isOpen = !customizationData.storeStatus.isOpen;
    saveCustomizationSettings();
    
    const status = customizationData.storeStatus.isOpen ? '✅ Store is OPEN' : '🚪 Store is CLOSED';
    showToast(status);
}

function toggleAnnouncementBar() {
    customizationData.announcementBar.enabled = !customizationData.announcementBar.enabled;
    saveCustomizationSettings();
    
    const status = customizationData.announcementBar.enabled ? '✅ Announcement enabled' : '❌ Announcement disabled';
    showToast(status);
}

// ============= PRESET ANNOUNCEMENT TEMPLATES =============
function useAnnouncementTemplate(template) {
    const templates = {
        holiday: '🎉 We\'re closed for the holidays! Back on [DATE]',
        sale: '🎊 Special 10% OFF on all items this week only!',
        newproduct: '✨ Check out our NEW PRODUCTS! Fresh baked daily!',
        custom: 'Enter your custom announcement'
    };

    document.getElementById('announcementText').value = templates[template];
    updateAnnouncementBar();
}

// ============= INITIALIZE ON PAGE LOAD =============
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initializeCustomizationSystem();
    }, 1000);
});
