// Customer sign-in for PickNGo.
// Guests can browse and use the cart; reserving requires an account.
(function () {
    const sheet = document.getElementById("authSheet");
    const title = document.getElementById("authTitle");
    const subtitle = document.getElementById("authSubtitle");
    const form = document.getElementById("authForm");
    const emailInput = document.getElementById("authEmail");
    const passwordInput = document.getElementById("authPassword");
    const nameRow = document.getElementById("authNameRow");
    const nameInput = document.getElementById("authName");
    const submitButton = document.getElementById("authSubmit");
    const toggleButton = document.getElementById("authToggle");
    const guestButton = document.getElementById("authGuest");
    const closeButton = document.getElementById("authClose");
    const authMessage = document.getElementById("authMessage");
    const authButton = document.getElementById("authButton");

    let currentUser = null;
    let mode = "signin"; // "signin" | "signup"

    function setMode(next) {
        mode = next;
        const signup = mode === "signup";
        title.textContent = signup ? "Create your account" : "Sign in to pickngo";
        submitButton.textContent = signup ? "Create Account" : "Sign In";
        toggleButton.textContent = signup
            ? "Already have an account? Sign in"
            : "New here? Create an account";
        passwordInput.autocomplete = signup ? "new-password" : "current-password";
        nameRow.classList.toggle("hidden", !signup);
        nameInput.required = signup;
        authMessage.textContent = "";
    }

    function openAuth(reason) {
        setMode("signin");
        subtitle.textContent =
            reason || "Sign in to reserve products. Browsing and the cart work without an account.";
        sheet.classList.remove("hidden");
        document.body.classList.add("sheet-open");
        requestAnimationFrame(function () {
            sheet.classList.add("show");
            emailInput.focus({ preventScroll: true });
        });
    }

    function closeAuth(asGuest) {
        if (asGuest) {
            try { sessionStorage.setItem("pickngoGuest", "1"); } catch (e) {}
        }
        sheet.classList.remove("show");
        document.body.classList.remove("sheet-open");
        setTimeout(function () { sheet.classList.add("hidden"); }, 320);
    }

    function setUser(user) {
        currentUser = user;
        if (user) {
            authButton.textContent = "Sign out";
            authButton.classList.add("signed-in");
            authButton.title = user.email || "";
            // Prefill the reservation name from the account, if empty.
            const nameField = document.getElementById("customerName");
            if (nameField && !nameField.value && user.user_metadata && user.user_metadata.name) {
                nameField.value = user.user_metadata.name;
            }
        } else {
            authButton.textContent = "Sign in";
            authButton.classList.remove("signed-in");
            authButton.title = "";
        }
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        submitButton.disabled = true;
        authMessage.textContent = mode === "signup" ? "Creating your account..." : "Signing in...";
        try {
            if (mode === "signup") {
                const { data, error } = await db.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: { name: nameInput.value.trim() },
                        emailRedirectTo: window.location.origin
                    }
                });
                if (error) throw error;
                if (!data.session) {
                    authMessage.textContent =
                        "Account created. Please confirm your email, then sign in.";
                    setMode("signin");
                    return;
                }
            } else {
                const { error } = await db.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                if (error) throw error;
            }
            form.reset();
            closeAuth(false);
        } catch (error) {
            authMessage.textContent = error.message || "Something went wrong. Please try again.";
        } finally {
            submitButton.disabled = false;
        }
    });

    toggleButton.addEventListener("click", function () {
        setMode(mode === "signin" ? "signup" : "signin");
    });
    guestButton.addEventListener("click", function () { closeAuth(true); });
    closeButton.addEventListener("click", function () { closeAuth(true); });
    sheet.addEventListener("click", function (e) {
        if (e.target === sheet) closeAuth(true);
    });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !sheet.classList.contains("hidden")) closeAuth(true);
    });

    authButton.addEventListener("click", async function () {
        if (currentUser) {
            authButton.disabled = true;
            await db.auth.signOut();
            authButton.disabled = false;
        } else {
            openAuth();
        }
    });

    db.auth.onAuthStateChange(function (event, session) {
        setUser(session ? session.user : null);
    });

    // Exposed for the checkout flow: true when reserving is allowed.
    window.pickngoCurrentUser = function () { return currentUser; };
    window.pickngoRequireAuth = function () {
        if (currentUser) return true;
        openAuth("Please sign in to reserve your products. You can keep browsing and adding to the cart without an account.");
        return false;
    };

    // Ask on opening, like Blinkit: signed-in users go straight in,
    // others choose sign in / create account / continue as guest.
    (async function () {
        const { data } = await db.auth.getSession();
        setUser(data.session ? data.session.user : null);
        let guest = false;
        try { guest = sessionStorage.getItem("pickngoGuest") === "1"; } catch (e) {}
        if (!data.session && !guest) openAuth();
    })();
})();
