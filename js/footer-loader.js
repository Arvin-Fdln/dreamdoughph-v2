// Firebase Footer Loader - Universal Script for All Pages
// ENHANCED VERSION WITH DEBUGGING

console.log('🔄 Footer loader script starting...');

// Wait for Firebase to be available
function initializeFooterLoader() {
    console.log('🔍 Checking Firebase availability...');
    
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase is not loaded! Make sure Firebase scripts are included.');
        return;
    }
    
    console.log('✅ Firebase object found');
    
    // Initialize Firebase if not already initialized
    if (!firebase.apps || firebase.apps.length === 0) {
        console.log('🔧 Initializing Firebase...');
        const firebaseConfig = {
            apiKey: "AIzaSyDiU0cygrN9zB3LiWaud-zeX4elFOKF408",
            authDomain: "dreamdoughph-88e46.firebaseapp.com",
            databaseURL: "https://dreamdoughph-88e46-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "dreamdoughph-88e46",
            storageBucket: "dreamdoughph-88e46.firebasestorage.app",
            messagingSenderId: "114077781038",
            appId: "1:114077781038:web:bc9d5bce890bbcb022e3bf",
            measurementId: "G-DSQJGHRNXZ"
        };
        
        try {
            firebase.initializeApp(firebaseConfig);
            console.log("✅ Firebase initialized successfully!");
        } catch (error) {
            console.error('❌ Firebase initialization error:', error);
            return;
        }
    } else {
        console.log('✅ Firebase already initialized');
    }

    const database = firebase.database();
    console.log('✅ Database reference obtained');
    
    // Load all footer data
    loadFooterData(database);
}

// Load footer data from Firebase
function loadFooterData(database) {
    console.log('📦 Loading footer data...');
    
    // Check if footer elements exist
    const phoneEl = document.getElementById('footerPhone');
    const emailEl = document.getElementById('footerEmail');
    const addressEl = document.getElementById('footerAddress');
    const socialContainer = document.querySelector('.social-links');
    
    console.log('🔍 Footer elements found:', {
        phone: !!phoneEl,
        email: !!emailEl,
        address: !!addressEl,
        social: !!socialContainer
    });
    
    // Load business settings
    console.log('📞 Loading business settings...');
    database.ref('settings/business').once('value')
        .then((snapshot) => {
            console.log('📞 Business settings received:', snapshot.exists());
            const settings = snapshot.val();
            console.log('📞 Business data:', settings);
            
            if (settings) {
                if (phoneEl && settings.businessPhone) {
                    phoneEl.textContent = `📞 ${settings.businessPhone}`;
                    phoneEl.style.color = '#ccc';
                    console.log('✅ Phone updated');
                }
                if (emailEl && settings.businessEmail) {
                    emailEl.textContent = `📧 ${settings.businessEmail}`;
                    emailEl.style.color = '#ccc';
                    console.log('✅ Email updated');
                }
                if (addressEl && settings.businessAddress) {
                    addressEl.textContent = `📍 ${settings.businessAddress}`;
                    addressEl.style.color = '#ccc';
                    console.log('✅ Address updated');
                }
            } else {
                console.warn('⚠️ No business settings found in database');
            }
        })
        .catch(error => {
            console.error('❌ Error loading business settings:', error);
        });

    // Load store hours
    loadStoreHours(database);
    
    // Load social media links
    loadSocialLinks(database);
}

