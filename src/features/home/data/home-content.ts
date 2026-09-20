import type { LocalizedText } from "@/core/i18n/localized-text";

export type BenefitContent = {
  icon: string;
  title: LocalizedText;
  description: LocalizedText;
};

export type HomeContent = {
  navigation: {
    logoText: LocalizedText;
    links: Array<{
      label: LocalizedText;
      href: string;
    }>;
    productsCta: LocalizedText;
    menuLabel: LocalizedText;
    closeMenuLabel: LocalizedText;
  };
  hero: {
    badge: LocalizedText;
    titleFirst: LocalizedText;
    titleSecond: LocalizedText;
    text: LocalizedText;
    productsCta: LocalizedText;
    contactCta: LocalizedText;
    cardTitle: LocalizedText;
    cardText: LocalizedText;
  };
  benefits: {
    kicker: LocalizedText;
    title: LocalizedText;
    text: LocalizedText;
    items: BenefitContent[];
  };
  products: {
    label: LocalizedText;
    title: LocalizedText;
    description: LocalizedText;
    showAll: LocalizedText;
    modalFeaturesTitle: LocalizedText;
    modalIngredientsTitle: LocalizedText;
    modalOrder: LocalizedText;
    modalClose: LocalizedText;
  };
  factory: {
    label: LocalizedText;
    title: LocalizedText;
    overlayTitle: LocalizedText;
    imageAlt: LocalizedText;
    imageUrl: string;
    stats: Array<{
      value: string;
      label: LocalizedText;
    }>;
  };
  contact: {
    kicker: LocalizedText;
    title: LocalizedText;
    text: LocalizedText;
    namePlaceholder: LocalizedText;
    emailPlaceholder: LocalizedText;
    phonePlaceholder: LocalizedText;
    messagePlaceholder: LocalizedText;
    submit: LocalizedText;
    sending: LocalizedText;
    success: LocalizedText;
    error: LocalizedText;
  };
  productDetail: {
    priceNote: LocalizedText;
    orderMessage: LocalizedText;
    priceCurrency: LocalizedText;
  };
  footer: {
    company: LocalizedText;
    products: LocalizedText;
    branches: LocalizedText;
    contact: LocalizedText;
    about: LocalizedText;
    factory: LocalizedText;
    quality: LocalizedText;
    allProducts: LocalizedText;
    biscuits: LocalizedText;
    cakes: LocalizedText;
    whatsApp: LocalizedText;
    copyright: LocalizedText;
    origin: LocalizedText;
  };
};

