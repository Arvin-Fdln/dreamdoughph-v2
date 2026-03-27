// Cart functionality
let cart = [];

// Carousel state management
const carouselStates = {};

// In your loadProducts function, add custom orders handling
function loadProducts() {
    console.log('📦 Loading products from Firebase...');
    
    // Load business settings
    loadBusinessSettings();
    
    // Load store hours
    loadStoreHours();
    
    // Load social media links
    loadSocialLinks();

    loadFeaturedProduct();

    // Track product counts per category
    let categoryCounts = {
        cakes: 0,
        cookies: 0,
        cupcakes: 0,
        custom: 0 // ADD THIS
    };

    // Load all products
    database.ref('products').on('value', (snapshot) => {
        console.log('📦 Products snapshot received');
        let allProducts = [];
        // Reset counts
        categoryCounts = {
            cakes: 0,
            cookies: 0,
            cupcakes: 0,
            custom: 0 // ADD THIS
        };
        snapshot.forEach((childSnapshot) => {
            const product = childSnapshot.val();
            console.log('Product found:', product);
            // Count products by category
            const category = product.category ? product.category.toLowerCase() : '';
            if (categoryCounts.hasOwnProperty(category)) {
                categoryCounts[category]++;
            }
            allProducts.push({
                id: childSnapshot.key,
                ...product
            });
        });

        // Now load custom items and merge with custom products
        database.ref('customItems').once('value').then((customSnapshot) => {
            const customItems = [];
            customSnapshot.forEach((childSnapshot) => {
                const item = childSnapshot.val();
                // Add a category property so it is treated as a custom product
                customItems.push({
                    id: childSnapshot.key,
                    ...item,
                    category: 'custom'
                });
            });
            // Merge custom items into allProducts
            allProducts = allProducts.concat(customItems);
            // Update custom count
            categoryCounts.custom += customItems.length;

            console.log('Merged custom items:', customItems.length);
            // Separate products by category and pass counts
            displayProductsByCategory(allProducts, 'cakes', 'cakesGrid', categoryCounts.cakes);
            displayProductsByCategory(allProducts, 'cookies', 'cookiesGrid', categoryCounts.cookies);
            displayProductsByCategory(allProducts, 'cupcakes', 'cupcakesGrid', categoryCounts.cupcakes);
            displayProductsByCategory(allProducts, 'custom', 'customOrdersGrid', categoryCounts.custom);
        }).catch((error) => {
            console.error('❌ Error loading custom items:', error);
            // Fallback: show only products
            displayProductsByCategory(allProducts, 'cakes', 'cakesGrid', categoryCounts.cakes);
            displayProductsByCategory(allProducts, 'cookies', 'cookiesGrid', categoryCounts.cookies);
            displayProductsByCategory(allProducts, 'cupcakes', 'cupcakesGrid', categoryCounts.cupcakes);
            displayProductsByCategory(allProducts, 'custom', 'customOrdersGrid', categoryCounts.custom);
        });
    }, (error) => {
        console.error('❌ Error loading products:', error);
    });
}

function displayProductsByCategory(allProducts, category, gridId, productCount) {
    console.log(`📋 Displaying ${category} in ${gridId} (${productCount} products)`);
    
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = '';

    const filteredProducts = allProducts.filter(product =>
        product.category && product.category.toLowerCase() === category
    );

    // Custom Orders Section: Show message and robustly hide buttons if no products
    if (gridId === 'customOrdersGrid') {
        if (filteredProducts.length === 0) {
            grid.innerHTML = `
                <div style="width: 100%; text-align: center; padding: 2rem;">
                    <p style="color: var(--light-brown); font-size: 1.1rem; margin-bottom: 1rem;">
                        No custom product has been uploaded
                    </p>
                </div>
            `;
            const section = grid.closest('.product-carousel-wrapper');
            if (section) {
                // Hide buttons robustly
                const hideButtons = () => {
                    const prevBtn = section.querySelector('.carousel-nav.prev');
                    const nextBtn = section.querySelector('.carousel-nav.next');
                    if (prevBtn) prevBtn.style.display = 'none';
                    if (nextBtn) nextBtn.style.display = 'none';
                };
                hideButtons();
                // In case buttons are added later, observe and hide them
                const observer = new MutationObserver(hideButtons);
                observer.observe(section, { childList: true, subtree: true });
            }
            return;
        }
    }
    
    // Set data attribute for product count
    grid.setAttribute('data-count', filteredProducts.length);
    const cardsHTML = filteredProducts.map(product => createProductCard(product)).filter(Boolean).join('');
    grid.innerHTML = cardsHTML;
    grid.scrollLeft = 0;

    // Dynamically add carousel buttons if enough products
    const section = grid.closest('.product-carousel-wrapper');
    if (section) {
        // Remove any existing buttons
        section.querySelectorAll('.carousel-nav').forEach(btn => btn.remove());

        if (filteredProducts.length >= 5) {
            // Create prev button
            const prevBtn = document.createElement('button');
            prevBtn.className = 'carousel-nav prev';
            prevBtn.innerHTML = '‹';
            prevBtn.onclick = () => scrollCarousel(gridId, -1);
            // Insert before grid
            section.insertBefore(prevBtn, grid);

            // Create next button
            const nextBtn = document.createElement('button');
            nextBtn.className = 'carousel-nav next';
            nextBtn.innerHTML = '›';
            nextBtn.onclick = () => scrollCarousel(gridId, 1);
            // Insert after grid
            if (grid.nextSibling) {
                section.insertBefore(nextBtn, grid.nextSibling);
            } else {
                section.appendChild(nextBtn);
            }
        }
    }

    setTimeout(() => {
        handleArrowVisibility(gridId, filteredProducts.length);
        initializeGridScrolling(gridId);
        if (gridId === 'cupcakesGrid') {
            // Force horizontal layout
            grid.style.display = 'flex';
            grid.style.flexDirection = 'row';
            grid.style.flexWrap = 'nowrap';
            grid.style.overflowX = 'auto';
            grid.style.overflowY = 'visible';
            grid.style.width = '100%';
            
            // Ensure all cards are properly sized
            const cards = grid.querySelectorAll('.product-card');
            cards.forEach(card => {
                card.style.flexShrink = '0';
                card.style.flexGrow = '0';
            });
        }
    }, 0);
}

