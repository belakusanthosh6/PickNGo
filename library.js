// Shared picture library for owner + customer sites.
// To add a new stored picture: drop assets/product-N.jpg and add one line here.
window.PICKNGO_LIBRARY = [
    { key: "product-0",  label: "Banana",        category: "Fruits",        match: /banana/i },
    { key: "product-7",  label: "Apple",         category: "Fruits",        match: /apple/i },
    { key: "product-13", label: "Mixed fruits",  category: "Fruits",        match: /fruit|orange|grape|mango|pomegranate/i },
    { key: "product-1",  label: "Tomato",        category: "Vegetables",    match: /tomato/i },
    { key: "product-6",  label: "Spinach",       category: "Vegetables",    match: /spinach|palak|leaf|greens/i },
    { key: "product-11", label: "Potato",        category: "Vegetables",    match: /potato|onion/i },
    { key: "product-2",  label: "Milk",          category: "Dairy & Eggs",  match: /milk/i },
    { key: "product-8",  label: "Curd",          category: "Dairy & Eggs",  match: /curd|yogurt|dahi/i },
    { key: "product-5",  label: "Butter",        category: "Dairy & Eggs",  match: /butter|ghee|cheese|paneer/i },
    { key: "product-3",  label: "Eggs",          category: "Dairy & Eggs",  match: /egg/i },
    { key: "product-4",  label: "Bread",         category: "Bakery",        match: /bread|bun|pav/i },
    { key: "product-12", label: "Chocolates",    category: "Snacks & Drinks", match: /chocolate|choco|dairy milk|kitkat|candy/i },
    { key: "product-15", label: "Drinks & chips", category: "Snacks & Drinks", match: /chips|drink|cola|juice|soda|water|lays|snack/i },
    { key: "product-10", label: "Rice",          category: "Staples",       match: /rice|atta|dal|flour/i },
    { key: "product-9",  label: "Cooking oil",   category: "Staples",       match: /oil/i },
    { key: "product-14", label: "Soap",          category: "Personal care", match: /soap|shampoo|wash/i }
];

window.PICKNGO_UNITS = [
    { value: "pc",    label: "piece (pc)" },
    { value: "kg",    label: "kilogram (kg)" },
    { value: "g",     label: "gram (g)" },
    { value: "L",     label: "litre (L)" },
    { value: "ml",    label: "millilitre (ml)" },
    { value: "dozen", label: "dozen" },
    { value: "pack",  label: "pack" }
];

window.pickngoImageFor = function(imageKey, name) {
    const lib = window.PICKNGO_LIBRARY;
    let item = imageKey && lib.find(function(x) { return x.key === imageKey; });
    if (!item && name) item = lib.find(function(x) { return x.match.test(name); });
    return item ? "../assets/" + item.key + ".jpg" : null;
};

window.pickngoUnitText = function(size, unit) {
    if (!unit) return "";
    const n = Number(size);
    const amount = Number.isFinite(n) && n > 0 ? String(n) : "1";
    return amount + " " + unit;
};
