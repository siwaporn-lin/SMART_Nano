// ============================================================
// app.js — โค้ดหลักร่วมทุกหน้า (JSONP + Session + Nav)
// ============================================================

function callAPI(action, params, onDone) {
  var url = API_URL + '?action=' + encodeURIComponent(action);
  if (params) { for (var k in params) { url += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); } }
  var cb = '_cb_' + Math.random().toString(36).substr(2, 9);
  url += '&callback=' + cb;
  var timer = setTimeout(function() { window[cb] = function(){}; onDone({ error: 'หมดเวลาเชื่อมต่อ' }); }, 15000);
  window[cb] = function(data) { clearTimeout(timer); try { delete window[cb]; } catch(e){} onDone(data); };
  var s = document.createElement('script');
  s.src = url;
  s.onerror = function() { clearTimeout(timer); onDone({ error: 'เชื่อมต่อไม่สำเร็จ' }); };
  document.head.appendChild(s);
}

function getSid() {
  try {
    var u = new URLSearchParams(window.location.search).get('sid');
    if (u) { localStorage.setItem('smart_sid', u); return u; }
    return localStorage.getItem('smart_sid') || '';
  } catch(e) { return ''; }
}

function logout() {
  try { localStorage.removeItem('smart_sid'); } catch(e) {}
  window.location.href = 'index.html';
}

function buildNav(active, sid) {
  var q = sid ? ('?sid=' + encodeURIComponent(sid)) : '';
  var items = [
    ['home','🏠','หน้าแรก','index.html'],
    ['lessons','📚','บทเรียน','lessons.html'],
    ['chatbot','🤖','AI','chatbot.html'],
    ['badges','🎖️','Badge','badges.html'],
    ['leaderboard','🏆','อันดับ','leaderboard.html'],
    ['checkin','📍','เช็คอิน','checkin.html']
  ];
  var html = '';
  for (var i=0;i<items.length;i++) {
    var it = items[i];
    var cls = (it[0]===active) ? 'active' : '';
    html += '<a href="'+it[3]+q+'" class="'+cls+'"><span class="ic">'+it[1]+'</span>'+it[2]+'</a>';
  }
  var nav = document.createElement('div');
  nav.className = 'nav';
  nav.innerHTML = html;
  document.body.appendChild(nav);
}
