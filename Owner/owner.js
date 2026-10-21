
let currentUser = null;
let currentShop = null;
let editingProductId = null;
let loadingProducts = false;
let loadingReservations = false;

const loginSection = document.getElementById("loginSection");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const signedInMessage = document.getElementById("signedInMessage");
const signOutButton = document.getElementById("signOutButton");

const productForm = document.getElementById("productForm");
const productFormTitle = document.getElementById("productFormTitle");
const productName = document.getElementById("productName");
const productShop = document.getElementById("productShop");
const productPrice = document.getElementById("productPrice");
const productStock = document.getElementById("productStock");
const productUnit = document.getElementById("productUnit");
const productUnitSize = document.getElementById("productUnitSize");
const unitChips = document.getElementById("unitChips");
const stockHint = document.getElementById("stockHint");
const pickerTabs = document.getElementById("pickerTabs");
const pickerGrid = document.getElementById("pickerGrid");
const pickerPreview = document.getElementById("pickerPreview");
const pickerLabel = document.getElementById("pickerLabel");
const shopTitle = document.getElementById("shopTitle");
let selectedImageKey = null;
let activePickerTab = "All";
// Becomes false if the database has no image/unit columns yet (run setup.sql).
let extraColumns = true;

// ---------- Unit options ----------
window.PICKNGO_UNITS.forEach(function(u) {
    const opt = document.createElement("option");
    opt.value = u.value;
    opt.textContent = u.label;
    productUnit.appendChild(opt);
});
[["1","kg"],["500","g"],["250","g"],["1","L"],["500","ml"],["1","pc"],["1","dozen"]].forEach(function(p) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "unit-chip";
    chip.textContent = p[0] + " " + p[1];
    chip.addEventListener("click", function() {
        productUnitSize.value = p[0];
        productUnit.value = p[1];
        updateUnitUi();
    });
    unitChips.appendChild(chip);
});
function updateUnitUi() {
    const text = window.pickngoUnitText(productUnitSize.value, productUnit.value);
    stockHint.textContent = "(number of " + text + " packs)";
    unitChips.querySelectorAll(".unit-chip").forEach(function(c) {
        c.classList.toggle("active", c.textContent === text);
    });
}
productUnit.addEventListener("change", updateUnitUi);
productUnitSize.addEventListener("input", updateUnitUi);
updateUnitUi();

// ---------- Picture library picker ----------
function renderPicker() {
    const lib = window.PICKNGO_LIBRARY;
    const cats = ["All"].concat(Array.from(new Set(lib.map(function(x) { return x.category; }))));
    pickerTabs.replaceChildren();
    cats.forEach(function(cat) {
        const tab = document.createElement("button");
        tab.type = "button";
        tab.className = "picker-tab" + (cat === activePickerTab ? " active" : "");
        tab.textContent = cat;
        tab.addEventListener("click", function() { activePickerTab = cat; renderPicker(); });
        pickerTabs.appendChild(tab);
    });
    pickerGrid.replaceChildren();
    lib.filter(function(x) { return activePickerTab === "All" || x.category === activePickerTab; })
        .forEach(function(item) {
            const tile = document.createElement("button");
            tile.type = "button";
            tile.className = "picker-tile" + (item.key === selectedImageKey ? " active" : "");
            const img = document.createElement("img");
            img.src = "../assets/" + item.key + ".jpg";
            img.alt = "";
            img.loading = "lazy";
            const label = document.createElement("span");
            label.textContent = item.label;
            tile.append(img, label);
            tile.addEventListener("click", function() {
                selectedImageKey = selectedImageKey === item.key ? null : item.key;
                renderPicker();
            });
            pickerGrid.appendChild(tile);
        });
    updatePickerPreview();
}
function updatePickerPreview() {
    const src = window.pickngoImageFor(selectedImageKey, productName.value);
    pickerPreview.replaceChildren();
    if (src) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        pickerPreview.appendChild(img);
    } else {
        pickerPreview.textContent = "🛍️";
    }
    const chosen = window.PICKNGO_LIBRARY.find(function(x) { return x.key === selectedImageKey; });
    pickerLabel.textContent = chosen ? chosen.label : (src ? "Auto-matched from name" : "No picture yet");
}
productName.addEventListener("input", updatePickerPreview);
renderPicker();

