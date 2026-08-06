export function renderSayismacaForm(container, stageData, onChange) {
  const data = {
    countdownTime: stageData.countdownTime || 30,
    successDamage: stageData.successDamage || 15,
    failDamage: stageData.failDamage || 20,
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
            <label class="form-label" style="font-size: 0.75rem;">Sayma Süresi (Sn)</label>
            <input type="number" id="say-time" class="form-input" style="padding: 0.6rem 0.8rem;" value="${data.countdownTime}" min="10" max="120" />
          </div>
          
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.75rem;">Başarı Hasarı</label>
            <input type="number" id="say-success" class="form-input" style="padding: 0.6rem 0.8rem;" value="${data.successDamage}" min="5" max="100" />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.75rem;">Başarısızlık Hasarı</label>
            <input type="number" id="say-fail" class="form-input" style="padding: 0.6rem 0.8rem;" value="${data.failDamage}" min="5" max="100" />
          </div>
        </div>

        <!-- Items Section -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm);">
            <h4 style="font-family: var(--font-heading); font-size: 0.9rem; letter-spacing: 0.5px;">TEMA LİSTESİ</h4>
            <button id="add-say-item-btn" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;">➕ TEMA EKLE</button>
          </div>

          <div id="say-items-list" style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
            <!-- Render items here -->
          </div>
        </div>
      </div>
    `;

    // Bind event listeners
    document.getElementById('say-time').addEventListener('input', (e) => {
      data.countdownTime = parseInt(e.target.value) || 30;
      update();
    });
    
    document.getElementById('say-success').addEventListener('input', (e) => {
      data.successDamage = parseInt(e.target.value) || 15;
      update();
    });

    document.getElementById('say-fail').addEventListener('input', (e) => {
      data.failDamage = parseInt(e.target.value) || 20;
      update();
    });

    document.getElementById('add-say-item-btn').addEventListener('click', () => {
      openItemModal();
    });

    renderItems();
  };

  const renderItems = () => {
    const list = document.getElementById('say-items-list');
    list.innerHTML = '';

    if (data.items.length === 0) {
      list.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--color-text-muted); text-align: center; padding: 20px; border: 1px dashed var(--color-border); border-radius: var(--radius-md);">
          Henüz tema eklenmedi.
        </div>
      `;
      return;
    }

    data.items.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'glass-card';
      card.style.cssText = 'padding: 10px 12px; display: flex; flex-direction: column; gap: 5px; border: 1px solid var(--color-border); font-size: 0.85rem;';

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="font-weight: 600; font-family: var(--font-heading); color: var(--color-accent-blue);">${idx + 1}. Tema: ${item.theme}</div>
          <div style="display: flex; gap: 5px;">
            <button class="stage-item-btn edit-item" data-idx="${idx}">✏️</button>
            <button class="stage-item-btn delete-item" data-idx="${idx}" style="color: var(--color-error);">&times;</button>
          </div>
        </div>
        <div style="font-size: 0.75rem; color: var(--color-text-muted); line-height: 1.4;">
          <strong>Referans Cevaplar:</strong> ${item.referenceAnswers.join(', ')}
        </div>
      `;

      card.querySelector('.edit-item').addEventListener('click', () => {
        openItemModal(idx);
      });

      card.querySelector('.delete-item').addEventListener('click', () => {
        if (confirm('Bu temayı silmek istediğinize emin misiniz?')) {
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
      : { theme: '', referenceAnswers: [] };

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';

    modal.innerHTML = `
      <div class="glass-card modal-content" style="max-width: 440px;">
        <div class="editor-form-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);">
          <h3 style="font-family: var(--font-heading); font-size: 1.1rem; letter-spacing: 1px;">
            ${isEdit ? 'TEMAYI DÜZENLE' : 'TEMA EKLE'}
          </h3>
          <button id="close-say-modal-btn" class="stage-item-btn" style="font-size: 1.2rem;">&times;</button>
        </div>

        <form id="say-item-form">
          <div class="form-group">
            <label class="form-label" for="say-theme-name">TEMA ADI</label>
            <input class="form-input" type="text" id="say-theme-name" value="${itemData.theme}" placeholder="Örn: Avrupa Başkentleri, Meyveler" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="say-ref-answers">REFERANS CEVAPLAR (VİRGÜLLE AYIRIN)</label>
            <textarea class="form-input" id="say-ref-answers" rows="3" placeholder="Örn: Paris, Londra, Roma, Berlin, Ankara" required>${itemData.referenceAnswers.join(', ')}</textarea>
            <span style="font-size: 0.65rem; color: var(--color-text-muted);">Host bu cevapları oyuncular sayarken ipucu/doğrulama için kullanacaktır.</span>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: var(--spacing-sm);">
            ${isEdit ? 'KAYDET' : 'TEMAYI KAYDET'}
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    const closeBtn = modal.querySelector('#close-say-modal-btn');
    const form = modal.querySelector('#say-item-form');

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
      
      const theme = document.getElementById('say-theme-name').value.trim();
      const referenceAnswers = document.getElementById('say-ref-answers').value
        .split(',')
        .map(ans => ans.trim())
        .filter(ans => ans.length > 0);

      if (isEdit) {
        data.items[editIdx] = { theme, referenceAnswers };
      } else {
        data.items.push({ theme, referenceAnswers });
      }

      update();
      renderItems();
      closeModal();
    });
  };

  render();
}
