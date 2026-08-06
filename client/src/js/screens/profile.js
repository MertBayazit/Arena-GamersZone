import { apiCall } from '../api';
import { currentUser, getMe } from '../auth';
import { getAvatarSVG, getAvatarList } from '../ui/avatars';

export const profileScreen = {
  render: async (container) => {
    // Refresh user state
    await getMe();

    if (!currentUser) {
      window.location.hash = '#login';
      return;
    }

    let selectedAvatar = currentUser.avatar?.value || 'avatar_01';

    container.innerHTML = `
      <div class="container" style="padding-top: var(--spacing-lg); padding-bottom: var(--spacing-lg);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
          <h1 class="text-gradient" style="font-family: var(--font-heading); font-size: 1.8rem;">PROFİL AYARLARI</h1>
          <button class="btn btn-secondary" onclick="window.location.hash='#dashboard'">GERİ DÖN</button>
        </div>

        <div id="status-alert" class="alert" style="display: none;"></div>

        <div style="display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); align-items: start;">
          <!-- 1. Stats and Avatar Selection -->
          <div style="display: grid; grid-template-columns: 1fr; gap: var(--spacing-md); md:grid-template-columns: 1fr 2fr;">
            <div class="glass-card" style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: var(--spacing-md);">
              <div id="current-avatar-preview">
                ${getAvatarSVG(selectedAvatar, 120)}
              </div>
              <h2 style="font-family: var(--font-heading); font-size: 1.2rem;">${currentUser.username}</h2>
              <p style="color: var(--color-text-muted); font-size: 0.85rem;">${currentUser.email}</p>
              
              <div style="display: flex; gap: var(--spacing-md); margin-top: var(--spacing-sm); border-top: 1px solid var(--color-border); width: 100%; padding-top: var(--spacing-md); justify-content: space-around;">
                <div>
                  <div style="font-family: var(--font-number); font-size: 1.2rem; color: var(--color-accent-blue);">${currentUser.stats?.gamesPlayed || 0}</div>
                  <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Oyun</div>
                </div>
                <div>
                  <div style="font-family: var(--font-number); font-size: 1.2rem; color: var(--color-success);">${currentUser.stats?.wins || 0}</div>
                  <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Kazanma</div>
                </div>
                <div>
                  <div style="font-family: var(--font-number); font-size: 1.2rem; color: var(--color-error);">${currentUser.stats?.losses || 0}</div>
                  <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Kaybetme</div>
                </div>
              </div>
            </div>

            <!-- Profile Settings Form -->
            <div class="glass-card">
              <form id="profile-form">
                <h3 style="font-family: var(--font-heading); font-size: 1.1rem; margin-bottom: var(--spacing-md); border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem; letter-spacing: 1px;">KULLANICI BİLGİLERİ</h3>
                
                <div class="form-group">
                  <label class="form-label" for="profile-username">KULLANICI ADI</label>
                  <input 
                    class="form-input" 
                    type="text" 
                    id="profile-username" 
                    value="${currentUser.username}" 
                    required
                    minlength="3"
                    maxlength="30"
                  />
                </div>

                <div class="form-group" style="margin-bottom: var(--spacing-lg);">
                  <label class="form-label">AVATAR SEÇİN</label>
                  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 5px;">
                    ${getAvatarList().map(avatar => `
                      <div 
                        class="avatar-option ${avatar.key === selectedAvatar ? 'selected' : ''}" 
                        data-avatar-key="${avatar.key}"
                        style="border: 2px solid ${avatar.key === selectedAvatar ? 'var(--color-accent-blue)' : 'var(--color-border)'}; border-radius: var(--radius-md); padding: 8px; cursor: pointer; text-align: center; background: rgba(255,255,255,0.02); transition: all var(--transition-fast);"
                      >
                        ${getAvatarSVG(avatar.key, 48)}
                        <div style="font-size: 0.7rem; color: var(--color-text-muted); margin-top: 4px;">${avatar.name}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>

                <h3 style="font-family: var(--font-heading); font-size: 1.1rem; margin-bottom: var(--spacing-md); border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem; letter-spacing: 1px; margin-top: var(--spacing-lg);">ŞİFRE DEĞİŞTİR (İSTEĞE BAĞLI)</h3>
                
                <div class="form-group">
                  <label class="form-label" for="profile-password">YENİ ŞİFRE</label>
                  <input 
                    class="form-input" 
                    type="password" 
                    id="profile-password" 
                    placeholder="Değiştirmek istemiyorsanız boş bırakın"
                    minlength="6"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="profile-password-confirm">YENİ ŞİFRE TEKRAR</label>
                  <input 
                    class="form-input" 
                    type="password" 
                    id="profile-password-confirm" 
                    placeholder="Yeni şifreyi onaylayın"
                  />
                </div>

                <h3 style="font-family: var(--font-heading); font-size: 1.1rem; margin-bottom: var(--spacing-md); border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem; letter-spacing: 1px; margin-top: var(--spacing-lg);">BAĞLI HESAPLAR</h3>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: rgba(255,255,255,0.02); border-radius: var(--radius-md); border: 1px solid var(--color-border); margin-bottom: var(--spacing-lg);">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <svg viewBox="0 0 24 24" style="width: 20px; height: 20px;">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Google Hesabı</span>
                  </div>
                  <div>
                    ${currentUser.googleId 
                      ? `<button type="button" id="unlink-google-btn" class="btn btn-danger" style="padding: 0.5rem 1rem; font-size: 0.75rem;">BAĞLANTIYI KOPAR</button>`
                      : `<button type="button" id="link-google-btn" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.75rem;">HESABI BAĞLA</button>`
                    }
                  </div>
                </div>

                <button type="submit" id="save-btn" class="btn btn-primary" style="width: 100%;">
                  AYARLARI KAYDET
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    const form = document.getElementById('profile-form');
    const saveBtn = document.getElementById('save-btn');
    const statusAlert = document.getElementById('status-alert');
    const currentAvatarPreview = document.getElementById('current-avatar-preview');
    const avatarOptions = document.querySelectorAll('.avatar-option');
    const unlinkGoogleBtn = document.getElementById('unlink-google-btn');
    const linkGoogleBtn = document.getElementById('link-google-btn');

    // Handle avatar option selection in UI
    avatarOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Remove selection from previous
        avatarOptions.forEach(opt => {
          opt.classList.remove('selected');
          opt.style.borderColor = 'var(--color-border)';
        });

        // Add selection to current
        option.classList.add('selected');
        option.style.borderColor = 'var(--color-accent-blue)';
        
        // Update selected key and preview
        selectedAvatar = option.dataset.avatarKey;
        currentAvatarPreview.innerHTML = getAvatarSVG(selectedAvatar, 120);
      });
    });

    // Save profile changes
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('profile-username').value;
      const password = document.getElementById('profile-password').value;
      const passwordConfirm = document.getElementById('profile-password-confirm').value;

      statusAlert.style.display = 'none';

      // Password checks
      if (password && password !== passwordConfirm) {
        statusAlert.innerText = 'Şifreler eşleşmiyor!';
        statusAlert.className = 'alert alert-error';
        statusAlert.style.display = 'flex';
        return;
      }

      saveBtn.disabled = true;
      saveBtn.innerText = 'KAYDEDİLİYOR...';

      try {
        const body = {
          username,
          avatar: {
            type: 'preset',
            value: selectedAvatar
          }
        };

        if (password) {
          body.password = password;
        }

        const data = await apiCall('/auth/profile', 'PUT', body);
        localStorage.setItem('token', data.token); // Save new token
        
        statusAlert.innerText = 'Profil başarıyla güncellendi! ✅';
        statusAlert.className = 'alert alert-success';
        statusAlert.style.display = 'flex';

        // Clear password fields
        document.getElementById('profile-password').value = '';
        document.getElementById('profile-password-confirm').value = '';
        
        // Refresh me data
        await getMe();
      } catch (err) {
        statusAlert.innerText = err.message || 'Profil güncellenemedi.';
        statusAlert.className = 'alert alert-error';
        statusAlert.style.display = 'flex';
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = 'AYARLARI KAYDET';
      }
    });

    // Link/Unlink Google handlers
    if (unlinkGoogleBtn) {
      unlinkGoogleBtn.addEventListener('click', async () => {
        if (!confirm('Google hesabınızın bağlantısını kesmek istediğinize emin misiniz?')) return;
        try {
          await apiCall('/auth/unlink-google', 'POST');
          window.location.reload();
        } catch (err) {
          alert(err.message || 'Google hesabı bağlantısı koparılamadı.');
        }
      });
    }

    if (linkGoogleBtn) {
      linkGoogleBtn.addEventListener('click', () => {
        // To link, redirect to google login. Passport checks if email matches and links automatically
        window.location.href = '/api/auth/google';
      });
    }
  },
  destroy: () => {}
};

export default profileScreen;
