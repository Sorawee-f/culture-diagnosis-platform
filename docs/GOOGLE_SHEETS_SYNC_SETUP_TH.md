# ตั้งค่า Sync to Google Sheets — Culture Diagnosis v5.3

ระบบยังใช้ **Supabase เป็น Database หลัก** และใช้ Google Sheets เป็น Working / Analysis Layer สำหรับ HR

เมื่อ Admin กด **Sync to Google Sheets** ระบบจะส่งข้อมูลล่าสุดจาก Supabase ไปเขียนทับ Google Sheet 3 แท็บ:

- `Participants` — รายชื่อพนักงานและสถานะ Completed / Pending
- `Responses_Long` — 1 แถวต่อพนักงานต่อคำถาม เหมาะกับ Pivot / BI / Analysis
- `Responses_Wide` — 1 แถวต่อพนักงาน มี Current / Desired ของ S01–S12 เหมาะกับ Join กับ Engagement / Talent / Successor
- `Sync_Meta` — Survey Version และเวลาที่ Sync ล่าสุด

> การ Sync เป็นแบบ **กด Manual จาก Admin** เพื่อควบคุมว่าเมื่อไรจะส่งข้อมูลเข้า Sheet และป้องกันการยิง Google Apps Script ทุกครั้งที่ User Submit

## STEP 1 — สร้าง Google Sheet กลาง

สร้าง Google Sheet ใหม่ เช่น `Culture Diagnosis - HR Data`

แนะนำให้ตั้งสิทธิ์ไฟล์ให้เฉพาะ HR/ผู้เกี่ยวข้องเท่านั้น

## STEP 2 — เปิด Apps Script

ใน Google Sheet:

`Extensions → Apps Script`

ลบโค้ดตัวอย่าง แล้ว Copy โค้ดจากไฟล์:

`scripts/google-sheets-sync.gs`

กด Save

## STEP 3 — สร้าง Secret

สร้างข้อความสุ่มยาวอย่างน้อย 16 ตัวอักษร เช่น 32–64 ตัวอักษร แล้วเก็บไว้ใช้ทั้ง Google Apps Script และ Vercel

ใน Apps Script ไปที่:

`Project Settings → Script Properties → Add script property`

ตั้ง:

- Property: `SYNC_SECRET`
- Value: `<secret ที่สร้าง>`

## STEP 4 — Deploy Apps Script เป็น Web App

ไปที่:

`Deploy → New deployment → Select type: Web app`

ตั้ง:

- Execute as: `Me`
- Who has access: `Anyone`

กด Deploy และอนุญาตสิทธิ์ Google Sheet

Copy **Web app URL** ที่ได้

## STEP 5 — เพิ่ม Environment Variables ใน Vercel

Vercel → Project → Settings → Environment Variables

เพิ่ม:

`GOOGLE_SHEETS_WEBHOOK_URL=<Web app URL>`

`GOOGLE_SHEETS_SYNC_SECRET=<secret เดียวกับ Apps Script>`

ให้เปิดอย่างน้อย Production environment แล้ว Redeploy

## STEP 6 — ทดสอบ

Admin Dashboard → ผู้ตอบรายบุคคล → `Sync to Google Sheets`

ถ้าสำเร็จ ระบบจะแสดงจำนวนพนักงานและจำนวนแถวคำตอบที่ Sync และ Google Sheet จะมีแท็บ Participants / Responses_Long / Responses_Wide / Sync_Meta

## Export CSV

ในหน้า Admin มี:

- `Export All Responses (.csv)` — ดึงคำตอบทั้งหมดของ Survey Version ปัจจุบัน ไม่ขึ้นกับ BU/Department filter ที่กำลังเลือกอยู่
- `Export Individual Response` — อยู่ในหน้าต่างคำตอบรายบุคคล
- `Export Status` — Export รายชื่อที่กำลัง Filter พร้อมสถานะ Completed/Pending

CSV เป็น UTF-8 with BOM เพื่อให้ภาษาไทยเปิดใน Excel ได้ถูกต้อง
