# คำศัพท์งานโรงแรม (hotel-vocab)

เว็บคำศัพท์และประโยคภาษาอังกฤษ–จีน สำหรับงานโรงแรม แบ่งเป็น 4 หมวด หมวดละ 15 คำ
ทุกคำมีภาษาไทย อังกฤษ จีน และพินอิน พร้อมปุ่มฟังเสียงอ่าน (ใช้เสียงที่มีในมือถือ)

เขียนด้วย HTML + Tailwind CSS (CLI) + JavaScript ล้วน และฝากเว็บไว้ที่ Cloudflare Pages

## 1. สิ่งที่ต้องมีในเครื่อง

- [Node.js](https://nodejs.org/) เวอร์ชัน 22 (LTS)
- [Git](https://git-scm.com/)

เช็คว่ามีแล้วหรือยัง โดยเปิด Command Prompt หรือ PowerShell แล้วพิมพ์:

```
node --version
git --version
```

## 2. ดูตัวอย่างในเครื่อง

เปิด Command Prompt ที่โฟลเดอร์ `C:\khem` แล้วรัน:

```
npm install
npm run dev
```

จากนั้นเปิดเบราว์เซอร์ไปที่ http://localhost:5173 แก้ไฟล์แล้วกดรีเฟรชเพื่อดูผล ถ้าจะหยุด ให้กด `Ctrl + C`

> ปุ่มฟังเสียงจะขึ้นเฉพาะในเบราว์เซอร์ที่มีเสียงภาษานั้นในเครื่อง ถ้าไม่มีเสียง ปุ่มจะถูกซ่อน

## 3. แก้หรือเพิ่มคำศัพท์

คำศัพท์ทั้งหมดอยู่ในไฟล์ `public/js/data.js` ไฟล์เดียว ตัวอย่างหนึ่งรายการ:

```js
{ th: 'เช็คอิน', en: 'Check-in', zh: '办理入住', pinyin: 'Bànlǐ rùzhù' },
```

- ห้ามใส่เลขลำดับข้างหน้าคำภาษาไทย เพราะเว็บใส่เลขให้เอง
- ถ้าอยากให้คำไหนมี 2 แบบ ให้คั่นด้วย ` / ` เช่น `'Key card / Room key'` แล้วเสียงอ่านจะอ่านทั้งสองคำ
- **แก้เสร็จแล้วให้รัน `npm test` ทุกครั้ง** ชุดทดสอบจะตรวจว่าข้อมูลครบ ไม่มีช่องว่าง และภาษาไทยไม่เพี้ยน
- ถ้าเพิ่มหรือลดจำนวนคำในหมวด ต้องแก้ตัวเลข `15` ในไฟล์ `tests/data.test.js` ด้วย

## 4. เอาโค้ดขึ้น GitHub (ครั้งแรก)

1. เข้า GitHub แล้วสร้าง repository ใหม่ชื่อ `hotel-vocab` แนะนำให้ตั้งเป็น **Private** และไม่ต้องติ๊กสร้าง README
2. ที่โฟลเดอร์ `C:\khem` รันคำสั่งเหล่านี้ (เปลี่ยน `<ชื่อบัญชี>` เป็นชื่อบัญชี GitHub ของคุณ):

```
git init -b main
git add .
git commit -m "first version"
git remote add origin https://github.com/<ชื่อบัญชี>/hotel-vocab.git
git push -u origin main
```

ไฟล์ `node_modules/` และ `public/styles.css` จะไม่ถูกส่งขึ้นไป เพราะ Cloudflare จะสร้างให้เองตอน build

## 5. สร้างเว็บบน Cloudflare Pages (ครั้งแรก)

1. เข้า Cloudflare dashboard → **Workers & Pages**
2. เลือก **Create application** → **Pages** → **Connect to Git**
3. เลือก **GitHub** → เลือก repo `hotel-vocab` → **Install & Authorize** → **Begin setup**
4. ตั้งค่าดังนี้:

   | ช่อง | ใส่ค่า |
   |---|---|
   | Project name | `hotel-vocab` |
   | Production branch | `main` |
   | Framework preset | None (ไม่เลือก) |
   | Build command | `npm run build` |
   | Build output directory | `public` |

5. กด **Save and Deploy** แล้วรอให้ build เสร็จ ประมาณ 1–2 นาที
6. **ดูลิงก์จริงที่ได้** ปกติจะเป็น `https://hotel-vocab.pages.dev` แต่ถ้าชื่อนี้มีคนใช้แล้ว Cloudflare จะเติมตัวอักษรต่อท้ายให้ **ให้ใช้ลิงก์ที่ Cloudflare แสดงไปทำ QR**

> ⚠️ อย่าลบโปรเจกต์นี้แล้วสร้างใหม่ เพราะลิงก์อาจเปลี่ยน และ QR ที่แปะไว้จะใช้ไม่ได้

## 6. ทดสอบบนมือถือจริงก่อนทำ QR

เปิดลิงก์บนมือถือในแต่ละที่ต่อไปนี้:

- [ ] iPhone: Safari
- [ ] Android: Chrome
- [ ] ส่งลิงก์เข้า LINE แล้วกดเปิดจากใน LINE (ทั้ง iPhone และ Android)

สิ่งที่ต้องดูในแต่ละที่:

- หน้าแรกขึ้น 4 หมวด
- กดเข้าหมวดแล้วเห็นการ์ด 15 ใบ
- ปุ่มลูกศรย้อนกลับใช้ได้
- กดปุ่มลำโพงแล้วมีเสียง หรือถ้าเครื่องนั้นไม่มีเสียง ปุ่มลำโพงต้องไม่ขึ้นเลย (เป็นเรื่องปกติของ LINE บน Android)

## 7. อัปเดตเว็บครั้งต่อไป

แก้ไฟล์ → รัน `npm test` → แล้วรัน:

```
git add .
git commit -m "อธิบายสิ่งที่แก้"
git push
```

Cloudflare จะ build และอัปเดตเว็บให้เองภายใน 1–2 นาที **ลิงก์เดิมไม่เปลี่ยน ไม่ต้องทำ QR ใหม่**

## 8. (ไม่บังคับ) ดูจำนวนคนเข้าเว็บ

ในหน้าโปรเจกต์ `hotel-vocab` บน Cloudflare มีตัวเลือกให้เปิด **Web Analytics** (ฟรี) ได้ ไม่ต้องแก้โค้ด

## โครงสร้างไฟล์

```
public/index.html       หน้าเว็บ
public/js/data.js       คำศัพท์ทั้งหมด ← แก้ที่นี่
public/js/views.js      สร้างหน้าจอจากข้อมูล
public/js/speech.js     เสียงอ่าน
public/js/app.js        เชื่อมทุกอย่างเข้าด้วยกัน
public/favicon.svg      ไอคอนแท็บ
src/input.css           ตั้งค่า Tailwind และสไตล์เพิ่มเติม
tests/                  ชุดทดสอบ (รันด้วย npm test)
docs/superpowers/       เอกสารออกแบบและแผนงาน
```
