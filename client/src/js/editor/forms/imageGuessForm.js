import { apiCall } from '../../api';

export function renderImageGuessForm(container, stageData, onChange) {
  const data = {
    answerMode: stageData.answerMode || 'buzzer',
    revealEffect: stageData.revealEffect || 'blur',
    steps: stageData.steps || 5,
    items: stageData.items || []
  };

  const update = () => {
    onChange({ ...stageData, ...data });
  };

  const render = () => {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
        <!-- Config Section -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--spacing-md); background: rgba(255,255,255,0.01); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.75rem;">Efekt Türü</label>
            <select id="ig-effect" class="form-input" style="padding: 0.6rem 0.8rem;">
              <option value="blur" ${data.revealEffect === 'blur' ? 'selected' : ''}>Blur (Bulanıklaştırma)</option>
              <option value="pixel" ${data.revealEffect === 'pixel' ? 'selected' : ''}>Pixel (Pikselleştirme)</option>
              <option value="puzzle" ${data.revealEffect === 'puzzle' ? 'selected' : ''}>Puzzle (Kare Kare Açma)</option>
            </select>
          </div>
          
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.75rem;">Açılma Adımı</label>
            <select id="ig-steps" class="form-input" style="padding: 0.6rem 0.8rem;">
              <option value="5" ${data.steps === 5 ? 'selected' : ''}>5 Adımda</option>
              <option value="10" ${data.steps === 10 ? 'selected' : ''}>10 Adımda</option>
              <option value="15" ${data.steps === 15 ? 'selected' : ''}>15 Adımda</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.75rem;">Cevaplama Modu</label>
            <select id="ig-answer-mode" class="form-input" style="padding: 0.6rem 0.8rem;">
              <option value="buzzer" ${data.answerMode === 'buzzer' ? 'selected' : ''}>Buzzer</option>
              <option value="turnBased" ${data.answerMode === 'turnBased' ? 'selected' : ''}>Sırayla</option>
            </select>
          </div>
        </div>

        <!-- Items Section -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm);">
            <h4 style="font-family: var(--font-heading); font-size: 0.9rem; letter-spacing: 0.5px;">GÖRSEL LİSTESİ</h4>
            <button id="add-ig-item-btn" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;">➕ GÖRSEL EKLE</button>
          </div>

          <div id="ig-items-list" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md);">
            <!-- Render items here -->
          </div>
        </div>
      </div>
    `;

    // Bind event listeners
    document.getElementById('ig-effect').addEventListener('change', (e) => {
      data.revealEffect = e.target.value;
      update();
    });
    
    document.getElementById('ig-steps').addEventListener('change', (e) => {
      data.steps = parseInt(e.target.value);
      update();
    });

    document.getElementById('ig-answer-mode').addEventListener('change', (e) => {
      data.answerMode = e.target.value;
      update();
    });

    document.getElementById('add-ig-item-btn').addEventListener('click', () => {
      openItemModal();
    });

    renderItems();
  };

  const renderItems = () => {
    const list = document.getElementById('ig-items-list');
    list.innerHTML = '';

    if (data.items.length === 0) {
      list.innerHTML = `
        <div style="grid-column: span 2; font-size: 0.8rem; color: var(--color-text-muted); text-align: center; padding: 20px; border: 1px dashed var(--color-border); border-radius: var(--radius-md);">
          Henüz görsel eklenmedi.
        </div>
      `;
      return;
    }

    data.items.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'glass-card';
      card.style.cssText = 'padding: var(--spacing-sm); display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--color-border); position: relative; height: 160px; justify-content: space-between;';

      card.innerHTML = `
        <div style="display: flex; gap: 10px; align-items: center; flex: 1; min-width: 0;">
          <img src="${item.imageUrl}" style="width: 80px; height: 80px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--color-border); background: rgba(0,0,0,0.2);" />
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">Cevap:</div>
            <div style="font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.answer}</div>
          </div>
        </div>
        
        <div style="display: flex; gap: 5px; border-top: 1px solid var(--color-border); padding-top: 5px; justify-content: flex-end;">
          <button class="stage-item-btn edit-item" data-idx="${idx}" style="padding: 4px 8px; font-size: 0.75rem;">✏️ Düzenle</button>
          <button class="stage-item-btn delete-item" data-idx="${idx}" style="padding: 4px 8px; font-size: 0.75rem; color: var(--color-error);">&times; Sil</button>
        </div>
      `;

      card.querySelector('.edit-item').addEventListener('click', () => {
        openItemModal(idx);
      });

      card.querySelector('.delete-item').addEventListener('click', () => {
        if (confirm('Bu görseli silmek istediğinize emin misiniz?')) {
          data.items.splice(idx, 1);
          update();
          renderItems();
        }
      });

      list.appendChild(card);
    });
  };

  const openItemModal = (editIdx = null) => {
    const isEdit = editIdx !== null;
    const itemData = isEdit 
      ? { ...data.items[editIdx] }
      : { imageUrl: '', answer: '' };

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';

    modal.innerHTML = `
      <div class="glass-card modal-content" style="max-width: 440px;">
        <div class="editor-form-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);">
          <h3 style="font-family: var(--font-heading); font-size: 1.1rem; letter-spacing: 1px;">
            ${isEdit ? 'GÖRSELİ DÜZENLE' : 'GÖRSEL EKLE'}
          </h3>
          <button id="close-ig-modal-btn" class="stage-item-btn" style="font-size: 1.2rem;">&times;</button>
        </div>

        <form id="ig-item-form">
          <div class="form-group">
            <label class="form-label">GÖRSEL SEÇİN</label>
            <div id="upload-zone" style="border: 2px dashed var(--color-border); border-radius: var(--radius-md); padding: 15px; text-align: center; cursor: pointer; background: rgba(255,255,255,0.01); transition: all var(--transition-fast); margin-bottom: 10px;">
              <input type="file" id="image-file-input" accept="image/*" style="display: none;" />
              <div id="upload-status">
                ${itemData.imageUrl 
                  ? `<img src="${itemData.imageUrl}" style="max-height: 80px; max-width: 100%; object-fit: contain; margin-bottom: 5px; border-radius: var(--radius-sm);" />
                     <p style="font-size: 0.7rem; color: var(--color-accent-blue);">Görsel Değiştirmek İçin Tıklayın veya Sürükleyin</p>`
                  : `<span style="font-size: 1.8rem; display: block; margin-bottom: 5px;">📤</span>
                     <p style="font-size: 0.75rem; color: var(--color-text-muted);">Görsel Yüklemek İçin Tıklayın veya Sürükleyin</p>`
                }
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="ig-answer">TAHMİN EDİLECEK CEVAP</label>
            <input class="form-input" type="text" id="ig-answer" value="${itemData.answer}" placeholder="Örn: Witcher 3, Eyfel Kulesi" required />
          </div>

          <button type="submit" id="ig-submit-btn" class="btn btn-primary" style="width: 100%; margin-top: var(--spacing-sm);" ${!itemData.imageUrl ? 'disabled' : ''}>
            ${isEdit ? 'KAYDET' : 'GÖRSELİ KAYDET'}
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    const closeBtn = modal.querySelector('#close-ig-modal-btn');
    const form = modal.querySelector('#ig-item-form');
    const uploadZone = modal.querySelector('#upload-zone');
    const fileInput = modal.querySelector('#image-file-input');
    const uploadStatus = modal.querySelector('#upload-status');
    const submitBtn = modal.querySelector('#ig-submit-btn');

    const closeModal = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // File Upload Trigger
    uploadZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      uploadStatus.innerHTML = `
        <div class="spinner" style="width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.1); border-left-color: var(--color-accent-blue); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 5px auto;"></div>
        <p style="font-size: 0.75rem; color: var(--color-text-muted);">Görsel yükleniyor...</p>
      `;
      submitBtn.disabled = true;

      try {
        const formData = new FormData();
        formData.append('image', file);

        const res = await apiCall('/upload/image', 'POST', formData);
        itemData.imageUrl = res.url;

        uploadStatus.innerHTML = `
          <img src="${itemData.imageUrl}" style="max-height: 80px; max-width: 100%; object-fit: contain; margin-bottom: 5px; border-radius: var(--radius-sm);" />
          <p style="font-size: 0.7rem; color: var(--color-accent-blue);">Başarıyla yüklendi! Değiştirmek için tıklayın</p>
        `;
        submitBtn.disabled = false;
      } catch (err) {
        uploadStatus.innerHTML = `
          <span style="font-size: 1.5rem; display: block; margin-bottom: 5px;">❌</span>
          <p style="font-size: 0.75rem; color: var(--color-error);">${err.message || 'Yükleme başarısız'}</p>
        `;
        submitBtn.disabled = true;
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const answer = document.getElementById('ig-answer').value.trim();

      if (isEdit) {
        data.items[editIdx] = { imageUrl: itemData.imageUrl, answer };
      } else {
        data.items.push({ imageUrl: itemData.imageUrl, answer });
      }

      update();
      renderItems();
      closeModal();
    });
  };

  render();
}
