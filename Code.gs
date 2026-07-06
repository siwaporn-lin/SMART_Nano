/**
 * SMART Nano Learning — Google Apps Script API (เวอร์ชัน JSONP)
 * ใช้กับ Frontend ที่วางบน GitHub Pages
 */

const SS = SpreadsheetApp.getActiveSpreadsheet();

function doGet(e) {
  const callback = (e && e.parameter) ? e.parameter.callback : '';
  const result = processRequest(e);
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) { return doGet(e); }

function processRequest(e) {
  const p = (e && e.parameter) || {};
  const action = p.action || '';
  // 'sid' เป็นคำสงวนของ Google (Session ID) ถ้าค่ามีตัวอักษรจะถูกเด้ง 400
  // จึงใช้ชื่อ 'student' แทน แต่ยังรองรับ 'sid' เดิมไว้เผื่อความเข้ากันได้
  const sid = p.student || p.sid;
  try {
    switch (action) {
      case 'getStudents':    return apiGetAllStudents();
      case 'getStudent':     return apiGetStudent(sid);
      case 'getLessons':     return apiGetLessons();
      case 'getQuiz':        return apiGetQuiz(p.quizId);
      case 'submitQuiz':     return apiSubmitQuiz(sid, p.quizId, p.answers);
      case 'getBadges':      return apiGetStudentBadges(sid);
      case 'getLeaderboard': return apiGetLeaderboard();
      case 'checkin':        return apiCheckin(sid, p.missionCode);
      case 'getCheckins':    return apiGetStudentCheckins(sid);
      case 'chatbot':        return apiChatbot(sid, p.message);
      case 'getStudentByLine': return apiGetStudentByLine(p.line);
      case 'linkLine':         return apiLinkLine(p.line, sid, p.name);
      case 'ping':           return { ok: true, time: new Date() };
      default:               return { error: 'ไม่รู้จัก action: ' + action };
    }
  } catch (err) { return { error: err.message }; }
}

function getConfig(key) {
  const data = SS.getSheetByName('Config').getDataRange().getValues();
  for (let i = 1; i < data.length; i++) { if (data[i][0] === key) return data[i][1]; }
  return null;
}

function sheetToObjects(sheetName) {
  const sheet = SS.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {}; headers.forEach((h, i) => obj[h] = row[i]); return obj;
  });
}

function appendRow(sheetName, arr) { SS.getSheetByName(sheetName).appendRow(arr); }
function nextId(sheetName) { return SS.getSheetByName(sheetName).getLastRow(); }

function apiGetAllStudents() {
  return sheetToObjects('Students').filter(s => s.status === 'active')
    .map(s => ({ student_id: s.student_id, full_name: s.full_name, nickname: s.nickname }));
}

function apiGetStudent(sid) {
  const s = sheetToObjects('Students').find(x => x.student_id === sid);
  if (!s) return { error: 'ไม่พบนักเรียน' };
  return { student_id: s.student_id, full_name: s.full_name, nickname: s.nickname,
    total_points: Number(s.total_points) || 0, total_badges: Number(s.total_badges) || 0,
    total_quiz_passed: Number(s.total_quiz_passed) || 0 };
}

function apiGetLessons() {
  return sheetToObjects('Lessons').filter(l => l.status === 'active')
    .map(l => ({ lesson_id: l.lesson_id, lesson_no: l.lesson_no, lesson_name: l.lesson_name,
      description: l.description, video_url: l.video_url, infographic_url: l.infographic_url,
      material_url: l.material_url, quiz_id: l.quiz_id }));
}

function apiGetQuiz(quizId) {
  return sheetToObjects('QuizBank').filter(q => q.quiz_id === quizId)
    .map(q => ({ quiz_id: q.quiz_id, question_no: q.question_no, question: q.question,
      choice_a: q.choice_a, choice_b: q.choice_b, choice_c: q.choice_c, choice_d: q.choice_d }));
}

function apiSubmitQuiz(sid, quizId, answersJson) {
  let answers = {};
  try { answers = JSON.parse(answersJson); } catch (e) { answers = {}; }
  const bank = sheetToObjects('QuizBank').filter(q => q.quiz_id === quizId);
  if (bank.length === 0) return { error: 'ไม่พบชุดข้อสอบ' };
  let score = 0;
  bank.forEach(q => { if (answers[String(q.question_no)] === q.answer) score++; });
  const total = bank.length;
  const percent = Math.round(score / total * 100);
  const passPercent = Number(getConfig('quiz_pass_percent') || 60);
  const passed = percent >= passPercent;
  const prev = sheetToObjects('QuizResults').filter(r => r.student_id === sid && r.quiz_id === quizId);
  const attemptNo = prev.length + 1;
  const now = new Date();
  appendRow('QuizResults', ['R' + String(nextId('QuizResults')).padStart(4, '0'), sid, quizId, score, total, percent, passed, attemptNo, now, now]);
  let earnedPoints = 0;
  const passedBefore = prev.some(r => r.passed === true || r.passed === 'TRUE');
  if (passed && !passedBefore) {
    earnedPoints = Number(getConfig('points_per_quiz') || 10);
    addPoints(sid, earnedPoints, 'quiz', quizId, 'ผ่าน Quiz ' + quizId);
    updateStudentStat(sid, 'total_quiz_passed', 1);
    checkBadgeConditions(sid);
  }
  return { score, total, percent, passed, attempt: attemptNo, earnedPoints };
}