// Function to handle arrow visibility based on product count AND scroll position
function handleArrowVisibility(gridId, productCount) {
    console.log(`🔄 Handling arrows for ${gridId}: ${productCount} products`);
    
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const section = grid.closest('.product-carousel-wrapper');
    if (!section) return;
    const prevBtn = section.querySelector('.carousel-nav.prev');
    const nextBtn = section.querySelector('.carousel-nav.next');

    // Only show/hide if buttons exist
    if (prevBtn && nextBtn) {
        if (productCount < 5) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            grid.style.justifyContent = 'center';
            grid.classList.add('centered-grid');
        } else {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
            grid.style.justifyContent = 'flex-start';
            grid.classList.remove('centered-grid');
        }
        // Calculate scroll position
        const scrollLeft = grid.scrollLeft;
        const scrollWidth = grid.scrollWidth;
        const clientWidth = grid.clientWidth;
        
        // Check if at the beginning
        if (scrollLeft <= 0) {
            prevBtn.style.opacity = '0.3';
            prevBtn.style.pointerEvents = 'none';
        } else {
            prevBtn.style.opacity = '1';
            prevBtn.style.pointerEvents = 'auto';
        }
        
        // Check if at the end (with small buffer)
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
            nextBtn.style.opacity = '0.3';
            nextBtn.style.pointerEvents = 'none';
        } else {
            nextBtn.style.opacity = '1';
            nextBtn.style.pointerEvents = 'auto';
        }
    }
}

// Initialize grid scrolling functionality - UPDATED VERSION
function initializeGridScrolling(gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const section = grid.closest('.product-carousel-wrapper');
    if (!section) return;
    const prevBtn = section.querySelector('.carousel-nav.prev');
    const nextBtn = section.querySelector('.carousel-nav.next');

    // Only add listeners if buttons exist
    if (prevBtn && nextBtn) {
        // Remove existing click listeners to prevent duplicates
        prevBtn.replaceWith(prevBtn.cloneNode(true));
        nextBtn.replaceWith(nextBtn.cloneNode(true));
        
        // Get fresh references
        const newPrevBtn = section.querySelector('.carousel-nav.prev');
        const newNextBtn = section.querySelector('.carousel-nav.next');
        
        // Add click event listeners
        newPrevBtn.addEventListener('click', () => scrollCarousel(gridId, -1));
        newNextBtn.addEventListener('click', () => scrollCarousel(gridId, 1));
        
        // Add scroll event listener to update arrow visibility
        grid.addEventListener('scroll', () => {
            const productCount = grid.querySelectorAll('.product-card').length;
            handleArrowVisibility(gridId, productCount);
        });
    }
    console.log(`✅ Carousel initialized for ${gridId}`);
}
// Load business settings from Firebase
function loadBusinessSettings() {
    database.ref('settings/business').once('value', (snapshot) => {
        const settings = snapshot.val();
        console.log('📋 Business settings loaded:', settings);
        if (settings) {
            // Update footer with settings
            if (settings.businessPhone) {
                document.getElementById('footerPhone').textContent = `📞 ${settings.businessPhone}`;
            }
            if (settings.businessEmail) {
                document.getElementById('footerEmail').textContent = `📧 ${settings.businessEmail}`;
            }
            if (settings.businessAddress) {
                document.getElementById('footerAddress').textContent = `📍 ${settings.businessAddress}`;
            }
        }
    }).catch(error => {
        console.error('❌ Error loading business settings:', error);
    });
}

