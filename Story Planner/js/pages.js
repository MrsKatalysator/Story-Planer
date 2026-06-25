/* ============================================
   Seiten-CRUD — Story Planner
   ============================================ */

const Pages = {
  getAll() {
    return Storage.getPages();
  },

  getById(id) {
    return Storage.getPages().find(p => p.id === id);
  },

  getByTitle(title) {
    return Storage.getPages().find(p => 
      p.title.toLowerCase() === title.toLowerCase()
    );
  },

  create(title, sectionId, content = '') {
    const page = {
      id: String(Date.now() + Math.random().toString(36).substr(2, 5)),
      title: title,
      sectionId: String(sectionId),
      content: content,
      images: [],
      order: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    Storage.saveData({
      sections: Storage.getSections(),
      pages: [...Storage.getPages(), page]
    });
    App.render();
    return page;
  },

  save(pageId, title, content, images) {
    const data = Storage.getData();
    const page = data.pages.find(p => p.id === pageId);
    if (page) {
      page.title = title;
      page.content = content;
      page.images = images || [];
      if (page.sectionId) page.sectionId = String(page.sectionId);
      page.updatedAt = new Date().toISOString();
      Storage.saveData(data);
      App.render();
    }
  },

  delete(pageId) {
    const data = Storage.getData();
    data.pages = data.pages.filter(p => p.id !== pageId);
    Storage.saveData(data);
    App.render();
  },

  moveToSection(pageId, newSectionId) {
    const data = Storage.getData();
    const page = data.pages.find(p => p.id === pageId);
    if (page) {
      page.sectionId = newSectionId;
      page.updatedAt = new Date().toISOString();
      Storage.saveData(data);
      App.render();
    }
  },

  getPreview(content, maxLen = 100) {
    if (!content) return '';
    const clean = content
      .replace(/\[\[([^\]]+)\]\]/g, '$1')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/^- /g, '• ')
      .replace(/\n/g, ' ')
      .trim();
    return clean.length > maxLen 
? clean.substring(0, maxLen) + '...' 
      : clean;
  },

  extractLinks(content) {
    if (!content) return [];
    const matches = content.matchAll(/\[\[([^\]]+)\]\]/g);
    return [...matches].map(m => m[1]);
  }
};
