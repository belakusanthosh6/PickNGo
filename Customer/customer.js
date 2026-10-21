
let products = [];
let cart = [];
let checkoutInProgress = false;

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const productList = document.getElementById("productList");
const message = document.getElementById("message");
const availableOnly = document.getElementById("availableOnly");

const reservationNotice = document.getElementById("reservationNotice");
const cartItems = document.getElementById("cartItems");
const cartMessage = document.getElementById("cartMessage");
const cartTotal = document.getElementById("cartTotal");
const checkoutForm = document.getElementById("checkoutForm");
const checkoutButton = document.getElementById("checkoutButton");

const reservationLookupForm =
    document.getElementById("reservationLookupForm");

const reservationLookupResult =
    document.getElementById("reservationLookupResult");

const lookupReservationButton =
    document.getElementById("lookupReservationButton");

// -------------------- CONFIRMATION MESSAGE --------------------

function showReservationNotice(type, title, details, receipt) {
    closeReservationSheet();
    const overlay = document.createElement("div");
    overlay.className = "sheet-overlay";
    overlay.id = "reservationSheet";
    const sheet = document.createElement("div");
    sheet.className = "sheet " + (type === "success" ? "sheet-ok" : "sheet-err");
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-label", title);

    const head = document.createElement("div");
    head.className = "sheet-head";
    const h = document.createElement("h2");
    h.textContent = title;
    const close = document.createElement("button");
    close.type = "button";
    close.className = "sheet-close";
    close.setAttribute("aria-label", "Close");
    close.textContent = "×";
    close.onclick = closeReservationSheet;
    head.append(h, close);
    sheet.appendChild(head);

    if (receipt) {
        const sub = document.createElement("p");
        sub.className = "sheet-sub";
        sub.textContent = "For " + receipt.name + " · Pay at the shop when you pick up.";
        sheet.appendChild(sub);
        const list = document.createElement("div");
        list.className = "sheet-list";
        receipt.items.forEach(function(it, i) {
            const row = document.createElement("div");
            row.className = "sheet-row";
            row.style.animationDelay = (120 + i * 70) + "ms";
            row.innerHTML = '<div><b></b><span></span></div><div class="sheet-right"><b></b><code></code></div>';
            row.querySelector("div b").textContent = it.name;
            row.querySelector("div span").textContent = it.shop + " · Qty " + it.qty;
            row.querySelector(".sheet-right b").textContent = "₹" + it.subtotal.toFixed(2);
            row.querySelector("code").textContent = "ID " + it.id;
            list.appendChild(row);
        });
        sheet.appendChild(list);
        const tot = document.createElement("div");
        tot.className = "sheet-total";
        tot.innerHTML = "<span>Total to pay</span><b></b>";
        tot.querySelector("b").textContent = "₹" + receipt.total.toFixed(2);
        sheet.appendChild(tot);
        const note = document.createElement("p");
        note.className = "sheet-note";
        note.textContent = "Show the ID at the shop. You can look it up anytime in My reservations.";
        sheet.appendChild(note);
    } else {
        details.forEach(function(d) {
            const p = document.createElement("p");
            p.className = "sheet-sub";
            p.textContent = d;
            sheet.appendChild(p);
        });
    }
    const done = document.createElement("button");
    done.type = "button";
    done.className = "sheet-done";
    done.textContent = type === "success" ? "Done" : "Okay";
    done.onclick = closeReservationSheet;
    sheet.appendChild(done);

    overlay.appendChild(sheet);
    overlay.addEventListener("click", function(e) { if (e.target === overlay) closeReservationSheet(); });
    document.body.appendChild(overlay);
    document.body.classList.add("sheet-open");
    requestAnimationFrame(function() { overlay.classList.add("show"); });
    done.focus({ preventScroll: true });
}

function closeReservationSheet() {
    const o = document.getElementById("reservationSheet");
    if (!o) return;
    o.id = "";
    o.classList.remove("show");
    document.body.classList.remove("sheet-open");
    setTimeout(function() { o.remove(); }, 320);
}
document.addEventListener("keydown", function(e) { if (e.key === "Escape") closeReservationSheet(); });

// -------------------- LOAD PRODUCTS --------------------


async function loadProducts() {
    message.textContent = "Loading products...";

    try {
        const { data, error } = await db.rpc(
            "get_pickngo_public_products"
        );

        if (error) {
            throw error;
        }

        products = data || [];

        displayProducts();
        displayCart();

        message.textContent =
            "Showing " + products.length + " product(s).";

    } catch (error) {
        console.error("Error loading PickNGo products:", error);

        message.textContent =
            "Could not load products: " + error.message;
    }
}


// -------------------- SEARCH AND DISPLAY PRODUCTS --------------------

