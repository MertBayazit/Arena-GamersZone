import { register } from '../auth';

export const registerScreen = {
  render: async (container) => {
    container.innerHTML = `
      <div class="auth-container">
        <div class="glass-card auth-card">
          <div class="auth-header">
            <h1 class="auth-logo text-gradient">ARENA</h1>
            <p class="auth-subtitle">GamersZone Yarışmasına Katılın</p>
          </div>

          <div id="error-alert" class="alert alert-error" style="display: none;"></div>

          <form id="register-form">
            <div class="form-group">
              <label class="form-label" for="reg-username">KULLANICI ADI</label>
              <input 
                class="form-input" 
                type="text" 
                id="reg-username" 
                placeholder="oyuncu123"
                required
                minlength="3"
                maxlength="30"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-email">E-POSTA ADRESİ</label>
              <input 
                class="form-input" 
                type="email" 
                id="reg-email" 
                placeholder="ornek@email.com"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-password">ŞİFRE</label>
              <input 
                class="form-input" 
                type="password" 
                id="reg-password" 
                placeholder="••••••"
                required
                minlength="6"
              />
            </div>

            <button type="submit" id="submit-btn" class="btn btn-primary" style="width: 100%; margin-bottom: var(--spacing-sm);">
              KAYIT OL
            </button>
          </form>

          <div class="auth-divider">VEYA</div>

          <button id="google-register-btn" class="btn btn-google">
            <svg viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Google ile Kayıt Ol
          </button>

          <div class="auth-footer">
            Zaten hesabınız var mı? <a href="#login" class="auth-link">Giriş Yapın</a>
          </div>
        </div>
      </div>
    `;

    const form = document.getElementById('register-form');
    const submitBtn = document.getElementById('submit-btn');
    const errorAlert = document.getElementById('error-alert');
    const googleBtn = document.getElementById('google-register-btn');

    // Handle form submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('reg-username').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;

      errorAlert.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.innerText = 'KAYIT YAPILIYOR...';

      try {
        await register(username, email, password);
        window.location.hash = '#dashboard';
      } catch (err) {
        errorAlert.innerText = err.message || 'Kayıt başarısız oldu. Girdilerinizi kontrol edin.';
        errorAlert.style.display = 'flex';
        submitBtn.disabled = false;
        submitBtn.innerText = 'KAYIT OL';
      }
    });

    // Handle Google Login Click
    googleBtn.addEventListener('click', () => {
      window.location.href = '/api/auth/google';
    });
  },
  destroy: () => {}
};

export default registerScreen;