function addPoints(sid, pts, srcType, srcId, detail) {
  appendRow('Points', [nextId('Points'), sid, pts, srcType, srcId, detail, new Date()]);
  updateStudentStat(sid, 'total_points', pts);
}

function updateStudentStat(sid, col, add) {
  const sheet = SS.getSheetByName('Students');
  const data = sheet.getDataRange().getValues();
  const ci = data[0].indexOf(col);
  if (ci === -1) return;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === sid) { sheet.getRange(i + 1, ci + 1).setValue((Number(data[i][ci]) || 0) + add); return; }
  }
}

function apiGetStudentBadges(sid) {
  const earned = sheetToObjects('StudentBadges').filter(b => b.student_id === sid);
  return sheetToObjects('Badges').map(b => ({ badge_id: b.badge_id, badge_name: b.badge_name,
    competency_group: b.competency_group, description: b.description, icon_emoji: b.icon_emoji,
    earned: earned.some(e => e.badge_id === b.badge_id) }));
}

function awardBadge(sid, badgeId) {
  if (sheetToObjects('StudentBadges').some(b => b.student_id === sid && b.badge_id === badgeId)) return false;
  appendRow('StudentBadges', [nextId('StudentBadges'), sid, badgeId, new Date(), 'system']);
  addPoints(sid, Number(getConfig('points_per_badge') || 20), 'badge', badgeId, 'Badge ' + badgeId);
  updateStudentStat(sid, 'total_badges', 1);
  return true;
}

function checkBadgeConditions(sid) {
  const results = sheetToObjects('QuizResults').filter(r => r.student_id === sid);
  const checkins = sheetToObjects('QRCheckin').filter(c => c.student_id === sid);
  const chats = sheetToObjects('ChatbotLog').filter(c => c.student_id === sid);
  const passedIds = [...new Set(results.filter(r => r.passed === true || r.passed === 'TRUE').map(r => r.quiz_id))];
  if (results.length >= 1) awardBadge(sid, 'B10');
  if (chats.length >= 5) awardBadge(sid, 'B11');
  if (passedIds.length >= 6 && checkins.length >= 11) awardBadge(sid, 'B12');
}

function apiGetLeaderboard() {
  const checkins = sheetToObjects('QRCheckin');
  const sorted = sheetToObjects('Students').filter(s => s.status === 'active')
    .map(s => ({ student_id: s.student_id, full_name: s.full_name,
      total_points: Number(s.total_points) || 0, total_badges: Number(s.total_badges) || 0,
      total_quiz_passed: Number(s.total_quiz_passed) || 0,
      checkins: checkins.filter(c => c.student_id === s.student_id).length }))
    .sort((a, b) => b.total_points - a.total_points);
  sorted.forEach((s, i) => s.rank = i + 1);
  return sorted;
}

function apiCheckin(sid, code) {
  const m = sheetToObjects('QRMissions').find(x => x.mission_code === code);
  if (!m) return { error: 'ไม่พบภารกิจนี้' };
  if (sheetToObjects('QRCheckin').some(c => c.student_id === sid && c.mission_code === code))
    return { error: 'เช็คอินภารกิจนี้ไปแล้ว', duplicated: true };
  appendRow('QRCheckin', [nextId('QRCheckin'), sid, code, new Date(), true]);
  const pts = Number(getConfig('points_per_checkin') || 5);
  addPoints(sid, pts, 'checkin', code, 'เช็คอิน ' + m.mission_name);
  checkBadgeConditions(sid);
  return { success: true, mission: m.mission_name, points: pts };
}

function apiGetStudentCheckins(sid) {
  const done = sheetToObjects('QRCheckin').filter(c => c.student_id === sid);
  return sheetToObjects('QRMissions').map(m => ({ mission_code: m.mission_code,
    mission_name: m.mission_name, mission_type: m.mission_type,
    checked: done.some(c => c.mission_code === m.mission_code) }));
}

