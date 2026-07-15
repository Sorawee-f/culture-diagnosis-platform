# Go-Live Checklist

## Data
- [ ] Employee Master ครบทุกคนและ status ถูกต้อง
- [ ] BU / Department / Section ใช้คำสะกดมาตรฐานเดียวกัน
- [ ] จำนวน Eligible Employees ตรงกับ HR Database
- [ ] ลบ Sample Employees ก่อนเปิดจริง

## Security & Privacy
- [ ] เปลี่ยน Admin Password
- [ ] ใช้ SESSION_SECRET ใหม่
- [ ] ตรวจว่า SUPABASE_SERVICE_ROLE_KEY อยู่เฉพาะ Vercel Environment Variables
- [ ] ตั้ง `MIN_GROUP_SIZE` อย่างน้อย 7
- [ ] ประกาศ Privacy Notice
- [ ] ตัดสินใจว่าจะใช้ Employee ID ซ้ำ หรือเพิ่ม DOB / OTP

## Survey
- [ ] Pilot 30–50 คน
- [ ] ตรวจ Mobile ทุกขนาด
- [ ] ตรวจคำถาม Current / Desired ไม่สลับกัน
- [ ] ทดสอบ Tie Result
- [ ] ทดสอบกดส่งซ้ำและเปิดหลาย Tab

## Operations
- [ ] ตั้ง Survey Start / Close Communication
- [ ] กำหนด Admin ผู้ติดตาม Response Rate
- [ ] กำหนดรอบ Reminder
- [ ] Backup Database
- [ ] เตรียม Focus Group หลัง Survey

## Technical Test
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Login Employee ถูก / ผิด
- [ ] Login Admin ถูก / ผิด
- [ ] CSV Import
- [ ] BU / Department Filter
- [ ] Export Non-responders
- [ ] Privacy suppression ของกลุ่มต่ำกว่า MIN_GROUP_SIZE
