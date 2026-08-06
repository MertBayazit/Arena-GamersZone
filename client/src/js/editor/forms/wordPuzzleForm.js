export function renderWordPuzzleForm(container, stageData, onChange) {
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
          <div style="font-size: 0.85rem; color: var(--color-text-muted);">Bulmaca Kelimeleri Genel Ayarları</div>
          <div class="form-group" style="margin-bottom: 0; display: flex; align-items: center; gap: 10px; flex-direction: row;">
            <label class="form-label" style="font-size: 0.75rem; margin-bottom: 0;">Yanlış Cevap Hasarı:</label>
            <select id="wp-damage" class="form-input" style="padding: 0.5rem 0.8rem; width: 120px;">
              <option value="10" ${data.damage === 10 ? 'selected' : ''}>10 Hasar</option>
              <option value="20" ${data.damage === 20 ? 'selected' : ''}>20 Hasar</option>
            </select>
          </div>
        </div>

        <!-- Items -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm);">
            <h4 style="font-family: var(--font-heading); font-size: 0.9rem; letter-spacing: 0.5px;">KELİME LİSTESİ</h4>
            <button id="add-wp-item-btn" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;">➕ KELİME EKLE</button>
          </div>

          <div id="wp-items-list" style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
            <!-- Render items here -->
          </div>
        </div>
      </div>
    `;

    document.getElementById('wp-damage').addEventListener('change', (e) => {
      data.damage = parseInt(e.target.value);
      update();
    });

    document.getElementById('add-wp-item-btn').addEventListener('click', () => {
      openItemModal();
    });

    renderItems();
  };

  const renderItems = () => {
    const list = document.getElementById('wp-items-list');
    list.innerHTML = '';

    if (data.items.length === 0) {
      list.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--color-text-muted); text-align: center; padding: 20px; border: 1px dashed var(--color-border); border-radius: var(--radius-md);">
          Henüz bulmaca kelimesi eklenmedi.
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
          <div style="font-weight: 600; color: var(--color-accent-purple); font-family: var(--font-heading); text-transform: uppercase;">
            ${idx + 1}. Kelime: ${item.word}
          </div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            <strong>İpucu:</strong> ${item.hint}
          </div>
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
        if (confirm('Bu kelimeyi silmek istediğinize emin misiniz?')) {
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
      : { word: '', hint: '' };

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';

    modal.innerHTML = `
      <div class="glass-card modal-content" style="max-width: 440px;">
        <div class="editor-form-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);">
          <h3 style="font-family: var(--font-heading); font-size: 1.1rem; letter-spacing: 1px;">
            ${isEdit ? 'KELİMEYİ DÜZENLE' : 'KELİME EKLE'}
          </h3>
          <button id="close-wp-modal-btn" class="stage-item-btn" style="font-size: 1.2rem;">&times;</button>
        </div>

        <form id="wp-item-form">
          <div class="form-group">
            <label class="form-label" for="wp-word">GİZLİ KELİME</label>
            <input class="form-input" type="text" id="wp-word" value="${itemData.word}" placeholder="Örn: PORTAKAL, REDBULL" style="text-transform: uppercase;" required />
            <span style="font-size: 0.65rem; color: var(--color-text-muted);">Türkçe karakterler dahil harfler kullanılabilir, boşluk bırakmayın.</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="wp-hint">KELİME İPUCU</label>
            <input class="form-input" type="text" id="wp-hint" value="${itemData.hint}" placeholder="Örn: C vitamini deposu bir meyve" required />
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: var(--spacing-sm);">
            ${isEdit ? 'KAYDET' : 'KELİMEYİ KAYDET'}
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    const closeBtn = modal.querySelector('#close-wp-modal-btn');
    const form = modal.querySelector('#wp-item-form');

    const closeModal = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const word = document.getElementById('wp-word').value.trim().toUpperCase();
      const hint = document.getElementById('wp-hint').value.trim();

      if (isEdit) {
        data.items[editIdx] = { word, hint };
      } else {
        data.items.push({ word, hint });
      }

      update();
      renderItems();
      closeModal();
    });
  };

  render();
}