// Load store hours from Firebase - UPDATED FOR NEW FOOTER
function loadStoreHours() {
    database.ref('settings/storeHours').once('value', (snapshot) => {
        const hoursContainer = document.querySelector('.footer-section:nth-child(2)');
        if (!hoursContainer) return;
        
        // Remove old hours
        const oldHours = hoursContainer.querySelectorAll('p[data-hours]');
        oldHours.forEach(el => el.remove());
        
        if (!snapshot.exists() || !snapshot.val()) {
            // Default hours if none set
            const defaultHours = document.createElement('p');
            defaultHours.setAttribute('data-hours', 'true');
            defaultHours.style.marginTop = '1rem';
            defaultHours.style.paddingTop = '1rem';
            defaultHours.style.borderTop = '1px solid rgba(255,255,255,0.2)';
            defaultHours.textContent = '🕐 Mon-Sat: 8AM - 10PM';
            hoursContainer.appendChild(defaultHours);
            return;
        }

        const hoursText = snapshot.val();
        const hoursLines = hoursText.split('\n').filter(line => line.trim());
        
        // Add separator before hours
        const separator = document.createElement('div');
        separator.style.marginTop = '1rem';
        separator.style.paddingTop = '1rem';
        separator.style.borderTop = '1px solid rgba(255,255,255,0.2)';
        hoursContainer.appendChild(separator);
        
        hoursLines.forEach(line => {
            const hoursEl = document.createElement('p');
            hoursEl.setAttribute('data-hours', 'true');
            hoursEl.textContent = `🕐 ${line.trim()}`;
            hoursContainer.appendChild(hoursEl);
        });
        
    }).catch(error => {
        console.error('❌ Error loading store hours:', error);
    });
}

// Format time from 24h to 12h format
function formatTime(time) {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes}${ampm}`;
}

// Load social media links from Firebase
function loadSocialLinks() {
    database.ref('settings/socialLinks').once('value', (snapshot) => {
        const socialContainer = document.querySelector('.social-links');
        if (!socialContainer) return;
        
        socialContainer.innerHTML = ''; // Clear existing links
        
        if (!snapshot.exists() || snapshot.numChildren() === 0) {
            // Default placeholder if no links
            socialContainer.innerHTML = '<p style="color: var(--gold); font-size: 0.9rem;">Follow us on social media!</p>';
            return;
        }

        const iconMap = {
            Facebook: '📘',
            Instagram: '📷',
            Twitter: '🐦',
            TikTok: '🎵',
            YouTube: '📺',
            LinkedIn: '💼'
        };

        snapshot.forEach((childSnapshot) => {
            const platform = childSnapshot.key;
            const url = childSnapshot.val();
            const icon = iconMap[platform] || '🌐';
            
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = `${icon} ${platform}`;
            
            socialContainer.appendChild(link);
        });
        
    }).catch(error => {
        console.error('❌ Error loading social links:', error);
    });
}

function createProductCard(product) {
    const name = product.name || 'Unnamed Product';
    const description = product.description || '';
    const price = parseFloat(product.price || 0).toFixed(2);
    const category = product.category || '';
    const image = product.image || '🰰';
    const productId = product.id || '';
    
    let imageHTML;
    if (image.startsWith('http://') || image.startsWith('https://')) {
        imageHTML = `<img src="${image}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
        imageHTML = image;
    }
    
    // For custom items, remove price and add-to-cart button outside modal
    if (category.toLowerCase() === 'custom') {
        return `
            <div class="product-card" data-name="${name.toLowerCase()}" data-category="custom" onclick="openProductDetails('${productId}', true)">
                <div class="product-image">${imageHTML}</div>
                <div class="product-info">
                    <h3>${name}</h3>
                    <p>${description.substring(0, 60)}${description.length > 60 ? '...' : ''}</p>
                </div>
            </div>
        `;
    } else {
        return `
            <div class="product-card" data-name="${name.toLowerCase()}" data-category="${category.toLowerCase()}" onclick="openProductDetails('${productId}')">
                <div class="product-image">${imageHTML}</div>
                <div class="product-info">
                    <h3>${name}</h3>
                    <p>${description.substring(0, 60)}${description.length > 60 ? '...' : ''}</p>
                    <div class="product-price">₱${price}</div>
                    <button class="add-to-cart" onclick="event.stopPropagation(); addToCart('${name.replace(/'/g, "\\'")}', ${product.price})">Add to Cart</button>
                </div>
            </div>
        `;
    }
}

// Carousel initialization and state management
function initCarousel(gridId, totalProducts) {
    carouselStates[gridId] = {
        currentIndex: 0,
        totalProducts: totalProducts,
        cardsPerView: getCardsPerView()
    };
    updateCarouselPosition(gridId);
}

