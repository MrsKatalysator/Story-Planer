/* ============================================
   Wiki-Links — Story Planner
   ============================================ */

const Links = {
  render(content) {
    if (!content) return '';

    // Erst Markdown-Formatierung umwandeln
    let html = content
      // Fett: **text** → <strong>text</strong>
.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Kursiv: *text* → <em>text</em>
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Unterstrichen: __text__ → <u>text</u>
      .replace(/__(.+?)__/g, '<u>$1</u>');

    // Dann Wiki-Links umwandeln
    html = html.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
      const page = Pages.getByTitle(linkText);
      if (page) {
        return `<span class="wiki-link" data-page-id="${page.id}">${linkText}</span>`;
      } else {
        return `<span class="wiki-link missing" data-page-title="${linkText}" title="Seite existiert nicht — klicken zum Erstellen">${linkText}</span>`;
      }
    });

    return html;
  },

  /**
   * Markdown + Wiki-Links zu echtem HTML für contenteditable Editor rendern.
   * Verwendet <b>, <em>, <u> statt <strong>, <em>, <u> für execCommand-Kompatibilität.
   */
  renderToHTML(content) {
    if (!content) return '';

    // Escape HTML entities first
    let html = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Markdown → HTML (Reihenfolge wichtig: Fett vor Kursiv!)
    html = html
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/__(.+?)__/g, '<u>$1</u>');

    // Listen: - text Zeilen in <ul><li> umwandeln
    const lines = html.split('\n');
    let inList = false;
    let result = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^- /)) {
        if (!inList) {
          result += '<ul>';
          inList = true;
        }
        result += '<li>' + line.replace(/^- /, '') + '</li>';
      } else {
        if (inList) {
          result += '</ul>';
          inList = false;
        }
        result += line;
        if (i < lines.length - 1) result += '<br>';
      }
    }
    if (inList) result += '</ul>';
    html = result;

    // Wiki-Links
    html = html.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
      const page = Pages.getByTitle(linkText);
      if (page) {
        return `<span class="wiki-link" data-page-id="${page.id}">${linkText}</span>`;
      } else {
        return `<span class="wiki-link missing" data-page-title="${linkText}">${linkText}</span>`;
      }
    });

    // Zeilenumbrüche
    html = html.replace(/\n/g, '<br>');

    return html;
  },

  /**
   * HTML (vom contenteditable Editor) zurück in Markdown konvertieren.
   * Speichert als Markdown, damit die Vorschau korrekt rendert.
   */
  htmlToMarkdown(html) {
    if (!html) return '';

    let md = html;

    // Wiki-Links zurückkonvertieren: <span class="wiki-link"...>Text</span> → [[Text]]
    md = md.replace(/<span[^>]*class="wiki-link[^"]*"[^>]*>([^<]+)<\/span>/g, '[[$1]]');

    // Listen: <ul><li>text</li></ul> → - text
    md = md.replace(/<li>(.*?)<\/li>/g, '- $1\n');
    md = md.replace(/<\/?ul>/g, '');

    // Fett: <b>text</b> → **text**
    md = md.replace(/<b>([^<]+)<\/b>/g, '**$1**');

    // Kursiv: <em>text</em> → *text*
    md = md.replace(/<em>([^<]+)<\/em>/g, '*$1*');

    // Unterstrichen: <u>text</u> → __text__
    md = md.replace(/<u>([^<]+)<\/u>/g, '__$1__');

    // Zeilenumbrüche: <br> → \n
    md = md.replace(/<br\s*\/?>/g, '\n');

    // Entferne alle anderen HTML-Tags (sollte keine geben, aber sicherheitshalber)
    md = md.replace(/<[^>]+>/g, '');

    // HTML-Entities zurück
    md = md.replace(/&amp;/g, '&');
    md = md.replace(/&lt;/g, '<');
    md = md.replace(/&gt;/g, '>');
    md = md.replace(/&quot;/g, '"');
    md = md.replace(/&#39;/g, "'");

    return md.trim();
  }
};