function apiChatbot(sid, message) {
  const apiKey = getConfig('gemini_api_key');
  if (!apiKey) return { error: 'ยังไม่ได้ตั้งค่า Gemini API Key' };
  const prompt = getConfig('chatbot_system_prompt') || 'คุณคือครูประกันภัย ตอบภาษาไทย สุภาพ เข้าใจง่าย';
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;
  try {
    const res = UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json',
      payload: JSON.stringify({ contents: [{ parts: [{ text: message }] }], systemInstruction: { parts: [{ text: prompt }] } }),
      muteHttpExceptions: true });
    const data = JSON.parse(res.getContentText());
    let reply = 'ขออภัย ไม่สามารถตอบได้';
    if (data.candidates && data.candidates[0] && data.candidates[0].content)
      reply = data.candidates[0].content.parts[0].text;
    appendRow('ChatbotLog', [nextId('ChatbotLog'), sid, message, reply, '', 0, new Date()]);
    if (sid) checkBadgeConditions(sid);
    return { reply };
  } catch (err) { return { error: 'AI ตอบไม่ได้: ' + err.message }; }
}

function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('updateDashboard').timeBased().everyHours(1).create();
}

function updateDashboard() {
  const students = sheetToObjects('Students').filter(s => s.status === 'active');
  const results = sheetToObjects('QuizResults');
  const passed = results.filter(r => r.passed === true || r.passed === 'TRUE');
  const now = new Date();
  const vals = [
    ['นักเรียนทั้งหมด', students.length, 'คน', now],
    ['นักเรียน Active', [...new Set(results.map(r => r.student_id))].length, 'คน', now],
    ['Quiz ที่ทำ', results.length, 'ครั้ง', now],
    ['Quiz ผ่าน', passed.length, 'ครั้ง', now],
    ['อัตราผ่าน', results.length ? Math.round(passed.length / results.length * 100) : 0, '%', now],
    ['Badge แจก', sheetToObjects('StudentBadges').length, 'อัน', now],
    ['คะแนนเฉลี่ย', students.length ? Math.round(students.reduce((s, x) => s + (Number(x.total_points) || 0), 0) / students.length) : 0, 'คะแนน', now],
    ['Chatbot ใช้', sheetToObjects('ChatbotLog').length, 'ครั้ง', now],
    ['เช็คอิน', sheetToObjects('QRCheckin').length, 'ครั้ง', now],
  ];
  SS.getSheetByName('Dashboard').getRange(2, 1, vals.length, 4).setValues(vals);
}

function testAPI() {
  Logger.log('นักเรียน: ' + apiGetAllStudents().length);
  Logger.log('บทเรียน: ' + apiGetLessons().length);
}

// ============================================================
// เชื่อม LINE Login (เฟส B) — จับคู่ LINE userId ↔ รหัสนักเรียน
// ตารางเก็บชื่อ 'LineUsers' (สร้างให้อัตโนมัติถ้ายังไม่มี)
// ============================================================
function lineSheet() {
  let sh = SS.getSheetByName('LineUsers');
  if (!sh) {
    sh = SS.insertSheet('LineUsers');
    sh.appendRow(['line_user_id', 'student_id', 'display_name', 'linked_at']);
  }
  return sh;
}

// เช็คว่า LINE คนนี้ผูกกับนักเรียนคนไหนแล้วหรือยัง
function apiGetStudentByLine(lineUid) {
  if (!lineUid) return { linked: false };
  const sh = SS.getSheetByName('LineUsers');
  if (!sh) return { linked: false };
  const rows = sheetToObjects('LineUsers').filter(r => r.line_user_id === lineUid);
  if (!rows.length) return { linked: false };
  const s = apiGetStudent(rows[0].student_id);
  if (s.error) return { linked: false };
  s.linked = true;
  return s;
}

// ผูก LINE คนนี้เข้ากับรหัสนักเรียน (ทำครั้งเดียวตอนเข้าครั้งแรก)
function apiLinkLine(lineUid, sid, name) {
  if (!lineUid) return { error: 'ไม่พบ LINE ID' };
  if (!sid)     return { error: 'กรุณาเลือกชื่อนักเรียน' };
  const sheet = lineSheet();
  const existing = sheetToObjects('LineUsers').filter(r => r.line_user_id === lineUid);
  if (existing.length) {
    const s0 = apiGetStudent(existing[0].student_id);
    if (!s0.error) { s0.linked = true; s0.already = true; return s0; }
  }
  const s = apiGetStudent(sid);
  if (s.error) return { error: 'ไม่พบนักเรียนรหัสนี้' };
  sheet.appendRow([lineUid, sid, name || '', new Date()]);
  s.linked = true;
  return s;
}
