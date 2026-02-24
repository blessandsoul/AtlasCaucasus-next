# Hero Category Tabs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the flat location chips below the hero search bar with a tabbed category system (All, Adventure, Cultural, Wine & Food, Nature, Beach) where each tab reveals relevant destination sub-tags.

**Architecture:** Hardcoded category-to-destination mapping defined as a constant in HeroSection. Active tab stored in local state. Destinations resolved to locationIds at runtime via the existing `useLocations` hook (increased limit to 30). Sub-tag clicks navigate to `/explore/tours?category=X&locationId=Y`.

**Tech Stack:** React state, Tailwind CSS, framer-motion for sub-tag transitions, existing `useLocations` hook, i18n translations in 3 languages.

---

### Task 1: Add translation keys for category tabs

**Files:**
- Modify: `client/src/locales/en/translation.json` (inside `home.hero`)
- Modify: `client/src/locales/ka/translation.json` (inside `home.hero`)
- Modify: `client/src/locales/ru/translation.json` (inside `home.hero`)

**Step 1: Add category tab keys to English translations**

In `home.hero`, after the `search` object, add:

```json
"category_tabs": {
  "all": "All",
  "adventure": "Adventure",
  "cultural": "Cultural",
  "wine_food": "Wine & Food",
  "nature": "Nature",
  "beach": "Beach"
}
```

**Step 2: Add category tab keys to Georgian translations**

Same location in ka/translation.json:

```json
"category_tabs": {
  "all": "ყველა",
  "adventure": "თავგადასავალი",
  "cultural": "კულტურული",
  "wine_food": "ღვინო და საჭმელი",
  "nature": "ბუნება",
  "beach": "სანაპირო"
}
```

**Step 3: Add category tab keys to Russian translations**

Same location in ru/translation.json:

```json
"category_tabs": {
  "all": "Все",
  "adventure": "Приключения",
  "cultural": "Культура",
  "wine_food": "Вино и еда",
  "nature": "Природа",
  "beach": "Пляж"
}
```

**Step 4: Commit**

```bash
git add client/src/locales/en/translation.json client/src/locales/ka/translation.json client/src/locales/ru/translation.json
git commit -m "feat: add hero category tab translations for en, ka, ru"
```

---

### Task 2: Add category data constant and replace trending section in HeroSection

**Files:**
- Modify: `client/src/components/home/HeroSection.tsx`

**Step 1: Add the category data constant and Lucide icons**

At the top of the file, after the existing imports, add `AnimatePresence` to the framer-motion import. Update the lucide-react import to include category icons: `Sparkles, Compass, Landmark, Wine, Leaf, Umbrella`. Remove unused icons: `Plane, TrendingUp, Sun, Mountain, Building2`.

Define the constant (outside the component, after the import block):

```typescript
interface CategoryTab {
    key: string;
    translationKey: string;
    icon: LucideIcon;
    categorySlug: string | null; // null = "All" (no category filter)
    destinations: string[]; // location names to match against API data
}

const HERO_CATEGORIES: CategoryTab[] = [
    {
        key: 'all',
        translationKey: 'home.hero.category_tabs.all',
        icon: Sparkles,
        categorySlug: null,
        destinations: ['Tbilisi', 'Batumi', 'Kazbegi (Stepantsminda)', 'Kutaisi', 'Mestia', 'Borjomi'],
    },
    {
        key: 'adventure',
        translationKey: 'home.hero.category_tabs.adventure',
        icon: Compass,
        categorySlug: 'Adventure',
        destinations: ['Kazbegi (Stepantsminda)', 'Tusheti', 'Gudauri', 'Shatili', 'Lagodekhi', 'Mestia'],
    },
    {
        key: 'cultural',
        translationKey: 'home.hero.category_tabs.cultural',
        icon: Landmark,
        categorySlug: 'Cultural',
        destinations: ['Tbilisi', 'Kutaisi', 'Gori', 'Vardzia', 'David Gareja', 'Uplistsikhe'],
    },
    {
        key: 'wine_food',
        translationKey: 'home.hero.category_tabs.wine_food',
        icon: Wine,
        categorySlug: 'Wine & Food',
        destinations: ['Telavi', 'Signagi', 'Kvareli', 'Tsinandali'],
    },
    {
        key: 'nature',
        translationKey: 'home.hero.category_tabs.nature',
        icon: Leaf,
        categorySlug: 'Nature',
        destinations: ['Borjomi', 'Martvili', 'Lagodekhi', 'Mestia', 'Ushguli'],
    },
    {
        key: 'beach',
        translationKey: 'home.hero.category_tabs.beach',
        icon: Umbrella,
        categorySlug: 'Beach & Coast',
        destinations: ['Batumi', 'Kobuleti'],
    },
];
```