function getCardsPerView() {
    const width = window.innerWidth;
    if (width >= 1200) return 4;
    if (width >= 900) return 3;
    if (width >= 600) return 2;
    return 1;
}

function scrollCarousel(gridId, direction) {
    const grid = document.getElementById(gridId);
    if (!grid) {
        console.log('❌ Grid not found:', gridId);
        return;
    }
    
    const section = grid.closest('.product-carousel-wrapper');
    if (!section) {
        console.log('❌ Section not found');
        return;
    }
    
    const prevBtn = section.querySelector('.carousel-nav.prev');
    const nextBtn = section.querySelector('.carousel-nav.next');
    
    // Check if arrows are hidden or disabled
    if (prevBtn && nextBtn) {
        if (prevBtn.style.display === 'none' && nextBtn.style.display === 'none') {
            console.log('⛔ Arrows hidden, not scrolling');
            return;
        }
        
        // Check if the arrow we're trying to use is disabled
        if (direction === -1 && prevBtn.style.pointerEvents === 'none') return;
        if (direction === 1 && nextBtn.style.pointerEvents === 'none') return;
    }
    
    // Calculate scroll amount based on screen size
    let scrollAmount;
    const screenWidth = window.innerWidth;
    
    if (screenWidth >= 1200) {
        scrollAmount = 312; // 280px card + 32px gap
    } else if (screenWidth >= 900) {
        scrollAmount = 312;
    } else if (screenWidth >= 768) {
        scrollAmount = 236; // 220px card + 16px gap (for mobile)
    } else if (screenWidth >= 480) {
        scrollAmount = 236;
    } else {
        scrollAmount = 196; // 180px card + 16px gap (for small mobile)
    }
    
    // Perform the scroll
    grid.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
    
    console.log('✅ Scrolling', gridId, direction > 0 ? 'RIGHT →' : 'LEFT ←', 'by', scrollAmount + 'px');
    
    // Update arrow visibility after scroll completes
    setTimeout(() => {
        const productCount = grid.querySelectorAll('.product-card').length;
        handleArrowVisibility(gridId, productCount);
    }, 300);
}

function updateCarouselPosition(gridId) {
    const grid = document.getElementById(gridId);
    const state = carouselStates[gridId];
    if (!state) return;

    const cardWidth = 280;
    const gap = 32;
    const totalWidth = cardWidth + gap;
    const offset = -(state.currentIndex * totalWidth);

    grid.style.transform = `translateX(${offset}px)`;
}

// Touch swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(e, gridId) {
    touchStartX = e.changedTouches[0].screenX;
}

function handleTouchEnd(e, gridId) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe(gridId);
}

function handleSwipe(gridId) {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            scrollCarousel(gridId, 1);
        } else {
            scrollCarousel(gridId, -1);
        }
    }
}

// Cart Functions
function addToCart(name, price) {
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    updateCartCount();
    showNotification(`${name} added to cart!`);
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = totalItems;
}

function toggleCart() {
    displayCart();
    
    // Update checkout total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const checkoutTotalEl = document.getElementById('checkoutTotal');
    if (checkoutTotalEl) {
        checkoutTotalEl.textContent = total.toFixed(2);
    }
    
    openModal('cartModal');
}

function displayCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: var(--light-brown); padding: 2rem;">Your cart is empty</p>';
        cartTotal.textContent = '0';
        return;
    }

    let html = '';
    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid var(--cream);">
                <div>
                    <h4 style="color: var(--brown);">${item.name}</h4>
                    <p style="color: var(--light-brown);">₱${item.price} × ${item.quantity}</p>
                </div>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <button onclick="changeQuantity(${index}, -1)" style="background: var(--light-brown); color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">-</button>
                    <span style="font-weight: bold;">${item.quantity}</span>
                    <button onclick="changeQuantity(${index}, 1)" style="background: var(--light-brown); color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">+</button>
                    <button onclick="removeFromCart(${index})" style="background: #D32F2F; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">Remove</button>
                </div>
            </div>
        `;
    });

    cartItems.innerHTML = html;
    cartTotal.textContent = total.toFixed(2);
}

function changeQuantity(index, change) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    updateCartCount();
    displayCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCount();
    displayCart();
}

function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // Close cart modal first
    closeModal('cartModal');
    
    // Open checkout modal
    openModal('checkoutModal');
}

// Handle checkout form submission
function handleCheckoutSubmit(event) {
    event.preventDefault();
    
    const customerName = document.getElementById('checkoutName').value.trim();
    const customerPhone = document.getElementById('checkoutPhone').value.trim();
    const customerEmail = document.getElementById('checkoutEmail').value.trim();
    const customerAddress = document.getElementById('checkoutAddress').value.trim();
    const pickupDate = document.getElementById('checkoutDate').value;
    const pickupTime = document.getElementById('checkoutTime').value;
    const specialRequests = document.getElementById('checkoutNotes').value.trim();
    
    if (!customerName || !customerPhone || !pickupDate || !pickupTime) {
        alert('Please fill in all required fields!');
        return;
    }
    
    // Calculate total
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Prepare order data
    const orderData = {
        customerName: customerName,
        customerPhone: customerPhone,
        customerEmail: customerEmail || '',
        customerAddress: customerAddress || '',
        pickupDate: pickupDate,
        pickupTime: pickupTime,
        items: cart.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category: item.category || 'Unknown'
        })),
        subtotal: subtotal,
        total: subtotal,
        status: 'pending',
        notes: specialRequests || '',
        date: new Date().toLocaleString('en-PH', { 
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }),
        createdAt: new Date().toISOString()
    };
    
    // Show loading state
    const submitBtn = document.getElementById('checkoutSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    
    // Save to Firebase
    database.ref('orders').push(orderData)
        .then(() => {
            // Success!
            closeModal('checkoutModal');
            
            // Show success message
            showSuccessModal(orderData);
            
            // Clear cart
            cart = [];
            updateCartCount();
            
            // Reset form
            document.getElementById('checkoutForm').reset();
            submitBtn.disabled = false;
            submitBtn.textContent = 'Place Order';
        })
        .catch(error => {
            alert('Error placing order: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Place Order';
        });
}

// Show success confirmation modal - FIXED VERSION
function showSuccessModal(orderData) {
    const modal = document.getElementById('successModal');
    const successOrderSummary = document.getElementById('successOrderSummary');
    
    // Clear any existing content
    successOrderSummary.innerHTML = '';
    
    // Create the modal content with proper styling
    successOrderSummary.innerHTML = `
        <div style="
            text-align: center; 
            margin-bottom: 1.5rem;
            width: 100%;
        ">
            <div style="font-size: 4rem; margin-bottom: 1rem; color: #4CAF50;">✅</div>
            <h3 style="
                color: var(--brown); 
                margin-bottom: 0.5rem; 
                font-family: var(--font-heading);
                font-weight: 700;
                font-size: 1.8rem;
            ">Order Placed Successfully!</h3>
            <p style="
                color: var(--light-brown); 
                font-size: 1.1rem;
                margin-top: 0.5rem;
            ">Thank you, ${orderData.customerName}!</p>
        </div>
        <div style="
            background: var(--soft-cream); 
            padding: 1.5rem; 
            border-radius: 10px; 
            border-left: 4px solid var(--gold);
            margin-bottom: 1rem;
        ">
            <h4 style="
                color: var(--brown); 
                margin-bottom: 1rem;
                font-family: var(--font-heading);
                font-weight: 600;
            ">Order Details:</h4>
            <div style="
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                margin-bottom: 1rem;
            ">
                <span style="font-weight: 600; color: var(--brown);">Total:</span>
                <span style="
                    color: var(--gold); 
                    font-size: 1.3rem; 
                    font-weight: bold;
                ">₱${orderData.total.toFixed(2)}</span>
            </div>
            <hr style="
                border: none; 
                border-top: 1px solid rgba(139, 69, 19, 0.2); 
                margin: 1rem 0;
            ">
            <h4 style="
                color: var(--brown); 
                margin-bottom: 0.5rem;
                font-family: var(--font-heading);
                font-weight: 600;
            ">Items:</h4>
            ${orderData.items.map(item => `
                <div style="
                    display: flex; 
                    justify-content: space-between; 
                    margin-bottom: 0.5rem;
                    padding: 0.3rem 0;
                ">
                    <span style="color: var(--brown);">${item.quantity}x ${item.name}</span>
                    <span style="color: var(--light-brown); font-weight: 600;">₱${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('')}
        </div>
        <div style="
            margin-top: 1.5rem; 
            padding: 1rem; 
            background: #E3F2FD; 
            border-radius: 8px;
            border-left: 4px solid #2196F3;
        ">
            <p style="
                color: var(--brown); 
                font-size: 0.9rem; 
                line-height: 1.6;
                margin: 0;
            ">
                📞 We will contact you at <strong>${orderData.customerPhone}</strong> to confirm your order.
                <br>Please wait for our confirmation before proceeding with payment.
            </p>
        </div>
    `;
    
    // Also need to update the modal container styles
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.maxHeight = '90vh'; // Prevent overflow
        modalContent.style.overflowY = 'auto'; // Add scroll only if needed
        modalContent.style.overflowX = 'hidden'; // Prevent horizontal scroll
        modalContent.style.padding = '2rem';
    }
    
    // Make sure the body is not scrollable
    document.body.style.overflow = 'hidden';
    
    openModal('successModal');
}

// Hero Carousel functionality
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-item');
const indicators = document.querySelectorAll('.indicator');

