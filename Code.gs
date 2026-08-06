/**
 * SMART Nano Learning - Backend (Google Apps Script, JSONP)
 * เก็บเฉพาะ "ข้อมูลนักเรียน" (เนื้อหา+ข้อสอบอยู่ใน data.js ฝั่งเว็บ)
 * ชีตทั้งหมดสร้างอัตโนมัติเมื่อถูกเรียกใช้ครั้งแรก - ไม่ต้องตั้งค่าเอง
 */
var SS = SpreadsheetApp.getActiveSpreadsheet();

// ===== ค่าคงที่ =====
var POINTS = { S:5, M:5, quiz:10, R:15, T:20, badge:20 };
var QUIZ_PASS = 60;               // ผ่าน >= 60%
var QUIZ_ANSWERS = {"1.1":{"1":"a","2":"b","3":"c","4":"d","5":"b"},"1.2":{"1":"b","2":"c","3":"a","4":"c","5":"b"},"1.3":{"1":"b","2":"a","3":"b","4":"c","5":"d"},"1.4":{"1":"b","2":"c","3":"a","4":"c","5":"b"},"1.5":{"1":"a","2":"b","3":"c","4":"d","5":"a"},"1.6":{"1":"b","2":"a","3":"b","4":"d","5":"c"},"1.7":{"1":"b","2":"a","3":"b","4":"a","5":"c"},"1.8":{"1":"b","2":"a","3":"b","4":"a","5":"c"},"1.9":{"1":"b","2":"c","3":"a","4":"b","5":"a"},"2.1":{"1":"b","2":"c","3":"d","4":"a","5":"b"},"2.2":{"1":"b","2":"d","3":"c","4":"a","5":"b"},"2.3":{"1":"b","2":"c","3":"d","4":"a","5":"c"},"2.4":{"1":"b","2":"c","3":"c","4":"c","5":"a"},"2.5":{"1":"b","2":"a","3":"c","4":"b","5":"d"},"2.6":{"1":"b","2":"c","3":"a","4":"c","5":"b"},"2.7":{"1":"b","2":"a","3":"a","4":"c","5":"d"},"2.8":{"1":"c","2":"b","3":"b","4":"c","5":"a"},"2.9":{"1":"b","2":"a","3":"c","4":"a","5":"b"},"2.10":{"1":"b","2":"c","3":"b","4":"c","5":"b"},"2.11":{"1":"b","2":"a","3":"a","4":"b","5":"c"},"2.12":{"1":"b","2":"c","3":"b","4":"b","5":"b"},"3.1":{"1":"b","2":"c","3":"b","4":"d","5":"a"},"3.2":{"1":"a","2":"b","3":"c","4":"b","5":"c"},"3.3":{"1":"a","2":"b","3":"c","4":"b","5":"d"},"3.4":{"1":"a","2":"d","3":"b","4":"c","5":"d"},"3.5":{"1":"b","2":"c","3":"d","4":"a","5":"b"},"3.6":{"1":"d","2":"c","3":"b","4":"a","5":"c"},"3.7":{"1":"a","2":"d","3":"b","4":"c","5":"b"},"3.8":{"1":"b","2":"c","3":"c","4":"a","5":"b"},"3.9":{"1":"b","2":"d","3":"c","4":"a","5":"c"},"4.1":{"1":"c","2":"b","3":"d","4":"c","5":"a"},"4.2":{"1":"a","2":"b","3":"c","4":"d","5":"b"},"4.3":{"1":"a","2":"b","3":"c","4":"d","5":"a"},"4.4":{"1":"b","2":"b","3":"c","4":"d","5":"a"},"4.5":{"1":"b","2":"c","3":"d","4":"a","5":"b"},"4.6":{"1":"b","2":"c","3":"a","4":"d","5":"c"},"4.7":{"1":"c","2":"b","3":"a","4":"d","5":"b"},"4.8":{"1":"b","2":"a","3":"c","4":"d","5":"a"},"4.9":{"1":"b","2":"c","3":"d","4":"a","5":"b"},"5.1":{"1":"b","2":"a","3":"c","4":"d","5":"b"},"5.2":{"1":"c","2":"b","3":"d","4":"a","5":"c"},"5.3":{"1":"d","2":"a","3":"c","4":"b","5":"c"},"5.4":{"1":"b","2":"d","3":"a","4":"c","5":"b"},"5.5":{"1":"b","2":"c","3":"b","4":"b","5":"c"},"5.6":{"1":"b","2":"b","3":"c","4":"d","5":"b"},"6.1":{"1":"a","2":"b","3":"c","4":"d","5":"b"},"6.2":{"1":"c","2":"d","3":"a","4":"c","5":"d"},"6.3":{"1":"a","2":"b","3":"d","4":"a","5":"b"},"6.4":{"1":"c","2":"a","3":"b","4":"c","5":"d"},"6.5":{"1":"b","2":"c","3":"d","4":"a","5":"c"},"6.6":{"1":"d","2":"a","3":"b","4":"d","5":"a"},"6.7":{"1":"b","2":"c","3":"a","4":"b","5":"c"},"6.8":{"1":"d","2":"d","3":"c","4":"b","5":"a"}};       // เฉลย (ซ่อนจากนักเรียน)
var TOPICS_BY_UNIT = {"1":["1.1","1.2","1.3","1.4","1.5","1.6","1.7","1.8","1.9"],"2":["2.1","2.2","2.3","2.4","2.5","2.6","2.7","2.8","2.9","2.10","2.11","2.12"],"3":["3.1","3.2","3.3","3.4","3.5","3.6","3.7","3.8","3.9"],"4":["4.1","4.2","4.3","4.4","4.5","4.6","4.7","4.8","4.9"],"5":["5.1","5.2","5.3","5.4","5.5","5.6"],"6":["6.1","6.2","6.3","6.4","6.5","6.6","6.7","6.8"]};     // เรื่องในแต่ละหน่วย
var BADGES = [
  {id:'C1',rule:'knowledge'}, {id:'C2',rule:'quiz_avg80'}, {id:'C3',rule:'transfer'},
  {id:'C4',rule:'reflect3'},
  {id:'U1',rule:'unit',u:1},{id:'U2',rule:'unit',u:2},{id:'U3',rule:'unit',u:3},
  {id:'U4',rule:'unit',u:4},{id:'U5',rule:'unit',u:5},{id:'U6',rule:'unit',u:6},
  {id:'S1',rule:'smartstar'},
  {id:'M1',rule:'topics',n:1},{id:'M2',rule:'topics',n:27},{id:'M3',rule:'topics',n:53}
];

