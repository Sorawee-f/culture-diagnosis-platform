# Culture Survey Pilot Platform — v4.1 Mobile Test Flow

ระบบเดียวสำหรับทดลองแบบสำรวจวัฒนธรรมองค์กร 2 ชุด และเปรียบเทียบผลบน Admin Dashboard

- **Scenario-Based Survey**
- **Simplified Culture Survey**
- ทั้งสองชุดวัด 12 Workplace Dimensions และ Map กับ Clan, Adhocracy, Market และ Hierarchy

## Pilot Flow

```text
Employee Login
  ↓
ระบบกำหนดลำดับอัตโนมัติ
  ↓
Question Set 1
  ↓
Question Set 2
  ↓
Mini Interactive Demo: Side-by-Side vs Sequential
  ↓
Mode Test Result
  ↓
Pilot Complete
```

ผู้ทดสอบมีหน้าที่ทดลองระบบเท่านั้น จึงไม่มี:

- Feedback 5 ข้อหลังจบแต่ละชุด
- หน้าเลือกหรือแนะนำชุดคำถาม Scenario / Simple / Hybrid

## Mobile Responsive

หน้าผู้ตอบออกแบบแบบ Mobile-First:

- Current และ Desired เรียงบน–ล่างบนมือถือ
- ปุ่มคำตอบกว้างเต็มหน้าจอและรองรับการแตะ
- Progress, Navigation และสถานะการตอบปรับตามความกว้างจอ
- Mini Mode Test เรียง Mode A และ Mode B บน–ล่างบนมือถือ
- Desktop/Tablet จะขยายเป็นหลาย Column เมื่อมีพื้นที่เพียงพอ

## Admin Dashboard

- Completion Funnel: Scenario, Simple, ครบทั้งสองชุด และ Mode Test
- Filter ตาม BU / Department
- ผล Scenario-Based และ Simple Survey แยกกัน
- Current / Desired Profile, Ranking, Gap, Theme Suggestion และผลราย Dimension
- หน้า Comparison แสดง Top Archetype, Gap Direction, Mean Absolute Difference และเวลาเฉลี่ย
- หน้า Survey Mode Test สรุป Side-by-Side vs Sequential
- Export รายชื่อผู้ที่ยังทำ Pilot ไม่ครบ
- Import / Update Employee Master ด้วย CSV

## Deploy จาก v4

Database Schema ไม่เปลี่ยนจาก v4 หากเคย Run `supabase/migrate-to-pilot-v4.sql` แล้ว ไม่ต้อง Run ซ้ำ

แนะนำให้เปลี่ยน Vercel Environment Variable เป็น:

```text
SURVEY_VERSION=2026-pilot-v4-1
PROTOTYPE_MODE=true
MIN_GROUP_SIZE=7
```

สำหรับ Supabase Project ใหม่ ให้ Run:

```text
supabase/schema.sql
```

## Environment Variables

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SESSION_SECRET
ADMIN_USERNAME
ADMIN_PASSWORD_HASH
SURVEY_VERSION
PROTOTYPE_MODE
MIN_GROUP_SIZE
NEXT_PUBLIC_SURVEY_TITLE
NEXT_PUBLIC_ORGANIZATION_NAME
```

## Employee CSV Header

```text
employeeId,name,surname,nickname,email,BU,department,section,jobLevel,status
```

## Question Content

```text
src/data/surveys.ts
```

ต้นฉบับ:

```text
docs/Scenario-Based-Version-1.1.csv
docs/Simple-Survey-Version-1.1.csv
```

## Validation

```text
npm run lint
npm run build
```
