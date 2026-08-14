# ตั้งค่า Sync to Google Sheets — Culture Diagnosis v5.5.2

Supabase ยังเป็น Database หลัก ส่วน Google Sheets เป็น Working / Analysis Layer สำหรับ HR

เมื่อ Admin กด **Sync to Google Sheets** ระบบจะเขียนข้อมูลล่าสุดลง 4 แท็บ:

- `Participants` — รายชื่อพนักงานและสถานะ Completed / Pending
- `Responses_Long` — 1 แถวต่อพนักงานต่อคำถาม
- `Responses_Wide` — 1 แถวต่อพนักงาน พร้อม Current / Desired ของ S01–S12
- `Sync_Meta` — Version, เวลา Sync และจำนวนแถวที่ได้รับ

## STEP 1 — สร้าง/เลือก Google Sheet กลาง

ตัวอย่างชื่อ `Culture Diagnosis - HR Data`

## STEP 2 — เปิด Apps Script จาก Google Sheet เป้าหมาย

ไปที่ `Extensions → Apps Script`

ลบโค้ดตัวอย่าง แล้ว Copy โค้ดจาก `scripts/google-sheets-sync.gs` ไปวางและ Save

> ควรเปิด Apps Script ผ่าน Google Sheet เป้าหมาย ไม่ควรสร้างเป็น Standalone Script ที่ script.google.com

## STEP 3 — ตั้ง SYNC_SECRET

Apps Script → `Project Settings → Script Properties → Add script property`

- Property: `SYNC_SECRET`
- Value: secret เดียวกับ Vercel `GOOGLE_SHEETS_SYNC_SECRET`

## STEP 4 — ผูก Spreadsheet ID (สำคัญ)

กลับหน้า Editor เลือก Function `setupSpreadsheetId` แล้วกด **Run** 1 ครั้ง และอนุญาตสิทธิ์

Script จะบันทึก `SPREADSHEET_ID` ของ Google Sheet นี้ไว้ใน Script Properties อัตโนมัติ

ตรวจที่ Project Settings แล้วควรเห็นทั้ง:

- `SYNC_SECRET`
- `SPREADSHEET_ID`

## STEP 5 — Deploy เป็น Web App

`Deploy → New deployment → Web app`

- Execute as: `Me`
- Who has access: `Anyone`

กด Deploy และ Copy URL ที่ลงท้ายด้วย `/exec`

> ถ้าเคย Deploy แล้วและมีการแก้ Apps Script ให้ใช้ `Deploy → Manage deployments → Edit → New version → Deploy` เพื่อให้ Web App ใช้โค้ดล่าสุด

## STEP 6 — Vercel Environment Variables

ตั้ง:

- `GOOGLE_SHEETS_WEBHOOK_URL=<Web App /exec URL>`
- `GOOGLE_SHEETS_SYNC_SECRET=<ค่าเดียวกับ SYNC_SECRET>`

จากนั้น Redeploy Vercel

## STEP 7 — ตรวจ Web App ก่อน Sync

เปิด Web App `/exec` URL ใน Browser จะต้องเห็น JSON คล้าย:

`{"ok":true,"service":"Culture Diagnosis Google Sheets Sync","spreadsheetConfigured":true,"secretConfigured":true}`

ถ้า `spreadsheetConfigured:false` ให้กลับไปรัน `setupSpreadsheetId()`

## STEP 8 — ทดสอบจาก Admin

Admin Dashboard → `Sync to Google Sheets`

ถ้าสำเร็จจะขึ้นจำนวนคนและจำนวนแถวคำตอบ และ Google Sheet จะมีแท็บทั้ง 4

### ถ้าขึ้น Sync สำเร็จแต่ Responses_Long เป็น 0

ตรวจว่า:

1. Vercel `SURVEY_VERSION` ตรงกับข้อมูลที่เพิ่งตอบ เช่น `2026-culture-v1`
2. `survey_responses.employee_id` ของคำตอบใหม่ไม่เป็น NULL
3. เคย Run `supabase/migrate-to-single-survey-v5.sql` ก่อนรับคำตอบชุดใหม่แล้ว

ข้อมูล Pilot เก่าที่สร้างก่อน migration อาจไม่มี `employee_id` และจะไม่สามารถจับคู่เป็นรายบุคคลใน Export/Sync แบบใหม่ได้โดยอัตโนมัติ
