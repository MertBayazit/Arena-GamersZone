import { login, loginAsGuest } from '../auth';

export const loginScreen = {
  render: async (container) => {
    container.innerHTML = `
      <div class="auth-container">
        <div class="glass-card auth-card">
          <div class="auth-header">
            <h1 class="auth-logo text-gradient">ARENA</h1>
            <p class="auth-subtitle">GamersZone Bilgi Yarışması Dünyası</p>
          </div>

          <div id="error-alert" class="alert alert-error" style="display: none;"></div>

          <form id="login-form">
            <div class="form-group">
              <label class="form-label" for="login-identifier">E-POSTA VEYA KULLANICI ADI</label>
              <input 
                class="form-input" 
                type="text" 
                id="login-identifier" 
                placeholder="ornek@email.com veya kullanıcı adı"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="login-password">ŞİFRE</label>
              <input 
                class="form-input" 
                type="password" 
                id="login-password" 
                placeholder="••••••"
                required
              />
            </div>

            <div class="remember-forgot">
              <label class="checkbox-label">
                <input type="checkbox" id="remember-me" />
                <span>Beni Hatırla</span>
              </label>
            </div>

            <button type="submit" id="submit-btn" class="btn btn-primary" style="width: 100%; margin-bottom: var(--spacing-sm);">
              GİRİŞ YAP
            </button>
          </form>

          <div class="auth-divider">VEYA</div>

          <button id="google-login-btn" class="btn btn-google" style="margin-bottom: var(--spacing-md);">
            <svg viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Google ile Giriş Yap
          </button>

          <div class="auth-divider">VEYA</div>

          <div style="display: flex; flex-direction: column; gap: 8px; background: rgba(255,255,255,0.02); padding: 12px; border-radius: var(--radius-md); border: 1px dashed var(--color-border);">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.65rem;">KAYITSIZ MİSAFİR GİRİŞİ</label>
              <input 
                class="form-input" 
                type="text" 
                id="guest-username" 
                placeholder="Takma adınızı girin..."
                minlength="2"
                maxlength="20"
              />
            </div>
            <button id="guest-login-btn" class="btn btn-secondary" style="width: 100%; padding: 0.6rem; font-size: 0.8rem;">
              👤 MİSAFİR OLARAK DEVAM ET
            </button>
          </div>

          <div class="auth-footer" style="margin-top: var(--spacing-md);">
            Hesabınız yok mu? <a href="#register" class="auth-link">Kayıt Olun</a>
          </div>
        </div>
      </div>
    `;

    const form = document.getElementById('login-form');
    const submitBtn = document.getElementById('submit-btn');
    const errorAlert = document.getElementById('error-alert');
    const googleBtn = document.getElementById('google-login-btn');
    const guestBtn = document.getElementById('guest-login-btn');
    const guestInput = document.getElementById('guest-username');

    // Handle form submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const loginIdentifier = document.getElementById('login-identifier').value;
      const password = document.getElementById('login-password').value;
      const rememberMe = document.getElementById('remember-me').checked;

      errorAlert.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.innerText = 'GİRİŞ YAPILIYOR...';

      try {
        await login(loginIdentifier, password, rememberMe);
        window.location.hash = '#dashboard';
      } catch (err) {
        errorAlert.innerText = err.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.';
        errorAlert.style.display = 'flex';
        submitBtn.disabled = false;
        submitBtn.innerText = 'GİRİŞ YAP';
      }
    });

    // Handle Google Login Click
    googleBtn.addEventListener('click', () => {
      window.location.href = '/api/auth/google';
    });

    // Handle Guest Login Click
    guestBtn.addEventListener('click', () => {
      const username = guestInput.value.trim();
      if (!username) {
        errorAlert.innerText = 'Lütfen misafir olarak görünmesini istediğiniz takma adı girin.';
        errorAlert.style.display = 'flex';
        return;
      }
      if (username.length < 2) {
        errorAlert.innerText = 'Takma ad en az 2 karakter olmalıdır.';
        errorAlert.style.display = 'flex';
        return;
      }

      loginAsGuest(username);
      window.location.hash = '#dashboard';
    });
  },
  destroy: () => {}
};

export default loginScreen;
