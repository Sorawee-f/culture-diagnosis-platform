# วิธีอัปเดต v4 เป็น v4.1 แบบเร็ว

## 1. Supabase

หากเคย Run ไฟล์นี้แล้ว:

```text
supabase/migrate-to-pilot-v4.sql
```

ไม่ต้อง Run SQL เพิ่ม เพราะ v4.1 ปรับเฉพาะ Flow และ UI

## 2. Vercel Environment Variables

แนะนำให้เปลี่ยน:

```text
SURVEY_VERSION=2026-pilot-v4-1
```

และเก็บค่า:

```text
PROTOTYPE_MODE=true
MIN_GROUP_SIZE=7
```

การเปลี่ยน Version ช่วยแยกข้อมูลทดสอบ v4.1 ออกจากข้อมูลเดิม

## 3. อัปโหลดไฟล์เข้า GitHub

นำไฟล์ใน Project ไปเขียนทับ Repository เดิม แล้ว Commit Changes จากนั้น Vercel จะ Deploy อัตโนมัติ

## 4. Smoke Test ผ่านมือถือ

ใช้พนักงานทดสอบอย่างน้อย 2 รหัส:

- คนที่ 1 ได้ Scenario ก่อน
- คนที่ 2 ได้ Simple ก่อน

ตรวจ Flow:

```text
Login
→ Pilot Hub
→ ชุดที่ 1
→ ชุดที่ 2
→ Survey Mode Test
→ Completed
```

ตรวจบนมือถือทั้งแนวตั้งและแนวนอน:

- ไม่มีข้อความหรือปุ่มล้นขอบจอ
- Current และ Desired เรียงบน–ล่าง
- แตะตัวเลือกได้สะดวก
- ปุ่มก่อนหน้า/ถัดไปมองเห็นครบ
- Mode A และ Mode B เรียงบน–ล่าง

ตรวจ Admin:

```text
ภาพรวม Pilot
Scenario-Based
Simple Survey
เปรียบเทียบผล
Survey Mode Test
```

## 5. Reset ข้อมูลก่อนเปิดห้องทดสอบ

```text
supabase/reset-survey.sql
```

คำสั่งนี้ไม่ลบ Employee Master