// Load store hours from Firebase
function loadStoreHours(database) {
    console.log('🕐 Loading store hours...');
    
    database.ref('settings/storeHours').once('value')
        .then((snapshot) => {
            console.log('🕐 Store hours received:', snapshot.exists());
            
            const addressEl = document.getElementById('footerAddress');
            if (!addressEl) {
                console.warn('⚠️ footerAddress element not found');
                return;
            }
            
            const hoursContainer = addressEl.parentElement;
            if (!hoursContainer) {
                console.warn('⚠️ Hours container not found');
                return;
            }
            
            // Remove old hours if they exist
            const oldHours = hoursContainer.querySelectorAll('p[data-hours]');
            oldHours.forEach(el => el.remove());
            
            if (!snapshot.exists() || !snapshot.val()) {
                console.log('ℹ️ No store hours in database, using default');
                // Default hours if none set
                const defaultHours = document.createElement('p');
                defaultHours.setAttribute('data-hours', 'true');
                defaultHours.style.marginTop = '1rem';
                defaultHours.style.paddingTop = '1rem';
                defaultHours.style.borderTop = '1px solid rgba(255,255,255,0.2)';
                defaultHours.style.color = '#ccc';
                defaultHours.style.marginBottom = '0.8rem';
                defaultHours.textContent = '🕐 Mon-Sat: 8AM - 10PM';
                hoursContainer.appendChild(defaultHours);
                return;
            }

            const hoursText = snapshot.val();
            console.log('🕐 Hours text:', hoursText);
            const hoursLines = hoursText.split('\n').filter(line => line.trim());
            
            // Add separator before hours
            if (hoursLines.length > 0) {
                const separator = document.createElement('div');
                separator.style.marginTop = '1rem';
                separator.style.paddingTop = '1rem';
                separator.style.borderTop = '1px solid rgba(255,255,255,0.2)';
                hoursContainer.appendChild(separator);
                
                hoursLines.forEach(line => {
                    const hoursEl = document.createElement('p');
                    hoursEl.setAttribute('data-hours', 'true');
                    hoursEl.textContent = `🕐 ${line.trim()}`;
                    hoursEl.style.color = '#ccc';
                    hoursEl.style.marginBottom = '0.8rem';
                    hoursContainer.appendChild(hoursEl);
                });
                console.log('✅ Store hours updated');
            }
        })
        .catch(error => {
            console.error('❌ Error loading store hours:', error);
        });
}

// Load social media links from Firebase
function loadSocialLinks(database) {
    console.log('📱 Loading social links...');
    
    database.ref('settings/socialLinks').once('value')
        .then((snapshot) => {
            console.log('📱 Social links received:', snapshot.exists());
            
            const socialContainer = document.querySelector('.social-links');
            if (!socialContainer) {
                console.warn('⚠️ Social links container not found');
                return;
            }
            
            socialContainer.innerHTML = ''; // Clear existing links
            
            if (!snapshot.exists() || snapshot.numChildren() === 0) {
                console.log('ℹ️ No social links in database, using default');
                // Default placeholder if no links
                const placeholder = document.createElement('p');
                placeholder.style.color = '#eebc46';
                placeholder.style.fontSize = '0.9rem';
                placeholder.textContent = 'Follow us on social media!';
                socialContainer.appendChild(placeholder);
                return;
            }

            const iconMap = {
                Facebook: { icon: '📘', color: '#1877F2', text: 'Facebook' },
                Instagram: { icon: '📷', color: '#E4405F', text: 'Instagram' },
                Twitter: { icon: '🐦', color: '#1DA1F2', text: 'Twitter' },
                TikTok: { icon: '🎵', color: '#000000', text: 'TikTok' },
                YouTube: { icon: '📺', color: '#FF0000', text: 'YouTube' },
                LinkedIn: { icon: '💼', color: '#0A66C2', text: 'LinkedIn' }
            };

            let linkCount = 0;
            snapshot.forEach((childSnapshot) => {
                const platform = childSnapshot.key;
                const url = childSnapshot.val();
                const iconData = iconMap[platform] || { icon: '🌐', color: '#8D6E63', text: platform };
                
                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.title = platform;
                link.textContent = `${iconData.icon} ${iconData.text}`;
                link.style.color = '#ccc';
                link.style.marginBottom = '0.8rem';
                link.style.display = 'block';
                link.style.textDecoration = 'none';
                link.style.transition = 'color 0.3s';
                
                link.addEventListener('mouseenter', () => {
                    link.style.color = '#eebc46';
                });
                link.addEventListener('mouseleave', () => {
                    link.style.color = '#ccc';
                });
                
                socialContainer.appendChild(link);
                linkCount++;
            });
            
            console.log(`✅ Social links updated (${linkCount} links)`);
        })
        .catch(error => {
            console.error('❌ Error loading social links:', error);
        });
}

// Mobile menu toggle function (if not already defined)
if (typeof toggleMenu !== 'function') {
    window.toggleMenu = function() {
        const navLinks = document.getElementById('navLinks');
        if (navLinks) {
            navLinks.classList.toggle('active');
        }
    };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFooterLoader);
} else {
    initializeFooterLoader();
}

console.log('✅ Footer loader script loaded!');