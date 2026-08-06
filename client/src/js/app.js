import { getMe } from './auth';

// Simple Hash-Based Router for Vanilla JS SPA
class Router {
  constructor() {
    this.routes = {};
    this.currentScreen = null;
    this.container = document.getElementById('app');

    // Handle hash change
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  // Register a route
  addRoute(hash, screenModule) {
    this.routes[hash] = screenModule;
  }

  // Initialize router
  async init() {
    // Check if user is logged in
    await getMe();
    
    // Redirect to default route if no hash
    if (!window.location.hash) {
      window.location.hash = '#login';
    } else {
      this.handleRoute();
    }
  }

  // Navigate to hash programmatically
  navigate(hash) {
    window.location.hash = hash;
  }

  // Handle routing logic
  async handleRoute() {
    const fullHash = window.location.hash || '#login';
    
    // Split hash and query parameters (e.g. #lobby?code=123456)
    const [hash, queryString] = fullHash.split('?');
    const queryParams = {};
    
    if (queryString) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        queryParams[key] = decodeURIComponent(value);
      });
    }

    const token = localStorage.getItem('token');
    const isAuthRoute = hash === '#login' || hash === '#register';

    // 1. Authentication Guards
    if (!token && !isAuthRoute) {
      // Redirect to login if not authenticated
      this.navigate('#login');
      return;
    }

    if (token && isAuthRoute) {
      // Redirect to dashboard if already authenticated
      this.navigate('#dashboard');
      return;
    }

    // 2. Destroy the active screen if it has cleanup logic
    if (this.currentScreen && typeof this.currentScreen.destroy === 'function') {
      this.currentScreen.destroy();
    }

    // 3. Load the corresponding screen module
    const screen = this.routes[hash];
    
    if (screen) {
      this.currentScreen = screen;
      this.container.innerHTML = ''; // Clear container
      
      try {
        await screen.render(this.container, queryParams);
      } catch (err) {
        console.error(`Error rendering screen ${hash}:`, err);
        this.container.innerHTML = `
          <div class="error-screen">
            <h2>Hata Oluştu 😢</h2>
            <p>Ekran yüklenirken bir sorun oluştu.</p>
            <button onclick="window.location.hash='#dashboard'">Ana Sayfaya Dön</button>
          </div>
        `;
      }
    } else {
      // Route not found
      this.container.innerHTML = `
        <div class="error-screen">
          <h2>404 - Sayfa Bulunamadı 🔍</h2>
          <p>Ulaşmaya çalıştığınız sayfa mevcut değil.</p>
          <button onclick="window.location.hash='#dashboard'">Ana Sayfaya Dön</button>
        </div>
      `;
    }
  }
}

export const router = new Router();
export default router;