function isMissingColumnError(error) {
    const msg = String((error && error.message) || "");
    return (error && error.code === "PGRST204") || /column/i.test(msg) && /(image_key|unit)/i.test(msg);
}
const saveProductButton = document.getElementById("saveProductButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const productMessage = document.getElementById("productMessage");
const ownerProductList = document.getElementById("ownerProductList");

const refreshProductsButton =
    document.getElementById("refreshProductsButton");

const refreshReservationsButton =
    document.getElementById("refreshReservationsButton");

const reservationMessage =
    document.getElementById("reservationMessage");

const reservationList =
    document.getElementById("reservationList");

function showLogin(messageText = "") {
    loginSection.classList.remove("hidden");
    dashboard.classList.add("hidden");
    loginMessage.textContent = messageText;
}

function showDashboard(user, shopName) {
    currentUser = user;
    currentShop = shopName;

    loginSection.classList.add("hidden");
    dashboard.classList.remove("hidden");

    signedInMessage.textContent = "Signed in as " + user.email;
    shopTitle.textContent = currentShop;

    // Owners can add products only to their assigned shop.
    productShop.value = currentShop;
    productShop.readOnly = true;

    loadOwnerProducts();
    loadReservations();
}

async function getOwnerShop(user) {
    if (!user) {
        return { shop: null, error: "Please sign in." };
    }

    const { data, error } = await db
        .from("owner_shops")
        .select("shop_name")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Owner shop lookup error:", error);
        return {
            shop: null,
            error: "Could not verify your shop: " + error.message
        };
    }

    if (!data || !data.shop_name) {
        return {
            shop: null,
            error:
                "No shop is assigned to this account. Ask the PickNGo administrator to assign your shop."
        };
    }

    return { shop: data.shop_name, error: null };
}

loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    loginMessage.textContent = "Signing in...";

    const email =
        document.getElementById("ownerEmail").value.trim();

    const password =
        document.getElementById("ownerPassword").value;

    const { data, error } = await db.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        loginMessage.textContent = "Login failed: " + error.message;
        return;
    }

    const result = await getOwnerShop(data.user);

    if (!result.shop) {
        await db.auth.signOut();
        currentUser = null;
        currentShop = null;
        showLogin(result.error);
        return;
    }

    showDashboard(data.user, result.shop);
});

signOutButton.addEventListener("click", async function() {
    const { error } = await db.auth.signOut();

    if (error) {
        alert("Could not sign out: " + error.message);
        return;
    }

    currentUser = null;
    currentShop = null;
    editingProductId = null;

    resetProductForm();

    ownerProductList.replaceChildren();
    reservationList.replaceChildren();
    reservationMessage.textContent = "";

    productShop.readOnly = false;
    showLogin("You have signed out.");
});

function resetProductForm() {
    editingProductId = null;
    productForm.reset();

    productFormTitle.textContent = "Add Product";
    saveProductButton.textContent = "Add Product";
    cancelEditButton.classList.add("hidden");
    productMessage.textContent = "";
    selectedImageKey = null;
    productUnit.value = "pc";
    productUnitSize.value = "1";
    updateUnitUi();
    renderPicker();

    if (currentShop) {
        productShop.value = currentShop;
        productShop.readOnly = true;
    }
}

cancelEditButton.addEventListener("click", resetProductForm);

productForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    if (!currentUser || !currentShop) {
        productMessage.textContent = "Please sign in first.";
        return;
    }

    const name = productName.value.trim();
    const price = Number(productPrice.value);
    const stock = Number(productStock.value);

    if (!name) {
        productMessage.textContent = "Enter the product name.";
        return;
    }

    if (!Number.isFinite(price) || price < 0) {
        productMessage.textContent = "Enter a valid price.";
        return;
    }

    const unit = productUnit.value;
    const unitSize = Number(productUnitSize.value);

    if (!Number.isFinite(unitSize) || unitSize <= 0) {
        productMessage.textContent = "Enter how much is sold per pack (e.g. 1 kg, 500 g).";
        return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
        productMessage.textContent =
            "Stock must be a whole number of zero or more.";
        return;
    }

    saveProductButton.disabled = true;
    productMessage.textContent = "Saving product...";

    try {
        let result;
        const extras = {
            image_key: selectedImageKey,
            unit: unit,
            unit_size: unitSize
        };

        async function save(withExtras) {
            const fields = { name: name, price: price, stock: stock };
            if (withExtras) Object.assign(fields, extras);
            if (editingProductId !== null) {
                return db.from("products").update(fields)
                    .eq("id", editingProductId)
                    .eq("shop", currentShop)
                    .select("id");
            }
            fields.shop = currentShop;
            return db.from("products").insert(fields).select("id");
        }

        result = await save(extraColumns);
        if (result.error && extraColumns && isMissingColumnError(result.error)) {
            extraColumns = false;
            result = await save(false);
        }

        if (result.error) {
            throw result.error;
        }

        if (!result.data || result.data.length === 0) {
            throw new Error(
                "No product was changed. Check your shop permissions."
            );
        }

        const okText = editingProductId !== null
            ? "Product updated successfully."
            : "Product added successfully.";

        resetProductForm();
        productMessage.textContent = extraColumns
            ? okText
            : okText + " (Picture and unit were not saved — run setup.sql once in your database.)";
        await loadOwnerProducts();

    } catch (error) {
        console.error("Product save error:", error);
        productMessage.textContent =
            "Could not save product: " + error.message;
    } finally {
        saveProductButton.disabled = false;
    }
});

