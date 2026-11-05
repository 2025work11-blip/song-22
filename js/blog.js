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

  function normalize(text) {
    return String(text || '').normalize('NFC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  }
  function search() {
    var term = normalize(query.value);
    var words = term ? term.split(' ') : [];
    var count = 0;
    articles.forEach(function (article) {
      var matches = words.every(function (word) { return article.blogSearchText.includes(word); });
      article.hidden = !matches;
      if (matches) count += 1;
    });
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
      var rows = [], size = 500, columns = 'id,post_date,title,content,content_html,source,source_url,source_links,slug';
      while (true) {
        var result = await client.from('blog_posts').select(columns)
          .order('post_date', { ascending: false }).order('id', { ascending: false })
          .range(rows.length, rows.length + size - 1);
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
        heading.append(element('span', 'blog-post-title', post.title), date);
        summary.append(heading, element('span', 'blog-post-toggle'));
        summary.lastChild.setAttribute('aria-hidden', 'true');
        var body;
        if (post.content_html) {
          body = element('div', 'blog-post-body blog-rich-body');
          var formatted = window.blogFormat.clean(post.content_html);
          searchParts.push(formatted.textContent);
          while (formatted.firstChild) body.appendChild(formatted.firstChild);
        } else {
          body = renderBody(post.content);
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
              var link = element('a', 'blog-source blog-source-link');
              link.href = href;
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              if (text) link.appendChild(element('span', 'blog-source-text', text));
              link.appendChild(element('span', 'blog-source-link-hint', '원문 보기 ↗ (새 탭)'));
              link.appendChild(element('span', 'blog-source-url', href));
              body.appendChild(link);
            } else if (text) body.appendChild(element('p', 'blog-source', text));
          });
        }
        article.blogSearchText = normalize(searchParts.join('\n'));
        if (post.slug && /^[a-z0-9가-힣]+(?:-[a-z0-9가-힣]+)*$/.test(post.slug)) { var permalink = element('a', 'blog-article-link', '개별 글 보기'); permalink.href = '/blog/' + encodeURIComponent(post.slug); body.prepend(permalink); }
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
