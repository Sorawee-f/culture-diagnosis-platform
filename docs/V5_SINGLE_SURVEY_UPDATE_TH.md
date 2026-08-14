# Culture Diagnosis v5 — Single Survey Update

## สิ่งที่เปลี่ยน

1. เหลือแบบประเมิน Scenario-Based เพียง 1 ชุด จำนวน 12 ข้อ
2. ใช้ Current / Desired แบบ Side-by-Side เท่านั้น
3. ปรับถ้อยคำ S01–S12 ตามข้อมูลล่าสุดที่ให้มา
4. หลัง Login แสดง Pop-up คำอธิบายและวิธีตอบ พร้อมปุ่ม “เข้าใจและตกลง”
5. Admin เห็นสถานะผู้ตอบรายบุคคล และเปิดดู Current / Desired รายข้อได้
6. หลังส่งแบบประเมิน พนักงานเห็น Culture Profile ของตนเอง พร้อมคำอธิบายว่าเป็นภาพสะท้อนจากคำตอบ ไม่ใช่การประเมินบุคคล
7. Session พนักงานเพิ่มจาก 8 ชั่วโมงเป็น 12 ชั่วโมง
8. เพิ่ม autosave คำตอบใน sessionStorage เพื่อช่วยกรณีหน้าเว็บ Reload ระหว่างทำ
9. ผลคำตอบใหม่ผูก employee_id เพื่อให้ Admin ใช้วิเคราะห์ภายในได้

## สำคัญก่อน Deploy

### 1) Run SQL Migration

Supabase → SQL Editor → Run:

`supabase/migrate-to-single-survey-v5.sql`

Migration นี้จะเพิ่ม `employee_id` ใน `survey_responses` และปรับ RPC `submit_culture_survey` ให้บันทึกรหัสพนักงานกับคำตอบใหม่

### 2) เปลี่ยน Vercel Environment Variable

ตั้งค่า:

`SURVEY_VERSION=2026-culture-v1`

ควรใช้ Version ใหม่เพื่อไม่ให้ข้อมูล Pilot เดิมปะปนกับแบบประเมินชุดจริง

จากนั้น Redeploy Vercel

## หมายเหตุเรื่องข้อคำถาม

ข้อมูลล่าสุดที่ได้รับในข้อความมี Option A, B, C แต่ไม่ได้มีข้อความ Option D และ Mapping C/D ครบทุกแถว ดังนั้น v5 นี้ใช้ข้อความ A–C ตามที่ให้มา และคง Option D + Mapping ของ Option C/D จาก Scenario-Based ชุดเดิม เพื่อไม่สร้างข้อความใหม่เอง หากมี Option D ฉบับ final ให้แก้ใน `src/data/surveys.ts` ได้โดยตรง

## Performance / Concurrent Users

Flow ผู้ใช้งานทั่วไปค่อนข้างเบา:

- Login: query employee 1 ครั้ง + insert login event 1 ครั้ง
- ระหว่างตอบ 12 ข้อ: ไม่มีการเขียนฐานข้อมูลทุกครั้งที่กดคำตอบ; draft เก็บใน Browser
- Submit: เรียก API 1 ครั้ง และบันทึกด้วย Supabase RPC transaction
- Result: query response ของผู้ใช้ 1 รายการ

จึงเหมาะกับการเปิดใช้พร้อมกันระดับหลักร้อยโดยสถาปัตยกรรมปัจจุบัน แต่ความจุจริงขึ้นอยู่กับ Vercel/Supabase plan, connection limits และ traffic ณ เวลาจริง ควรทำ load test ก่อนเปิดทั้งองค์กรหากคาดว่าหลายร้อยถึงหลักพันคนจะกดส่งในช่วงเวลาเดียวกัน

## v5.3 Data Export & Google Sheets

เพิ่ม Admin tools:
- Export All Responses (.csv)
- Export Individual Response (.csv)
- Sync to Google Sheets แบบ Manual

ดูขั้นตอนตั้งค่าใน `docs/GOOGLE_SHEETS_SYNC_SETUP_TH.md`
