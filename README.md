# 🎓 SMART Nano Learning

แอปการเรียนรู้แบบนาโนเลิร์นนิ่ง วิชาการประกันภัย
วิทยาลัยอาชีวศึกษาสุรินทร์

เว็บฝั่งหน้าบ้าน (HTML/CSS/JS) วางบน **GitHub Pages** เชื่อมกับหลังบ้าน
**Google Apps Script + Google Sheets** ผ่าน JSONP

## โครงสร้าง

| ไฟล์ | หน้าที่ |
|------|---------|
| `index.html` | เข้าสู่ระบบ / โปรไฟล์นักเรียน |
| `lessons.html` | รายการบทเรียน |
| `quiz.html` | ทำแบบทดสอบ |
| `chatbot.html` | ถาม AI ครูประกันภัย (Gemini) |
| `badges.html` | เหรียญตราสมรรถนะ |
| `leaderboard.html` | ตารางอันดับคะแนน |
| `checkin.html` | เช็คอินภารกิจ QR |
| `style.css` | สไตล์รวม |
| `app.js` | ตัวช่วยเรียก API (JSONP) + เมนู |
| `config.js` | เก็บ `API_URL` ของ Apps Script (แก้ที่นี่ที่เดียว) |
| `Code.gs` | โค้ดหลังบ้าน (วางใน Google Apps Script — ไม่ได้ทำงานบน GitHub) |

## การเชื่อมต่อหลังบ้าน

หน้าเว็บเรียกข้อมูลผ่านตัวแปร `API_URL` ใน `config.js`
เวลา deploy Apps Script ใหม่แล้วได้ URL ใหม่ ให้แก้แค่บรรทัดเดียวใน `config.js`

> หมายเหตุ: ห้ามใช้ชื่อพารามิเตอร์ `sid` ในการเรียก Apps Script
> เพราะ Google สงวนไว้ (จะถูกปฏิเสธ 400) — โปรเจกต์นี้ใช้ชื่อ `student` แทน

## วิธี deploy หน้าเว็บ

อัปโหลดไฟล์ทั้งหมดขึ้น GitHub แล้วเปิด **Settings → Pages → Branch: main** เว็บจะออนไลน์ที่
`https://<username>.github.io/<repo>/`
