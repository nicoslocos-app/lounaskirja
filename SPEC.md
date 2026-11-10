# Latest user change: shared kitchen account

The user explicitly replaced separate staff/admin accounts with one shared username and password. All signed-in staff may maintain the restaurant data. Credentials are server-side Netlify environment values, not browser source. The new implementation does not use Supabase Auth. See README.md for current instructions; earlier role requirements below are superseded.

# Updated architecture · 10 November 2026

The user has replaced the original Cloudflare recommendation with GitHub + Netlify + Supabase. This revision uses Supabase Auth, Netlify Functions, and PostgreSQL. See README.md and ALOITA_TASTA.html for the current setup. No terminal is required for dashboard-based initial deployment.

# PROJECT BRIEF: Lunch Management & Recipe App

## 1. PROJECT OVERVIEW

Build a lightweight, professional, mobile-friendly web application for a Finnish restaurant that serves daily buffet lunches.

**This is a real application intended for daily restaurant use, not just a visual prototype.**

The app should help restaurant staff:

1. Record daily lunch customer numbers.
2. Track leftover food in GN containers.
3. Record which dishes were served.
4. Analyze customer numbers and food waste over time.
5. Store, search and scale kitchen recipes.
6. View food allergens, dietary labels and protein sources.

The application must be exceptionally simple and fast to use.

**Main objective: Staff should be able to complete the daily lunch report in approximately 1–2 minutes.**

### Business model

The app will initially be built for one restaurant and potentially sold to its owner for a one-time payment.

Therefore:

- Avoid mandatory monthly subscriptions.
- Avoid paid AI APIs.
- Prioritize free hosting and database tiers.
- Keep maintenance requirements minimal.
- Make data export and backups possible.
- Do not build a complex SaaS architecture.

The first version is for **one restaurant only**.

---

## 2. TECHNOLOGY & HOSTING

Recommended stack:

- Frontend: lightweight React + TypeScript, or another suitably simple modern frontend.
- Backend: Netlify Functions.
- Database: Supabase PostgreSQL + Supabase Auth.
- Hosting: Netlify, deployed from GitHub.
- Source control: GitHub, in a new independent repository.
- Mobile-friendly responsive web app.
- PWA support if practical, allowing staff to add the app to their phone's home screen.

Aim to stay within the available free service tiers, but do not assume hosting will remain free indefinitely.

The application must use a shared database. Do not use localStorage as the primary storage mechanism.

Include secure authentication and two user roles:

- **Admin:** manages recipes, settings, users and reports.
- **Staff:** records lunches and searches recipes.

Use secure sessions, server-side validation and appropriate authorization. Avoid unnecessary external services.

All project files and services must be independent from existing Nicoslocos projects. Do not modify any existing repository or application.

---

## 3. UI / UX DESIGN

Create a clean, minimal and professional interface suitable for a busy restaurant kitchen.

Design principles:

- Finnish interface.
- Mobile-first and responsive.
- Large, easy-to-tap buttons.
- Minimal typing.
- Clear typography.
- Light, neutral interface with restrained accent colors.
- Simple navigation.
- No unnecessary animations.
- No cluttered dashboards.

The main navigation should contain four sections:

**1. Lounaskirjaus**

**2. Reseptipankki**

**3. Lounaslista**

**4. Tilastot**

Admin settings can be a separate secondary section.

The homepage should show today's date, today's lunch menu and a prominent button to record the lunch.

---

## 4. FEATURE 1: DAILY LUNCH RECORDING

This is the most important functionality.

**One daily record represents one lunch service.**

The user should enter:

| Field | Input type |
|---|---|
| Date | Automatically today, editable |
| Weekday | Automatic |
| Month | Automatic |
| Year | Automatic |
| Finnish public holiday | Automatically detected |
| Total lunch customers | Number |
| Contract lunch customers | Number, included in total |
| Main protein dish(es) | Select from dishes or enter manually |
| Carbohydrate dish(es) | Select from dishes or enter manually |
| Vegan dish(es) | Select from dishes or enter manually |
| Protein leftovers | GN quantity |
| Carbohydrate leftovers | GN quantity |
| Vegan leftovers | GN quantity |
| Optional notes | Text |
| Exceptional day | Optional selection |

