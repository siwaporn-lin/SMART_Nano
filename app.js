// ============================================================
// app.js — โค้ดร่วมทุกหน้า (JSONP + Session + Nav + Data helper)
// ============================================================
var D = window.SMART_DATA || { units:[], topics:[], quizzes:{}, badges:[], config:{} };

// ---------- เรียก API หลังบ้าน (JSONP) ----------
function callAPI(action, params, onDone){
  var url = API_URL + '?action=' + encodeURIComponent(action);
  if (params){ for (var k in params){ url += '&'+encodeURIComponent(k)+'='+encodeURIComponent(params[k]); } }
  var cb = '_cb_' + Math.random().toString(36).substr(2,9);
  url += '&callback=' + cb;
  var timer = setTimeout(function(){ window[cb]=function(){}; onDone({ error:'หมดเวลาเชื่อมต่อ' }); }, 15000);
  window[cb] = function(data){ clearTimeout(timer); try{ delete window[cb]; }catch(e){} onDone(data); };
  var s = document.createElement('script');
  s.src = url;
  s.onerror = function(){ clearTimeout(timer); onDone({ error:'เชื่อมต่อไม่สำเร็จ' }); };
  document.head.appendChild(s);
}

// ---------- Session ----------
function getSid(){
  try{
    var u = new URLSearchParams(location.search).get('sid');
    if (u){ localStorage.setItem('smart_sid', u); return u; }
    return localStorage.getItem('smart_sid') || '';
  }catch(e){ return ''; }
}
function setSid(id){ try{ localStorage.setItem('smart_sid', id); }catch(e){} }
function logout(){ try{ localStorage.removeItem('smart_sid'); }catch(e){} location.href='index.html'; }
function requireSid(){
  var sid = getSid();
  if (!sid){ location.href='index.html'; return ''; }
  return sid;
}

// ---------- Data helper ----------
function unitById(id){ for (var i=0;i<D.units.length;i++){ if (String(D.units[i].id)===String(id)) return D.units[i]; } return null; }
function topicById(id){ for (var i=0;i<D.topics.length;i++){ if (String(D.topics[i].id)===String(id)) return D.topics[i]; } return null; }
function topicsOfUnit(uid){ return D.topics.filter(function(t){ return String(t.unit)===String(uid); }); }
function quizOfTopic(tid){ return D.quizzes[tid] || []; }
function cfg(key, def){ var v=D.config[key]; return (v===undefined||v==='')?def:v; }

// ---------- ระดับตามคะแนน ----------
function levelInfo(points){
  var tiers=[{min:0,name:'มือใหม่'},{min:100,name:'ผู้เรียนรู้'},{min:300,name:'นักผจญภัย'},
             {min:600,name:'ผู้เชี่ยวชาญ'},{min:1000,name:'ปรมาจารย์'}];
  var i=0; for (var k=0;k<tiers.length;k++){ if (points>=tiers[k].min) i=k; }
  var cur=tiers[i], next=tiers[i+1];
  if (!next) return { name:cur.name, text:points+' คะแนน', pct:100 };
  return { name:cur.name, text:points+'/'+next.min, pct:Math.round(points/next.min*100) };
}

// ---------- เมนูล่าง ----------
function buildNav(active){
  var q = '';
  var items=[
    ['home','🏠','หน้าแรก','index.html'],
    ['learn','📚','เรียนรู้','learn.html'],
    ['badges','🎖️','เหรียญ','badges.html'],
    ['rank','🏆','อันดับ','leaderboard.html']
  ];
  var html='';
  for (var i=0;i<items.length;i++){
    var it=items[i], cls=(it[0]===active)?'active':'';
    html+='<a href="'+it[3]+q+'" class="'+cls+'"><span class="ic">'+it[1]+'</span>'+it[2]+'</a>';
  }
  var nav=document.createElement('div'); nav.className='nav'; nav.innerHTML=html;
  document.body.appendChild(nav);
}

// ---------- Toast ----------
function toast(msg){
  var t=document.createElement('div'); t.className='toast'; t.innerHTML=msg;
  document.body.appendChild(t);
  requestAnimationFrame(function(){ t.classList.add('show'); });
  setTimeout(function(){ t.classList.remove('show'); setTimeout(function(){ t.remove(); },300); }, 2200);
}

// ---------- escape ----------
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
