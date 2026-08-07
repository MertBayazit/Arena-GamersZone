const optionalStages = [
  {
    type: 'multipleChoice',
    name: 'Çoktan Seçmeli',
    icon: '🧠',
    desc: '4 şıklı bilgi soruları sorulur. Buzzer veya sırayla cevaplanır.'
  },
  {
    type: 'imageGuess',
    name: 'Görsel Tahmin',
    icon: '🖼️',
    desc: 'Bulanık veya pikselli görsel adım adım açılır, buzzer ile tahmin edilir.'
  },
  {
    type: 'soundGuess',
    name: 'Ses Tahmin',
    icon: '🎵',
    desc: 'Ses/müzik klibi çalınır, buzzer ile tahmin edilir.'
  },
  {
    type: 'sayismaca',
    name: 'Sayışmaca',
    icon: '🎯',
    desc: 'Tema üzerine takımlar sayı artırır, en yüksek sayı kadar doğru cevap sayılır.'
  },
  {
    type: 'wordPuzzle',
    name: 'Kelime Bulmaca',
    icon: '🧩',
    desc: 'Gizli kelimenin harfleri tek tek açılır, buzzer ile tahmin edilir.'
  },
  {
    type: 'mapGuess',
    name: 'Harita Tahmin',
    icon: '🗺️',
    desc: 'Oyun haritası veya PNG görseli üzerinde bölge tahmini yapılır.'
  },
  {
    type: 'finalDuel',
    name: 'Final Düellosu',
    icon: '🏆',
    desc: 'Takımlardan seçilen birer oyuncu teke tekte dönüşümlü olarak yarışır.'
  },
  {
    type: 'classicQA',
    name: 'Klasik',
    icon: '📝',
    desc: 'Tek cevaplı açık uçlu sorular sorulur. Yarışmacı sesli cevap verir, host doğru/yanlış kararını verir.'
  }
];

export function openStageSelector(onSelect) {
  // Create modal markup
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  
  modalOverlay.innerHTML = `
    <div class="glass-card modal-content" style="max-width: 600px;">
      <div class="editor-form-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="font-family: var(--font-heading); font-size: 1.1rem; letter-spacing: 1px;">YENİ ETAP EKLE</h3>
        <button id="close-selector-btn" class="stage-item-btn" style="font-size: 1.2rem;">&times;</button>
      </div>
      <p style="color: var(--color-text-muted); font-size: 0.8rem; margin-bottom: var(--spacing-md);">
        Yarışmaya eklemek istediğiniz etap türünü seçin. Sıralamayı daha sonra değiştirebilirsiniz.
      </p>
      
      <div class="selector-grid" style="padding-bottom: 25px;">
        ${optionalStages.map(stage => `
          <div class="selector-card" data-stage-type="${stage.type}">
            <div class="selector-icon">${stage.icon}</div>
            <div class="selector-title">${stage.name}</div>
            <div class="selector-desc">${stage.desc}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  // Trigger CSS transition
  setTimeout(() => modalOverlay.classList.add('active'), 10);

  const closeBtn = modalOverlay.querySelector('#close-selector-btn');
  const cards = modalOverlay.querySelectorAll('.selector-card');

  const closeModal = () => {
    modalOverlay.classList.remove('active');
    setTimeout(() => modalOverlay.remove(), 300);
  };

  closeBtn.addEventListener('click', closeModal);

  // Close when clicking overlay background
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const type = card.dataset.stageType;
      onSelect(type);
      closeModal();
    });
  });
}
