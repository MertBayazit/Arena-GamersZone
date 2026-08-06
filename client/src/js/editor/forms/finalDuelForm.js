export function renderFinalDuelForm(container, stageData, onChange) {
  const data = {
    damagePerQuestion: stageData.damagePerQuestion || 25,
    lastQuestionMultiplier: stageData.lastQuestionMultiplier || 2,
    questions: stageData.questions || []
  };

  const update = () => {
    onChange({ ...stageData, ...data });
  };

  const render = () => {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
        <!-- Settings -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); background: rgba(255,255,255,0.01); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.75rem;">Soru Başı Hasar</label>
            <input type="number" id="fd-damage" class="form-input" style="padding: 0.6rem 0.8rem;" value="${data.damagePerQuestion}" min="10" max="100"/>
          </div>
          
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.75rem;">Son Soru Çarpanı (Altın Soru)</label>
            <select id="fd-multiplier" class="form-input" style="padding: 0.6rem 0.8rem;">
              <option value="1" ${data.lastQuestionMultiplier === 1 ? 'selected' : ''}>Çarpansız (1x)</option>
              <option value="2" ${data.lastQuestionMultiplier === 2 ? 'selected' : ''}>2 Kat Hasar (2x)</option>
              <option value="3" ${data.lastQuestionMultiplier === 3 ? 'selected' : ''}>3 Kat Hasar (3x)</option>
            </select>
          </div>
        </div>

        <!-- Questions -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm);">
            <h4 style="font-family: var(--font-heading); font-size: 0.9rem; letter-spacing: 0.5px;">DÜELLO SORULARI LİSTESİ</h4>
            <button id="add-fd-question-btn" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;">➕ SORU EKLE</button>
          </div>

          <div id="fd-questions-list" style="display: flex; flex-direction: column; gap: 8px;">
            <!-- Questions rendered here -->
          </div>
        </div>
      </div>
    `;

    document.getElementById('fd-damage').addEventListener('input', (e) => {
      data.damagePerQuestion = parseInt(e.target.value) || 25;
      update();
    });

    document.getElementById('fd-multiplier').addEventListener('change', (e) => {
      data.lastQuestionMultiplier = parseInt(e.target.value) || 2;
      update();
    });

    document.getElementById('add-fd-question-btn').addEventListener('click', () => {
      openQuestionModal();
    });

    renderQuestions();
  };

  const renderQuestions = () => {
    const list = document.getElementById('fd-questions-list');
    list.innerHTML = '';

    if (data.questions.length === 0) {
      list.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--color-text-muted); text-align: center; padding: 20px; border: 1px dashed var(--color-border); border-radius: var(--radius-md);">
          Henüz soru eklenmedi.
        </div>
      `;
      return;
    }

    data.questions.forEach((q, idx) => {
      const isLast = idx === data.questions.length - 1;
      const item = document.createElement('div');
      item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.85rem;';
      
      item.innerHTML = `
        <div style="flex: 1; min-width: 0; padding-right: 10px;">
          <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 8px;">
            <span>${idx + 1}. ${q.question}</span>
            ${isLast && data.lastQuestionMultiplier > 1 ? `<span class="game-card-badge draft" style="font-size: 0.55rem; padding: 1px 4px;">🏆 Altın Soru (${data.lastQuestionMultiplier}x Hasar)</span>` : ''}
          </div>
          <div style="font-size: 0.7rem; color: var(--color-text-muted); margin-top: 2px;">
            Şıklar: A) ${q.options[0]} | B) ${q.options[1]} | C) ${q.options[2]} | D) ${q.options[3]} 
            <span style="color: var(--color-success); font-weight: bold; margin-left: 5px;">(Doğru: ${String.fromCharCode(65 + q.correctAnswer)})</span>
          </div>
        </div>
        <div style="display: flex; gap: 5px;">
          <button class="stage-item-btn edit-q" data-idx="${idx}">✏️</button>
          <button class="stage-item-btn delete-q" data-idx="${idx}" style="color: var(--color-error);">&times;</button>
        </div>
      `;

      item.querySelector('.edit-q').addEventListener('click', () => {
        openQuestionModal(idx);
      });

      item.querySelector('.delete-q').addEventListener('click', () => {
        if (confirm('Bu düello sorusunu silmek istediğinize emin misiniz?')) {
          data.questions.splice(idx, 1);
          update();
          renderQuestions();
        }
      });

      list.appendChild(item);
    });
  };

  const openQuestionModal = (editIdx = null) => {
    const isEdit = editIdx !== null;
    const qData = isEdit 
      ? { ...data.questions[editIdx] }
      : { question: '', options: ['', '', '', ''], correctAnswer: 0 };

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
      <div class="glass-card modal-content" style="max-width: 500px;">
        <div class="editor-form-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);">
          <h3 style="font-family: var(--font-heading); font-size: 1.1rem; letter-spacing: 1px;">
            ${isEdit ? 'DÜELLO SORUSUNU DÜZENLE' : 'DÜELLO SORUSU EKLE'}
          </h3>
          <button id="close-q-modal-btn" class="stage-item-btn" style="font-size: 1.2rem;">&times;</button>
        </div>

        <form id="q-form">
          <div class="form-group">
            <label class="form-label" for="q-text">SORU METNİ</label>
            <input class="form-input" type="text" id="q-text" value="${qData.question}" required />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: var(--spacing-md);">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">A ŞIKKI</label>
              <input class="form-input" type="text" id="opt-0" value="${qData.options[0]}" required />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">B ŞIKKI</label>
              <input class="form-input" type="text" id="opt-1" value="${qData.options[1]}" required />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">C ŞIKKI</label>
              <input class="form-input" type="text" id="opt-2" value="${qData.options[2]}" required />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">D ŞIKKI</label>
              <input class="form-input" type="text" id="opt-3" value="${qData.options[3]}" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="q-correct">DOĞRU CEVAP</label>
            <select id="q-correct" class="form-input">
              <option value="0" ${qData.correctAnswer === 0 ? 'selected' : ''}>A Şıkkı</option>
              <option value="1" ${qData.correctAnswer === 1 ? 'selected' : ''}>B Şıkkı</option>
              <option value="2" ${qData.correctAnswer === 2 ? 'selected' : ''}>C Şıkkı</option>
              <option value="3" ${qData.correctAnswer === 3 ? 'selected' : ''}>D Şıkkı</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: var(--spacing-sm);">
            ${isEdit ? 'KAYDET' : 'SORU EKLE'}
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    const closeBtn = modal.querySelector('#close-q-modal-btn');
    const qForm = modal.querySelector('#q-form');

    const closeModal = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    qForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const question = document.getElementById('q-text').value.trim();
      const options = [
        document.getElementById('opt-0').value.trim(),
        document.getElementById('opt-1').value.trim(),
        document.getElementById('opt-2').value.trim(),
        document.getElementById('opt-3').value.trim()
      ];
      const correctAnswer = parseInt(document.getElementById('q-correct').value);

      if (isEdit) {
        data.questions[editIdx] = { question, options, correctAnswer };
      } else {
        data.questions.push({ question, options, correctAnswer });
      }

      update();
      renderQuestions();
      closeModal();
    });
  };

  render();
}
