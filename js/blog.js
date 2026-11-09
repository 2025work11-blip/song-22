(function () {
  'use strict';
  var form = document.querySelector('[data-blog-search]');
  var list = document.querySelector('[data-blog-list]');
  if (!form || !list) return;
  var query = form.querySelector('input');
  var loading = document.querySelector('[data-blog-loading]');
  var noPosts = document.querySelector('[data-blog-no-posts]');
  var error = document.querySelector('[data-blog-error]');
  var empty = document.querySelector('[data-blog-empty]');
  var results = document.querySelector('[data-blog-results]');
  var resultCount = document.querySelector('[data-blog-result-count]');
  var articles = [];
  var ready = false;
  var page = 1, pageSize = 10, previousTerm = '';
  var pagination = document.createElement('nav');
  pagination.className = 'blog-pagination'; pagination.setAttribute('aria-label', '블로그 페이지'); pagination.hidden = true;
  var prev = element('button', '', '이전'), pageInfo = element('span', 'blog-page-info'), next = element('button', '', '다음');
  prev.type = next.type = 'button'; pageInfo.setAttribute('aria-live', 'polite');
  pagination.append(prev, pageInfo, next); list.insertAdjacentElement('afterend', pagination);
  prev.addEventListener('click', function () { if (page > 1) { page--; search(); } });
  next.addEventListener('click', function () { page++; search(); });

  function normalize(text) {
    return String(text || '').normalize('NFC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  }
  function search() {
    var term = normalize(query.value);
    if (term !== previousTerm) { page = 1; previousTerm = term; }
    var words = term ? term.split(' ') : [];
    var matches = articles.filter(function (article) { return words.every(function (word) { return article.blogSearchText.includes(word); }); });
    var count = matches.length, totalPages = Math.max(1, Math.ceil(count / pageSize));
    page = Math.min(Math.max(1, page), totalPages);
    var visible = new Set(matches.slice((page - 1) * pageSize, page * pageSize));
    articles.forEach(function (article) {
      article.hidden = !visible.has(article);
      if (article.hidden) article.open = false;
    });
    pagination.hidden = !ready || totalPages <= 1;
    prev.disabled = page === 1; next.disabled = page === totalPages;
    pageInfo.textContent = page + ' / ' + totalPages;
    empty.hidden = !ready || !articles.length || count !== 0;
    results.hidden = !ready || !term;
    resultCount.textContent = String(count);
  }
  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function sourceLink(value) {
    if (!value) return null;
    try {
      var url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
      return url.href;
    } catch (error) { return null; }
  }
  function renderBody(content) {
    var body = element('div', 'blog-post-body');
    var lines = content.replace(/\r\n?/g, '\n').split('\n');
    var inSources = false;
    lines.forEach(function (line, index) {
      var text = line.trim();
      if (!text) {
        var spacer = element('div', 'blog-paragraph-gap');
        spacer.setAttribute('aria-hidden', 'true');
        body.appendChild(spacer);
        return;
      }
      if (text === '출처' || text === '참고문헌') {
        inSources = true;
        body.appendChild(element('h3', 'blog-source-heading', line));
        return;
      }
      var next = (lines[index + 1] || '').trim();
      var heading = !inSources && text.length <= 45 && next.length > text.length &&
        next.length >= 45 && !/[.!?。！？:：]$/.test(text) && !/^https?:\/\//i.test(text);
      body.appendChild(element(heading ? 'h3' : 'p', heading ? 'blog-subheading' : inSources ? 'blog-source' : 'blog-paragraph', line));
    });
    return body;
  }
  async function loadPosts() {
    try {
      var client = window.supabaseClient;
      if (!client) throw new Error('DB 연결 없음');
      var rows = [], size = 500, columns = 'id,post_date,title,content,content_html,source,source_url,source_links,slug,is_academic,seo_payload';
      while (true) {
        var result = await client.from('blog_posts').select(columns).eq('is_published', true)
          .order('post_date', { ascending: false }).order('id', { ascending: false })
          .range(rows.length, rows.length + size - 1);
        if (result.error && ['42703', 'PGRST204'].includes(result.error.code) && columns.includes(',seo_payload')) {
          columns = columns.replace(',seo_payload', '');
          continue;
        }
        if (result.error && ['42703', 'PGRST204'].includes(result.error.code) && columns.includes('source_links')) {
          columns = 'id,post_date,title,content,content_html,source,source_url';
          continue;
        }
        if (result.error && ['42703', 'PGRST204'].includes(result.error.code) && columns.includes('source_url')) {
          columns = 'id,post_date,title,content,content_html,source';
          continue;
        }
        if (result.error && ['42703', 'PGRST204'].includes(result.error.code) && columns.includes('content_html')) {
          columns = 'id,post_date,title,content';
          continue;
        }
        if (result.error || !Array.isArray(result.data)) throw result.error || new Error('조회 결과 없음');
        rows = rows.concat(result.data);
        if (result.data.length < size) break;
      }
      rows.forEach(function (post) {
        var article = element('details', 'blog-post');
        article.setAttribute('data-blog-post', '');
        // 작성자가 입력한 글은 HTML로 실행하거나 자동 번역하지 않습니다.
        article.setAttribute('translate', 'no');
        var date = element('time', '', post.post_date.replaceAll('-', '.'));
        date.dateTime = post.post_date;
        var searchParts = [post.title, post.post_date, post.content, post.source];
        var summary = element('summary', 'blog-post-summary');
        var heading = element('span', 'blog-post-summary-text');
        var titleRow = element('span', 'blog-post-title-row');
        titleRow.appendChild(element('span', 'blog-post-title', post.title));
        var meta = element('span', 'blog-post-meta');
        meta.appendChild(date);
        if (post.is_academic) meta.appendChild(element('span', 'blog-academic-badge', '학술정보'));
        var permalink = element('a', 'blog-article-link', '새페이지에서 보기');
        permalink.href = post.slug && /^[a-z0-9가-힣]+(?:-[a-z0-9가-힣]+)*$/.test(post.slug) ? '/blog/' + encodeURIComponent(post.slug) : '/blog/id/' + encodeURIComponent(post.id);
        permalink.target = '_blank'; permalink.rel = 'noopener noreferrer';
        permalink.addEventListener('click', function (event) { event.stopPropagation(); });
        meta.appendChild(permalink);
        heading.append(titleRow, meta);
        summary.append(heading, element('span', 'blog-post-toggle'));
        summary.lastChild.setAttribute('aria-hidden', 'true');
        var body;
        if (post.content_html) {
          body = element('div', 'blog-post-body blog-rich-body');
          var formatted = window.blogFormat.clean(post.content_html);
          searchParts.push(formatted.textContent);
          while (formatted.firstChild) body.appendChild(formatted.firstChild);
        } else {
          var intro = post.seo_payload && typeof post.seo_payload.answer_summary === 'string' ? post.seo_payload.answer_summary.trim() : '';
          var fullContent = post.content || '';
          if (intro && fullContent.startsWith(intro) && fullContent.slice(intro.length).trim()) {
            body = renderBody(fullContent.slice(intro.length).replace(/^\s*\n+/, ''));
            body.prepend(element('hr', 'blog-intro-divider'));
            body.prepend(element('p', 'blog-paragraph blog-intro', intro));
          } else body = renderBody(fullContent);
        }
        var entries = Array.isArray(post.source_links) ? post.source_links : [{ text: post.source, url: post.source_url }];
        entries = entries.filter(function (item) { return item && (typeof item.text === 'string' && item.text.trim() || typeof item.url === 'string' && sourceLink(item.url)); });
        if (entries.length) {
          body.appendChild(element('h3', 'blog-source-heading', '출처'));
          entries.forEach(function (entry) {
            var text = typeof entry.text === 'string' ? entry.text : '';
            var href = typeof entry.url === 'string' ? sourceLink(entry.url) : null;
            searchParts.push(text);
            if (href) {
              var source = element('div', 'blog-source');
              if (text) source.appendChild(element('span', 'blog-source-text', text));
              var link = element('a', 'blog-source-link-hint', '원문 보기 ↗');
              link.href = href;
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              source.appendChild(link);
              body.appendChild(source);
            } else if (text) body.appendChild(element('p', 'blog-source', text));
          });
        }
        article.blogSearchText = normalize(searchParts.join('\n'));
        var closeRow = element('div', 'blog-post-close-row');
        var closeButton = element('button', 'blog-post-close', '×');
        closeButton.type = 'button';
        closeButton.setAttribute('aria-label', '글 닫기');
        closeButton.addEventListener('click', function () {
          article.open = false;
          summary.focus();
        });
        closeRow.appendChild(closeButton);
        body.appendChild(closeRow);
        article.append(summary, body);
        list.appendChild(article);
        articles.push(article);
      });
      ready = true;
      noPosts.hidden = articles.length > 0;
      search();
    } catch (err) {
      list.replaceChildren();
      articles = [];
      error.hidden = false;
    } finally {
      loading.hidden = true;
    }
  }
  form.addEventListener('submit', function (event) { event.preventDefault(); search(); });
  query.addEventListener('input', function (event) { if (!event.isComposing) search(); });
  query.addEventListener('compositionend', search);
  loadPosts();
}());
