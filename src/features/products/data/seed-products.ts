import type { Product } from "@/features/products/domain/Product";

const chocolateCookieImage =
  "https://i.ibb.co/wFH8XbwP/7f3a316864503da2b970b1dedebd673b6f6c4e5241505207da3d6f2e32b2efe7.jpg";

export const seedProducts: Product[] = [
  {
    id: "cookies",
    slug: "chocolate-cookies",
    name: {
      ar: "كوكيز الشوكولاتة",
      en: "Chocolate Cookies",
    },
    category: {
      ar: "بسكويت",
      en: "Biscuits",
    },
    shortDescription: {
      ar: "قطع غنية بالشوكولاتة",
      en: "Rich chocolate pieces",
    },
    description: {
      ar: "كوكيز غنية بقطع الشوكولاتة بقوام متوازن وقرمشة مميزة.",
      en: "Rich cookies with chocolate chunks, a balanced texture, and a distinctive crunch.",
    },
    pieces: 24,
    weight: {
      ar: "حسب الطلب",
      en: "On request",
    },
    pack: {
      ar: "عبوات متعددة",
      en: "Multiple packs",
    },
    type: {
      ar: "كوكيز",
      en: "Cookies",
    },
    features: [
      {
        ar: "قطع شوكولاتة غنية",
        en: "Rich chocolate chunks",
      },
      {
        ar: "قوام متوازن",
        en: "Balanced texture",
      },
      {
        ar: "مخبوز بعناية",
        en: "Carefully baked",
      },
    ],
    ingredients: {
      ar: "دقيق، شوكولاتة، زبدة، سكر، بيض ومكونات مختارة.",
      en: "Flour, chocolate, butter, sugar, eggs, and selected ingredients.",
    },
    images: [chocolateCookieImage],
    mainImage: chocolateCookieImage,
    isPublished: true,
    sortOrder: 1,
  },
  {
    id: "classic",
    slug: "classic-biscuits",
    name: {
      ar: "بسكويت كلاسيك",
      en: "Classic Biscuits",
    },
    category: {
      ar: "بسكويت",
      en: "Biscuits",
    },
    shortDescription: {
      ar: "قرمشة خفيفة وطعم أصيل",
      en: "Light crunch and classic taste",
    },
    description: {
      ar: "قرمشة خفيفة وطعم أصيل مناسب لكل وقت.",
      en: "A light crunch and authentic taste for any time of day.",
    },
    pieces: 24,
    weight: {
      ar: "حسب الطلب",
      en: "On request",
    },
    pack: {
      ar: "عبوات متعددة",
      en: "Multiple packs",
    },
    type: {
      ar: "بسكويت",
      en: "Biscuits",
    },
    features: [
      {
        ar: "قرمشة خفيفة",
        en: "Light crunch",
      },
      {
        ar: "طعم أصيل",
        en: "Authentic taste",
      },
      {
        ar: "مناسب مع القهوة",
        en: "Perfect with coffee",
      },
    ],
    ingredients: {
      ar: "دقيق، زبدة، سكر، حليب ومكونات مختارة.",
      en: "Flour, butter, sugar, milk, and selected ingredients.",
    },
    images: [
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=1000&q=85",
    ],
    mainImage:
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=1000&q=85",
    isPublished: true,
    sortOrder: 2,
  },
  {
    id: "wafer",
    slug: "chocolate-wafer",
    name: {
      ar: "ويفر شوكولاتة",
      en: "Chocolate Wafer",
    },
    category: {
      ar: "ويفر",
      en: "Wafer",
    },
    shortDescription: {
      ar: "طبقات مقرمشة وحشوة غنية",
      en: "Crisp layers and rich filling",
    },
    description: {
      ar: "طبقات مقرمشة وحشوة غنية بنكهة الشوكولاتة.",
      en: "Crisp wafer layers with a rich chocolate filling.",
    },
    pieces: 24,
    weight: {
      ar: "حسب الطلب",
      en: "On request",
    },
    pack: {
      ar: "عبوات متعددة",
      en: "Multiple packs",
    },
    type: {
      ar: "ويفر",
      en: "Wafer",
    },
    features: [
      {
        ar: "طبقات مقرمشة",
        en: "Crisp layers",
      },
      {
        ar: "حشوة غنية",
        en: "Rich filling",
      },
      {
        ar: "نكهة شوكولاتة",
        en: "Chocolate flavor",
      },
    ],
    ingredients: {
      ar: "رقائق ويفر، كاكاو، سكر، حليب ومكونات مختارة.",
      en: "Wafer sheets, cocoa, sugar, milk, and selected ingredients.",
    },
    images: [chocolateCookieImage],
    mainImage: chocolateCookieImage,
    isPublished: true,
    sortOrder: 3,
  },
  {
    id: "cake",
    slug: "chocolate-cake",
    name: {
      ar: "كيك الشوكولاتة",
      en: "Chocolate Cake",
    },
    category: {
      ar: "كيك",
      en: "Cake",
    },
    shortDescription: {
      ar: "قوام غني ونكهة شوكولاتة",
      en: "Rich texture and chocolate flavor",
    },
    description: {
      ar: "قوام غني ونكهة شوكولاتة مميزة.",
      en: "A rich texture with a distinctive chocolate flavor.",
    },
    pieces: 24,
    weight: {
      ar: "حسب الطلب",
      en: "On request",
    },
    pack: {
      ar: "عبوات متعددة",
      en: "Multiple packs",
    },
    type: {
      ar: "كيك",
      en: "Cake",
    },
    features: [
      {
        ar: "قوام غني",
        en: "Rich texture",
      },
      {
        ar: "نكهة شوكولاتة",
        en: "Chocolate flavor",
      },
      {
        ar: "مخبوز بعناية",
        en: "Carefully baked",
      },
    ],
    ingredients: {
      ar: "دقيق، كاكاو، سكر، بيض، حليب ومكونات مختارة.",
      en: "Flour, cocoa, sugar, eggs, milk, and selected ingredients.",
    },
    images: [
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1000&q=85",
    ],
    mainImage:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1000&q=85",
    isPublished: true,
    sortOrder: 4,
  },
];