function displayProducts() {
    productList.innerHTML = "";

    const searchText = searchInput.value.trim().toLowerCase();
    const onlyAvailable = availableOnly.checked;

    // Filter products using the search text and availability checkbox.
    const filtered = products.filter(function(product) {
        const name = String(product.name || "").toLowerCase();
        const shop = String(product.shop || "").toLowerCase();

        const matches =
            name.includes(searchText) ||
            shop.includes(searchText);

        const isAvailable = Number(product.stock) > 0;

        return matches && (!onlyAvailable || isAvailable);
    });

    if (filtered.length === 0) {
        message.textContent = products.length === 0
            ? "No products have been added by the shop yet."
            : "No matching products found. Try another search.";

        return;
    }

    // Group products with the same name into one card.
    const groupedProducts = new Map();

    filtered.forEach(function(product) {
        const productKey = String(product.name || "")
            .trim()
            .toLowerCase();

        if (!groupedProducts.has(productKey)) {
            groupedProducts.set(productKey, []);
        }

        groupedProducts.get(productKey).push(product);
    });

    message.textContent =
        "Showing " + groupedProducts.size + " different product(s).";

    // Display one card for each product name.
    groupedProducts.forEach(function(shopProducts) {
        const firstProduct = shopProducts[0];

        const card = document.createElement("article");
        card.className = "product-card grouped-product-card";
        const withImage = shopProducts.find(function(p) { return p.image_key; });
        card.dataset.image = withImage ? withImage.image_key : "";

        const name = document.createElement("h3");
        name.className = "grouped-product-name";
        name.textContent = firstProduct.name;

        const shopCount = document.createElement("p");
        shopCount.className = "shop-count";
        shopCount.textContent =
            "Available at " + shopProducts.length +
            (shopProducts.length === 1 ? " shop" : " shops");

        const shopList = document.createElement("div");
        shopList.className = "shop-options";

        // Show each shop's own price, stock and Add to Cart button.
        shopProducts.forEach(function(product) {
            const shopOption = document.createElement("div");
            shopOption.className = "shop-option";

            const shopName = document.createElement("h4");
            shopName.className = "shop-option-name";
            shopName.textContent = product.shop || "Green Mart";

            const price = document.createElement("p");
            price.className = "shop-option-price";
            price.textContent =
                "₹" + Number(product.price).toFixed(2);
            const unitText = window.pickngoUnitText
                ? window.pickngoUnitText(product.unit_size, product.unit)
                : "";
            if (unitText) {
                const per = document.createElement("small");
                per.className = "unit-per";
                per.textContent = " / " + unitText;
                price.appendChild(per);
            }

            const stock = document.createElement("p");

            if (Number(product.stock) > 0) {
                stock.className = "available";
                stock.textContent =
                    "In stock: " + product.stock;
            } else {
                stock.className = "unavailable";
                stock.textContent = "Out of stock";
            }

            const addButton = document.createElement("button");
            addButton.type = "button";
            addButton.className = "shop-add-button";
            addButton.textContent = "Add to Cart";

            addButton.disabled =
                checkoutInProgress ||
                Number(product.stock) <= 0;

            // Keep the original product ID and cart logic.
            addButton.addEventListener("click", function() {
                addToCart(product);
            });

            shopOption.append(
                shopName,
                price,
                stock,
                addButton
            );

            shopList.appendChild(shopOption);
        });

        card.append(name, shopCount, shopList);
        productList.appendChild(card);
    });
}

// -------------------- ADD TO CART --------------------

function addToCart(product) {
    if (checkoutInProgress) return;

    const currentStock = Number(product.stock);

    if (currentStock <= 0) {
        alert("This product is out of stock.");
        return;
    }

    const existingItem = cart.find(function(item) {
        return String(item.product_id) === String(product.id);
    });

    if (existingItem) {
        if (existingItem.quantity >= currentStock) {
            alert("You have reached the available stock limit.");
            return;
        }

        existingItem.quantity++;
    } else {
        cart.push({
            product_id: product.id,
            quantity: 1
        });
    }

    displayCart();
}

// -------------------- DISPLAY SHOPPING CART --------------------