export const homeContent: HomeContent = {
  navigation: {
    logoText: {
      ar: "مصنع الحلويات",
      en: "Sweets Factory",
    },
    links: [
      {
        label: {
          ar: "الرئيسية",
          en: "Home",
        },
        href: "#home",
      },
      {
        label: {
          ar: "لماذا نحن؟",
          en: "Why us?",
        },
        href: "#benefits",
      },
      {
        label: {
          ar: "المنتجات",
          en: "Products",
        },
        href: "#products",
      },
      {
        label: {
          ar: "المصنع",
          en: "Factory",
        },
        href: "#factory",
      },
      {
        label: {
          ar: "تواصل معنا",
          en: "Contact",
        },
        href: "#contact",
      },
    ],
    productsCta: {
      ar: "منتجاتنا",
      en: "Products",
    },
    menuLabel: {
      ar: "فتح القائمة",
      en: "Open menu",
    },
    closeMenuLabel: {
      ar: "إغلاق القائمة",
      en: "Close menu",
    },
  },
  hero: {
    badge: {
      ar: "مخبوز بعناية كل يوم",
      en: "Carefully baked every day",
    },
    titleFirst: {
      ar: "بسكويت وكيك",
      en: "Biscuits and cakes",
    },
    titleSecond: {
      ar: "بجودة لا تتنازل",
      en: "with uncompromising quality",
    },
    text: {
      ar: "نصنع منتجاتنا بعناية من مكونات مختارة لنقدم لك مذاقًا طازجًا وجودة تشعر بها من أول لقمة.",
      en: "We craft our products with selected ingredients to deliver fresh taste and quality from the first bite.",
    },
    productsCta: {
      ar: "اكتشف منتجاتنا",
      en: "Explore products",
    },
    contactCta: {
      ar: "تواصل معنا",
      en: "Contact us",
    },
    cardTitle: {
      ar: "جودة تبدأ من المكونات",
      en: "Quality starts with ingredients",
    },
    cardText: {
      ar: "نهتم بكل تفصيلة من اختيار المكونات حتى خروج المنتج بالشكل والطعم الذي نريده لك.",
      en: "Every detail matters, from selected ingredients to the final product made for your table.",
    },
  },
  benefits: {
    kicker: {
      ar: "لماذا نحن؟",
      en: "Why us?",
    },
    title: {
      ar: "تفاصيل صغيرة تصنع فرقًا كبيرًا",
      en: "Small details make a big difference",
    },
    text: {
      ar: "نركز على الجودة والطعم والتفاصيل حتى تحصل على تجربة تستحقها.",
      en: "We focus on quality, taste, and detail to deliver an experience worth choosing.",
    },
    items: [
      {
        icon: "★",
        title: {
          ar: "مكونات مختارة",
          en: "Selected ingredients",
        },
        description: {
          ar: "نختار مكوناتنا بعناية لضمان مذاق متوازن وجودة ثابتة.",
          en: "We choose our ingredients carefully for balanced taste and consistent quality.",
        },
      },
      {
        icon: "♨",
        title: {
          ar: "طزاجة مستمرة",
          en: "Ongoing freshness",
        },
        description: {
          ar: "نهتم بعملية الإنتاج والتجهيز لنقدم لك منتجات بطعم طازج.",
          en: "Our production process keeps products fresh and ready to enjoy.",
        },
      },
      {
        icon: "✓",
        title: {
          ar: "جودة نهتم بها",
          en: "Quality we care about",
        },
        description: {
          ar: "كل منتج يمر بعناية قبل أن يصل إليك حتى نحافظ على المستوى المطلوب.",
          en: "Every product is handled carefully before it reaches you.",
        },
      },
    ],
  },
  products: {
    label: {
      ar: "منتجاتنا",
      en: "Our products",
    },
    title: {
      ar: "تشكيلة متنوعة من\nالبسكويت والكيك",
      en: "A varied collection of\nbiscuits and cakes",
    },
    description: {
      ar: "مجموعة من المنتجات المصممة لتناسب مختلف الأذواق، من البسكويت الكلاسيكي إلى النكهات الغنية والمميزة.",
      en: "A collection designed for different tastes, from classic biscuits to rich and distinctive flavors.",
    },
    showAll: {
      ar: "عرض جميع المنتجات",
      en: "View all products",
    },
    modalFeaturesTitle: {
      ar: "مميزات المنتج",
      en: "Product features",
    },
    modalIngredientsTitle: {
      ar: "المكونات",
      en: "Ingredients",
    },
    modalOrder: {
      ar: "اطلب هذا المنتج",
      en: "Order this product",
    },
    modalClose: {
      ar: "إغلاق",
      en: "Close",
    },
  },
  factory: {
    label: {
      ar: "مصنعنا",
      en: "Our factory",
    },
    title: {
      ar: "صناعة تجمع بين الخبرة والتكنولوجيا",
      en: "Manufacturing that combines experience and technology",
    },
    overlayTitle: {
      ar: "جودة تبدأ من قلب المصنع.",
      en: "Quality starts at the heart of the factory.",
    },
    imageAlt: {
      ar: "خط إنتاج",
      en: "Production line",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1565895405131-9f674b2b0d8a?auto=format&fit=crop&w=2000&q=85",
    stats: [
      {
        value: "5+",
        label: {
          ar: "خطوط إنتاج",
          en: "Production lines",
        },
      },
      {
        value: "50+",
        label: {
          ar: "منتج",
          en: "Products",
        },
      },
      {
        value: "20+",
        label: {
          ar: "سنة خبرة",
          en: "Years of experience",
        },
      },
    ],
  },
  contact: {
    kicker: {
      ar: "تواصل معنا",
      en: "Contact us",
    },
    emailPlaceholder: { ar: "البريد الإلكتروني", en: "Email address" },
    title: {
      ar: "خلينا نحكي",
      en: "Let's talk",
    },
    text: {
      ar: "للاستفسارات والطلبات والتعاون، يمكنك التواصل معنا مباشرة.",
      en: "For inquiries, orders, and collaboration, you can contact us directly.",
    },
    namePlaceholder: {
      ar: "الاسم",
      en: "Name",
    },
    phonePlaceholder: {
      ar: "رقم الهاتف",
      en: "Phone number",
    },
    messagePlaceholder: {
      ar: "رسالتك",
      en: "Your message",
    },
    submit: {
      ar: "إرسال الرسالة",
      en: "Send message",
    },
    sending: {
      ar: "جار الإرسال...",
      en: "Sending...",
    },
    success: {
      ar: "تم إرسال رسالتك بنجاح.",
      en: "Your message has been sent.",
    },
    error: {
      ar: "حدث خطأ أثناء إرسال الرسالة. حاول مرة أخرى.",
      en: "Something went wrong while sending. Please try again.",
    },
  },
  productDetail: {
    priceNote: {
      ar: "السعر حسب الكمية والتعبئة",
      en: "Price depends on quantity and packaging",
    },
    orderMessage: {
      ar: "مرحبًا، أريد الاستفسار عن منتج:",
      en: "Hello, I would like to ask about:",
    },
    priceCurrency: {
      ar: "ريال",
      en: "SAR",
    },
  },
  footer: {
    company: {
      ar: "الشركة",
      en: "Company",
    },
    products: {
      ar: "المنتجات",
      en: "Products",
    },
    branches: {
      ar: "الفروع",
      en: "Branches",
    },
    contact: {
      ar: "تواصل معنا",
      en: "Contact",
    },
    about: {
      ar: "من نحن",
      en: "About us",
    },
    factory: {
      ar: "المصنع",
      en: "Factory",
    },
    quality: {
      ar: "الجودة",
      en: "Quality",
    },
    allProducts: {
      ar: "جميع المنتجات",
      en: "All products",
    },
    biscuits: {
      ar: "البسكويت",
      en: "Biscuits",
    },
    cakes: {
      ar: "الكيك",
      en: "Cakes",
    },
    whatsApp: {
      ar: "واتساب",
      en: "WhatsApp",
    },
    copyright: {
      ar: "© 2026 مصنع الحلويات — جميع الحقوق محفوظة",
      en: "© 2026 Sweets Factory — All rights reserved",
    },
    origin: {
      ar: "صناعة سعودية",
      en: "Saudi made",
    },
  },
};
