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
    let selectedAvatarType = currentUser.avatar?.type || 'preset';

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
                        class="avatar-option ${selectedAvatarType === 'preset' && avatar.key === selectedAvatar ? 'selected' : ''}" 
                        data-avatar-key="${avatar.key}"
                        style="border: 2px solid ${selectedAvatarType === 'preset' && avatar.key === selectedAvatar ? 'var(--color-accent-blue)' : 'var(--color-border)'}; border-radius: var(--radius-md); padding: 8px; cursor: pointer; text-align: center; background: rgba(255,255,255,0.02); transition: all var(--transition-fast);"
                      >
                        ${getAvatarSVG(avatar.key, 48)}
                        <div style="font-size: 0.7rem; color: var(--color-text-muted); margin-top: 4px;">${avatar.name}</div>
                      </div>
                    `).join('')}
                  </div>

                  <!-- Custom File Upload Option -->
                  <div style="margin-top: 15px; border-top: 1px dashed var(--color-border); padding-top: 15px;">
                    <label class="form-label" style="font-size: 0.75rem; display: block; margin-bottom: 8px;">Veya Kendi Resminizi Yükleyin 🖼️</label>
                    <div style="display: flex; gap: 10px; align-items: center;">
                      <input type="file" id="avatar-file-input" accept="image/*" style="display: none;" />
                      <button type="button" id="btn-trigger-avatar-upload" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.75rem;">Fotoğraf Seç</button>
                      <span id="avatar-upload-filename" style="font-size: 0.75rem; color: var(--color-text-muted); font-style: italic;">
                        ${selectedAvatarType === 'custom' ? 'Özel resim yüklendi' : 'Dosya seçilmedi'}
                      </span>
                    </div>
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
        selectedAvatarType = 'preset';
        document.getElementById('avatar-upload-filename').innerText = 'Dosya seçilmedi';
        currentAvatarPreview.innerHTML = getAvatarSVG(selectedAvatar, 120);
      });
    });

    // Custom File Upload Trigger & Handler
    const fileInput = document.getElementById('avatar-file-input');
    const triggerUploadBtn = document.getElementById('btn-trigger-avatar-upload');
    const uploadFilename = document.getElementById('avatar-upload-filename');

    triggerUploadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      openCropModal(file, async (croppedBlob) => {
        uploadFilename.innerText = "kırpılmış_resim.jpg";

        // Upload the cropped blob as formData
        const formData = new FormData();
        formData.append('image', croppedBlob, 'avatar.jpg');

        statusAlert.style.display = 'none';
        saveBtn.disabled = true;
        saveBtn.innerText = 'DOSYA YÜKLENİYOR...';

        try {
          const res = await apiCall('/upload/image', 'POST', formData);
          selectedAvatar = res.url;
          selectedAvatarType = 'custom';

          // Deselect all presets
          avatarOptions.forEach(opt => {
            opt.classList.remove('selected');
            opt.style.borderColor = 'var(--color-border)';
          });

          // Update preview
          currentAvatarPreview.innerHTML = getAvatarSVG(selectedAvatar, 120);

          statusAlert.innerText = 'Fotoğraf kırpıldı ve yüklendi! Profilinizi kaydetmek için lütfen "AYARLARI KAYDET" butonuna basın.';
          statusAlert.className = 'alert alert-success';
          statusAlert.style.display = 'flex';
        } catch (err) {
          statusAlert.innerText = err.message || 'Görsel yüklenirken bir hata oluştu.';
          statusAlert.className = 'alert alert-error';
          statusAlert.style.display = 'flex';
          uploadFilename.innerText = 'Dosya seçilmedi';
        } finally {
          saveBtn.disabled = false;
          saveBtn.innerText = 'AYARLARI KAYDET';
        }
      }, () => {
        // Cancelled
        fileInput.value = '';
        uploadFilename.innerText = 'Dosya seçilmedi';
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
            type: selectedAvatarType,
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

// ─── Circular Image Cropper Modal (Vanilla JS) ───────────────────────
function openCropModal(file, onSave, onCancel) {
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  
  modalOverlay.innerHTML = `
    <div class="glass-card modal-content" style="max-width: 380px; display: flex; flex-direction: column; align-items: center; gap: 15px; padding: 20px;">
      <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 8px;">
        <h4 style="font-family: var(--font-heading); font-size: 0.95rem; margin: 0; letter-spacing: 0.5px; color: #ffffff;">FOTOĞRAFI AYARLA</h4>
        <button id="btn-close-crop" class="stage-item-btn" style="font-size: 1.2rem; cursor: pointer;">&times;</button>
      </div>

      <!-- Crop Viewport Wrapper -->
      <div style="position: relative; width: 260px; height: 260px; background: #080a14; border-radius: var(--radius-md); overflow: hidden; display: flex; align-items: center; justify-content: center; border: 1px solid var(--color-border);">
        <!-- Circular Crop Mask -->
        <div id="crop-viewport" style="position: absolute; width: 200px; height: 200px; border-radius: 50%; border: 2px solid var(--color-accent-purple); box-shadow: 0 0 0 9999px rgba(8, 10, 20, 0.75); overflow: hidden; cursor: move; z-index: 10;">
          <img id="crop-image" style="position: absolute; pointer-events: none; user-select: none; max-width: none; max-height: none;" />
        </div>
      </div>

      <!-- Zoom Range Slider -->
      <div style="width: 100%; display: flex; flex-direction: column; gap: 5px;">
        <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase;">
          <span>YAKINLAŞTIR</span>
          <span id="zoom-value">100%</span>
        </div>
        <input type="range" id="crop-zoom-slider" min="0.2" max="4" step="0.01" value="1" style="width: 100%; cursor: pointer;" />
      </div>

      <p style="font-size: 0.7rem; color: var(--color-text-muted); text-align: center; margin: 0;">
        Görseli sürükleyerek kaydırın, sürgüyle yakınlaştırın.
      </p>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 10px; width: 100%;">
        <button id="btn-crop-cancel" class="btn btn-secondary" style="flex: 1; padding: 0.6rem; font-size: 0.8rem;">İPTAL</button>
        <button id="btn-crop-confirm" class="btn btn-primary" style="flex: 1; padding: 0.6rem; font-size: 0.8rem; background: var(--color-accent-purple); box-shadow: var(--shadow-neon-purple);">UYGULA</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);
  setTimeout(() => modalOverlay.classList.add('active'), 10);

  const img = modalOverlay.querySelector('#crop-image');
  const viewport = modalOverlay.querySelector('#crop-viewport');
  const zoomSlider = modalOverlay.querySelector('#crop-zoom-slider');
  const zoomValueLabel = modalOverlay.querySelector('#zoom-value');
  const confirmBtn = modalOverlay.querySelector('#btn-crop-confirm');
  const cancelBtn = modalOverlay.querySelector('#btn-crop-cancel');
  const closeBtn = modalOverlay.querySelector('#btn-close-crop');

  let zoom = 1;
  let imgLeft = 0;
  let imgTop = 0;
  let baseWidth = 0;
  let baseHeight = 0;
  
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  // Load selected file
  const reader = new FileReader();
  reader.onload = (e) => {
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);

  img.onload = () => {
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    // Scale to cover 200x200 viewport fully
    if (naturalWidth > naturalHeight) {
      baseHeight = 200;
      baseWidth = 200 * (naturalWidth / naturalHeight);
    } else {
      baseWidth = 200;
      baseHeight = 200 * (naturalHeight / naturalWidth);
    }

    imgLeft = (200 - baseWidth) / 2;
    imgTop = (200 - baseHeight) / 2;

    updateImageStyle();
  };

  function updateImageStyle() {
    img.style.width = `${baseWidth * zoom}px`;
    img.style.height = `${baseHeight * zoom}px`;
    img.style.left = `${imgLeft}px`;
    img.style.top = `${imgTop}px`;
    zoomValueLabel.innerText = `${Math.round(zoom * 100)}%`;
  }

  // Mouse & Touch dragging
  const handleDragStart = (e) => {
    isDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startX = clientX - imgLeft;
    startY = clientY - imgTop;
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    imgLeft = clientX - startX;
    imgTop = clientY - startY;

    // Restrict positions dynamically (works for both zoom-in and zoom-out)
    const currentWidth = baseWidth * zoom;
    const currentHeight = baseHeight * zoom;
    const minLeft = Math.min(0, 200 - currentWidth);
    const maxLeft = Math.max(0, 200 - currentWidth);
    const minTop = Math.min(0, 200 - currentHeight);
    const maxTop = Math.max(0, 200 - currentHeight);

    imgLeft = Math.min(maxLeft, Math.max(minLeft, imgLeft));
    imgTop = Math.min(maxTop, Math.max(minTop, imgTop));

    updateImageStyle();
  };

  const handleDragEnd = () => {
    isDragging = false;
  };

  // Bind drag interactions
  viewport.addEventListener('mousedown', handleDragStart);
  window.addEventListener('mousemove', handleDragMove);
  window.addEventListener('mouseup', handleDragEnd);

  viewport.addEventListener('touchstart', handleDragStart, { passive: true });
  window.addEventListener('touchmove', handleDragMove, { passive: false });
  window.addEventListener('touchend', handleDragEnd);

  // Zoom Slider interactions
  zoomSlider.addEventListener('input', (e) => {
    const oldZoom = zoom;
    zoom = parseFloat(e.target.value);

    // Zoom relative to viewport center
    const zoomRatio = zoom / oldZoom;
    imgLeft = 100 - (100 - imgLeft) * zoomRatio;
    imgTop = 100 - (100 - imgTop) * zoomRatio;

    // Apply constraints
    const currentWidth = baseWidth * zoom;
    const currentHeight = baseHeight * zoom;
    const minLeft = Math.min(0, 200 - currentWidth);
    const maxLeft = Math.max(0, 200 - currentWidth);
    const minTop = Math.min(0, 200 - currentHeight);
    const maxTop = Math.max(0, 200 - currentHeight);

    imgLeft = Math.min(maxLeft, Math.max(minLeft, imgLeft));
    imgTop = Math.min(maxTop, Math.max(minTop, imgTop));

    updateImageStyle();
  });

  const closeModal = () => {
    modalOverlay.classList.remove('active');
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
    window.removeEventListener('touchmove', handleDragMove);
    window.removeEventListener('touchend', handleDragEnd);
    setTimeout(() => modalOverlay.remove(), 300);
  };

  closeBtn.addEventListener('click', () => {
    closeModal();
    onCancel();
  });
  cancelBtn.addEventListener('click', () => {
    closeModal();
    onCancel();
  });

  confirmBtn.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    // Fill background with theme color for zoomed-out states
    ctx.fillStyle = '#080a14';
    ctx.fillRect(0, 0, 200, 200);

    // Draw the active crop viewport region
    ctx.drawImage(
      img,
      imgLeft,
      imgTop,
      baseWidth * zoom,
      baseHeight * zoom
    );

    canvas.toBlob((blob) => {
      onSave(blob);
      closeModal();
    }, 'image/jpeg', 0.92);
  });
}
