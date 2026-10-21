# PickNGo — professional storefront redesign

Open index.html for the customer website. Shop owners can use the link in the top menu or open Owner/index.html.

Both sites can be uploaded together to a static web host. Keep the folder structure unchanged. An internet connection is needed for the existing product and reservation service, and web fonts.

This edition removes animated glows, floating emoji cards, glass panels and ornamental effects. It uses solid surfaces, category photography, compact product cards and restrained interaction transitions. Mobile layouts and reduced-motion preferences are supported.

The original service configuration and customer/owner scripts are preserved. Product photographs are illustrative category images, not verified package photos. Products without a matching illustration use a neutral shopping-bag placeholder. Categories are search shortcuts; a category can return no results when there are no matching live products.

Verified: live public product loading, search/empty results, add-to-cart, cart quantity/total, customer and owner sign-in layouts, mobile overflow, and browser errors. Owner sign-in and authenticated dashboard actions were not verified. A real reservation was not submitted, to avoid creating an unwanted booking.

## New in v4
- Owner "Seller Hub" redesign: shop banner, stats, picture cards.
- Stored picture library (library.js + assets/). Owners pick a picture by category tab (Fruits, Vegetables, Dairy, Snacks, ...). Add more by dropping assets/product-N.jpg and one line in library.js.
- Units: owners set "Sold per" (e.g. 1 kg, 500 g, 1 L, 6 pc, 1 dozen). Stock = number of those packs.
- IMPORTANT: run setup.sql once in your database so picture + unit are saved.

## New in v7
- Phone-first fixes: compact one-row top menu, banner picture shown fully above its text, swipeable category row, larger product photos, bigger tap targets, and lighter animations so scrolling is smooth on phones.

## New in v6
- Customer accounts: on opening, visitors choose Sign in, Create an account, or Continue as guest. Guests can browse and use the cart exactly like before; reserving asks for sign-in first. A Sign in / Sign out button sits in the top menu.
- Customer accounts use the same email + password service as the owner portal (auth.js). New accounts may need email confirmation depending on your service settings — to let customers sign in right after creating an account, turn off "Confirm email" in your Auth settings.
- Motion is now continuous: the reveal, blur and zoom effects replay every time a section scrolls into view, the banner picture slowly breathes, and the main button has a soft pulse — no reload needed.
