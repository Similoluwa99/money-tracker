# Money Tracker

A simple, fast, and responsive money and expense tracking web application built using pure HTML, CSS, and vanilla JavaScript. Features Nigerian Naira (₦) currency formatting and full income tracking.

## Features

- **No Backend / Database Required**: Completely client-side and runs right in any modern web browser.
- **Naira Currency (₦)**: Formats all amounts in Nigerian Naira (`₦`).
- **Income & Expense Tracking**: Easily switch between recording daily spendings or incoming revenue.
- **Financial Overview**: Real-time summary cards displaying Net Balance, Total Income, Total Spends, and Spends Count.
- **Persistent Storage**: Uses browser `localStorage` so your spendings and income persist across page reloads.
- **Filter & Search**: Filter by `All`, `Spends`, or `Income`, and search records dynamically by keyword, amount, or date.
- **Edit & Update**: Modify details of any spend or income record with ease.
- **Safe Deletion**: In-app custom confirmation modal prevents accidental deletions.
- **Mobile Responsive**: Clean layout optimized for mobile screens and desktop alike.

## Getting Started

1. Clone or download this repository.
2. Open `index.html` in your web browser. That's it!

## Files

- `index.html` - App structure, stats overview, income/expense form, and modal markup
- `style.css` - Responsive modern styling, segmented controls, badges, and modal animations
- `script.js` - Dynamic DOM interactions, income/spend logic, search & tab filtering, and localStorage management
