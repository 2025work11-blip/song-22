// 공지는 한국 날짜 기준 오늘부터 3개월 전 같은 날까지 조회합니다.
(function () {
  'use strict';
  function dateKey(date) { return date.toISOString().slice(0, 10); }
  window.loadRecentNotices = async function (now) {
    var client = window.supabaseClient;
    if (!client) throw new Error('공지 조회 연결을 사용할 수 없습니다.');
    var parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(now || new Date());
    function part(type) { return Number(parts.find(function (p) { return p.type === type; }).value); }
    var end = new Date(Date.UTC(part('year'), part('month') - 1, part('day')));
    // 5월 31일의 3개월 전은 2월 말일로 처리합니다.
    var start = new Date(Date.UTC(part('year'), part('month') - 4, 1));
    var lastDay = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
    start.setUTCDate(Math.min(part('day'), lastDay));
    var rows = [];
    var size = 1000;
    while (true) {
      var result = await client.from('notices').select('id,title,content,notice_date,image_url')
        .gte('notice_date', dateKey(start)).lte('notice_date', dateKey(end))
        .order('notice_date', { ascending: false }).order('id', { ascending: false })
        .range(rows.length, rows.length + size - 1);
      if (result.error) throw result.error;
      if (!Array.isArray(result.data)) throw new Error('공지 조회 결과를 확인할 수 없습니다.');
      rows = rows.concat(result.data);
      if (result.data.length < size) return rows;
    }
  };

  var list = document.querySelector('[data-notice-list]');
  if (!list) return;
  function make(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function message(text) {
    var node = make('p', 'schedule-empty', text);
    node.setAttribute('role', 'status');
    list.replaceChildren(node);
  }
  async function renderNotices() {
    message('공지사항을 불러오는 중입니다.');
    try {
      var notices = await window.loadRecentNotices();
      list.replaceChildren();
      if (!notices.length) {
        list.hidden = true;
        return;
      }
      list.hidden = false;
      notices.forEach(function (notice) {
        var item = make('details', 'notice-item');
        var summary = make('summary');
        var date = make('time', '', notice.notice_date.replaceAll('-', '.'));
        date.dateTime = notice.notice_date;
        summary.append(make('span', 'notice-item-title', notice.title), date, make('span', 'notice-expand', '+'));
        var content = make('div', 'notice-content');
        content.appendChild(make('p', 'notice-body-text', notice.content));
        if (notice.image_url) {
          try {
            var url = new URL(notice.image_url);
            if (url.protocol !== 'https:') throw new Error('Invalid image URL');
            var image = make('img', 'notice-image');
            image.alt = notice.title;
            image.loading = 'lazy';
            image.decoding = 'async';
            image.referrerPolicy = 'no-referrer';
            image.addEventListener('error', function () {
              image.hidden = true;
              content.appendChild(make('p', 'notice-image-error', '이미지를 불러올 수 없습니다.'));
            }, { once: true });
            image.src = url.href;
            content.appendChild(image);
          } catch (error) {
            content.appendChild(make('p', 'notice-image-error', '이미지를 불러올 수 없습니다.'));
          }
        }
        item.append(summary, content);
        list.appendChild(item);
      });
    } catch (error) {
      list.replaceChildren();
      list.hidden = true;
    }
  }
  renderNotices();
}());
