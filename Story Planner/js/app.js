const App = {
  currentSectionId: null,
  currentView: 'cards',
  editMode: false,
  listMode: false,

  init() {
    const sections = Storage.getSections();
    if (sections.length === 0) {
      this.createDefaultSections();
    }

    // Starte ohne Filter — zeige ALLE Seiten
    this.currentSectionId = null;

    this.renderSidebar();
    this.renderCards();
    this.bindEvents();
    DragDrop.init();
  },

  createDefaultSections() {
    const defaults = [
      { name: 'Charaktere', icon: '👤' },
      { name: 'Worldbuilder', icon: '🌍' },
      { name: 'Kapitel', icon: '📖' },
      { name: 'Themen', icon: '💡' },
      { name: 'Mechaniken', icon: '⚙️' },
    ];
    defaults.forEach(d => Storage.addSection(d));
    this.render();
  },

  render() {
    this.renderSidebar();
    this.renderCards();
  },

  renderSidebar() {
    const nav = document.getElementById('sections-nav');
    const sections = Storage.getSections();

    if (sections.length === 0) {
      nav.innerHTML = `<div class="empty-state"><p>Noch keine Bereiche.</p></div>`;
      return;
    }

    let html = `
      <div class="sidebar-all ${this.currentSectionId === null ? 'active' : ''}" data-section-id="__all">
        <div class="nav-section-header" style="padding: 0.75rem;">
          <span class="nav-section-icon">📋</span>
          <span class="nav-section-name">Alle Seiten</span>
        </div>
      </div>
      <hr style="border-color: var(--border); margin: 0.25rem 0.75rem;">
    `;

    html += sections.map(section => {
      const pages = Storage.getPagesInSection(section.id);
      return `
        <div class="nav-section ${section.expanded ? 'expanded' : ''} ${this.currentSectionId === section.id ? 'active-section' : ''}" data-section-id="${section.id}">
          <div class="nav-section-header" data-section-id="${section.id}">
            <span class="nav-section-icon">${section.icon || '📁'}</span>
            <span class="nav-section-name">${section.name}</span>
            <span class="nav-section-count">${pages.length}</span>
          </div>
          <div class="nav-section-pages">
            ${pages.map(page => `<div class="nav-page" data-page-id="${page.id}">• ${page.title}</div>`).join('')}
          </div>
        </div>
      `;
    }).join('');

    nav.innerHTML = html;
  },

  renderCards() {
    const grid = document.getElementById('cards-grid');
    const sectionId = this.currentSectionId;
    const pages = sectionId 
      ? Storage.getPagesInSection(sectionId) 
      : Storage.getPages();

    grid.closest('.content-area').classList.toggle('cards-view-list', this.currentView === 'list');

    if (pages.length === 0) {
      grid.innerHTML = `<div class="empty-state"><p>Noch keine Seiten.</p><button class="btn btn-primary" onclick="App.createNewPage()">+ Seite erstellen</button></div>`;
      document.getElementById('section-count').textContent = '0 Seiten';
      return;
    }

    // Seiten nach sectionId gruppieren für die Anzeige
    const grouped = {};
    const sectionOrder = Storage.getSections().map(s => s.id);
    pages.forEach(page => {
      const sid = String(page.sectionId || '');
      if (!grouped[sid]) grouped[sid] = [];
      grouped[sid].push(page);
    });

    let html = '';

    // Wenn ein spezifischer Bereich ausgewählt ist — zeige nur diesen
    if (sectionId) {
      const section = this.getCurrentSection();
      const sectionName = section ? section.name : 'Seiten';
      const sectionIcon = section ? section.icon : '📄';
      html += `<div class="overview-section">`;
      html += `<h3 class="overview-section__title">${sectionIcon} ${sectionName} <span class="overview-section__count">${pages.length}</span></h3>`;
      html += `<div class="cards-grid">`;
      pages.forEach(page => {
        html += this.renderCardHTML(page);
      });
      html +=

`</div></div>`;
    } else {
      // Alle Sektionen mit Seiten anzeigen (in Reihenfolge der Sektionen)
      sectionOrder.forEach(sid => {
        if (!grouped[sid] || grouped[sid].length === 0) return;
        const section = Storage.getSections().find(s => String(s.id) === String(sid));
        const sectionName = section ? section.name : 'Ohne Bereich';
        const sectionIcon = section ? section.icon : '📄';
        html += `<div class="overview-section">`;
        html += `<h3 class="overview-section__title">${sectionIcon} ${sectionName} <span class="overview-section__count">${grouped[sid].length}</span></h3>`;
        html += `<div class="cards-grid">`;
        grouped[sid].forEach(page => {
          html += this.renderCardHTML(page);
        });
        html += `</div></div>`;
      });

      // Seiten ohne Bereich oder mit ungültiger sectionId
      const orphanPages = pages.filter(p => {
        const sid = String(p.sectionId || '');
        return !sectionOrder.includes(sid) || !grouped[sid];
      });
      if (orphanPages.length > 0) {
        html += `<div class="overview-section">`;
        html += `<h3 class="overview-section__title">📄 Ohne Bereich <span class="overview-section__count">${orphanPages.length}</span></h3>`;
        html += `<div class="cards-grid">`;
        orphanPages.forEach(page => {
          html += this.renderCardHTML(page);
        });
        html += `</div></div>`;
      }
    }

    grid.innerHTML = html;
    document.getElementById('section-count').textContent = `${pages.length} Seite${pages.length !== 1 ? 'n' : ''}`;
  },

  renderCardHTML(page) {
    const thumb = page.images && page.images.length > 0 
      ? `<div class="page-card__thumb"><img src="${page.images[0]}"></div>` 
      : '';
    return `
      <div class="page-card" data-page-id="${page.id}" data-section-id="${page.sectionId}" draggable="true">
        ${thumb}
        <div class="page-card__title">${page.title}</div>
        <div class="page-card__preview">${Pages.getPreview(page.content)}</div>
        <div class="page-card__meta"><span>${this.formatDate(page.updatedAt)}</span></div>
        <button class="page-card__delete" onclick="event.stopPropagation(); App.deletePage('${page.id}')">✕</button>
      </div>
    `;
  },

  getCurrentSection() {
    return Storage.getSections().find(s => s.id === this.currentSectionId);
  },

  selectSection(sectionId) {
    // Sektion auswählen und nach ihr filtern
    this.currentSectionId = sectionId;
    this.listMode = false;
    document.getElementById('btn-list').classList.remove('active');
    const section = this.getCurrentSection();
    document.getElementById('current-section-title').textContent = section ? `${section.icon || '📁'} ${section.name}` : 'Alle Seiten';
    this.renderCards();
  },

  createSection(name, icon) {
    Storage.addSection({ name, icon: icon || '📁' });
    this.render();
  },

  toggleSection(sectionId) {
    const section = Storage.getSections().find(s => s.id === sectionId);
    if (section) {
      Storage.updateSection(sectionId, { expanded: !section.expanded });
      this.renderSidebar();
    }
  },

  createNewPage() {
    document.getElementById('page-create-modal').classList.add('open');
    document.getElementById('new-page-title').value = '';
    document.getElementById('new-page-title').focus();
    this.updateCreatePageDropdown();
  },

  updateCreatePageDropdown() {
    const select = document.getElementById('new-page-section');
    const sections = Storage.getSections();
    const selectedId = this.currentSectionId || (sections.length > 0 ? sections[0].id : '');
    select.innerHTML = sections.map(s => 
      `<option value="${s.id}" ${s.id === selectedId ? 'selected' : ''}>${s.name}</option>`
    ).join('');
    
    const selectedSection = sections.find(s => s.id === selectedId);
    const titleInput = document.getElementById('new-page-title');
    if (selectedSection) {
      const placeholders = {
        'Charaktere': 'z.B. Charaktername...',
        'Worldbuilder': 'z.B. Name der Welt, Ort...',
        'Kapitel': 'z.B. Kapitel 1: Prolog...',
        'Themen': 'z.B. Freundschaft, Verrat...',
        'Mechaniken': 'z.B. Magiesystem, Regeln...',
      };
      titleInput.placeholder = placeholders[selectedSection.name] || 'z.B. Titel...';
    }
  },

  openPage(pageId) {
    const page = Pages.getById(pageId);
    if (!page) return;

    document.getElementById('page-title-input').value = page.title;
    document.getElementById('page-title-input').readOnly = true;
    document.getElementById('page-content-display').innerHTML = Links.render(page.content);
    const editorEl = document.getElementById('page-content-editor');
    if (editorEl) {
      editorEl.innerHTML = Links.renderToHTML(page.content || '');
    }
    document.getElementById('page-meta').textContent = `Erstellt: ${this.formatDate(page.createdAt)} · Geändert: ${this.formatDate(page.updatedAt)}`;
    document.getElementById('page-delete-btn').dataset.pageId = pageId;

    this.renderImages(page);
    document.getElementById('page-overlay').classList.add('open');
    document.querySelector('.page-modal').classList.remove('editing');
  },

  renderImages(page) {
    const container = document.getElementById('page-images');
    if (!container) return;
    if (!page.images || page.images.length === 0) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML = page.images.map((img, idx) => `
      <div class="page-image-thumb" data-image-idx="${idx}">
        <img src="${img}" alt="Bild ${idx + 1}" ondblclick="App.showImageLightbox('${img}')">
        <button class="page-image-remove" onclick="App.removeImage(${idx})">✕</button>
      </div>
    `).join('');
  },

  showImageLightbox(dataUrl) {
    const existing = document.getElementById('image-lightbox');
    if (existing) existing.remove();

    const lightbox = document.createElement('div');
    lightbox.id = 'image-lightbox';
    lightbox.className = 'image-lightbox';
    lightbox.innerHTML = `
      <div class="image-lightbox__content">
        <button class="image-lightbox__close" onclick="document.getElementById('image-lightbox').remove()">✕</button>
        <img src="${dataUrl}" alt="Originalgröße" class="image-lightbox__img">
      </div>
    `;
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) lightbox.remove();
    });
    document.body.appendChild(lightbox);
  },

  editPage() {
    document.querySelector('.page-modal').classList.add('editing');
    document.getElementById('page-title-input').readOnly = false;
    const editorEl = document.getElementById('page-content-editor');
    if (editorEl) {
      editorEl.focus();
    }
  },

  savePage() {
    const pageId = document.getElementById('page-delete-btn').dataset.pageId;
    const title = document.getElementById('page-title-input').value.trim();
    const editorEl = document.getElementById('page-content-editor');
    const content = editorEl ? Links.htmlToMarkdown(editorEl.innerHTML) : '';

    if (!title) { alert('Bitte Titel eingeben.'); return; }

    const page = Pages.getById(pageId);
    const existingImages = page && page.images ? page.images : [];
    Pages.save(pageId, title, content, existingImages);
    
    this.closePage();
    this.renderCards();
  },

  deletePage(pageId) {
    if (!confirm('Seite wirklich löschen?')) return;
    Pages.delete(pageId);
    document.getElementById('page-overlay').classList.remove('open');
  },

  closePage() {
    document.getElementById('page-overlay').classList.remove('open');
    document.querySelector('.page-modal').classList.remove('editing');
  },

  addImage(pageId, dataUrl) {
    const page = Pages.getById(pageId);
    if (!page) return;
    if (!page.images) page.images = [];
    page.images.push(dataUrl);
    Pages.save(pageId, page.title, page.content, page.images);
    this.renderImages(page);
  },

  removeImage(imageIdx) {
    const pageId = document.getElementById('page-delete-btn').dataset.pageId;
    const page = Pages.getById(pageId);
    if (!page || !page.images) return;
    page.images.splice(imageIdx, 1);
    Pages.save(pageId, page.title, page.content, page.images);
    this.renderImages(page);
  },

  handleImageUpload(file, pageId) {
    if (!file.type.startsWith('image/')) { alert('Nur Bilder!'); return; }
    if (file.size > 2 * 1024 * 1024) { alert('Max 2MB!'); return; }
    const reader = new FileReader();
    reader.onload = (e) => this.addImage(pageId, e.target.result);
    reader.readAsDataURL(file);
  },

  resetAllData() {
    document.getElementById('reset-modal').classList.add('open');
  },

  confirmReset() {
    document.getElementById('reset-modal').classList.remove('open');
    localStorage.clear();
    location.reload();
  },

  exportData() {
    const data = Storage.getData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `story-planner-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  },

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (!data.sections || !data.pages) throw new Error('Ungültig');
          if (!confirm(`Importieren? ${data.sections.length} Bereiche, ${data.pages.length} Seiten`)) return;
          Storage.saveData(data);
          this.currentSectionId = null;
          this.init();
          alert('✅ Import OK!');
        } catch (err) {
          alert('❌ ' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  bindEvents() {
    document.getElementById('sections-nav').addEventListener('click', (e) => {
      // "Alle Seiten" Button
      const allBtn = e.target.closest('[data-section-id="__all"]');
      if (allBtn) { this.showOverview(); return; }

      // Sektions-Header klicken → filtern + ausklappen
      const header = e.target.closest('.nav-section-header');
      if (header) {
        if (header.dataset.sectionId === '__all') { this.showOverview(); return; }
        // Ausklappen
        const section = Storage.getSections().find(s => s.id === header.dataset.sectionId);
        if (section) {
          Storage.updateSection(header.dataset.sectionId, { expanded: !section.expanded });
        }
        // Filtern
        this.selectSection(header.dataset.sectionId);
        return;
      }
      // Direkt zur Seite navigieren
      const pageLink = e.target.closest('.nav-page');
      if (pageLink) this.openPage(pageLink.dataset.pageId);
    });

    document.getElementById('cards-grid').addEventListener('click', (e) => {
      const card = e.target.closest('.page-card');
      if (!card) return;
      if (e.target.closest('.page-card__delete')) return;
      this.openPage(card.dataset.pageId);
    });

    document.getElementById('page-content-display').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const link = e.target.closest('.wiki-link');
      if (!link) return;
      
      const pageId = link.dataset.pageId;
      const pageTitle = link.dataset.pageTitle;

      if (pageId) {
        this.openPage(pageId);
      } else {
        if (confirm(`Seite "${pageTitle}" existiert nicht. Jetzt erstellen?`)) {
          const currentSection = this.getCurrentSection();
          const sectionId = currentSection ? currentSection.id : null;
          if (sectionId) {
            Pages.create(pageTitle, sectionId);
          } else {
            alert('Bitte wähle zuerst einen Bereich aus.');
          }
        }
      }
    });

    document.getElementById('new-section-btn').addEventListener('click', () => {
      document.getElementById('section-modal').classList.add('open');
      document.getElementById('section-name').value = '';
      document.getElementById('section-icon').value = '';
      document.getElementById('section-name').focus();
    });

    document.getElementById('section-create-btn').addEventListener('click', () => {
      const name = document.getElementById('section-name').value.trim();
      const icon = document.getElementById('section-icon').value.trim();
      if (!name) return;
      this.createSection(name, icon);
      document.getElementById('section-modal').classList.remove('open');
    });

    document.getElementById('section-cancel-btn').addEventListener('click', () => {
      document.getElementById('section-modal').classList.remove('open');
    });

    document.getElementById('new-page-btn').addEventListener('click', () => this.createNewPage());

    document.getElementById('page-create-confirm-btn').addEventListener('click', () => {
      const title = document.getElementById('new-page-title').value.trim();
      const sectionId = document.getElementById('new-page-section').value;
      if (!title || !sectionId) {
        if (!title) document.getElementById('new-page-title').focus();
        if (!sectionId) document.getElementById('new-page-section').focus();
        return;
      }
      Pages.create(title, sectionId);
      document.getElementById('page-create-modal').classList.remove('open');
    });

    document.getElementById('page-create-cancel-btn').addEventListener('click', () => {
      document.getElementById('page-create-modal').classList.remove('open');
    });

    const pageCloseBtn = document.getElementById('page-close-btn');
    const pageEditBtn = document.getElementById('page-edit-btn');
    const pageSaveBtn = document.getElementById('page-save-btn');
    const pageDeleteBtn = document.getElementById('page-delete-btn');
    if (pageCloseBtn) pageCloseBtn.addEventListener('click', () => this.closePage());
    if (pageEditBtn) pageEditBtn.addEventListener('click', () => this.editPage());
    if (pageSaveBtn) pageSaveBtn.addEventListener('click', () => this.savePage());
    if (pageDeleteBtn) {
      pageDeleteBtn.addEventListener('click', () => {
        const pid = pageDeleteBtn.dataset.pageId;
        if (pid) this.deletePage(pid);
      });
    }

    const imageInput = document.getElementById('image-upload-input');
    if (imageInput) {
      imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const pageId = pageDeleteBtn.dataset.pageId;
        if (file && pageId) this.handleImageUpload(file, pageId);
        e.target.value = '';
      });
    }

    document.getElementById('reset-btn').addEventListener('click', () => this.resetAllData());
    document.getElementById('reset-cancel-btn').addEventListener('click', () => {
      document.getElementById('reset-modal').classList.remove('open');
    });
    document.getElementById('reset-confirm-btn').addEventListener('click', () => this.confirmReset());

    document.getElementById('overview-btn').addEventListener('click', () => {
      this.showOverview();
    });
    // Editor Toolbar
    document.querySelectorAll('.editor-toolbar__btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const btnEl = e.target.closest('button');
        const format = btnEl.dataset.format;
        // Alle Formate (inkl. 'ul') werden über applyFormat() gesteuert
        this.applyFormat(format);
      });
    });

    // Text Reset Button
    document.getElementById('btn-reset').addEventListener('click', () => {
      const editor = document.getElementById('page-content-editor');
      if (editor && editor.innerHTML && confirm('Gesamten Text löschen?')) {
        editor.innerHTML = '';
        this.listMode = false;
        document.getElementById('btn-list').classList.remove('active');
      }
    });

    // Keyboard-Shortcuts für contenteditable
    document.getElementById('page-content-editor').addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'b') { e.preventDefault(); this.applyFormat('bold'); }
        if (e.key === 'i') { e.preventDefault(); this.applyFormat('italic'); }
        if (e.key === 'u') { e.preventDefault(); this.applyFormat('underline'); }
      }
      // Listenpunkte: Enter im Listenmodus → neues <li> erstellen
      if (e.key === 'Enter' && this.listMode) {
        e.preventDefault();
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        const currentLi = range.startContainer.parentElement?.closest('li');
        if (currentLi) {
          const newLi = document.createElement('li');
          newLi.textContent = '';
          currentLi.parentNode.insertBefore(newLi, currentLi.nextSibling);
          const newRange = document.createRange();
          newRange.selectNodeContents(newLi);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
      }
    });

    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentView = btn.dataset.view;
        this.renderCards();
      });
    });

    document.getElementById('edit-mode-btn').addEventListener('click', () => {
    this.editMode = !this.editMode;
      document.body.classList.toggle('edit-mode', this.editMode);
      document.getElementById('edit-mode-btn').classList.toggle('active', this.editMode);
    });

    // Toolbar Dropdown
    const moreBtn = document.getElementById('toolbar-more-btn');
    const dropdownMenu = document.getElementById('toolbar-dropdown-menu');
    if (moreBtn && dropdownMenu) {
      moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('open');
      });
      document.addEventListener('click', () => {
        dropdownMenu.classList.remove('open');
      });
      dropdownMenu.addEventListener('click', (e) => e.stopPropagation());
    }

    document.getElementById('export-btn').addEventListener('click', () => this.exportData());
    document.getElementById('import-btn').addEventListener('click', () => this.importData());

    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      const sidebar = document.getElementById('sidebar');
      const toggle = document.getElementById('sidebar-toggle');
      if (window.innerWidth <= 768 && 
          sidebar.classList.contains('open') && 
          !sidebar.contains(e.target) && 
          e.target !== toggle &&
          !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });

    document.addEventListener('touchstart', (e) => {
      const sidebar = document.getElementById('sidebar');
      const toggle = document.getElementById('sidebar-toggle');
      if (window.innerWidth <= 768 && 
          sidebar.classList.contains('open') && 
          !sidebar.contains(e.target) && 
          e.target !== toggle &&
          !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    }, { passive: true });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closePage();
        document.getElementById('section-modal').classList.remove('open');
        document.getElementById('page-create-modal').classList.remove('open');
        document.getElementById('reset-modal').classList.remove('open');
        document.getElementById('sidebar').classList.remove('open');
        const lightbox = document.getElementById('image-lightbox');
        if (lightbox) lightbox.remove();
      }
    });
  },

  formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
  },

  showOverview() {
    // Setze Filter zurück → zeige alle Seiten gruppiert nach Bereich
    this.currentSectionId = null;
    this.renderCards();
    document.getElementById('current-section-title').textContent = 'Alle Seiten';
  },

  applyFormat(format) {
    const editor = document.getElementById('page-content-editor');
    if (!editor) return;
    editor.focus();

    switch (format) {
      case 'bold':
        document.execCommand('bold', false, null);
        break;
      case 'italic':
        document.execCommand('italic', false, null);
        break;
      case 'underline':
        document.execCommand('underline', false, null);
        break;
      case 'ul': {
        // Umschaltmodus für Listen aktivieren/deaktivieren
        this.listMode = !this.listMode;
        document.getElementById('btn-list').classList.toggle('active', this.listMode);
        if (this.listMode) {
          const ul = document.createElement('ul');
          ul.style.margin = '0 0 0 1.5rem';
          ul.style.padding = '0';
          const li = document.createElement('li');
          li.textContent = 'Listeneintrag';
          ul.appendChild(li);
          editor.appendChild(ul);
          const range = document.createRange();
          range.selectNodeContents(li);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } else {
          const uls = editor.querySelectorAll('ul');
          uls.forEach(ul => {
            const items = Array.from(ul.querySelectorAll('li'));
            const fragment = document.createDocumentFragment();
            items.forEach(li => {
              const p = document.createElement('p');
              p.innerHTML = li.innerHTML;
              fragment.appendChild(p);
            });
            ul.parentNode.replaceChild(fragment, ul);
          });
        }
        break;
      }
      case 'link': {
        const selection = window.getSelection().toString() || 'Seitenname';
        document.execCommand('insertText', false, `[[${selection}]]`);
        break;
      }
    }
  }
};

App.init();