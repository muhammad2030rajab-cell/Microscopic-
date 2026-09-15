# Rajab Diagnostics — تجهيز إنتاجي وأمان (V1 → V1.1)

هذا الملف يوثّق التعديلات اللي اتعملت على نسخة `FINAL_STATUS.md` لمعالجة بنود
"Next production hardening"، بالإضافة لأي ثغرات إضافية ظهرت أثناء المراجعة.
كل تعديل اتشرح جوه الكود نفسه في تعليق قريب من مكان التغيير.

## ⚠️ قيد مهم في هذه المراجعة

المراجعة والتعديل اتعملوا من غير اتصال بالإنترنت، يعني **لم يتم تشغيل
`npm install` ولا `npm run build` ولا `npm run typecheck` ولا `npm test`**
على النسخة المعدّلة. لازم تتنفذ كلها في بيئة عادية (جهازك أو CI) قبل أي نشر:

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

---

## ✅ تم إصلاحه في هذه الجولة

### 1. حسابات مصادقة يتيمة (orphaned auth users) — أهم إصلاح
في `src/lib/platform-admin.ts` (`createLab`) و `src/lib/lab-users.ts`
(`createLabStaff`): كان الكود بينشئ حساب Better Auth كامل (بريد + كلمة مرور)
**قبل** إدراج صف `labs`/`lab_users`. لو الإدراج فشل (تعارض اسم مستخدم بسباق
متزامن، انقطاع اتصال بقاعدة البيانات، إلخ)، كان الكود القديم يمسح صف `labs`
فقط بينما يفضل حساب Better Auth الحقيقي (بريد/باسورد فعّال) موجود للأبد من
غير ما يوصل لأي معمل أو صلاحية — تسريب حسابات صامت. دلوقتي أي فشل بيمسح حساب
المصادقة كمان (`deleteAuthUser`)، والحذف بينتشر تلقائيًا لصفوف `session`/
`account`/`lab_users` المرتبطة بفضل `on delete cascade` في الـ migrations.

### 2. صفحة إنشاء المدير الأول تفضل مفتوحة للأبد
`src/routes/admin.setup.tsx` كانت متاحة لأي زائر في أي وقت، حتى بعد ما يتم
تفعيل أول مدير — وكل محاولة إنشاء حساب فاشلة (لأن حد سبقك) كانت تسيب حساب
مصادقة حقيقي يتيم بدون تنظيف. دلوقتي:
- فيه دالة عامة `platformAdminExists()` (من غير تسجيل دخول) بترجع فقط true/false.
- الصفحة بتتحول لـ `/login` تلقائيًا لو فيه مدير مفعّل بالفعل.
- لو خسرت السباق وقت الإنشاء، بيتم مسح حسابك اليتيم تلقائيًا (`deleteSelfIfOrphaned`
  — دالة تمسح المستخدم نفسه فقط، وفقط لو فعلاً مالوش دور مدير أو معمل).

### 3. سجل تدقيق (audit log) ناقص لإجراءات الفريق والكتالوج
`FINAL_STATUS.md` كان بيدّعي وجود "Audit logging for key report/team/catalog
actions"، لكن كان مطبّق فعليًا على التقارير بس. دلوقتي `src/lib/audit.ts`
(دالة مشتركة `logAudit`) متوصّلة كمان بـ:
- إنشاء معمل (`lab.create`) وتفعيل أول مدير (`platform_admin.claim`) في
  `platform-admin.ts`
- إضافة/تعديل عضو فريق (`team.create` / `team.update`) في `lab-users.ts`
- تعديل بند كتالوج (`catalog.update`) في `lab-catalog.ts`

### 4. لا يوجد أي مراقبة (monitoring) — أضيف health-check endpoint
`src/routes/api/health.ts` (جديد): نقطة `/api/health` بترجع حالة الاتصال
بقاعدة البيانات (`select 1`) بدون أي تسجيل دخول، عشان تقدر توصّلها بأي أداة
مراقبة uptime (UptimeRobot / Better Uptime / فحص دوري من الاستضافة). **ده
مش بديل عن أداة تتبّع أخطاء حقيقية** — لسه محتاج حاجة زي Sentry لتنبيهات
الأعطال والاستثناءات.

### 5. لا يوجد تنسيق موحّد للـ logs
`src/lib/logger.server.ts` (جديد): دالة `logEvent(level, event, meta)` بترجع
سطر JSON واحد لكل حدث — أسهل بكتير لأي أداة تجميع logs (Vercel log drains،
Datadog، Axiom...) من `console.log` نصي حر. اتربطت بإجراءات الحساسة
(إنشاء معمل، تفعيل مدير، فشل إنشاء حساب).

### 6. لا توجد نسخ احتياطي على الإطلاق
`scripts/backup-db.mjs` و `scripts/restore-db.mjs` (جديد) + أوامر
`npm run db:backup` / `npm run db:restore`. يصدّر كل الجداول (auth + تطبيق)
لملف JSON واحد مضغوط (`.json.gz`) بختم وقت، والاستعادة upsert آمن (مش
truncate). **ملاحظة**: السكريبت ده صمّم كطبقة نسخ احتياطي محمولة تشغّلها
إنت (cron خارجي / GitHub Action مجدول)، لأن الاستضافة الحالية معدّة على
Nitro preset "vercel" (سيرفرليس بلا عملية دائمة تشغّل cron من جوه نفسها).
لو قاعدة البيانات Neon (المعدّة أصلاً في `src/lib/db.ts`)، فعّل point-in-time
recovery / branching بتاع Neon كخط الاسترجاع الأساسي، واعتبر هذا السكريبت
نسخة إضافية تحت سيطرتك (مثلاً نسخة خارج المزوّد).

