# سیستم طراحی و هویت بصری ویرا (Vira Design System Specification)

**نسخه:** 1.0.0  
**توسعه‌دهنده:** تیم طراحی و تجربه کاربری ویرا  
**محیط هدف:** PWA / وب اپلیکیشن موبایل‌محور RTL  

---

## ۱. فلسفه طراحی (Design Philosophy)
سیستم طراحی **ویرا (Vira)** بر پایه اصول **"تاریکی لوکس و ارگونومیک (Luxury Dark Indigo Atmosphere)"** پیاده‌سازی شده است. این سبک visual باعث کاهش خستگی چشم در استفاده‌های طولانی‌مدت (به‌ویژه در شب) و برجسته‌سازی المان‌های باارزش مانند **الماس (Cyan)** و **امتیاز/طلا (Amber/Gold)** می‌شود.

---

## ۲. پالت رنگی و توکن‌ها (Color Palette & Tokens)

### 2.1. رنگ‌های پایه و پس‌زمینه (Background & Surfaces)
* **Canvas Background:** `#090d16` (`bg-indigo-950` و `bg-slate-950`) - پس‌زمینه عمیق نیلی.
* **Surface Containers:** `#1e1b4b` با شفافیت بالا (`bg-indigo-900/60`, `bg-indigo-950/80`).
* **Borders & Dividers:** `#3730a3` با شفافیت کم (`border-indigo-800/60`, `border-indigo-700/50`).

### 2.2. رنگ‌های آکسان و معنامند (Accent & Semantic Colors)
* **Gold / Amber (امتیاز و رتبه‌بندی):** `#f59e0b` (`text-yellow-400`, `from-yellow-400 to-amber-500`).
* **Cyan / Diamond (الماس و اعتبار نیترو):** `#06b6d4` (`text-cyan-400`, `bg-cyan-500/20`).
* **Emerald (موفقیت، شارژ و تأیید):** `#10b981` (`text-emerald-400`, `bg-emerald-500/20`).
* **Rose / Red (خطا، هشدار و خروج):** `#f43f5e` (`text-red-400`, `bg-red-500/20`).
* **Purple (نقش مدیریتی و VIP):** `#a855f7` (`text-purple-300`, `bg-purple-500/20`).

---

## ۳. تایپوگرافی (Typography Hierarchy)

| سطح تایپوگرافی | وزن | کلاس Tailwind | مورد استفاده |
| :--- | :---: | :--- | :--- |
| **Hero Heading** | `font-black` | `text-2xl` تا `text-3xl` | عناوین اصلی صفحات و لوگوی ویرا |
| **Section Title** | `font-black` | `text-sm` تا `text-base` | تیتر کارت‌ها و مدال‌ها |
| **Subhead / Label** | `font-bold` | `text-xs` | برچسب‌های ورودی‌ها و گزینه‌های سوال |
| **Body Text** | `font-medium` | `text-xs` تا `text-[13px]` | متون راهنما و توضیحات اطلاعیه‌ها |
| **Caption / Mono** | `font-mono` | `text-[10px]` تا `text-[11px]` | شماره تلفن، آمار و شناسه کاربری |

---

## ۴. قانون شعاع زوایا (Corner Radius Rules)
* **کارت‌های اصلی و مدال‌ها:** `rounded-3xl` (24px)
* **دکمه‌ها و المان‌های تعاملی:** `rounded-2xl` (16px)
* **ورودی‌ها (Inputs) و چیپ‌ها:** `rounded-xl` (12px)
* **محاسبه شعاع‌های تو در تو (Nested Radius Math):**  
  `شعاع داخلی = شعاع خارجی - فاصله (Padding)`  
  *مثال:* اگر کارت اصلی `rounded-3xl` (24px) با پدینگ 8px باشد، عناصر داخلی از `rounded-2xl` (16px) استفاده می‌کنند.

---

## ۵. دکمه‌ها و هیرارکی تعاملی (Interactive Buttons)

### 5.1. دکمه اصلی (Primary Action)
* **استایل:** گرادینت درخشان طلایی به نارنجی (`bg-gradient-to-tr from-yellow-400 to-amber-500 text-indigo-950 font-black`).
* **افکت:** سایه نرم طلایی (`shadow-lg shadow-yellow-500/20`) و مقیاس‌پذیری در هور (`hover:scale-[1.02]`).

### 5.2. دکمه ثانویه (Secondary Action)
* **استایل:** شیشه‌ای نیلی (`bg-indigo-900/80 border border-indigo-700/80 text-white font-bold`).

### 5.3. دکمه خطر / خروج (Danger / Destructive)
* **استایل:** قرمز شیشه‌ای (`bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300`).

---

## ۶. انیمیشن‌ها و بازخورد زنده (Animations & Motion)
* **انتقال صفحات:** استفاده از `motion` با افکت‌های `fade` و `scale` در تغییر وضعیت‌های بازی.
* **فیدبک لمسی:** پشتیبانی کامل از دکمه‌های با ارتفاع حداقل 44px برای تجربه کاربری لمسی در موبایل.
