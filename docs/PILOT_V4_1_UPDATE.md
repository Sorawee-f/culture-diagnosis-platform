# Pilot v4.1 — Mobile Test Flow

## สิ่งที่ตัดออก

1. Feedback 5 ข้อหลังแบบสำรวจแต่ละชุด
2. หน้าให้ผู้ทดสอบเลือก Scenario / Simple / Hybrid

ผู้ทดสอบทำหน้าที่ทดลองระบบและทำแบบสำรวจทั้งสองชุดเท่านั้น การตัดสินใจเลือกชุดคำถามใช้ข้อมูลจาก Admin Dashboard และการพิจารณาของทีมโครงการ

## Flow ใหม่

```text
Login
→ Pilot Hub
→ ชุดคำถามที่ 1
→ ชุดคำถามที่ 2
→ Mini Mode Test
→ Completed
```

## สิ่งที่ยังคงไว้

- ระบบสลับลำดับ Scenario → Simple / Simple → Scenario
- Side-by-Side เป็น Flow หลักของแบบสำรวจทั้งสองชุด
- Mini Interactive Demo เปรียบเทียบ Side-by-Side กับ Sequential
- Admin Dashboard แยกผลสองชุดและแสดง Comparison
- Dashboard สรุปผล Survey Mode Test

## Mobile Responsive

- Participant pages ใช้ Mobile-First layout
- Survey Choice Panels เรียงบน–ล่างเมื่อหน้าจอเล็ก
- ปุ่มเลือกคำตอบเป็น Full Width
- Mode A และ Mode B เรียงบน–ล่างบนมือถือ
- ไม่มีตารางกว้างในหน้าผู้ตอบ