function displayCart() {
    cartItems.replaceChildren();

    let total = 0;
    let itemCount = 0;

    cart.forEach(function(item) {
        const product = products.find(function(p) {
            return String(p.id) === String(item.product_id);
        });

        if (!product) return;

        const price = Number(product.price);
        const quantity = item.quantity;
        const subtotal = price * quantity;

        total += subtotal;
        itemCount += quantity;

        const row = document.createElement("article");
        row.className = "cart-item";

        Object.assign(row.style, {
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "14px",
            margin: "10px 0",
            backgroundColor: "#fff",
            boxSizing: "border-box"
        });

        const name = document.createElement("h3");
        name.textContent = product.name;
        name.style.marginTop = "0";

        const shop = document.createElement("p");
        shop.textContent = "Shop: " + (product.shop || "Green Mart");

        const unitPrice = document.createElement("p");
        unitPrice.textContent = "Price per item: ₹" + price.toFixed(2);

        const subtotalLine = document.createElement("p");
        subtotalLine.textContent = "Subtotal: ₹" + subtotal.toFixed(2);
        subtotalLine.style.fontWeight = "bold";

        const controls = document.createElement("div");

        Object.assign(controls.style, {
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "wrap"
        });

        const minusButton = document.createElement("button");
        minusButton.type = "button";
        minusButton.textContent = "−";
        minusButton.disabled = checkoutInProgress;

        minusButton.addEventListener("click", function() {
            if (item.quantity > 1) {
                item.quantity--;
            } else {
                cart = cart.filter(function(cartItem) {
                    return String(cartItem.product_id) !==
                        String(item.product_id);
                });
            }

            displayCart();
        });

        const quantityText = document.createElement("span");
        quantityText.textContent = "Quantity: " + quantity;

        const plusButton = document.createElement("button");
        plusButton.type = "button";
        plusButton.textContent = "+";
        plusButton.disabled =
            checkoutInProgress || quantity >= Number(product.stock);

        plusButton.addEventListener("click", function() {
            if (item.quantity < Number(product.stock)) {
                item.quantity++;
                displayCart();
            } else {
                alert("You have reached the available stock limit.");
            }
        });

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Remove";
        removeButton.disabled = checkoutInProgress;

        removeButton.addEventListener("click", function() {
            cart = cart.filter(function(cartItem) {
                return String(cartItem.product_id) !==
                    String(item.product_id);
            });

            displayCart();
        });

        controls.append(
            minusButton,
            quantityText,
            plusButton,
            removeButton
        );

        row.append(name, shop, unitPrice, subtotalLine, controls);

        if (quantity > Number(product.stock)) {
            const warning = document.createElement("p");
            warning.textContent =
                "Only " + product.stock +
                " item(s) are currently available. Please adjust your quantity.";
            warning.style.color = "#b91c1c";
            row.appendChild(warning);
        }

        cartItems.appendChild(row);
    });

    cartMessage.textContent = cart.length === 0
        ? "Your cart is empty. Add products below."
        : cart.length + " different product(s), " +
          itemCount + " item(s) in total.";

    cartTotal.textContent = total.toFixed(2);

    checkoutButton.disabled =
        checkoutInProgress || cart.length === 0;
}

// -------------------- CHECKOUT ALL PRODUCTS --------------------

checkoutForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    if (checkoutInProgress) return;

    if (cart.length === 0) {
        showReservationNotice(
            "error",
            "Your cart is empty",
            ["Please add products before checkout."]
        );
        return;
    }

    // Reserving needs an account; browsing and the cart stay open to guests.
    if (window.pickngoRequireAuth && !window.pickngoRequireAuth()) {
        return;
    }

    const customerName =
        document.getElementById("customerName").value.trim();

    const customerPhone =
        document.getElementById("customerPhone").value.trim();

    if (!customerName || !customerPhone) {
        showReservationNotice(
            "error",
            "Customer details required",
            ["Please enter your name and phone number."]
        );
        return;
    }

    // Confirm that every selected product still exists
    // and has enough stock before checkout.
    for (const item of cart) {
        const product = products.find(function(p) {
            return String(p.id) === String(item.product_id);
        });

        if (!product || Number(product.stock) < item.quantity) {
            showReservationNotice(
                "error",
                "Stock has changed",
                [
                    (product ? product.name : "A selected product") +
                    " no longer has enough stock.",
                    "Your cart has not been submitted. Review the quantities and try again."
                ]
            );

            await loadProducts();
            return;
        }
    }

    const itemsToReserve = cart.map(function(item) {
        return {
            product_id: String(item.product_id),
            quantity: item.quantity
        };
    });

    checkoutInProgress = true;
    checkoutButton.textContent = "Processing Reservation...";

    displayProducts();
    displayCart();

    try {
        // Call the exact multi-product function created in Supabase.
        const { data, error } = await db.rpc(
            "reserve_pickngo_products",
            {
                p_items: itemsToReserve,
                p_customer_name: customerName,
                p_customer_phone: customerPhone
            }
        );

        if (error) throw error;

        if (
            !data ||
            data.success !== true ||
            !Array.isArray(data.reservations)
        ) {
            throw new Error(
                "The reservation could not be confirmed. Please try again."
            );
        }

        let grandTotal = 0;
        const items = data.reservations.map(function(r) {
            const subtotal = Number(r.price) * Number(r.quantity);
            grandTotal += subtotal;
            return { name: r.product_name, shop: r.shop || "Green Mart",
                     qty: Number(r.quantity), subtotal: subtotal, id: r.reservation_id };
        });

        // Clear the cart only after Supabase confirms success.
        cart = [];

        showReservationNotice("success", "Reserved for pickup", [],
            { name: customerName, items: items, total: grandTotal });

        checkoutForm.reset();

        await loadProducts();

    } catch (error) {
        console.error("Cart reservation error:", error);

        showReservationNotice(
            "error",
            "Reservation unsuccessful",
            [
                error.message || "Please try again.",
                "Your checkout was not confirmed. Review your cart before retrying."
            ]
        );

        await loadProducts();

    } finally {
        checkoutInProgress = false;
        checkoutButton.textContent = "Reserve All Products";

        displayProducts();
        displayCart();
    }
});

