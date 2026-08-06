export const resultsScreen = {
  render: async (container) => {
    container.innerHTML = `
      <div class="glass-card" style="max-width: 800px; margin: 2rem auto; text-align: center;">
        <h1 class="text-gradient" style="font-family: var(--font-heading); margin-bottom: var(--spacing-md);">Oyun Sonuçları (Stub)</h1>
        <p style="margin-bottom: var(--spacing-md);">Faz 12/15'te bu ekran tamamlanacaktır.</p>
        <button class="btn btn-secondary" onclick="window.location.hash='#dashboard'">Geri Dön</button>
      </div>
    `;
  },
  destroy: () => {
    console.log('Results Screen destroyed');
  }
};

export default resultsScreen;
