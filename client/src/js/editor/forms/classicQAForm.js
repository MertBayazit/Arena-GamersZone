export function renderClassicQAForm(container, stageData, onChange) {
  const data = {
    answerMode: stageData.answerMode || 'buzzer',
    damagePerQuestion: stageData.damagePerQuestion || 10,
    questions: stageData.questions || []
  };

  const update = () => {
    onChange({ ...stageData, ...data });
  };

  const render = () => {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
        <!-- Stage Settings -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); background: rgba(255,255,255,0.01); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.75rem;">Cevaplama Modu</label>
            <select id="cq-answer-mode" class="form-input" style="padding: 0.6rem 0.8rem;">
              <option value="buzzer" ${data.answerMode === 'buzzer' ? 'selected' : ''}>Buzzer (İlk basan)</option>
              <option value="turnBased" ${data.answerMode === 'turnBased' ? 'selected' : ''}>Sırayla (Dönüşümlü)</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.75rem;">Soru Başı Hasar</label>
            <input type="number" id="cq-damage" class="form-input" style="padding: 0.6rem 0.8rem;" value="${data.damagePerQuestion}" min="5" max="100"/>
          </div>
        </div>

        <div style="background: rgba(0,240,255,0.03); border: 1px solid rgba(0,240,255,0.1); border-radius: var(--radius-md); padding: 10px 14px; font-size: 0.78rem; color: var(--color-text-muted);">
          💡 <strong style="color: #ffffff;">Klasik Etap:</strong> Yarışmacılar sesli olarak cevap verir. Host, kendi panelinden doğru/yanlış kararını verir. Doğruysa cevap ekranlarda görünür ve rakip takıma hasar uygulanır.
        </div>

        <!-- Questions List -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm);">
            <h4 style="font-family: var(--font-heading); font-size: 0.9rem; letter-spacing: 0.5px;">SORU LİSTESİ</h4>
            <button id="add-cq-btn" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;">➕ SORU EKLE</button>
          </div>
          <div id="cq-questions-list" style="display: flex; flex-direction: column; gap: 8px;"></div>
        </div>
      </div>
    `;

    document.getElementById('cq-answer-mode').addEventListener('change', (e) => {
      data.answerMode = e.target.value;
      update();
    });

    document.getElementById('cq-damage').addEventListener('input', (e) => {
      data.damagePerQuestion = parseInt(e.target.value) || 10;
      update();
    });

    document.getElementById('add-cq-btn').addEventListener('click', () => openQuestionModal());

    renderQuestions();
  };

  const renderQuestions = () => {
    const list = document.getElementById('cq-questions-list');
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
      const item = document.createElement('div');
      item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.85rem;';

      item.innerHTML = `
        <div style="flex: 1; min-width: 0; padding-right: 10px;">
          <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${idx + 1}. ${q.question}</div>
          <div style="font-size: 0.7rem; color: var(--color-text-muted); margin-top: 2px;">
            Cevap: <span style="color: var(--color-success); font-weight: bold;">${q.answer}</span>
          </div>
        </div>
        <div style="display: flex; gap: 5px;">
          <button class="stage-item-btn edit-cq" data-idx="${idx}">✏️</button>
          <button class="stage-item-btn delete-cq" data-idx="${idx}" style="color: var(--color-error);">&times;</button>
        </div>
      `;

      item.querySelector('.edit-cq').addEventListener('click', () => openQuestionModal(idx));
      item.querySelector('.delete-cq').addEventListener('click', () => {
        if (confirm('Bu soruyu silmek istediğinize emin misiniz?')) {
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
      : { question: '', answer: '' };

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';

    modal.innerHTML = `
      <div class="glass-card modal-content" style="max-width: 480px;">
        <div class="editor-form-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);">
          <h3 style="font-family: var(--font-heading); font-size: 1.1rem; letter-spacing: 1px;">
            ${isEdit ? 'SORUYU DÜZENLE' : 'YENİ SORU EKLE'}
          </h3>
          <button id="close-cq-modal" class="stage-item-btn" style="font-size: 1.2rem;">&times;</button>
        </div>

        <form id="cq-form">
          <div class="form-group">
            <label class="form-label" for="cq-text">SORU METNİ</label>
            <input class="form-input" type="text" id="cq-text" value="${qData.question}" placeholder="Soruyu buraya yazın..." required />
          </div>

          <div class="form-group">
            <label class="form-label" for="cq-answer">DOĞRU CEVAP</label>
            <input class="form-input" type="text" id="cq-answer" value="${qData.answer}" placeholder="Doğru cevabı buraya yazın..." required />
            <span style="font-size: 0.7rem; color: var(--color-text-muted);">Bu cevap yalnızca host ekranında görünür; yarışmacı doğru dediğinde gösterilir.</span>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: var(--spacing-sm);">
            ${isEdit ? 'KAYDET' : 'SORU EKLE'}
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    const closeModal = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('#close-cq-modal').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    modal.querySelector('#cq-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const question = document.getElementById('cq-text').value.trim();
      const answer = document.getElementById('cq-answer').value.trim();

      if (isEdit) {
        data.questions[editIdx] = { question, answer };
      } else {
        data.questions.push({ question, answer });
      }

      update();
      renderQuestions();
      closeModal();
    });
  };

  render();
}
