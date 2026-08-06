import { apiCall } from '../../api';

export function renderMapGuessForm(container, stageData, onChange) {
  const data = {
    damage: stageData.damage || 10,
    items: stageData.items || []
  };

  const update = () => {
    onChange({ ...stageData, ...data });
  };

  const render = () => {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
        <!-- Settings -->
        <div style="background: rgba(255,255,255,0.01); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 0.85rem; color: var(--color-text-muted);">Harita / Bölge Tahmin Genel Ayarları</div>
          <div class="form-group" style="margin-bottom: 0; display: flex; align-items: center; gap: 10px; flex-direction: row;">
            <label class="form-label" style="font-size: 0.75rem; margin-bottom: 0;">Soru Başı Hasar:</label>
            <input type="number" id="mp-damage" class="form-input" style="padding: 0.5rem 0.8rem; width: 90px;" value="${data.damage}" min="5" max="100"/>
          </div>
        </div>

        <!-- Items -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm);">
            <h4 style="font-family: var(--font-heading); font-size: 0.9rem; letter-spacing: 0.5px;">HARİTA LİSTESİ</h4>
            <button id="add-mp-item-btn" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;">➕ HARİTA / PNG EKLE</button>
          </div>

          <div id="mp-items-list" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md);">
            <!-- Render items here -->
          </div>
        </div>
      </div>
    `;

    document.getElementById('mp-damage').addEventListener('input', (e) => {
      data.damage = parseInt(e.target.value) || 10;
      update();
    });

    document.getElementById('add-mp-item-btn').addEventListener('click', () => {
      openItemModal();
    });

    renderItems();
  };

  const renderItems = () => {
    const list = document.getElementById('mp-items-list');
    list.innerHTML = '';

    if (data.items.length === 0) {
      list.innerHTML = `
        <div style="grid-column: span 2; font-size: 0.8rem; color: var(--color-text-muted); text-align: center; padding: 20px; border: 1px dashed var(--color-border); border-radius: var(--radius-md);">
          Henüz harita eklenmedi.
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
            <div style="font-size: 0.7rem; color: var(--color-text-muted);">Cevap:</div>
            <div style="font-weight: 600; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">${item.answer}</div>
            
            ${item.hint ? `
              <div style="font-size: 0.65rem; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                <strong>İpucu:</strong> ${item.hint}
              </div>
            ` : ''}
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
        if (confirm('Bu haritayı silmek istediğinize emin misiniz?')) {
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
      : { imageUrl: '', answer: '', hint: '' };

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';

    modal.innerHTML = `
      <div class="glass-card modal-content" style="max-width: 440px;">
        <div class="editor-form-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);">
          <h3 style="font-family: var(--font-heading); font-size: 1.1rem; letter-spacing: 1px;">
            ${isEdit ? 'HARİTAYI DÜZENLE' : 'HARİTA / GÖRSEL EKLE'}
          </h3>
          <button id="close-mp-modal-btn" class="stage-item-btn" style="font-size: 1.2rem;">&times;</button>
        </div>

        <form id="mp-item-form">
          <div class="form-group">
            <label class="form-label">HARİTA GÖRSELİ SEÇİN (.png, .jpg, .jpeg)</label>
            <div id="upload-zone" style="border: 2px dashed var(--color-border); border-radius: var(--radius-md); padding: 15px; text-align: center; cursor: pointer; background: rgba(255,255,255,0.01); transition: all var(--transition-fast); margin-bottom: 10px;">
              <input type="file" id="map-file-input" accept="image/*" style="display: none;" />
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
            <label class="form-label" for="mp-answer">TAHMİN EDİLECEK CEVAP</label>
            <input class="form-input" type="text" id="mp-answer" value="${itemData.answer}" placeholder="Örn: Erangel, Dust 2, Türkiye Haritası" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="mp-hint">YARIŞMACILARA İPUCU (İSTEĞE BAĞLI)</label>
            <input class="form-input" type="text" id="mp-hint" value="${itemData.hint}" placeholder="Örn: CS:GO oyunundaki en ünlü harita" />
          </div>

          <button type="submit" id="mp-submit-btn" class="btn btn-primary" style="width: 100%; margin-top: var(--spacing-sm);" ${!itemData.imageUrl ? 'disabled' : ''}>
            ${isEdit ? 'KAYDET' : 'HARİTAYI KAYDET'}
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    const closeBtn = modal.querySelector('#close-mp-modal-btn');
    const form = modal.querySelector('#mp-item-form');
    const uploadZone = modal.querySelector('#upload-zone');
    const fileInput = modal.querySelector('#map-file-input');
    const uploadStatus = modal.querySelector('#upload-status');
    const submitBtn = modal.querySelector('#mp-submit-btn');

    const closeModal = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

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
      
      const answer = document.getElementById('mp-answer').value.trim();
      const hint = document.getElementById('mp-hint').value.trim();

      if (isEdit) {
        data.items[editIdx] = { imageUrl: itemData.imageUrl, answer, hint };
      } else {
        data.items.push({ imageUrl: itemData.imageUrl, answer, hint });
      }

      update();
      renderItems();
      closeModal();
    });
  };

  render();
}
