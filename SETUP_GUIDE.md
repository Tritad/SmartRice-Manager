# 🌾 ระบบบัญชีนาข้าว — คู่มือการติดตั้งและ Deploy

## ภาพรวมระบบ
- **Frontend**: React + Vite → Deploy บน Vercel (ฟรี)
- **Auth**: Firebase Authentication (Google + Email)
- **Backend/API**: Google Apps Script Web App (ฟรี)
- **Database**: Google Sheets

---

## ขั้นตอนที่ 1: ตั้งค่า Google Sheets

1. ไปที่ [Google Sheets](https://sheets.google.com) → สร้าง Spreadsheet ใหม่
2. ตั้งชื่อว่า `rice-farm-finance`
3. คัดลอก **Sheet ID** จาก URL:
   ```
   https://docs.google.com/spreadsheets/d/<<COPY_THIS_ID>>/edit
   ```

---

## ขั้นตอนที่ 2: ตั้งค่า Google Apps Script (Backend)

1. เปิด Google Sheets → **Extensions → Apps Script**
2. ลบโค้ดเดิมทั้งหมด วางโค้ดจากไฟล์ `google-apps-script/Code.gs`
3. เปลี่ยน `YOUR_GOOGLE_SHEET_ID_HERE` เป็น Sheet ID ที่คัดลอกมา
4. รัน `setupSheets()` ครั้งแรก (เพื่อสร้าง headers)
5. **Deploy** → **New deployment**:
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. คัดลอก **Web App URL** เก็บไว้

---

## ขั้นตอนที่ 3: ตั้งค่า Firebase

1. ไปที่ [Firebase Console](https://console.firebase.google.com)
2. **Add project** → ตั้งชื่อ `rice-farm-finance`
3. **Authentication** → **Get started** → เปิดใช้:
   - **Google** (Sign-in provider)
   - **Email/Password**
4. **Project Settings** → **Your apps** → เพิ่ม **Web app** (</> icon)
5. คัดลอก firebaseConfig ทั้งหมด

---

## ขั้นตอนที่ 4: ตั้งค่า Environment Variables

คัดลอกไฟล์ `.env.example` เป็นชื่อ `.env`:
```bash
cp .env.example .env
```

เปิดไฟล์ `.env` และใส่ค่าที่ได้จาก Firebase และ Apps Script:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc

VITE_GAS_URL=https://script.google.com/macros/s/YOUR_ID/exec
```

---

## ขั้นตอนที่ 5: รันและ Deploy

### รันบนเครื่องก่อน
```bash
npm install
npm run dev
```
เปิด http://localhost:5173 ทดสอบระบบ

### Deploy บน Vercel (ฟรี)

**วิธีที่ 1: ผ่าน Vercel CLI**
```bash
npm install -g vercel
vercel
```

**วิธีที่ 2: ผ่าน GitHub (แนะนำ)**
1. Push โค้ดขึ้น GitHub
2. ไปที่ [vercel.com](https://vercel.com) → **New Project** → Import จาก GitHub
3. ตั้งค่า Environment Variables ใน Vercel Dashboard:
   - Settings → Environment Variables
   - ใส่ค่าทุกตัวจาก `.env` ของคุณ
4. กด **Deploy** → รอ 2-3 นาที ได้ URL ทันที!

---

## โครงสร้างข้อมูลใน Google Sheets

### Sheet: `transactions`
| id | userId | userEmail | date | type | category | amount | description | season | createdAt |
|----|--------|-----------|------|------|----------|--------|-------------|--------|-----------|
| uuid | uid | email | 2024-03-15 | expense | ค่าปุ๋ย/ยา | 3500 | ปุ๋ยยูเรีย | นาปี 2567 | ISO datetime |

---

## หมวดหมู่ค่าใช้จ่ายในระบบ

**รายจ่าย (expense):**
- ค่าเมล็ดพันธุ์
- ค่าปุ๋ย/ยา
- ค่าแรงงาน
- ค่าเครื่องจักร/เช่า
- ค่าน้ำมัน
- ค่าเช่าที่นา
- ค่าไฟ/น้ำ
- อื่นๆ

**รายรับ (income):**
- รายรับจากการขาย
- เงินอุดหนุน
- ขายพืชร่วม
- อื่นๆ

---

## การแก้ปัญหาที่พบบ่อย

### CORS Error จาก Apps Script
→ ตรวจสอบว่า Deploy เป็น "Anyone" access และ re-deploy หลังแก้โค้ด

### Firebase auth/unauthorized-domain
→ ไปที่ Firebase Console → Authentication → Settings → **Authorized domains** → เพิ่ม URL ของ Vercel

### ข้อมูลไม่เข้า Sheets
→ รัน `setupSheets()` ใน Apps Script อีกครั้งเพื่อสร้าง headers

---

## ค่าใช้จ่าย (ฟรีทั้งหมด!)
| บริการ | แผนฟรี | ขีดจำกัด |
|--------|--------|---------|
| Vercel | Hobby (ฟรี) | 100GB bandwidth/เดือน |
| Firebase Auth | Spark (ฟรี) | 10,000 users/เดือน |
| Google Apps Script | ฟรี | 6 นาที/รัน, 90 นาที/วัน |
| Google Sheets | ฟรี | 10M cells |