async function loadOwnerProducts() {
    if (!currentUser || !currentShop || loadingProducts) {
        return;
    }

    loadingProducts = true;
    ownerProductList.textContent = "Loading your shop's products...";

    try {
        const { data, error } = await db
            .from("products")
            .select(extraColumns ? "*" : "id, name, shop, price, stock")
            .eq("shop", currentShop)
            .order("name", { ascending: true });

        if (error) {
            throw error;
        }

        ownerProductList.replaceChildren();

        const list = data || [];
        document.getElementById("statProducts").textContent = list.length;
        document.getElementById("statInStock").textContent =
            list.filter(function(p) { return Number(p.stock) > 0; }).length;
        document.getElementById("statOut").textContent =
            list.filter(function(p) { return Number(p.stock) <= 0; }).length;
        if (list.length && !("unit" in list[0])) extraColumns = false;

        if (!data || data.length === 0) {
            ownerProductList.textContent =
                "No products have been added to " + currentShop + " yet.";
            return;
        }

        data.forEach(function(product) {
            const item = document.createElement("div");
            item.className = "owner-product";

            const src = window.pickngoImageFor(product.image_key, product.name);
            const media = document.createElement("div");
            media.className = "owner-product-img";
            if (src) {
                const img = document.createElement("img");
                img.src = src; img.alt = ""; img.loading = "lazy";
                media.appendChild(img);
            } else {
                media.textContent = "🛍️";
            }

            const heading = document.createElement("h3");
            heading.textContent = product.name;

            const unitText = window.pickngoUnitText(product.unit_size, product.unit);
            const details = document.createElement("p");
            details.className = "owner-product-meta";
            details.textContent = unitText || "—";

            const priceRow = document.createElement("div");
            priceRow.className = "owner-product-row";
            const priceEl = document.createElement("b");
            priceEl.textContent = "₹" + Number(product.price).toFixed(2);
            const stockEl = document.createElement("span");
            const inStock = Number(product.stock) > 0;
            stockEl.className = "stock-badge" + (inStock ? "" : " out");
            stockEl.textContent = inStock ? product.stock + " in stock" : "Out of stock";
            priceRow.append(priceEl, stockEl);

            const actions = document.createElement("div");
            actions.className = "owner-actions";

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.textContent = "Edit";

            editButton.addEventListener("click", function() {
                editingProductId = product.id;

                productName.value = product.name;
                productShop.value = currentShop;
                productPrice.value = product.price;
                productStock.value = product.stock;
                productUnit.value = product.unit || "pc";
                productUnitSize.value = product.unit_size || 1;
                selectedImageKey = product.image_key || null;
                updateUnitUi();
                renderPicker();

                productFormTitle.textContent = "Update Product";
                saveProductButton.textContent = "Save Changes";
                cancelEditButton.classList.remove("hidden");
                productMessage.textContent = "";

                productForm.scrollIntoView({ behavior: "smooth" });
            });

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "Delete";
            deleteButton.className = "danger";

            deleteButton.addEventListener("click", async function() {
                const confirmed = confirm(
                    "Delete " + product.name + " from " +
                    currentShop + "? This cannot be undone."
                );

                if (!confirmed) {
                    return;
                }

                deleteButton.disabled = true;

                try {
                    const { data: deletedRows, error } = await db
                        .from("products")
                        .delete()
                        .eq("id", product.id)
                        .eq("shop", currentShop)
                        .select("id");

                    if (error) {
                        throw error;
                    }

                    if (!deletedRows || deletedRows.length === 0) {
                        throw new Error(
                            "The product was not deleted. Check permissions."
                        );
                    }

                    await loadOwnerProducts();

                } catch (error) {
                    alert("Could not delete product: " + error.message);
                    deleteButton.disabled = false;
                }
            });

            actions.append(editButton, deleteButton);
            item.append(media, heading, details, priceRow, actions);
            ownerProductList.appendChild(item);
        });

    } catch (error) {
        console.error("Product loading error:", error);
        ownerProductList.textContent =
            "Could not load products: " + error.message;
    } finally {
        loadingProducts = false;
    }
}