function goToSlide(index) {
    currentSlide = index;
    updateCarousel();
}

function updateCarousel() {
    const carousel = document.getElementById('carousel');
    if (!carousel) return;
    carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlide);
    });
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    updateCarousel();
}

setInterval(nextSlide, 5000);

// Search functionality
function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const productCards = document.querySelectorAll('.product-card');
    
    let hasResults = false;
    productCards.forEach(card => {
        const productName = card.getAttribute('data-name');
        const productCategory = card.getAttribute('data-category');
        
        if (productName.includes(searchTerm) || productCategory.includes(searchTerm)) {
            card.style.display = 'block';
            card.classList.add('fade-in');
            hasResults = true;
        } else {
            card.style.display = 'none';
        }
    });
    
    if (searchTerm === '') {
        productCards.forEach(card => {
            card.style.display = 'block';
        });
    }
}

// Load Featured "What's New" Product
let featuredProduct = null;

function loadFeaturedProduct() {
    // Get the most recently added product
    database.ref('products').orderByChild('createdAt').limitToLast(1).once('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            featuredProduct = {
                id: childSnapshot.key,
                ...childSnapshot.val()
            };
            
            // Populate featured section
            const image = featuredProduct.image || '🰰';
            let imageHTML;
            if (image.startsWith('http://') || image.startsWith('https://')) {
                imageHTML = `<img src="${image}" alt="${featuredProduct.name}">`;
            } else {
                imageHTML = `<div class="featured-image-placeholder">${image}</div>`;
            }
            
            document.getElementById('featuredImage').innerHTML = imageHTML;
            document.getElementById('featuredCategory').textContent = (featuredProduct.category || 'NEW ARRIVAL').toUpperCase();
            document.getElementById('featuredName').textContent = featuredProduct.name;
            document.getElementById('featuredDescription').textContent = featuredProduct.description || 'Discover our latest creation';
            document.getElementById('featuredPrice').textContent = `₱${parseFloat(featuredProduct.price).toFixed(2)}`;
        });
    });
}

function openFeaturedProduct() {
    if (featuredProduct) {
        openProductDetails(featuredProduct.id);
    }
}


// Modal functionality - IMPROVED VERSION
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        // Save current scroll position
        const scrollY = window.scrollY;
        
        // Lock body scroll
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.classList.add('modal-open');
        
        // Show modal
        modal.style.display = 'flex';
        
        // For success modal specifically
        if (modalId === 'successModal') {
            // Center the modal content
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.margin = 'auto';
                modalContent.style.display = 'flex';
                modalContent.style.flexDirection = 'column';
                modalContent.style.alignItems = 'center';
            }
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        
        // Restore body scroll
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        
        // Restore scroll position
        if (scrollY) {
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
    }
}

// Close modal when clicking outside - FIXED
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal') || event.target.classList.contains('modal-overlay')) {
        const modal = event.target.classList.contains('modal') ? event.target : event.target.closest('.modal');
        if (modal) {
            const modalId = modal.id;
            closeModal(modalId);
        }
    }
});

// Close modal with ESC key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'flex') {
                closeModal(modal.id);
            }
        });
    }
});

// Hamburger menu
function toggleMenu() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

// Sidebar open/close for mobile (admin style)
function openMobileMenu() {
    const sidebar = document.getElementById('mainSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.classList.add('sidebar-open');
        // Lock body scroll when sidebar is open
        document.body.style.overflow = 'hidden';
    }
}

function closeMobileMenu() {
    const sidebar = document.getElementById('mainSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
        // Restore body scroll
        document.body.style.overflow = '';
    }
}

// Notification system
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--brown);
        color: var(--cream);
        padding: 1rem 2rem;
        border-radius: 10px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        z-index: 3000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

function observeElements() {
    document.querySelectorAll('.product-card, .feature-item').forEach(el => {
        observer.observe(el);
    });
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// ===== SECRET ADMIN ACCESS - HIDDEN EASTER EGG =====
let secretKeys = '';
const secretCode = 'openadmin';
let secretTimeout;

document.addEventListener('keypress', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    clearTimeout(secretTimeout);
    secretKeys += e.key.toLowerCase();
    
    if (secretKeys.includes(secretCode)) {
        secretKeys = '';
        console.log('🔓 Secret code detected! Redirecting to admin login...');
        showNotification('🔓 Admin access granted!');
        setTimeout(() => {
            window.location.href = 'Login.html';
        }, 800);
        return;
    }
    
    if (secretKeys.length > 20) {
        secretKeys = secretKeys.slice(-20);
    }
    
    secretTimeout = setTimeout(() => {
        secretKeys = '';
    }, 3000);
});