### GN recording

The restaurant uses shallow, elongated GN containers.

The exact GN size and depth are not yet confirmed.

Therefore, create a configurable standard reference GN container in settings.

Initially, staff should be able to record leftovers in increments of 0.25 GN:

- 0 GN
- 0.25 GN
- 0.5 GN
- 0.75 GN
- 1 GN
- More than 1 GN, if necessary

Use large plus/minus buttons.

Store these values as numeric quantities.

Do not assume the container is GN 1/1 or convert quantities into kilograms without verified capacity information.

**Important:** For version 1, the entered GN values represent food left over after lunch, not necessarily food that has been thrown away. Label this clearly as "Ylijäämä (GN)" in the interface.

The three categories are tracked separately.

Do not attempt to calculate individual dish waste if multiple dishes share the same category and only a category-level quantity was entered.

### Usability

When a user opens the daily entry:

- Today is selected automatically.
- Weekday and month are already filled.
- Dishes are prefilled from the lunch menu if available.
- Staff enter customer numbers and GN leftovers.
- One prominent "Tallenna lounas" button saves the record.
- Show a clear confirmation.
- Allow existing records to be edited.
- Prevent duplicate records for the same lunch service.
- Validate that contract customer numbers do not exceed total customers.
- Do not count closed days as zero-customer lunch services.

---

## 5. FEATURE 2: FOOD / DISH MANAGEMENT

Create a simple list of dishes that can be reused in the daily lunch records.

Examples:

**Proteiini**
- Uunilohi
- Broileri
- Lihapullat

**Hiilihydraatti**
- Perunamuusi
- Riisi
- Paahdetut perunat

**Vegaaninen**
- Linssicurry
- Tofuwokki
- Kasvispata

The list must be editable.

Allow users to add their own dishes.

A dish should have a primary tracking category for daily reporting. Recipes can also have additional searchable tags.

Users should not need to type the same dish name repeatedly.

---

## 6. FEATURE 3: DIGITAL RECIPE BANK

Build a searchable recipe library.

This is the second most important feature.

### Recipe fields

Each recipe should support:

- Recipe name.
- Food category.
- Ingredient list.
- Ingredient quantities and units.
- Preparation instructions.
- Original serving quantity.
- Protein source (e.g. chicken, salmon, tofu, lentils).
- Dietary labels (vegan, vegetarian, gluten-free, etc.).
- Allergen information.
- Optional preparation notes.
- Optional recipe image.

### Search

Users should be able to search by:

- Recipe name.
- Ingredient.
- Category.
- Protein source.
- Dietary requirements.

Examples:

Searching for "tofu" should show recipes containing tofu.

Filtering by "Vegaaninen" should show recipes that have been verified and marked vegan.

### Serving calculator

Add a simple recipe scaling function.

Example:

A recipe contains quantities for 50 servings.

If the user selects 80 servings, ingredient quantities automatically scale proportionally.

Keep the calculations simple and accurate.

Do not automatically change the original stored recipe when scaling.

### Allergens and dietary information

Allergen and dietary fields must be entered or verified by authorized kitchen staff.

Do not invent, assume or automatically certify allergen-free status.

Make it clear that staff must check the actual ingredients, product labels and cross-contact risks.

---

## 7. FEATURE 4: WEEKLY LUNCH MENU

Allow staff to plan weekly lunches.

Create a calendar view from Monday to Friday.

For each day, users can select dishes from the dish list or recipe bank.

Example:

**Monday**
- Chicken
- Rice
- Vegan curry

**Tuesday**
- Salmon
- Mashed potatoes
- Lentil stew

Users must be able to change dishes easily.

When opening daily lunch recording, automatically show the dishes already planned for that date.

Support more than one dish in a category.

---

## 8. FEATURE 5: LUNCH STATISTICS

Create a simple statistics dashboard.

### Essential statistics

1. Total lunch customers.
2. Average customers by weekday.
3. Average customers by month.
4. Contract lunch customer totals.
5. Protein leftovers (GN).
6. Carbohydrate leftovers (GN).
7. Vegan leftovers (GN).
8. Total recorded GN leftovers.

### Filtering

Allow filtering by:

