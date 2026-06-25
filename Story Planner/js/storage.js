/* ============================================
   Local Storage — Story Planner
   ============================================ */

const Storage = {
  KEY: 'story-planner',

  getData() {
    const data = localStorage.getItem(this.KEY);
    if (data) {
      try {
        return JSON.parse(data);
} catch (e) {
        return { sections: [], pages: [] };
      }
    }
    return { sections: [], pages: [] };
  },

  saveData(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },

  getSections() {
    return this.getData().sections || [];
  },

  getPages() {
    return this.getData().pages || [];
  },

  addSection(section) {
    const data = this.getData();
    section.id = String(Date.now() + Math.random().toString(36).substr(2, 5));
    section.order = data.sections.length;
    section.expanded = true;
    data.sections.push(section);
    this.saveData(data);
    return section;
  },

  deleteSection(sectionId) {
    const data = this.getData();
    data.sections = data.sections.filter(s => s.id !== sectionId);
    data.pages = data.pages.filter(p => p.sectionId !== sectionId);
    this.saveData(data);
  },

  updateSection(sectionId, updates) {
    const data = this.getData();
    const section = data.sections.find(s => s.id === sectionId);
    if (section) Object.assign(section, updates);
    this.saveData(data);
  },

      getPagesInSection(sectionId) {
    const normalizedId = String(sectionId).trim();
    const pages = this.getPages().filter(p => {
      if (p.sectionId === undefined || p.sectionId === null) return false;
      return String(p.sectionId).trim() === normalizedId;
    });
    return pages.sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  movePageToSection(pageId, sectionId) {
    const data = this.getData();
    const page = data.pages.find(p => p.id === pageId);
    if (page) {
      page.sectionId = String(sectionId);
      if (page.order === undefined) page.order = Date.now();
      this.saveData(data);
    }
  },

  reorderPages(sectionId, orderedPageIds) {
    const data = this.getData();
    orderedPageIds.forEach((pageId, index) => {
      const page = data.pages.find(p => p.id === pageId);
      if (page) {
        page.sectionId = String(sectionId);
        page.order = index;
      }
    });
    this.saveData(data);
  }
};