// Load products when page loads
window.addEventListener('DOMContentLoaded', loadProducts);

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('checkoutDate');
    if (dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.min = tomorrow.toISOString().split('T')[0];
    }
    
    // Initialize all grids - ADD customOrdersGrid
    const grids = ['cakesGrid', 'cookiesGrid', 'cupcakesGrid', 'customOrdersGrid']; // UPDATED
    
    grids.forEach(gridId => {
        const grid = document.getElementById(gridId);
        if (grid) {
            // Initialize scrolling
            initializeGridScrolling(gridId);
            
            // Touch support
            grid.addEventListener('touchstart', (e) => handleTouchStart(e, gridId), false);
            grid.addEventListener('touchend', (e) => handleTouchEnd(e, gridId), false);
            
            // Initial arrow visibility check
            const productCount = grid.querySelectorAll('.product-card').length;
            setTimeout(() => handleArrowVisibility(gridId, productCount), 100);
        }
    });
        
    // ===== UPDATED CUPCAKES FIX =====
    setTimeout(() => {
        const cupcakesGrid = document.getElementById('cupcakesGrid');
        if (cupcakesGrid) {
            // Reset all display properties
            cupcakesGrid.style.display = 'flex';
            cupcakesGrid.style.flexDirection = 'row';
            cupcakesGrid.style.flexWrap = 'nowrap';
            cupcakesGrid.style.overflowX = 'auto';
            cupcakesGrid.style.overflowY = 'visible';
            cupcakesGrid.style.width = '100%';
            cupcakesGrid.style.minWidth = '100%';
            
            // Remove any problematic classes
            cupcakesGrid.classList.remove('centered-grid');
            
            // Also fix any child product cards
            const cupcakeCards = cupcakesGrid.querySelectorAll('.product-card');
            cupcakeCards.forEach(card => {
                card.style.float = 'none';
                card.style.display = 'block';
                card.style.position = 'relative';
                card.style.flexShrink = '0';
                card.style.flexGrow = '0';
            });
            
            // Force a reflow to trigger proper rendering
            void cupcakesGrid.offsetHeight;
            
            // Check arrow visibility
            const productCount = cupcakeCards.length;
            handleArrowVisibility('cupcakesGrid', productCount);
        }
    }, 100);
    // ===== END OF CUPCAKES FIX =====
});

// Close modal when clicking outside or pressing ESC - ULTIMATE FIX
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
});

// Close modal with ESC key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'flex') {
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
            }
        });
    }
});

// Product Details Modal - UPDATED FOR NEW DESIGN
let currentModalProduct = null;
let modalQuantity = 1;

function openProductDetails(productId, isCustom = false) {
    if (isCustom) {
        // Find the custom item from merged products (already loaded in allProducts)
        let customItem = null;
        if (window.allProducts) {
            customItem = window.allProducts.find(p => p.id === productId && p.category === 'custom');
        }
        if (!customItem) {
            // fallback: fetch from Firebase
            database.ref(`customItems/${productId}`).once('value', (snapshot) => {
                const item = snapshot.val();
                if (!item) return;
                showCustomModal({ id: productId, ...item });
            });
        } else {
            showCustomModal(customItem);
        }
    } else {
        // Find the product
        database.ref(`products/${productId}`).once('value', (snapshot) => {
            const product = snapshot.val();
            if (!product) return;
            currentModalProduct = { id: productId, ...product };
            modalQuantity = 1;
            // Populate modal
            const image = product.image || '🰰';
            let imageHTML;
            if (image.startsWith('http://') || image.startsWith('https://')) {
                imageHTML = `<img src="${image}" alt="${product.name}" onclick="openImageLightbox('${image.replace(/'/g, "\\'")}', '${product.name.replace(/'/g, "\\'")}')">`;
            } else {
                imageHTML = image;
            }
            document.getElementById('productModalImage').innerHTML = imageHTML;
            document.getElementById('productModalName').textContent = product.name;
            document.getElementById('productModalPrice').textContent = `₱${parseFloat(product.price).toFixed(2)}`;
            document.getElementById('productModalCategory').textContent = (product.category || '').toUpperCase();
            document.getElementById('productModalDescription').textContent = product.description || 'No description available.';
            document.getElementById('modalQuantity').textContent = modalQuantity;
            openModal('productModal');
        });
    }
}

// Show modal for custom item
function showCustomModal(item) {
    currentModalProduct = { id: item.id, ...item, category: 'custom' };
    modalQuantity = 1;
    // Populate modal (reuse product modal)
    const image = item.image || '🰰';
    let imageHTML;
    if (image.startsWith('http://') || image.startsWith('https://')) {
        imageHTML = `<img src="${image}" alt="${item.name}" onclick="openImageLightbox('${image.replace(/'/g, "\\'")}', '${item.name.replace(/'/g, "\\'")}')">`;
    } else {
        imageHTML = image;
    }
    document.getElementById('productModalImage').innerHTML = imageHTML;
    document.getElementById('productModalName').textContent = item.name;
    document.getElementById('productModalPrice').textContent = '';
    document.getElementById('productModalCategory').textContent = 'CUSTOM';
    document.getElementById('productModalDescription').textContent = item.description || 'No description available.';
    // Remove quantity controls for custom orders
    const quantitySection = document.querySelector('.product-modal-quantity');
    if (quantitySection) {
        quantitySection.style.display = 'none';
    }
    // Hide price row if present
    if (document.getElementById('productModalPrice')) {
        document.getElementById('productModalPrice').style.display = 'none';
    }
    openModal('productModal');
}

