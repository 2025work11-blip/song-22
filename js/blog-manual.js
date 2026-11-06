(async function () {
  'use strict';
  var container = document.querySelector('[data-manual-blog-content]');
  if (!container || !window.supabaseClient || !window.blogFormat) return;
  var id = container.getAttribute('data-manual-blog-content');
  if (!/^[1-9]\d*$/.test(id)) return;
  try {
    var result = await window.supabaseClient.from('blog_posts').select('content_html').eq('id', id).maybeSingle();
    if (result.error || !result.data || !result.data.content_html) return;
    var clean = window.blogFormat.clean(result.data.content_html);
    container.replaceChildren();
    while (clean.firstChild) container.appendChild(clean.firstChild);
    container.classList.add('blog-rich-body');
  } catch (error) { /* 서버에서 제공한 텍스트를 유지합니다. */ }
}());
