import { apiCall } from '../../api';

export function renderSoundGuessForm(container, stageData, onChange) {
  const data = {
    answerMode: stageData.answerMode || 'buzzer',
    playMode: stageData.playMode || 'gradual',
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
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--spacing-md); background: rgba(255,255,255,0.01); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.75rem;">Çalma Modu</label>
            <select id="sg-play-mode" class="form-input" style="padding: 0.6rem 0.8rem;">
              <option value="gradual" ${data.playMode === 'gradual' ? 'selected' : ''}>Kademeli (Süreyle artan)</option>
              <option value="full" ${data.playMode === 'full' ? 'selected' : ''}>Tamamını Çal</option>
            </select>
          </div>
          
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.75rem;">Yanlış Cevap Hasarı</label>
            <select id="sg-damage" class="form-input" style="padding: 0.6rem 0.8rem;">
              <option value="10" ${data.damage === 10 ? 'selected' : ''}>10 Hasar</option>
              <option value="20" ${data.damage === 20 ? 'selected' : ''}>20 Hasar</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.75rem;">Cevaplama Modu</label>
            <select id="sg-answer-mode" class="form-input" style="padding: 0.6rem 0.8rem;">
              <option value="buzzer" ${data.answerMode === 'buzzer' ? 'selected' : ''}>Buzzer</option>
              <option value="turnBased" ${data.answerMode === 'turnBased' ? 'selected' : ''}>Sırayla</option>
            </select>
          </div>
        </div>

        <!-- Items -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm);">
            <h4 style="font-family: var(--font-heading); font-size: 0.9rem; letter-spacing: 0.5px;">SES LİSTESİ</h4>
            <button id="add-sg-item-btn" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;">➕ SES DOSYASI EKLE</button>
          </div>

          <div id="sg-items-list" style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
            <!-- Render items here -->
          </div>
        </div>
      </div>
    `;

    // Bind event listeners
    document.getElementById('sg-play-mode').addEventListener('change', (e) => {
      data.playMode = e.target.value;
      update();
    });
    
    document.getElementById('sg-damage').addEventListener('change', (e) => {
      data.damage = parseInt(e.target.value);
      update();
    });

    document.getElementById('sg-answer-mode').addEventListener('change', (e) => {
      data.answerMode = e.target.value;
      update();
    });

    document.getElementById('add-sg-item-btn').addEventListener('click', () => {
      openItemModal();
    });

    renderItems();
  };

  const renderItems = () => {
    const list = document.getElementById('sg-items-list');
    list.innerHTML = '';

    if (data.items.length === 0) {
      list.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--color-text-muted); text-align: center; padding: 20px; border: 1px dashed var(--color-border); border-radius: var(--radius-md);">
          Henüz ses dosyası eklenmedi.
        </div>
      `;
      return;
    }

    data.items.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'glass-card';
      card.style.cssText = 'padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-md); border: 1px solid var(--color-border); font-size: 0.85rem;';

      card.innerHTML = `
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${idx + 1}. ${item.answer}</div>
          <audio controls src="${item.audioUrl}" style="height: 30px; width: 100%; margin-top: 5px; background: rgba(0,0,0,0.1); border-radius: 4px;"></audio>
        </div>
        <div style="display: flex; gap: 5px;">
          <button class="stage-item-btn edit-item" data-idx="${idx}">✏️</button>
          <button class="stage-item-btn delete-item" data-idx="${idx}" style="color: var(--color-error);">&times;</button>
        </div>
      `;

      card.querySelector('.edit-item').addEventListener('click', () => {
        openItemModal(idx);
      });

      card.querySelector('.delete-item').addEventListener('click', () => {
        if (confirm('Bu sesi silmek istediğinize emin misiniz?')) {
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
      : { audioUrl: '', answer: '' };

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';

    modal.innerHTML = `
      <div class="glass-card modal-content" style="max-width: 440px;">
        <div class="editor-form-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);">
          <h3 style="font-family: var(--font-heading); font-size: 1.1rem; letter-spacing: 1px;">
            ${isEdit ? 'SESİ DÜZENLE' : 'SES EKLE'}
          </h3>
          <button id="close-sg-modal-btn" class="stage-item-btn" style="font-size: 1.2rem;">&times;</button>
        </div>

        <form id="sg-item-form">
          <div class="form-group">
            <label class="form-label">SES DOSYASI SEÇİN (.mp3, .wav, .ogg)</label>
            <div id="upload-zone" style="border: 2px dashed var(--color-border); border-radius: var(--radius-md); padding: 15px; text-align: center; cursor: pointer; background: rgba(255,255,255,0.01); transition: all var(--transition-fast); margin-bottom: 10px;">
              <input type="file" id="audio-file-input" accept="audio/*" style="display: none;" />
              <div id="upload-status">
                ${itemData.audioUrl 
                  ? `<span style="font-size: 1.8rem; display: block; margin-bottom: 5px;">🎵</span>
                     <audio src="${itemData.audioUrl}" controls style="height: 30px; width: 100%; margin-bottom: 5px;"></audio>
                     <p style="font-size: 0.7rem; color: var(--color-accent-blue);">Sesi Değiştirmek İçin Tıklayın veya Sürükleyin</p>`
                  : `<span style="font-size: 1.8rem; display: block; margin-bottom: 5px;">📤</span>
                     <p style="font-size: 0.75rem; color: var(--color-text-muted);">Ses Yüklemek İçin Tıklayın veya Sürükleyin</p>`
                }
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="sg-answer">TAHMİN EDİLECEK CEVAP</label>
            <input class="form-input" type="text" id="sg-answer" value="${itemData.answer}" placeholder="Örn: Tarkan, Bohemian Rhapsody" required />
          </div>

          <button type="submit" id="sg-submit-btn" class="btn btn-primary" style="width: 100%; margin-top: var(--spacing-sm);" ${!itemData.audioUrl ? 'disabled' : ''}>
            ${isEdit ? 'KAYDET' : 'SESİ KAYDET'}
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    const closeBtn = modal.querySelector('#close-sg-modal-btn');
    const form = modal.querySelector('#sg-item-form');
    const uploadZone = modal.querySelector('#upload-zone');
    const fileInput = modal.querySelector('#audio-file-input');
    const uploadStatus = modal.querySelector('#upload-status');
    const submitBtn = modal.querySelector('#sg-submit-btn');

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
        <p style="font-size: 0.75rem; color: var(--color-text-muted);">Ses dosyası yükleniyor...</p>
      `;
      submitBtn.disabled = true;

      try {
        const formData = new FormData();
        formData.append('audio', file);

        const res = await apiCall('/upload/audio', 'POST', formData);
        itemData.audioUrl = res.url;

        uploadStatus.innerHTML = `
          <span style="font-size: 1.8rem; display: block; margin-bottom: 5px;">🎵</span>
          <audio src="${itemData.audioUrl}" controls style="height: 30px; width: 100%; margin-bottom: 5px;"></audio>
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
      const answer = document.getElementById('sg-answer').value.trim();

      if (isEdit) {
        data.items[editIdx] = { audioUrl: itemData.audioUrl, answer };
      } else {
        data.items.push({ audioUrl: itemData.audioUrl, answer });
      }

      update();
      renderItems();
      closeModal();
    });
  };

  render();
}