> **Note:** Destination names must match the `name` field from the locations API exactly. Verify against seed data: `server/src/scripts/db/seed-all.ts`. Adjust if names differ (e.g., "Kazbegi (Stepantsminda)" vs "Kazbegi").

**Step 2: Remove old helper functions**

Delete `getLocationIcon()` and `getLocationIconColor()` functions (lines 17-36). These were used by the old trending chips and are no longer needed.

**Step 3: Add state and increase location fetch limit**

Inside the component:

1. Add `activeCategory` state:
```typescript
const [activeCategory, setActiveCategory] = useState<string>('all');
```

2. Change the `useLocations` call from `limit: 5` to `limit: 30` so all locations are available for ID resolution:
```typescript
const { data: locationsData, isLoading: isLoadingLocations } = useLocations({
    isActive: true,
    limit: 30,
});
```

3. Add a helper to find a location by name:
```typescript
const findLocationByName = useCallback((name: string): { id: string; name: string } | undefined => {
    return locations?.find((loc) => loc.name === name);
}, [locations]);
```

4. Derive the active category object:
```typescript
const activeCategoryData = HERO_CATEGORIES.find((c) => c.key === activeCategory) ?? HERO_CATEGORIES[0];
```

**Step 4: Replace the trending section (lines 392-435)**

Remove the entire `{/* Trending Section */}` div and replace with:

```tsx
{/* Category Tabs + Sub-Tags */}
<div className="mt-8 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-backwards">
    {/* Category Tabs Row */}
    <div className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm p-1.5">
        {HERO_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.key;
            return (
                <button
                    key={category.key}
                    onClick={() => setActiveCategory(category.key)}
                    className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                        isActive
                            ? "bg-white text-foreground shadow-sm"
                            : "text-white/80 hover:text-white hover:bg-white/10"
                    )}
                >
                    <Icon className="h-3.5 w-3.5" />
                    {t(category.translationKey)}
                </button>
            );
        })}
    </div>

    {/* Sub-Tags Row */}
    <div className="flex flex-wrap items-center justify-center gap-2.5 min-h-[36px]">
        {isLoadingLocations ? (
            Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 w-20 rounded-full bg-white/10 animate-pulse" />
            ))
        ) : (
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeCategory}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-wrap items-center justify-center gap-2.5"
                >
                    {activeCategoryData.destinations.map((destName) => {
                        const location = findLocationByName(destName);
                        return (
                            <button
                                key={destName}
                                onClick={() => {
                                    const params = new URLSearchParams();
                                    if (activeCategoryData.categorySlug) {
                                        params.set('category', activeCategoryData.categorySlug);
                                    }
                                    if (location) {
                                        params.set('locationId', location.id);
                                    }
                                    router.push(`/explore/tours?${params.toString()}`);
                                }}
                                className="text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-full px-3 py-1 transition-all duration-150 cursor-pointer"
                            >
                                # {destName}
                            </button>
                        );
                    })}
                </motion.div>
            </AnimatePresence>
        )}
    </div>
</div>
```

**Step 5: Verify the component builds**

Run: `cd client && npx next build --no-lint 2>&1 | head -30` (or just start dev server and check the hero section)

**Step 6: Commit**

```bash
git add client/src/components/home/HeroSection.tsx
git commit -m "feat: replace hero trending chips with category tabs and sub-tags"
```

---

### Task 3: Verify destination names match seed data

**Files:**
- Read-only: `server/src/scripts/db/seed-all.ts` or `server/src/scripts/db/data/` files

**Step 1: Check location names in seed data**

Compare every destination name in `HERO_CATEGORIES` against the actual seeded location names. The names must match exactly (case-sensitive). Common mismatches to watch for:
- "Kazbegi" vs "Kazbegi (Stepantsminda)"
- "David Gareja" vs "David-Gareja"

**Step 2: Fix any mismatches in `HERO_CATEGORIES`**

Update destination strings to match the exact DB names.

**Step 3: Commit if changes were needed**

```bash
git add client/src/components/home/HeroSection.tsx
git commit -m "fix: correct destination names to match seed data"
```

---

### Task 4: Visual QA in browser

**Step 1: Start the dev server and open the homepage**

Verify:
- [ ] Category tabs render in a glassmorphic pill container
- [ ] "All" tab is selected by default with white bg
- [ ] Clicking a tab switches the active state and sub-tags animate
- [ ] Sub-tags show `#` prefix and destination names
- [ ] Clicking a sub-tag navigates to `/explore/tours?category=X&locationId=Y`
- [ ] "All" tab sub-tags navigate without a `category` param
- [ ] Loading skeleton appears while locations are fetching
- [ ] Mobile layout wraps tabs and sub-tags correctly
- [ ] No console errors

**Step 2: Test all 6 tabs**

Click each tab and confirm sub-tags change correctly with the fade transition.

**Step 3: Test navigation**

Click at least one sub-tag from each category and confirm the URL params are correct on the explore page.