// ===== HTTP (JSONP) =====
function doGet(e){
  var cb = (e && e.parameter) ? e.parameter.callback : '';
  var out = process(e);
  if (cb) return ContentService.createTextOutput(cb+'('+JSON.stringify(out)+')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(JSON.stringify(out))
      .setMimeType(ContentService.MimeType.JSON);
}
function doPost(e){ return doGet(e); }

function process(e){
  var p = (e && e.parameter) || {};
  var a = p.action || '';
  var sid = p.student || p.sid;   // 'sid' สงวนโดย Google - ใช้ 'student'
  try {
    switch(a){
      case 'ping':          return { ok:true, time:new Date() };
      case 'getStudents':   return getStudents();
      case 'lineLogin':     return lineLogin(p.line, p.name, p.picture);
      case 'linkLine':      return lineLogin(p.line, p.name, p.picture);
      case 'getStudent':    return getStudent(sid);
      case 'getProgress':   return getProgress(sid);
      case 'track':         return track(sid, p.topic, p.stage);
      case 'submitQuiz':    return submitQuiz(sid, p.topic, p.answers);
      case 'reflect':       return unitStage(sid, p.unit, 'R');
      case 'transfer':      return unitStage(sid, p.unit, 'T');
      case 'checkin':       return checkin(sid, p.missionCode || p.topic);
      case 'getLeaderboard':return getLeaderboard();
      default:              return { error:'ไม่รู้จัก action: '+a };
    }
  } catch(err){ return { error: String(err && err.message || err) }; }
}

// ===== ชีต (สร้างอัตโนมัติ) =====
function ensureSheet(name, headers){
  var sh = SS.getSheetByName(name);
  if (!sh){ sh = SS.insertSheet(name); sh.appendRow(headers); }
  else if (sh.getLastRow()===0){ sh.appendRow(headers); }
  return sh;
}
function S_Students(){ return ensureSheet('Students',
  ['student_id','full_name','nickname','total_points','status','line_user_id','picture_url','created_at','updated_at']); }
function S_Progress(){ return ensureSheet('Progress',['student_id','topic_id','stage','ts']); }
function S_UnitStage(){ return ensureSheet('UnitStage',['student_id','unit_id','stage','ts']); }
function S_Quiz(){ return ensureSheet('QuizResults',['student_id','topic_id','score','total','percent','passed','ts']); }
function S_Badges(){ return ensureSheet('StudentBadges',['student_id','badge_id','ts']); }
function S_Points(){ return ensureSheet('Points',['student_id','points','source','ref','detail','ts']); }

function objs(sh){
  var d = sh.getDataRange().getValues(); if (d.length<2) return [];
  var h = d[0], out=[];
  for (var i=1;i<d.length;i++){ var o={}; for (var j=0;j<h.length;j++) o[h[j]]=d[i][j]; out.push(o); }
  return out;
}

// ===== นักเรียน / ล็อกอิน =====
function getStudents(){
  return objs(S_Students()).filter(function(s){ return String(s.status)!=='inactive'; })
    .map(function(s){ return { student_id:String(s.student_id), full_name:s.full_name, nickname:s.nickname }; });
}
function findRow(sid){
  var sh=S_Students(), d=sh.getDataRange().getValues();
  for (var i=1;i<d.length;i++){ if (String(d[i][0])===String(sid)) return { sh:sh, i:i+1, row:d[i] }; }
  return null;
}
function getStudent(sid){
  if (!sid) return { error:'ไม่พบรหัสนักเรียน' };
  var r=findRow(sid); if (!r) return { error:'ไม่พบนักเรียน' };
  return { student_id:String(sid), full_name:r.row[1], nickname:r.row[2],
           total_points:Number(r.row[3])||0, picture_url:r.row[6]||'' };
}
function lineLogin(line, nameB64, picture){
  if (!line) return { error:'ไม่พบ LINE ID' };
  var name = decodeB64(nameB64);
  var r=findRow(line);
  var now=new Date();
  if (r){
    if (name){ r.sh.getRange(r.i,2).setValue(name); r.sh.getRange(r.i,3).setValue(name); }
    if (picture) r.sh.getRange(r.i,7).setValue(picture);
    r.sh.getRange(r.i,9).setValue(now);
    return getStudent(line);
  }
  S_Students().appendRow([line, name||'ผู้ใช้ LINE', name||'', 0, 'active', line, picture||'', now, now]);
  return getStudent(line);
}
function decodeB64(b64){
  if (!b64) return '';
  try { return Utilities.newBlob(Utilities.base64Decode(b64)).getDataAsString('UTF-8'); }
  catch(e){ return b64; }
}

// ===== คะแนน =====
function addPoints(sid, pts, source, ref, detail){
  S_Points().appendRow([sid, pts, source, ref||'', detail||'', new Date()]);
  var r=findRow(sid); if (r) r.sh.getRange(r.i,4).setValue((Number(r.row[3])||0)+pts);
}

// ===== ความก้าวหน้า =====
function hasProg(sid, topic, stage){
  return objs(S_Progress()).some(function(p){
    return String(p.student_id)===String(sid) && String(p.topic_id)===String(topic) && String(p.stage)===stage; });
}
function track(sid, topic, stage){    // S=วิดีโอ, M=eBook
  if (!sid) return { error:'ไม่พบรหัสนักเรียน' };
  if (!topic || (stage!=='S' && stage!=='M')) return { error:'ข้อมูลไม่ถูกต้อง' };
  if (hasProg(sid, topic, stage)) return { ok:true, already:true };
  S_Progress().appendRow([sid, topic, stage, new Date()]);
  var pts = stage==='S'?POINTS.S:POINTS.M;
  addPoints(sid, pts, stage==='S'?'video':'ebook', topic, 'เรื่อง '+topic);
  recalcBadges(sid);
  return { ok:true, awarded:pts };
}
function submitQuiz(sid, topic, answersJson){
  if (!sid) return { error:'ไม่พบรหัสนักเรียน' };
  var key = QUIZ_ANSWERS[topic];
  if (!key) return { error:'ไม่พบชุดข้อสอบ '+topic };
  var ans={}; try { ans=JSON.parse(answersJson); } catch(e){ ans={}; }
  var total=0, score=0;
  for (var qn in key){ total++; if (String(ans[qn])===String(key[qn])) score++; }
  var percent = total? Math.round(score/total*100):0;
  var passed = percent>=QUIZ_PASS;
  S_Quiz().appendRow([sid, topic, score, total, percent, passed, new Date()]);
  var earned=0;
  if (passed && !hasProg(sid, topic, 'A')){
    S_Progress().appendRow([sid, topic, 'A', new Date()]);
    earned=POINTS.quiz; addPoints(sid, earned, 'quiz', topic, 'ผ่านแบบทดสอบ '+topic);
  }
  recalcBadges(sid);
  return { score:score, total:total, percent:percent, passed:passed, earned:earned };
}
function unitStage(sid, unit, stage){
  if (!sid || !unit) return { error:'ข้อมูลไม่ครบ' };
  var exists = objs(S_UnitStage()).some(function(x){
    return String(x.student_id)===String(sid)&&String(x.unit_id)===String(unit)&&String(x.stage)===stage; });
  if (exists) return { ok:true, already:true };
  S_UnitStage().appendRow([sid, unit, stage, new Date()]);
  var pts = stage==='R'?POINTS.R:POINTS.T;
  addPoints(sid, pts, stage==='R'?'reflect':'transfer', 'U'+unit, (stage==='R'?'สะท้อนคิด':'ถ่ายทอด')+' หน่วย '+unit);
  recalcBadges(sid);
  return { ok:true, awarded:pts };
}
function checkin(sid, code){
  if (!code) return { error:'ไม่พบรหัสภารกิจ' };
  return track(sid, String(code), 'S');
}

// ===== Badge =====
function recalcBadges(sid){
  var prog=objs(S_Progress()).filter(function(p){ return String(p.student_id)===String(sid); });
  var us=objs(S_UnitStage()).filter(function(x){ return String(x.student_id)===String(sid); });
  var qz=objs(S_Quiz()).filter(function(q){ return String(q.student_id)===String(sid); });
  var have={}; prog.forEach(function(p){ have[p.topic_id+'|'+p.stage]=1; });
  var uhave={}; us.forEach(function(x){ uhave[x.unit_id+'|'+x.stage]=1; });

  function smaDone(t){ return have[t+'|S']&&have[t+'|M']&&have[t+'|A']; }
  function unitAllSMA(u){ var ts=TOPICS_BY_UNIT[String(u)]||[]; return ts.length>0 && ts.every(smaDone); }
  function unitComplete(u){ return unitAllSMA(u) && uhave[u+'|R'] && uhave[u+'|T']; }

  var topicsDone=0; for (var u in TOPICS_BY_UNIT){ (TOPICS_BY_UNIT[u]).forEach(function(t){ if (smaDone(t)) topicsDone++; }); }
  var reflectUnits={}; us.forEach(function(x){ if (String(x.stage)==='R') reflectUnits[x.unit_id]=1; });
  var transferN={}; us.forEach(function(x){ if (String(x.stage)==='T') transferN[x.unit_id]=1; });
  var best={}; qz.forEach(function(q){ var p=Number(q.percent)||0; if (!(q.topic_id in best)||p>best[q.topic_id]) best[q.topic_id]=p; });
  var pcts=[]; for (var t in best) pcts.push(best[t]);
  var avg = pcts.length? pcts.reduce(function(a,b){return a+b;},0)/pcts.length : 0;
  function unitQuizAllPassed(u){ var ts=TOPICS_BY_UNIT[String(u)]||[]; return ts.length>0 && ts.every(function(t){ return (best[t]||0)>=QUIZ_PASS; }); }
  var knowledge=false; for (var u2 in TOPICS_BY_UNIT){ if (unitQuizAllPassed(u2)) knowledge=true; }
  var anyUnit=false; for (var u3 in TOPICS_BY_UNIT){ if (unitComplete(u3)) anyUnit=true; }

  var earned={}; objs(S_Badges()).forEach(function(b){ if (String(b.student_id)===String(sid)) earned[b.badge_id]=1; });
  function award(id){ if (earned[id]) return; S_Badges().appendRow([sid, id, new Date()]); earned[id]=1;
    addPoints(sid, POINTS.badge, 'badge', id, 'ได้ Badge '+id); }

  BADGES.forEach(function(b){
    var ok=false;
    if (b.rule==='knowledge') ok=knowledge;
    else if (b.rule==='quiz_avg80') ok=(pcts.length>=5 && avg>=80);
    else if (b.rule==='transfer') ok=Object.keys(transferN).length>=1;
    else if (b.rule==='reflect3') ok=Object.keys(reflectUnits).length>=3;
    else if (b.rule==='unit') ok=unitComplete(b.u);
    else if (b.rule==='smartstar') ok=anyUnit;
    else if (b.rule==='topics') ok=topicsDone>=b.n;
    if (ok) award(b.id);
  });
}

// ===== รวมความก้าวหน้า =====
function getProgress(sid){
  if (!sid) return { error:'ไม่พบรหัสนักเรียน' };
  var st=getStudent(sid); if (st.error) return st;
  var prog=objs(S_Progress()).filter(function(p){ return String(p.student_id)===String(sid); });
  var us=objs(S_UnitStage()).filter(function(x){ return String(x.student_id)===String(sid); });
  var qz=objs(S_Quiz()).filter(function(q){ return String(q.student_id)===String(sid); });
  var badges=objs(S_Badges()).filter(function(b){ return String(b.student_id)===String(sid); }).map(function(b){ return b.badge_id; });
  var topics={};
  prog.forEach(function(p){ var t=p.topic_id; topics[t]=topics[t]||{}; topics[t][p.stage]=true; });
  var best={}; qz.forEach(function(q){ var p=Number(q.percent)||0; if (!(q.topic_id in best)||p>best[q.topic_id]) best[q.topic_id]=p; });
  for (var t in best){ topics[t]=topics[t]||{}; topics[t].quiz=best[t]; }
  var units={}; us.forEach(function(x){ units[x.unit_id]=units[x.unit_id]||{}; units[x.unit_id][x.stage]=true; });
  var lb=getLeaderboard(); var rank=0;
  for (var i=0;i<lb.length;i++){ if (String(lb[i].student_id)===String(sid)){ rank=lb[i].rank; break; } }
  return { student_id:String(sid), full_name:st.full_name, picture_url:st.picture_url,
           total_points:st.total_points, topics:topics, units:units, badges:badges, rank:rank };
}

function getLeaderboard(){
  var arr=objs(S_Students()).filter(function(s){ return String(s.status)!=='inactive'; })
    .map(function(s){ return { student_id:String(s.student_id), full_name:s.full_name,
      total_points:Number(s.total_points)||0 }; })
    .sort(function(a,b){ return b.total_points-a.total_points; });
  arr.forEach(function(s,i){ s.rank=i+1; });
  return arr;
}