async function loadReservations() {
    if (!currentUser || !currentShop || loadingReservations) {
        return;
    }

    loadingReservations = true;
    reservationMessage.textContent = "Loading your shop's reservations...";
    reservationList.replaceChildren();

    try {
        const { data, error } = await db
            .from("reservations")
            .select(
                "id, product_name, shop, price, quantity, customer_name, customer_phone, status, created_at"
            )
            .eq("shop", currentShop)
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        document.getElementById("statReserved").textContent =
            (data || []).filter(function(r) { return r.status === "reserved"; }).length;

        if (!data || data.length === 0) {
            reservationMessage.textContent =
                "No reservations for " + currentShop + " yet.";
            return;
        }

        reservationMessage.textContent =
            "Found " + data.length + " reservation(s) for " +
            currentShop + ".";

        data.forEach(function(reservation) {
            const item = document.createElement("div");
            item.className = "reservation-item";

            const heading = document.createElement("h3");
            heading.textContent =
                reservation.product_name + " × " + reservation.quantity;

            const customer = document.createElement("p");
            customer.textContent =
                "Customer: " + reservation.customer_name +
                " | Phone: " + reservation.customer_phone;

            const shop = document.createElement("p");
            shop.textContent =
                "Shop: " + reservation.shop +
                " | Price per item: ₹" + reservation.price;

            const status = document.createElement("p");
            status.textContent = "Status: " + reservation.status;

            const date = document.createElement("p");
            date.textContent =
                "Reserved: " +
                new Date(reservation.created_at).toLocaleString();

            item.append(heading, customer, shop, status, date);

            if (reservation.status === "reserved") {
                const collectedButton = document.createElement("button");
                collectedButton.type = "button";
                collectedButton.textContent = "Mark as Collected";

                collectedButton.addEventListener(
                    "click",
                    async function() {
                        const confirmed = confirm(
                            "Mark this reservation as collected?"
                        );

                        if (!confirmed) {
                            return;
                        }

                        collectedButton.disabled = true;

                        try {
                            const { data: updatedRows, error } = await db
                                .from("reservations")
                                .update({ status: "collected" })
                                .eq("id", reservation.id)
                                .eq("shop", currentShop)
                                .select("id");

                            if (error) {
                                throw error;
                            }

                            if (!updatedRows || updatedRows.length === 0) {
                                throw new Error(
                                    "Reservation was not updated. Check permissions."
                                );
                            }

                            await loadReservations();

                        } catch (error) {
                            alert(
                                "Could not update reservation: " +
                                error.message
                            );
                            collectedButton.disabled = false;
                        }
                    }
                );

                item.appendChild(collectedButton);
            }

            reservationList.appendChild(item);
        });

    } catch (error) {
        console.error("Reservation loading error:", error);
        reservationMessage.textContent =
            "Could not load reservations: " + error.message;
    } finally {
        loadingReservations = false;
    }
}

refreshProductsButton.addEventListener(
    "click",
    loadOwnerProducts
);

refreshReservationsButton.addEventListener(
    "click",
    loadReservations
);

async function initializeOwnerPage() {
    showLogin("Checking your login...");

    const { data, error } = await db.auth.getSession();

    if (error) {
        showLogin("Could not check login: " + error.message);
        return;
    }

    const user = data.session ? data.session.user : null;

    if (!user) {
        showLogin("Please sign in to continue.");
        return;
    }

    const result = await getOwnerShop(user);

    if (!result.shop) {
        await db.auth.signOut();
        showLogin(result.error);
        return;
    }

    showDashboard(user, result.shop);
}

db.auth.onAuthStateChange(function(event, session) {
    if (event === "SIGNED_OUT") {
        currentUser = null;
        currentShop = null;
        showLogin("You have signed out.");
    }
});

initializeOwnerPage();