// Image Lightbox - View full size image
function openImageLightbox(imageUrl, productName) {
    const lightbox = document.createElement('div');
    lightbox.id = 'imageLightbox';
    lightbox.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        cursor: zoom-out;
        animation: fadeIn 0.3s ease;
    `;
    
    lightbox.innerHTML = `
        <div style="position: relative; max-width: 95vw; max-height: 95vh; display: flex; flex-direction: column; align-items: center; gap: 1rem;">
            <button onclick="closeImageLightbox()" style="
                position: absolute;
                top: 30px;
                right: 30px;
                background: white;
                border: none;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                font-size: 1.5rem;
                cursor: pointer;
                color: var(--brown);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                transition: all 0.3s;
                z-index: 10;
            " onmouseover="this.style.background='var(--brown)'; this.style.color='white'; this.style.transform='rotate(90deg) scale(1.1)';" onmouseout="this.style.background='white'; this.style.color='var(--brown)'; this.style.transform='rotate(0) scale(1)';">✕</button>
            
            <img src="${imageUrl}" alt="${productName}" style="
                max-width: 100%;
                max-height: calc(95vh - 80px);
                object-fit: contain;
                border-radius: 12px;
                box-shadow: 0 25px 80px rgba(0,0,0,0.5);
                animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                cursor: default;
            " onclick="event.stopPropagation();">
            
            <div style="
                background: rgba(255, 255, 255, 0.95);
                padding: 1rem 2rem;
                border-radius: 25px;
                color: var(--brown);
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                text-align: center;
                font-family: 'Georgia', serif;
            ">${productName}</div>
        </div>
    `;
    
    // Add animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes zoomIn {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(lightbox);
    
    // Close on background click
    lightbox.addEventListener('click', closeImageLightbox);
    
    // Close on ESC key
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeImageLightbox();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

function closeImageLightbox() {
    const lightbox = document.getElementById('imageLightbox');
    if (lightbox) {
        lightbox.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => lightbox.remove(), 200);
    }
}

function changeModalQuantity(change) {
    modalQuantity += change;
    if (modalQuantity < 1) modalQuantity = 1;
    if (modalQuantity > 99) modalQuantity = 99;
    document.getElementById('modalQuantity').textContent = modalQuantity;
}

function addToCartFromModal() {
    if (!currentModalProduct) return;
    let cartId = currentModalProduct.category === 'custom' ? `custom-${currentModalProduct.id}` : currentModalProduct.id;
    const existingItem = cart.find(item => item.cartId === cartId);
    if (existingItem) {
        existingItem.quantity += modalQuantity;
    } else {
        cart.push({ 
            cartId: cartId,
            name: currentModalProduct.name, 
            price: currentModalProduct.price, 
            quantity: modalQuantity,
            category: currentModalProduct.category
        });
    }
    updateCartCount();
    showNotification(`${modalQuantity}x ${currentModalProduct.name} added to cart!`);
    closeModal('productModal');
    modalQuantity = 1;
}
// Add Ctrl key detection for secret links
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey) document.body.classList.add('ctrl-pressed');
});

document.addEventListener('keyup', function(e) {
    if (!e.ctrlKey) document.body.classList.remove('ctrl-pressed');
});
// ===== DOUBLE-TAP EASTER EGG FOR "FILIPINO" WORD =====
document.addEventListener('DOMContentLoaded', function() {
    const secretWords = document.querySelectorAll('.secret-word');
    let lastTapTime = 0;
    let lastTappedElement = null;
    
    secretWords.forEach(word => {
        word.addEventListener('click', function(e) {
            const currentTime = new Date().getTime();
            const timeSinceLastTap = currentTime - lastTapTime;
            
            // Check if it's the same element and within 500ms (double-tap)
            if (this === lastTappedElement && timeSinceLastTap < 500) {
                // Double-tap detected!
                const url = this.getAttribute('data-href');
                if (url) {
                    window.location.href = url;
                }
                e.preventDefault();
                return false;
            }
            
            lastTappedElement = this;
            lastTapTime = currentTime;
            
            // Single tap - allow text selection (do nothing)
            return true;
        });
        
        // Prevent text selection on rapid clicks
        word.addEventListener('mousedown', function(e) {
            if (e.detail > 1) { // More than 1 click quickly
                e.preventDefault();
            }
        });
    });
});