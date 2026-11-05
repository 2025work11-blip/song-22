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
  var articles = [];
  var ready = false;

  function search() {
    var term = query.value.trim().toLocaleLowerCase();
    var count = 0;
    articles.forEach(function (article) {
      var matches = !term || article.textContent.toLocaleLowerCase().includes(term);
      article.hidden = !matches;
      if (matches) count += 1;
    });
    empty.hidden = !ready || !articles.length || count !== 0;
  }
  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  async function loadPosts() {
    try {
      var client = window.supabaseClient;
      if (!client) throw new Error('DB 연결 없음');
      var rows = [], size = 500;
      while (true) {
        var result = await client.from('blog_posts').select('id,post_date,title,content')
          .order('post_date', { ascending: false }).order('id', { ascending: false })
          .range(rows.length, rows.length + size - 1);
        if (result.error || !Array.isArray(result.data)) throw result.error || new Error('조회 결과 없음');
        rows = rows.concat(result.data);
        if (result.data.length < size) break;
      }
      rows.forEach(function (post) {
        var article = element('article', 'blog-post');
        article.setAttribute('data-blog-post', '');
        // 작성자가 입력한 글은 HTML로 실행하거나 자동 번역하지 않습니다.
        article.setAttribute('translate', 'no');
        var date = element('time', '', post.post_date.replaceAll('-', '.'));
        date.dateTime = post.post_date;
        article.append(element('h2', '', post.title), date, element('p', '', post.content));
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
  query.addEventListener('input', search);
  loadPosts();
}());
