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

    // 将文本中的换行符转换成 HTML 的换行标签 <br>
    return result.replace(/\n/g, '<br>');
  }

  function renderStars(rating) {
    if (!rating && rating !== 0) return '';
    var num = parseFloat(rating);
    if (isNaN(num)) return '';

    var score = Math.min(5, Math.max(0, Math.round(num / 2)));
    return '★'.repeat(score) + '☆'.repeat(5 - score) + ' (' + num + '分)';
  }

  // 提取评语的通用辅助函数（兼容多种 NeoDB JSON 导出格式）
  function extractComment(item) {
    if (!item) return '';

    // 1. 优先尝试短评
    if (item.comment && typeof item.comment === 'string' && item.comment.trim() !== '') {
      return item.comment;
    }

    // 2. 尝试长评的各种可能字段与嵌套层级
    if (typeof item.review === 'string' && item.review.trim() !== '') {
      return item.review;
    }
    if (item.review && typeof item.review === 'object') {
      if (item.review.content) return item.review.content;
      if (item.review.body) return item.review.body;
      if (item.review.text) return item.review.text;
    }

    if (item.review_body) return item.review_body;
    if (item.review_content) return item.review_content;
    if (item.review_text) return item.review_text;
    if (item.description) return item.description;

    return '';
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
        var createdMonthGridIds = {};
        var createdMonthFeedIds = {};

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

          // 为网格视图独立设置每个月份的锚点 ID（前缀 grid-sec-）
          if (yearMonth !== '其他' && !createdMonthGridIds[yearMonth]) {
            gItem.id = 'grid-sec-' + yearMonth;
            createdMonthGridIds[yearMonth] = true;
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

          // 为动态视图独立设置每个月份的锚点 ID（前缀 feed-sec-）
          if (yearMonth !== '其他' && !createdMonthFeedIds[yearMonth]) {
            fItem.id = 'feed-sec-' + yearMonth;
            createdMonthFeedIds[yearMonth] = true;
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

          var rawComment = extractComment(item);
          var parsedComment = parseSpoilers(rawComment);

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

        // 3. 时间轴渲染（根据当前所处视图智能匹配并滚动）
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

              var aTag = document.createElement('a');
              aTag.href = '#';
              aTag.innerText = ym + ' (' + count + ')';

              aTag.onclick = function(e) {
                e.preventDefault();
                // 判断当前是网格视图还是动态详情视图
                var isGridActive = gridView && gridView.style.display !== 'none';

                var targetId = isGridActive ? ('grid-sec-' + ym) : ('feed-sec-' + ym);
                var targetEl = document.getElementById(targetId);

                if (targetEl) {
                  targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              };

              li.appendChild(aTag);
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