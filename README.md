# Culture Diagnosis Platform

ระบบ Scenario-based Culture Assessment สำหรับวัด **Current Culture vs Desired Culture** ด้วย 4 Culture Archetypes: Clan, Adhocracy, Market และ Hierarchy

## Features

### Employee
- Login ด้วยรหัสพนักงาน และพิมพ์รหัสพนักงานซ้ำเป็น Password
- ทำแบบประเมิน 12 สถานการณ์ โดยเลือก Current 1 ตัวเลือก และ Desired 1 ตัวเลือก
- ส่งได้เพียงครั้งเดียว โดยบังคับผ่าน Database Transaction และ Unique Constraint
- หลังส่งเห็น Current / Desired Culture Profile และ Culture Gap ของตนเองทันที

### Admin
- Admin Login แยกจาก Employee
- ดู Eligible, Completed และ Response Rate
- Filter ตาม BU / Department
- Radar / Bar chart สำหรับ Current และ Desired
- Rank และ Culture Theme Suggestions เบื้องต้นจาก Gap
- ดูและ Export รายชื่อผู้ที่ยังไม่ตอบ
- Import / Update Employee Master ด้วย CSV

## Privacy Design

ระบบแยกข้อมูล 2 ส่วน:
1. `participant_completions` เก็บว่า Employee ID ใดตอบแล้ว เพื่อกันตอบซ้ำและ Tracking ผู้ยังไม่ตอบ
2. `survey_responses` เก็บคำตอบแบบไม่ใส่ Employee ID โดยเก็บเฉพาะ BU/Department/Section/Job Level snapshot สำหรับ Aggregate Analysis

จึงไม่สามารถเปิด Dashboard แล้วดูว่า “พนักงานคนใดตอบตัวเลือกอะไร” ได้จากโครงสร้างปกติ

> หมายเหตุ: Login แบบ Password = Employee ID มีความปลอดภัยด้านการยืนยันตัวตนต่ำ หากใช้งานจริงกับข้อมูลอ่อนไหว ควรเปลี่ยนเป็น Employee ID + DOB 6 หลัก หรือ Email OTP

## Technology
- Next.js App Router + TypeScript
- Tailwind CSS v4 + Prompt font
- Supabase PostgreSQL
- Recharts
- Deploy on Vercel

## 1. Create Supabase Project
1. Create a new Supabase project.
2. Open **SQL Editor**.
3. Run `supabase/schema.sql` ทั้งก้อน.
4. Import employee data ได้ 2 วิธี:
   - เปิดเว็บ `/admin/dashboard` แล้ว Upload CSV
   - Import `sample-employees.csv` ผ่าน Supabase Table Editor แล้วแก้ Header ให้ตรง database columns

## 2. Create Environment Variables
Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Generate admin password hash:

```bash
npm install
npm run hash-password -- "Change-This-Strong-Password"
```

นำ Hash ที่ได้ไปใส่ `ADMIN_PASSWORD_HASH`

Environment variables ที่ต้องมี:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` **ห้ามใช้ใน Client และห้าม Commit ลง GitHub**
- `SESSION_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `SURVEY_VERSION`
- `MIN_GROUP_SIZE` (แนะนำ 7–10 คน)

Generate session secret example:

```bash
openssl rand -base64 48
```

## 3. Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`

## 4. Deploy to GitHub and Vercel

```bash
git init
git add .
git commit -m "Initial culture diagnosis platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

In Vercel:
1. Add New Project
2. Import GitHub repository
3. Add all environment variables from `.env.local`
4. Deploy

## Employee CSV Header

```text
employeeId,name,surname,nickname,email,BU,department,section,jobLevel,status
```

`status` ใช้ `active` หรือ `inactive`

## Survey Content
Questions อยู่ที่:

```text
src/data/scenarios.ts
```

แต่ละตัวเลือกต้อง map ไปยัง Archetype หนึ่งประเภท ห้ามเพิ่ม/ลบ Scenario โดยไม่แก้ validation และตรวจความสมดุลของคำถาม

## Culture Theme Suggestion Logic
Dashboard แนะนำ Theme จาก Aggregate Gap แบบ rule-based:
- Clan → Cross-team Collaboration & Trust
- Adhocracy → Agility, Innovation & Experimentation
- Market → Ownership, Accountability & Result Focus
- Hierarchy → Role Clarity & Operating Discipline

Suggestion เป็นเพียง **Strategic Culture Hypothesis / Initial Insight** ต้องนำไปตรวจสอบกับ Focus Group และ Business Direction ก่อนสรุป Core Values

## Production Checklist
- เปลี่ยน Login จาก Password = Employee ID เป็น DOB หรือ OTP
- ทดสอบ End-to-End อย่างน้อย 30–50 users ก่อนเปิดจริง
- ตรวจ Header และจำนวนพนักงานใน Employee Master
- ตั้ง Admin Password ที่แข็งแรง
- ทดสอบ Mobile / Tablet / Desktop
- Backup Database ก่อน Reset Survey
- ระบบบังคับ Minimum Group Size ผ่าน `MIN_GROUP_SIZE` ก่อนแสดงผล Culture Profile ของกลุ่มย่อย
- แจ้ง Privacy Notice ให้ชัดว่า Admin เห็น Participation แต่ไม่เห็นคำตอบรายบุคคล

## Reset Test Data
Run `supabase/reset-survey.sql` เฉพาะรอบทดสอบ ก่อนเปิด Production เท่านั้น