// -------------------- SEARCH CONTROLS --------------------

searchButton.addEventListener("click", displayProducts);

availableOnly.addEventListener("change", displayProducts);

searchInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        displayProducts();
    }
});

// -------------------- START PICKNGO --------------------

loadProducts();

// Refresh every 50 seconds without resetting the cart.
setInterval(loadProducts, 50000);


/* ========================================
   PICKNGO - CHECK MY RESERVATION
   ======================================== */

reservationLookupForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const reservationIdInput =
        document.getElementById("lookupReservationId").value.trim();

    const customerPhone =
        document.getElementById("lookupPhone").value.trim();

    const reservationId = Number(reservationIdInput);

    // Validate the reservation ID.
    if (
        !reservationIdInput ||
        !Number.isSafeInteger(reservationId) ||
        reservationId <= 0
    ) {
        reservationLookupResult.textContent =
            "Please enter a valid positive reservation ID.";
        return;
    }

    if (!customerPhone) {
        reservationLookupResult.textContent =
            "Please enter the phone number used when booking.";
        return;
    }

    // Show loading information.
    reservationLookupResult.replaceChildren();

    const loadingMessage = document.createElement("p");
    loadingMessage.textContent = "Checking your reservation...";
    reservationLookupResult.appendChild(loadingMessage);

    lookupReservationButton.disabled = true;
    lookupReservationButton.textContent = "Checking...";

    try {
        const { data, error } = await db.rpc(
            "get_pickngo_reservation",
            {
                p_reservation_id: reservationId,
                p_customer_phone: customerPhone
            }
        );

        if (error) {
            console.error("Reservation lookup error:", error);
            throw new Error(
                "We couldn't check the reservation right now. Please try again."
            );
        }

        reservationLookupResult.replaceChildren();

        if (!data || data.length === 0) {
            const notFound = document.createElement("p");
            notFound.textContent =
                "No matching reservation was found. Check your reservation ID and phone number.";
            notFound.className = "error";

            reservationLookupResult.appendChild(notFound);
            return;
        }

        const reservation = data[0];

        const card = document.createElement("article");
        card.className = "panel";
        card.style.marginTop = "16px";

        const heading = document.createElement("h3");
        heading.textContent = "Reservation Details";
        card.appendChild(heading);

        function addDetail(label, value) {
            const line = document.createElement("p");
            line.textContent = label + ": " + value;
            card.appendChild(line);
        }

        addDetail("Reservation ID", reservation.reservation_id);
        addDetail("Product", reservation.product_name);
        addDetail("Shop", reservation.shop);
        addDetail(
            "Price per item",
            "₹" + Number(reservation.price).toFixed(2)
        );
        addDetail("Quantity", reservation.quantity);
        addDetail(
            "Total",
            "₹" + (
                Number(reservation.price) *
                Number(reservation.quantity)
            ).toFixed(2)
        );
        addDetail("Status", reservation.status || "Pending");

        if (reservation.created_at) {
            const date = new Date(reservation.created_at);

            if (!Number.isNaN(date.getTime())) {
                addDetail("Reserved on", date.toLocaleString());
            }
        }

        const note = document.createElement("p");
        note.textContent =
            "Please visit the shop to pay for and collect your reserved product.";
        card.appendChild(note);

        reservationLookupResult.appendChild(card);

    } catch (error) {
        console.error("Could not retrieve reservation:", error);

        reservationLookupResult.replaceChildren();

        const errorMessage = document.createElement("p");
        errorMessage.textContent =
            error.message || "Something went wrong. Please try again.";
        errorMessage.className = "error";

        reservationLookupResult.appendChild(errorMessage);

    } finally {
        lookupReservationButton.disabled = false;
        lookupReservationButton.textContent = "Check Reservation";
    }
});

