// ============= DARK MODE THEME MANAGER =============
// Manages light/dark mode toggle with persistent user preference

const THEME_CONFIG = {
    STORAGE_KEY: 'dreamdough_theme_preference',
    LIGHT_THEME: 'light',
    DARK_THEME: 'dark',
    AUTO_THEME: 'auto'
};

let currentTheme = THEME_CONFIG.LIGHT_THEME;

// ============= INITIALIZE THEME SYSTEM =============
function initializeThemeSystem() {
    console.log('🎨 Initializing Theme Manager...');
    
    // Load saved theme preference
    const savedTheme = localStorage.getItem(THEME_CONFIG.STORAGE_KEY);
    
    if (savedTheme) {
        currentTheme = savedTheme;
    } else {
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            currentTheme = THEME_CONFIG.DARK_THEME;
        } else {
            currentTheme = THEME_CONFIG.LIGHT_THEME;
        }
    }
    
    applyTheme(currentTheme);
    setupThemeToggle();
    
    // Listen for system theme changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (localStorage.getItem(THEME_CONFIG.STORAGE_KEY) === null) {
                applyTheme(e.matches ? THEME_CONFIG.DARK_THEME : THEME_CONFIG.LIGHT_THEME);
            }
        });
    }
}

// ============= APPLY THEME =============
function applyTheme(theme) {
    const root = document.documentElement;
    
    if (theme === THEME_CONFIG.DARK_THEME) {
        root.setAttribute('data-theme', 'dark');
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        currentTheme = THEME_CONFIG.DARK_THEME;
    } else {
        root.setAttribute('data-theme', 'light');
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
        currentTheme = THEME_CONFIG.LIGHT_THEME;
    }
    
    // Update toggle button if it exists
    updateThemeToggleButton();
    
    // Save preference
    localStorage.setItem(THEME_CONFIG.STORAGE_KEY, theme);
    
    console.log('✅ Theme applied:', theme);
}

// ============= SETUP THEME TOGGLE =============
function setupThemeToggle() {
    const toggleBtn = document.getElementById('themeToggleBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleTheme);
    }
}

// ============= TOGGLE THEME =============
function toggleTheme() {
    const newTheme = currentTheme === THEME_CONFIG.LIGHT_THEME 
        ? THEME_CONFIG.DARK_THEME 
        : THEME_CONFIG.LIGHT_THEME;
    
    applyTheme(newTheme);
    showToast(`🌙 Switched to ${newTheme === THEME_CONFIG.DARK_THEME ? 'Dark' : 'Light'} Mode`);
}

// ============= UPDATE TOGGLE BUTTON =============
function updateThemeToggleButton() {
    const toggleBtn = document.getElementById('themeToggleBtn');
    if (toggleBtn) {
        if (currentTheme === THEME_CONFIG.DARK_THEME) {
            toggleBtn.innerHTML = '☀️';
            toggleBtn.title = 'Switch to Light Mode';
            toggleBtn.classList.add('dark-mode-active');
        } else {
            toggleBtn.innerHTML = '🌙';
            toggleBtn.title = 'Switch to Dark Mode';
            toggleBtn.classList.remove('dark-mode-active');
        }
    }
}

// ============= GET CURRENT THEME =============
function getCurrentTheme() {
    return currentTheme;
}

// ============= INITIALIZE ON PAGE LOAD =============
document.addEventListener('DOMContentLoaded', () => {
    initializeThemeSystem();
});
