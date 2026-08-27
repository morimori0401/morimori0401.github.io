(function() {
  var SPOILER_START = String.fromCharCode(62, 33); // >!
  var SPOILER_END = String.fromCharCode(33, 60);   // !<

  function parseSpoilers(text) {
    if (!text) return '';
    var result = '';
    var curr = text;

    while (curr.indexOf(SPOILER_START) !== -1) {
      if (curr.indexOf(SPOILER_END) === -1) break;

      var start = curr.indexOf(SPOILER_START);
      var end = curr.indexOf(SPOILER_END, start);
      if (end === -1) break;

      result += curr.substring(0, start);
      var content = curr.substring(start + 2, end);
      result += '<span class="spoiler" title="点击显示剧透内容" onclick="this.classList.toggle(\'revealed\')">' + content + '</span>';
      curr = curr.substring(end + 2);
    }
    result += curr;
    return result;
  }

  function renderStars(rating) {
    if (!rating && rating !== 0) return '';
    var num = parseFloat(rating);
    if (isNaN(num)) return '';

    var score = Math.min(5, Math.max(0, Math.round(num / 2)));
    return '★'.repeat(score) + '☆'.repeat(5 - score) + ' (' + num + '分)';
  }

  function initNeoDB() {
    var btnGrid = document.getElementById('btn-grid');
    var btnFeed = document.getElementById('btn-feed');
    var gridView = document.getElementById('grid-view');
    var feedView = document.getElementById('feed-view');
    var loading = document.getElementById('neodb-loading');
    var sidebarTimeline = document.getElementById('sidebar-timeline');

    if (!gridView || !feedView) return;

    if (btnGrid && btnFeed) {
      btnGrid.onclick = function() {
        gridView.style.display = 'grid';
        feedView.style.display = 'none';
        btnGrid.classList.add('active');
        btnFeed.classList.remove('active');
      };
      btnFeed.onclick = function() {
        gridView.style.display = 'none';
        feedView.style.display = 'flex';
        btnFeed.classList.add('active');
        btnGrid.classList.remove('active');
      };
    }

    fetch('/neodb_data.json?v=' + new Date().getTime())
      .then(function(res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function(items) {
        if (!items || items.length === 0) {
          if (loading) loading.innerText = '暂无已标记的书影音';
          return;
        }

        gridView.innerHTML = '';
        feedView.innerHTML = '';
        if (sidebarTimeline) sidebarTimeline.innerHTML = '';

        var timelineMap = {};
        var createdMonthIds = {}; // 记录哪些月份的锚点已经创建

        items.forEach(function(item) {
          var dateStr = item.created_time || '';
          var year = '其他';
          var yearMonth = '其他';

          if (dateStr && typeof dateStr === 'string' && dateStr.indexOf('-') !== -1) {
            var parts = dateStr.split('-');
            year = parts[0];
            if (parts.length >= 2) {
              yearMonth = parts[0] + '-' + parts[1];
            }
          }

          if (!timelineMap[year]) timelineMap[year] = {};
          if (!timelineMap[year][yearMonth]) timelineMap[year][yearMonth] = [];
          timelineMap[year][yearMonth].push(item);

          // 1. 瀑布流视图卡片
          var gItem = document.createElement('a');
          gItem.className = 'grid-card';
          gItem.href = item.link || '#';
          gItem.target = '_blank';
          gItem.title = (item.title || '') + ' (' + dateStr + ')';

          // 如果这个月份在瀑布流中还没有锚点，给第一个遇到的元素分配 ID
          if (yearMonth !== '其他' && !createdMonthIds['grid-' + yearMonth]) {
            gItem.id = 'sec-' + yearMonth; // 在瀑布流视图下提供跳转目标
            createdMonthIds['grid-' + yearMonth] = true;
          }

          if (item.cover) {
            var img = document.createElement('img');
            img.src = item.cover;
            img.alt = item.title || '';
            img.referrerPolicy = 'no-referrer';
            img.onerror = function() {
              var fallback = document.createElement('div');
              fallback.className = 'title-fallback';
              fallback.innerText = item.title || '';
              if (this.parentNode) {
                this.parentNode.replaceChild(fallback, this);
              }
            };
            gItem.appendChild(img);
          } else {
            var fallback = document.createElement('div');
            fallback.className = 'title-fallback';
            fallback.innerText = item.title || '';
            gItem.appendChild(fallback);
          }
          gridView.appendChild(gItem);

          // 2. 动态详情视图卡片
          var fItem = document.createElement('div');
          fItem.className = 'feed-card';

          // 如果这个月份在动态视图中还没有锚点，给第一个遇到的元素分配同一个 ID 基础
          if (yearMonth !== '其他' && !createdMonthIds['feed-' + yearMonth]) {
            // 如果是在动态视图下，赋予锚点；如果当前处于瀑布流视图，浏览器会自动滚动到上面的 gItem 锚点
            if (!gItem.id) {
              fItem.id = 'sec-' + yearMonth;
            }
            createdMonthIds['feed-' + yearMonth] = true;
          }

          if (item.cover) {
            var coverDiv = document.createElement('div');
            coverDiv.className = 'feed-cover';
            var fImg = document.createElement('img');
            fImg.src = item.cover;
            fImg.alt = item.title || '';
            fImg.referrerPolicy = 'no-referrer';
            fImg.onerror = function() {
              if (this.parentNode) this.parentNode.style.display = 'none';
            };
            coverDiv.appendChild(fImg);
            fItem.appendChild(coverDiv);
          }

          var infoDiv = document.createElement('div');
          infoDiv.className = 'feed-info';

          var headerDiv = document.createElement('div');
          headerDiv.className = 'feed-header';
          headerDiv.innerHTML = '<span class="feed-title"><a href="' + (item.link || '#') + '" target="_blank">' + (item.title || '') + '</a></span><span class="feed-date">' + dateStr + '</span>';
          infoDiv.appendChild(headerDiv);

          if (item.rating || item.rating === 0) {
            var ratingDiv = document.createElement('div');
            ratingDiv.className = 'feed-rating';
            ratingDiv.innerText = renderStars(item.rating);
            infoDiv.appendChild(ratingDiv);
          }

          var parsedComment = parseSpoilers(item.comment);
          var commentDiv = document.createElement('div');
          commentDiv.className = 'feed-comment';
          if (parsedComment) {
            commentDiv.innerHTML = parsedComment;
          } else {
            commentDiv.style.color = '#999';
            commentDiv.style.fontStyle = 'italic';
            commentDiv.innerText = '暂无文字评语';
          }
          infoDiv.appendChild(commentDiv);

          fItem.appendChild(infoDiv);
          feedView.appendChild(fItem);
        });

        // 3. 时间轴渲染
        if (sidebarTimeline) {
          Object.keys(timelineMap).sort(function(a, b) { return b.localeCompare(a); }).forEach(function(year) {
            var yearEl = document.createElement('div');
            yearEl.className = 'archive-year';
            yearEl.innerText = year;
            sidebarTimeline.appendChild(yearEl);

            var monthUl = document.createElement('ul');
            monthUl.className = 'archive-month-list';

            Object.keys(timelineMap[year]).sort(function(a, b) { return b.localeCompare(a); }).forEach(function(ym) {
              var count = timelineMap[year][ym].length;
              var li = document.createElement('li');
              li.className = 'archive-month-item';
              li.innerHTML = '<a href="#sec-' + ym + '">' + ym + ' (' + count + ')</a>';
              monthUl.appendChild(li);
            });
            sidebarTimeline.appendChild(monthUl);
          });
        }

        if (loading) loading.style.display = 'none';
      })
      .catch(function(err) {
        console.error('NeoDB 加载失败:', err);
        if (loading) loading.innerText = '加载失败：' + err.message;
      });
  }

  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    initNeoDB();
  } else {
    document.addEventListener('DOMContentLoaded', initNeoDB);
  }
  document.addEventListener('pjax:complete', initNeoDB);
  document.addEventListener('pjax:success', initNeoDB);
})();