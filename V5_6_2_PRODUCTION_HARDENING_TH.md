# v5.6.2 Production Hardening

- Autosave draft แยกตาม employeeId + surveyVersion + surveyType
- ล้าง legacy shared draft key
- ลดการนำทางซ้ำหลัง Login/Submit
- เพิ่ม Employee Logout
- เปลี่ยน Current / Desired ที่พนักงานเห็นเป็นภาษาไทย
- เปลี่ยน “มักเป็นแบบไหน” เป็นข้อความกลาง

ไม่มี SQL migration และไม่เปลี่ยน scoring / option mapping.
