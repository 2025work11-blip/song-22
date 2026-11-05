(function () {
  'use strict';
  var fontSizes = { 1: 12, 2: 14, 3: 16, 4: 18, 5: 20, 6: 24, 7: 28 };

  // 저장된 HTML은 신뢰하지 않고 표시 가능한 태그와 스타일만 복사합니다.
  function clean(html) {
    var template = document.createElement('template');
    template.innerHTML = html || '';
    var result = document.createElement('div');
    function copy(node, parent) {
      if (node.nodeType === 3) { parent.appendChild(document.createTextNode(node.nodeValue)); return; }
      if (node.nodeType !== 1) return;
      var tag = node.tagName.toLowerCase();
      if (['script', 'style', 'iframe', 'object', 'svg', 'video'].includes(tag)) return;
      if (tag === 'img') {
        try {
          var url = new URL(node.getAttribute('src'));
          if (url.protocol !== 'https:') return;
          var img = document.createElement('img');
          img.src = url.href;
          img.alt = node.getAttribute('alt') || '';
          img.loading = 'lazy';
          parent.appendChild(img);
        } catch (error) { /* 올바른 HTTPS 사진만 표시합니다. */ }
        return;
      }
      var out = parent;
      if (['div', 'p', 'br', 'b', 'strong', 'span', 'font'].includes(tag)) {
        out = document.createElement(tag === 'font' ? 'span' : tag);
        if (tag === 'font' && fontSizes[node.getAttribute('size')]) out.style.fontSize = fontSizes[node.getAttribute('size')] + 'px';
        if (tag === 'span') {
          var size = parseInt(node.style.fontSize, 10);
          if (node.style.fontSize === size + 'px' && Object.values(fontSizes).includes(size)) out.style.fontSize = size + 'px';
          if (node.style.fontWeight === 'bold' || node.style.fontWeight === '700') out.style.fontWeight = '700';
        }
        parent.appendChild(out);
      }
      Array.from(node.childNodes).forEach(function (child) { copy(child, out); });
    }
    Array.from(template.content.childNodes).forEach(function (child) { copy(child, result); });
    return result;
  }
  function splitLegacy(content) {
    var match = /(?:^|\n)\s*(?:출처|참고문헌)\s*\n/.exec(content || '');
    if (!match) return { content: content || '', source: '' };
    return { content: content.slice(0, match.index).replace(/\s+$/, ''), source: content.slice(match.index + match[0].length).trim() };
  }
  window.blogFormat = { clean: clean, splitLegacy: splitLegacy };
}());
