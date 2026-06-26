(function () {
  const panel = document.querySelector('.stamp-panel');
  if (!panel) return;

  const novelId = panel.dataset.novelId;
  const storageKey = 'reaction:' + novelId;
  const buttons = panel.querySelectorAll('.stamp-btn');

  function getStoredReaction() {
    return localStorage.getItem(storageKey); // 'likes' | 'loves' | 'dislikes' | null
  }

  function setStoredReaction(type) {
    if (type) {
      localStorage.setItem(storageKey, type);
    } else {
      localStorage.removeItem(storageKey);
    }
  }

  function updateCounts(counts) {
    buttons.forEach((btn) => {
      const type = btn.dataset.type;
      const countEl = btn.querySelector('[data-count]');
      if (countEl) countEl.textContent = counts[type];
    });
  }

  function markActive(activeType) {
    buttons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.type === activeType);
    });
  }

  // Reflect whatever this reader already picked, on page load
  markActive(getStoredReaction());

  buttons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const clickedType = btn.dataset.type;
      const previousType = getStoredReaction();

      // Clicking the same reaction again removes it (un-react)
      const newType = previousType === clickedType ? null : clickedType;

      try {
        const res = await fetch(`/api/novels/${novelId}/react`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: newType, previousType })
        });

        if (!res.ok) throw new Error('Request failed');

        const counts = await res.json();
        updateCounts(counts);
        setStoredReaction(newType);
        markActive(newType);
      } catch (err) {
        console.error('Could not save reaction:', err);
      }
    });
  });
})();
