---
description: "Workspace instructions for the Food Point static HTML storefront."
---

# Food Point workspace instructions

This repository is a small static web project with only HTML pages. There is no JavaScript or CSS source in the repository root, and no build/test pipeline is present.

## What to do here

- Treat this as a static frontend project. Edit HTML files directly.
- Preserve the existing page structure, links, and semantic HTML wherever possible.
- Keep changes small and localized to the relevant file(s).
- When asked to add or change UI content, use the existing layout and page patterns.
- When asked to fix navigation or form flow, update only the affected HTML pages.

## Relevant files

- `cart.html`
- `login.html`
- `menu.html`
- `orders.html`
- `owner-dashboard.html`
- `payment-options.html`
- `payment-upi.html`
- `payment.html`
- `store.html`
- `thank-you.html`

## Notes

- There is no visible build tooling, task runner, or package manifest in this repository.
- Do not assume backend services, server-side templates, or database access.
- If a feature requires dynamic behavior, prefer static HTML-level changes and keep assumptions explicit.

## Example prompts

- "Update the `orders.html` page to show a pending orders message when the order list is empty."
- "Fix the navigation links between `menu.html` and `cart.html`."
- "Add a confirmation step to `payment.html` using the existing page layout."
