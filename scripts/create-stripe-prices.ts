/**
 * Mirrors the Studio price list (src/data/studio-products.ts) into Stripe.
 *
 *   npm run stripe:setup            create or update everything in the mode of the key in your env file
 *   npm run stripe:setup -- --dry   print what would happen and change nothing
 *   npm run stripe:setup -- --live  required to touch a live-mode key (rk_live_… / sk_live_…)
 *   npm run stripe:setup -- --test-order         create a hidden A$1 "TEST ORDER" product, for the private test at /admin/test-order/
 *   npm run stripe:setup -- --remove-test-order  archive that test product again once the test is done
 *
 * One Stripe Product per size (so the checkout line item reads "Level Design — Line Table (2000mm × 1000mm)") with one AUD
 * Price each, found again by its lookup key. Safe to re-run: unchanged prices are left alone (though a Product's
 * name and description are refreshed if they have changed), and a changed amount gets a new Price that takes over the lookup
 * key (the old one is archived). The names start with "Level Design" so they stand out on a shared Stripe account.
 *
 * The Stripe account is shared with other sites, so every object this creates is namespaced: Product ids and
 * Price lookup keys all start with "studio_", and nothing outside that prefix is read, changed or archived.
 * A restricted key (rk_…) is enough: Products = Write and Prices = Write. Delete that key once setup is done.
 */
import Stripe from "stripe";
import { allStudioProducts } from "../src/data/studio-products.ts";

const SITE = "https://leveldesign.com.au";
const args = new Set(process.argv.slice(2));
const dry = args.has("--dry");
const allowLive = args.has("--live");

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY is empty. Put your *test* restricted key (rk_test_…) in your env file, then run this again.");
  process.exit(1);
}
// Both secret (sk_live_…) and restricted (rk_live_…) live keys count as live.
const isLive = /^(sk|rk)_live_/.test(key);
if (isLive && !allowLive) {
  console.error("That is a LIVE-mode key. Re-run with --live if you really mean to create live Products and Prices.");
  process.exit(1);
}
console.log(`Stripe mode: ${isLive ? "LIVE" : "test"}${dry ? " (dry run — nothing will be changed)" : ""}\n`);

const stripe = new Stripe(key);
const dollars = (cents: number) => `$${(cents / 100).toLocaleString("en-AU")}`;

// A hidden A$1 product for one end-to-end test of checkout, the order webhook and the emails (see /admin/test-order/). It is not part
// of the site's price list, so it never appears on a page. Only this one product and its price are created or archived.
const TEST_ORDER_ID = "studio_test_order";
if (args.has("--test-order") || args.has("--remove-test-order")) {
  const existing = (await stripe.prices.list({ lookup_keys: [TEST_ORDER_ID], active: true, limit: 1 })).data[0];
  if (args.has("--remove-test-order")) {
    console.log(existing ? `  -  archive the test order price (${existing.id}) and product` : "  =  no active test order price to archive");
    if (!dry) {
      if (existing) await stripe.prices.update(existing.id, { active: false });
      await stripe.products.update(TEST_ORDER_ID, { active: false }).catch(() => undefined);
    }
  } else if (existing && existing.unit_amount === 100 && existing.currency === "aud") {
    // The price can still be active while the product was archived (e.g. in the Stripe dashboard), and Checkout refuses an
    // archived product, so make sure it's switched back on.
    const product = await stripe.products.retrieve(TEST_ORDER_ID).catch(() => null);
    if (product && !product.active) {
      console.log(`  ~  TEST ORDER A$1 (${existing.id}): product was archived → reactivate`);
      if (!dry) await stripe.products.update(TEST_ORDER_ID, { active: true });
    } else {
      console.log(`  =  TEST ORDER A$1 already set up (${existing.id})`);
    }
  } else {
    console.log("  +  TEST ORDER  A$1  → create");
    if (!dry) {
      const fields = { name: "Level Design: TEST ORDER (not a real product)", description: "Internal test of the checkout, the order webhook and the order emails. Not for sale.", active: true };
      try {
        await stripe.products.update(TEST_ORDER_ID, fields);
      } catch (err) {
        if ((err as { code?: string }).code !== "resource_missing") throw err;
        await stripe.products.create({ id: TEST_ORDER_ID, ...fields });
      }
      const price = await stripe.prices.create({ product: TEST_ORDER_ID, currency: "aud", unit_amount: 100, lookup_key: TEST_ORDER_ID, transfer_lookup_key: true, nickname: "Test order", tax_behavior: "unspecified" });
      if (existing) await stripe.prices.update(existing.id, { active: false });
      console.log(`       ${price.id}`);
    }
  }
  console.log(dry ? "\n(Dry run: nothing was changed.)" : "\nDone.");
  process.exit(0);
}

let created = 0;
let updated = 0;
let unchanged = 0;
let renamed = 0;

for (const product of allStudioProducts) {
  for (const size of product.sizes) {
    const productId = size.stripeLookupKey; // e.g. studio_line_2000x1000 — also used as the Stripe Product id
    const name = `Level Design — ${product.name} (${size.label})`;
    // The plain 3D render, as everywhere outside the product page (the room views are AI visualisations, labelled only there).
    const image = new URL(product.images.main, SITE).toString();
    const description = `${size.dimensions}. ${product.specifications["Timber / Finish"]}. Studio Collection, made to order (6–8 week lead time).`;

    const existing = (await stripe.prices.list({ lookup_keys: [size.stripeLookupKey], active: true, limit: 1 })).data[0];
    if (existing && existing.unit_amount === size.price && existing.currency === "aud") {
      // The price is right; just make sure the Product's name, description and image are current.
      const current = await stripe.products.retrieve(productId).catch(() => null);
      if (current && (current.name !== name || current.description !== description || current.images[0] !== image)) {
        console.log(`  ~  ${name}  ${dollars(size.price)}  → update details (was "${current.name}")`);
        if (!dry) await stripe.products.update(productId, { name, description, images: [image] });
        renamed++;
      } else {
        console.log(`  =  ${name}  ${dollars(size.price)}  (already set up: ${existing.id})`);
        unchanged++;
      }
      continue;
    }

    console.log(`  ${existing ? "~" : "+"}  ${name}  ${dollars(size.price)}  → ${existing ? `update (was ${dollars(existing.unit_amount ?? 0)})` : "create"}`);
    if (dry) continue;

    // Product: reuse the one with our id if it exists, otherwise create it. Names and descriptions stay in sync.
    try {
      await stripe.products.update(productId, { name, description, images: [image], active: true });
    } catch (err) {
      if ((err as { code?: string }).code !== "resource_missing") throw err;
      await stripe.products.create({
        id: productId,
        name,
        description,
        images: [image],
        metadata: { studio_product: product.id, studio_size: size.id },
      });
    }

    const price = await stripe.prices.create({
      product: productId,
      currency: "aud",
      unit_amount: size.price,
      lookup_key: size.stripeLookupKey,
      transfer_lookup_key: true, // moves the key off the old Price, if there is one
      nickname: size.label,
      // The business isn't GST-registered, so no tax is added or shown.
      tax_behavior: "unspecified",
    });
    if (existing) {
      await stripe.prices.update(existing.id, { active: false });
      updated++;
    } else {
      created++;
    }
    console.log(`       ${price.id}`);
  }
}

console.log(`\nDone. ${created} created, ${updated} updated, ${renamed} renamed, ${unchanged} already up to date.`);
if (dry) console.log("(Dry run: nothing was changed.)");