### 7. لا يوجد `.gitignore` ولا `.env.example` في الحزمة
أضيف `.gitignore` (يستثني `node_modules`, `.env`, `backups/`, ملفات البناء)
و`.env.example` بكل متغيرات البيئة المستخدمة فعليًا في الكود (تم استخراجها
بالبحث في الكود، مش من الذاكرة) مع شرح مختصر لكل واحد.

### 8. جدولة النسخ الاحتياطي فعليًا — GitHub Actions
`.github/workflows/db-backup.yml` (جديد): يشغّل `scripts/backup-db.mjs` يوميًا
(3 صباحًا UTC) + إمكانية تشغيله يدويًا من تبويب Actions، ويرفع الملف
الناتج كـ workflow artifact لمدة 30 يوم (بدون ما يتحفظ في الـ git history —
`backups/` موجودة في `.gitignore`). محتاج منك خطوة واحدة بس: أضف سِر
(secret) اسمه `DATABASE_URL` في إعدادات الريبو
(Settings → Secrets and variables → Actions) بنفس قيمة `DATABASE_URL`
المضبوطة في Vercel. فيه قسم اختياري (معلّق/commented) جوه نفس الملف لرفع
نسخة إضافية على S3 لو حبيت تخزين خارج GitHub لمدى أطول.

هذه بنود من `FINAL_STATUS.md` الأصلي ما اتقفلتش بالكامل، أو بنود ظهرت أثناء
المراجعة ومحتاجة قرار/بنية تحتية منك:

1. **تشغيل build/typecheck/test فعلي** (اتذكر فوق) — أول خطوة قبل أي نشر.
2. **التحقق من توافق `auth.api.signUpEmail` مع نسخة better-auth المثبّتة**
   (`~1.6.30` في `package.json`) — محتاج `npm install` فعلي للتأكد، ما قدرتش
   أتحقق منه من غير إنترنت.
3. **اعتماد أداة تتبع أخطاء حقيقية** (Sentry أو ما شابه) لالتقاط الاستثناءات
   والتنبيه الفوري، بدل الاعتماد على `console.error`/logs بس.
4. **إضافة سِر `DATABASE_URL` في GitHub** لتفعيل `.github/workflows/db-backup.yml`
   (بدونه الـ workflow موجود لكن هيفشل)، وتجربة **استعادة كاملة** (restore)
   مرة على الأقل من نسخة حقيقية قبل الاعتماد عليها وقت أزمة فعلية.
5. **تقرير الاعتماد على منصة Grok/xAI**: الكود الحالي لتسجيل الدخول
   (`src/lib/auth/server.ts`, `gate-identity.server.ts`, `gate-session.server.ts`)
   مبني أصلاً على أن يعمل هذا التطبيق فوق منصة "Grok App Builder" الخاصة بـ
   xAI (broker OAuth، نطاقات `*.grok.me`/`*.grok-sandbox.com`، تحقق JWT من
   بوابة Grok). لو نيّتك تستضيف المشروع بشكل مستقل تمامًا (سيرفر/دومين خاص
   بيك، مش عبر Grok)، فكل هذا الجزء (`gate-identity`, `gate-session`,
   `GROK_*` env vars) هيفضل كود غير مُفعّل بلا ضرر (لأنه مشروط بمتغيرات بيئة
   مش موجودة)، وتسجيل الدخول هيشتغل بالإيميل/الباسورد المحلي فقط (مفعّل
   بالفعل في `src/lib/auth/email-password.ts`) — بس يستاهل قرار واعي منك
   بدل ما يفضل كود ميت بيعقّد أي حد يراجع الأمان بعدين.
6. **`routeTree.gen.ts`**: ملف مولّد تلقائيًا (فيه تحذير "DO NOT edit" في
   أوله) بواسطة إضافة TanStack Router أثناء `npm run dev` / `npm run build`.
   أضفت مسار جديد (`src/routes/api/health.ts`) لكن **لم أعدّل** هذا الملف
   يدويًا احترامًا لتحذيره — أول `npm install && npm run build` (أو
   `npm run dev`) هيولّده من جديد ويضيف المسار تلقائيًا. لو شغّلت المشروع
   قبل كده ولقيت `/api/health` مش شغالة، شغّل الأمرين فوق الأول.
7. **مراجعة سياسة كلمات المرور**: الحد الأدنى الحالي 8 أحرف فقط (لا تعقيد
   مطلوب) في أكتر من مكان (`admin.setup.tsx`, `platform-admin.ts`,
   `lab-users.ts`). قرار منتجي/أمني يستاهل مراجعتك (تعقيد إضافي؟ حد أقصى
   لمحاولات الدخول الفاشلة؟ Better Auth بيدعم rate limiting مدمج يستحق تفعيله).
8. **نسخ احتياطي لملفات غير قاعدة البيانات**: لو فيه أي رفع ملفات (شعارات
   معامل، صور) خارج قاعدة البيانات مستقبلًا، السكريبت الحالي بيغطي قاعدة
   البيانات بس.

---

## ملخص الملفات المتأثرة

**تعديل:**
- `src/lib/platform-admin.ts`
- `src/lib/lab-users.ts`
- `src/lib/lab-catalog.ts`
- `src/routes/admin.setup.tsx`
- `package.json`

**جديد:**
- `.github/workflows/db-backup.yml`
- `src/lib/audit.ts`
- `src/lib/logger.server.ts`
- `src/routes/api/health.ts`
- `scripts/backup-db.mjs`
- `scripts/restore-db.mjs`
- `.gitignore`
- `.env.example`
- `PRODUCTION_READINESS.md` (هذا الملف)
