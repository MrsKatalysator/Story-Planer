/* ============================================
   Drag & Drop — Story Planner
   ============================================ */

const DragDrop = {
  draggedCard: null,

  init() {
    const grid = document.getElementById('cards-grid');

    grid.addEventListener('dragstart', (e) => {
      const card = e.target.closest('.page-card');
      if (!card) return;
      this.draggedCard = card;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.dataset.pageId);
    });

    grid.addEventListener('dragend', (e) => {
      const card = e.target.closest('.page-card');
      if (card) card.classList.remove('dragging');
      this.draggedCard = null;
      document.querySelectorAll('.drop-zone').forEach(el => el.classList.remove('drop-zone'));
    });

    grid.addEventListener('dragover', (e) => {
      e.preventDefault();
      const card = e.target.closest('.page-card');
      if (card && card !== this.draggedCard) {
        card.classList.add('drop-zone');
      }
    });

    grid.addEventListener('dragleave', (e) => {
      const card = e.target.closest('.page-card');
      if (card) card.classList.remove('drop-zone');
    });

    grid.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetCard = e.target.closest('.page-card');
      if (!targetCard || !this.draggedCard || targetCard === this.draggedCard) return;

      targetCard.classList.remove('drop-zone');

      const draggedPageId = this.draggedCard.dataset.pageId;
const targetPageId = targetCard.dataset.pageId;
      const draggedSectionId = this.draggedCard.dataset.sectionId;
      const targetSectionId = targetCard.dataset.sectionId;

      if (!draggedPageId || !targetPageId) return;

      if (draggedSectionId === targetSectionId) {
        const allCards = [...grid.querySelectorAll('.page-card')];
        const orderedIds = allCards.map(c => c.dataset.pageId);
        
        const draggedIdx = orderedIds.indexOf(draggedPageId);
        const targetIdx = orderedIds.indexOf(targetPageId);
        
        if (draggedIdx !== -1 && targetIdx !== -1) {
          orderedIds.splice(draggedIdx, 1);
          orderedIds.splice(targetIdx, 0, draggedPageId);
          Storage.reorderPages(targetSectionId, orderedIds);
          App.renderCards();
        }
      } else {
        Pages.moveToSection(draggedPageId, targetSectionId);
      }
    });

    document.querySelectorAll('.nav-section-header').forEach(header => {
      header.addEventListener('dragover', (e) => {
        e.preventDefault();
        header.classList.add('drop-zone');
      });

      header.addEventListener('dragleave', () => {
        header.classList.remove('drop-zone');
      });

      header.addEventListener('drop', (e) => {
        e.preventDefault();
        header.classList.remove('drop-zone');
        const sectionId = header.dataset.sectionId;
        const draggedPageId = this.draggedCard?.dataset.pageId;
        if (sectionId && draggedPageId) {
          Pages.moveToSection(draggedPageId, sectionId);
        }
      });
    });
  }
};
