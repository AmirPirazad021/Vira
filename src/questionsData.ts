export interface Question {
  id: string;
  category: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
}

export const staticQuestions: Question[] = [
  // تاریخی (History)
  {
    id: "hist_1",
    category: "تاریخی",
    questionText: "عیلامی ها کشورشان را چه مینامیدند؟",
    options: ["هل تمتی", "سرزمین عیلامی", "ایران", "سوسا"],
    correctOptionIndex: 0
  },
  {
    id: "hist_2",
    category: "تاریخی",
    questionText: "کدام شاه قاجار فرمان مشروطیت را امضا کرد؟",
    options: ["ناصرالدین شاه", "مظفرالدین شاه", "احمد شاه", "محمدعلی شاه"],
    correctOptionIndex: 1
  },
  {
    id: "hist_3",
    category: "تاریخی",
    questionText: "مؤسس سلسله هخامنشیان چه کسی بود؟",
    options: ["داریوش بزرگ", "کوروش بزرگ", "خشایارشا", "اردشیر اول"],
    correctOptionIndex: 1
  },
  {
    id: "hist_4",
    category: "تاریخی",
    questionText: "پایتخت زمستانه هخامنشیان کدام شهر بود؟",
    options: ["شوش", "تخت جمشید", "پاسارگاد", "همدان"],
    correctOptionIndex: 0
  },

  // عمومی (General)
  {
    id: "gen_1",
    category: "عمومی",
    questionText: "کدام سیاره به سیاره سرخ معروف است؟",
    options: ["زهره", "مریخ", "مشتری", "عطارد"],
    correctOptionIndex: 1
  },
  {
    id: "gen_2",
    category: "عمومی",
    questionText: "بزرگترین اقیانوس جهان کدام است؟",
    options: ["اقیانوس اطلس", "اقیانوس هند", "اقیانوس آرام", "اقیانوس منجمد شمالی"],
    correctOptionIndex: 2
  },
  {
    id: "gen_3",
    category: "عمومی",
    questionText: "سردترین نقطه زمین در کدام قاره قرار دارد؟",
    options: ["آسیا", "اروپا", "آمریکای شمالی", "قطب جنوب"],
    correctOptionIndex: 3
  },

  // ورزشی (Sports)
  {
    id: "sport_1",
    category: "ورزشی",
    questionText: "کدام کشور بیشترین قهرمانی را در جام جهانی فوتبال دارد؟",
    options: ["ایتالیا", "آلمان", "برزیل", "آرژانتین"],
    correctOptionIndex: 2
  },
  {
    id: "sport_2",
    category: "ورزشی",
    questionText: "ورزش ملی ایران چیست؟",
    options: ["کشتی", "فوتبال", "وزنه برداری", "تکواندو"],
    correctOptionIndex: 0
  },
  {
    id: "sport_3",
    category: "ورزشی",
    questionText: "هر تیم والیبال چند بازیکن داخل زمین دارد؟",
    options: ["۵ نفر", "۶ نفر", "۷ نفر", "۸ نفر"],
    correctOptionIndex: 1
  },

  // سینما (Cinema)
  {
    id: "cine_1",
    category: "سینما",
    questionText: "کارگردان فیلم معروف «جدایی نادر از سیمین» کیست؟",
    options: ["عباس کیارستمی", "اصغر فرهادی", "داریوش مهرجویی", "مسعود کیمیایی"],
    correctOptionIndex: 1
  },
  {
    id: "cine_2",
    category: "سینما",
    questionText: "کدام بازیگر ایرانی برنده جایزه بهترین بازیگر مرد در جشنواره کن شده است؟",
    options: ["شهاب حسینی", "پیمان معادی", "نوید محمدزاده", "خسرو شکیبایی"],
    correctOptionIndex: 0
  },
  {
    id: "cine_3",
    category: "سینما",
    questionText: "اولین فیلم ناطق ایرانی چه نام دارد؟",
    options: ["دختر لر", "حاجی آقا آکتور سینما", "آبی و رابی", "طوفان زندگی"],
    correctOptionIndex: 0
  },

  // هنری (Art)
  {
    id: "art_1",
    category: "هنری",
    questionText: "مینیاتوریست معروف و معاصر ایرانی کیست؟",
    options: ["کمال الملک", "محمود فرشچیان", "رضا عباسی", "سهراب سپهری"],
    correctOptionIndex: 1
  },
  {
    id: "art_2",
    category: "هنری",
    questionText: "اثر معروف «مونالیزا» از کیست؟",
    options: ["میکل آنژ", "پیکاسو", "لئوناردو داوینچی", "ون گوگ"],
    correctOptionIndex: 2
  },
  {
    id: "art_3",
    category: "هنری",
    questionText: "کدام هنرمند ایرانی به پدر نقاشی مدرن ایران معروف است؟",
    options: ["کمال الملک", "جلیل ضیاءپور", "حسین زنده رودی", "بهمن محصص"],
    correctOptionIndex: 1
  },

  // مذهبی (Religious)
  {
    id: "rel_1",
    category: "مذهبی",
    questionText: "مدت خلافت حضرت علی (ع) چند سال بود؟",
    options: ["۳ سال", "۵ سال", "۱۰ سال", "۱۲ سال"],
    correctOptionIndex: 1
  },
  {
    id: "rel_2",
    category: "مذهبی",
    questionText: "کدام سوره به نام «عروس قرآن» معروف است؟",
    options: ["یاسین", "الرحمن", "واقعه", "الملک"],
    correctOptionIndex: 1
  },

  // جغرافیا (Geography)
  {
    id: "geo_1",
    category: "جغرافیا",
    questionText: "طولانی‌ترین رود جهان چه نام دارد؟",
    options: ["آمازون", "نیل", "یانگ تسه", "می‌سی‌سی‌پی"],
    correctOptionIndex: 1
  },
  {
    id: "geo_2",
    category: "جغرافیا",
    questionText: "پایتخت کشور استرالیا کدام شهر است؟",
    options: ["سیدنی", "ملبورن", "کانبرا", "بریزبن"],
    correctOptionIndex: 2
  },
  {
    id: "geo_3",
    category: "جغرافیا",
    questionText: "بزرگترین دریاچه جهان کدام است؟",
    options: ["دریاچه سوپریور", "دریای خزر", "دریاچه میشیگان", "دریاچه بایکال"],
    correctOptionIndex: 1
  },

  // ریاضی (Math)
  {
    id: "math_1",
    category: "ریاضی",
    questionText: "عدد پی (π) تقریبا برابر با کدام گزینه است؟",
    options: ["۳.۱۴", "۲.۷۱", "۱.۶۱", "۳.۴۱"],
    correctOptionIndex: 0
  },
  {
    id: "math_2",
    category: "ریاضی",
    questionText: "مجموع زوایای داخلی یک مثلث چند درجه است؟",
    options: ["۹۰ درجه", "۱۸۰ درجه", "۲۷۰ درجه", "۳۶۰ درجه"],
    correctOptionIndex: 1
  },
  {
    id: "math_3",
    category: "ریاضی",
    questionText: "کدام ریاضیدان ایرانی مبدع علم جبر است؟",
    options: ["خیام", "خوارزمی", "ابوریحان بیرونی", "غیاث الدین جمشید کاشانی"],
    correctOptionIndex: 1
  },

  // ادبیات (Literature)
  {
    id: "lit_1",
    category: "ادبیات",
    questionText: "شاعر اثر معروف «شاهنامه» کیست؟",
    options: ["حافظ", "سعدی", "فردوسی", "مولوی"],
    correctOptionIndex: 2
  },
  {
    id: "lit_2",
    category: "ادبیات",
    questionText: "کتاب «گلستان» و «بوستان» اثر کدام شاعر است؟",
    options: ["سعدی", "حافظ", "عطار", "نظامی"],
    correctOptionIndex: 0
  },
  {
    id: "lit_3",
    category: "ادبیات",
    questionText: "خالق رمان معروف «بوف کور» کیست؟",
    options: ["بزرگ علوی", "صادق هدایت", "جلال آل احمد", "محمود دولت آبادی"],
    correctOptionIndex: 1
  },

  // سیاسی (Political)
  {
    id: "pol_1",
    category: "سیاسی",
    questionText: "مقر اصلی سازمان ملل متحد در کدام شهر قرار دارد؟",
    options: ["ژنو", "لندن", "نیویورک", "پاریس"],
    correctOptionIndex: 2
  },
  {
    id: "pol_2",
    category: "سیاسی",
    questionText: "اولین رئیس جمهور ایران پس از انقلاب چه کسی بود؟",
    options: ["ابوالحسن بنی‌صدر", "محمدعلی رجایی", "علی خامنه‌ای", "اکبر هاشمی رفسنجانی"],
    correctOptionIndex: 0
  },
  {
    id: "pol_3",
    category: "سیاسی",
    questionText: "بزرگترین دموکراسی جهان از نظر جمعیت کدام کشور است؟",
    options: ["آمریکا", "چین", "هند", "برزیل"],
    correctOptionIndex: 2
  }
];