- Date range.
- Weekday.
- Month.
- Year.
- Dish.
- Public holiday / exceptional day.

### Charts

Display simple charts for:

- Customers by weekday.
- Customer trends over time.
- Leftovers by food category.
- Leftovers over time.

Show exact numbers alongside charts.

All statistics must be calculated from actual stored records.

Do not generate fictional performance insights.

### Dish analysis

Allow filtering customer numbers by the dishes served on particular dates.

Example:

"How many customers visited on Tuesdays when salmon was served?"

Because this is a buffet, do not claim that all customers consumed the selected dish.

---

## 9. FINNISH PUBLIC HOLIDAYS

Implement automatic Finnish public holiday detection.

Include fixed and movable public holidays, with correct dates for each year.

Store or calculate:

- Date.
- Weekday.
- Month.
- Year.
- Public holiday status/name.

Also provide an optional exceptional-day field for:

- School holidays.
- Special events.
- Restaurant closures.
- Unusual contract customer changes.
- Other exceptional circumstances.

Closed days must be excluded from normal lunch service averages.

---

## 10. DATA STORAGE & EXPORT

Data must persist reliably in the shared database.

Provide an admin feature to export:

- Lunch records.
- Dish list.
- Recipes, including ingredients and instructions.

Use portable formats such as CSV and JSON. Add Excel-compatible exports where practical.

Document a practical backup and restore procedure.

Include a safe way to recover from accidental mistakes.

Make sure a browser refresh, logout or device change does not delete stored data.

---

## 11. NOT INCLUDED IN V1

To keep this version lightweight, do not implement:

- AI-powered analysis.
- Paid API integrations.
- Ingredient purchase price tracking.
- Full recipe costing.
- Automatic food ordering.
- Inventory management.
- POS integrations.
- Complex menu forecasting.
- Automatic per-dish consumption estimation.
- Multi-restaurant SaaS architecture.
- Payment processing.
- Subscription systems.

These may be added later.

The database structure should support reasonable future extensions without making V1 unnecessarily complicated.

---

## 12. FUTURE FEATURES — DO NOT IMPLEMENT YET

Potential version 2 improvements:

- Customer forecasts based on weekday, month and lunch menu.
- Separate management of active contract lunch customers.
- Contract customer start/end dates.
- Recommended preparation amounts.
- Tracking food quantities prepared versus food left over.
- Accurate food waste in kilograms and euros.
- Recipe food-cost calculations.
- Ingredient purchase planning.
- Historical dish popularity analysis.

Do not add these features in version 1.

---

## 13. DEVELOPMENT INSTRUCTIONS

Build the actual working application.

Please:

1. Define the application architecture.
2. Create the database schema and necessary migrations.
3. Implement the frontend and backend.
4. Implement secure authentication and role permissions.
5. Implement all V1 features.
6. Make the interface fully responsive.
7. Include helpful empty states and clear error messages.
8. Include optional sample data for testing, clearly separated from real records.
9. Test saving, editing, filtering, recipe scaling and data persistence.
10. Include clear installation and Netlify + Supabase deployment instructions.

### Acceptance criteria

The app is ready for testing when:

- A staff member can record a lunch in under two minutes.
- A saved record is visible on another authenticated device.
- The same lunch date cannot accidentally create duplicate records.
- Weekdays, months and Finnish public holidays work correctly.
- GN quantities and statistics calculate correctly.
- Staff can find a recipe quickly using search and filters.
- Recipe ingredient quantities scale correctly.
- Admins can export the restaurant's data.
- The app works comfortably on mobile and desktop.
- It can operate within free hosting tiers under modest usage, without requiring paid APIs.

### Deliverables

Provide:

- Complete source code.
- Database schema and migrations.
- Deployment configuration.
- README with setup instructions.
- Instructions for creating the initial admin account.
- Instructions for backups and data exports.
- A short explanation of potential ongoing costs and maintenance requirements.

Use a new independent project.

Do not modify existing Nicoslocos apps, repositories or deployments.

**Prioritize simplicity, reliability, low maintenance and usability over technical complexity.**

The final result should feel like a small, polished restaurant operations tool — not an enterprise management system.

Proceed with coding the MVP. Make sensible implementation decisions where details are missing and document assumptions. Do not add features outside this brief.