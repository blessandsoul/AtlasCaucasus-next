# SEO-Friendly Filename Strategy

**Status:** Recommendation
**Priority:** Medium (improve discoverability, not critical for functionality)

---

## Current Implementation

### Filename Pattern
```
{uuid}-{original-name}.{ext}
```

**Example:**
```
abc12345-DSC_0123.jpg
```

### Issues
- ❌ No contextual information (what entity? what location?)
- ❌ Original filename often not descriptive (camera filenames like `DSC_0123.jpg`)
- ❌ Missed SEO opportunity for image search ranking

---

## Recommended: SEO-Optimized Filename Pattern

### Pattern
```
{entity-slug}-{uuid}-{descriptive-name}.{ext}
```

### Examples by Entity Type

#### Tours
```
kazbegi-tour-abc12345-mountain-view.jpg
batumi-beach-tour-def67890-sunset-panorama.jpg
tbilisi-city-tour-ghi11223-old-town-street.jpg
```

#### Companies
```
mountain-adventures-abc12345-logo.jpg
georgia-travel-co-def67890-office-exterior.jpg
```

#### Guides
```
guide-john-smith-abc12345-profile-photo.jpg
guide-ana-beridze-def67890-hiking-action.jpg
```

#### Drivers
```
driver-george-brown-abc12345-vehicle-land-cruiser.jpg
driver-nino-gelashvili-def67890-profile.jpg
```

#### Users
```
user-jane-doe-abc12345-avatar.jpg
```

### Full URL Structure
```
https://yoursite.com/uploads/tours/kazbegi-tour-abc12345-mountain-view.jpg
                              ↑       ↑              ↑      ↑
                         Entity dir   Entity info    UUID   Descriptive
```

---

## SEO Benefits

### 1. Image Search Rankings
**Impact:** HIGH

Google's image search algorithm considers:
- **Filename keywords** (primary signal)
- **URL path** (secondary signal)
- **Alt text** (tertiary signal)
- **Surrounding text** (context signal)

**Example:**
```html
<!-- Current: Low SEO value -->
<img src="/uploads/tours/abc12345-DSC_0123.jpg" alt="Kazbegi mountain view" />

<!-- Recommended: High SEO value -->
<img src="/uploads/tours/kazbegi-tour-abc12345-mountain-view.jpg" alt="Kazbegi mountain view on guided tour" />
```

Google sees: "kazbegi" + "tour" + "mountain" + "view" in BOTH filename and alt text = **highly relevant**.

### 2. Click-Through Rate (CTR)
**Impact:** MEDIUM

Users searching Google Images are more likely to click descriptive filenames:

**Current:**
`abc12345-DSC_0123.jpg` → No context, generic

**Recommended:**
`kazbegi-tour-abc12345-mountain-view.jpg` → Clear context, trustworthy

### 3. Social Media Sharing
**Impact:** MEDIUM

When images are shared on Facebook, Twitter, LinkedIn:
- Filename visible in download/save dialogs
- Descriptive names more shareable
- Better tracking when images go viral

### 4. Backlink Value
**Impact:** LOW

Other websites linking to your images:
- Descriptive filenames provide link text value
- Better context for search engines
- Easier to reference in articles/blogs

---

## Implementation Strategy

### Phase 1: Update Filename Generation

#### New Function: `generateSeoFriendlyFilename()`

**Location:** `server/src/libs/file-upload.ts`

```typescript
/**
 * Generate SEO-friendly filename with entity context
 * @param originalFilename - Original uploaded filename
 * @param entityType - Type of entity (tour, company, guide, driver, user)
 * @param entitySlug - URL-friendly slug of entity (e.g., "kazbegi-tour", "mountain-adventures")
 * @returns SEO-optimized unique filename
 */
export function generateSeoFriendlyFilename(
  originalFilename: string,
  entityType: MediaEntityType,
  entitySlug: string
): string {
  const uuid = uuidv4().split("-")[0]; // 8 chars for uniqueness
  const ext = path.extname(originalFilename).toLowerCase();
  let nameWithoutExt = path.basename(originalFilename, ext);

  // Clean and slugify original filename (remove camera naming patterns)
  nameWithoutExt = slugifyFilename(nameWithoutExt);

  // If original name is not descriptive (e.g., "DSC_0123"), use generic name
  if (!isDescriptiveFilename(nameWithoutExt)) {
    nameWithoutExt = getDefaultNameForEntity(entityType);
  }

  // Format: {entity-slug}-{uuid}-{descriptive-name}.{ext}
  return `${entitySlug}-${uuid}-${nameWithoutExt}${ext}`;
}

/**
 * Slugify filename for SEO (lowercase, hyphens, remove special chars)
 */
function slugifyFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, "")     // Remove leading/trailing hyphens
    .replace(/-{2,}/g, "-")      // Replace multiple hyphens with single
    .slice(0, 50);               // Limit length
}

/**
 * Check if filename is descriptive (not camera auto-generated)
 */
function isDescriptiveFilename(name: string): boolean {
  // Camera patterns: DSC_0123, IMG_5678, P1234567, etc.
  const cameraPatterns = /^(dsc|img|p|photo|image|pic)[-_]?\d+$/i;

  // Generic patterns: image1, photo, untitled, etc.
  const genericPatterns = /^(image|photo|picture|img|pic|untitled|new)[-_]?\d*$/i;

  // If name matches camera/generic pattern, it's NOT descriptive
  if (cameraPatterns.test(name) || genericPatterns.test(name)) {
    return false;
  }

  // If name has at least 3 chars and looks meaningful, it's descriptive
  return name.length >= 3;
}

/**
 * Get default descriptive name for entity type
 */
function getDefaultNameForEntity(entityType: MediaEntityType): string {
  const defaults: Record<MediaEntityType, string> = {
    tour: "tour-image",
    company: "company-logo",
    guide: "guide-photo",
    driver: "driver-photo",
    user: "user-avatar",
  };
  return defaults[entityType] || "image";
}
```

### Phase 2: Extract Entity Slugs

#### Tours
```typescript
// In uploadTourImage() helper
export async function uploadTourImage(
  currentUser: JwtUser,
  tourId: string,
  file: UploadedFile
): Promise<SafeMedia> {
  const tour = await getTourById(tourId);
  if (!tour) {
    throw new NotFoundError("Tour not found", "TOUR_NOT_FOUND");
  }

  // Check ownership
  if (tour.ownerId !== currentUser.id && !currentUser.roles.includes("ADMIN")) {
    throw new ForbiddenError("You can only upload images for your own tours", "NOT_TOUR_OWNER");
  }

  // Generate entity slug from tour title
  const entitySlug = generateEntitySlug(tour.title, "tour");

  return uploadMediaForEntity(currentUser, "tour", tourId, file, entitySlug);
}

/**
 * Generate entity slug from title/name
 */
function generateEntitySlug(title: string, entityType: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40); // Limit to 40 chars

  return `${slug}-${entityType}`;
}
```

**Example Output:**
- Tour title: "Kazbegi Mountain Adventure"
- Entity slug: `kazbegi-mountain-adventure-tour`
- Full filename: `kazbegi-mountain-adventure-tour-abc12345-mountain-view.jpg`

#### Companies
```typescript
// Generate slug from company name
const entitySlug = generateEntitySlug(company.companyName, "company");
// Result: "mountain-adventures-company-abc12345-logo.jpg"
```

#### Guides
```typescript
// Generate slug from guide name
const guideName = `${guide.user.firstName} ${guide.user.lastName}`;
const entitySlug = generateEntitySlug(guideName, "guide");
// Result: "guide-john-smith-abc12345-profile.jpg"
```

#### Drivers
```typescript
// Generate slug from driver name
const driverName = `${driver.user.firstName} ${driver.user.lastName}`;
const entitySlug = generateEntitySlug(driverName, "driver");
// Result: "driver-george-brown-abc12345-vehicle.jpg"
```

#### Users
```typescript
// Generate slug from user name
const userName = `${user.firstName} ${user.lastName}`;
const entitySlug = generateEntitySlug(userName, "user");
// Result: "user-jane-doe-abc12345-avatar.jpg"
```

### Phase 3: Update Service Layer

#### Modify `uploadMediaForEntity()`

**Location:** `server/src/modules/media/media.service.ts`

```typescript
export async function uploadMediaForEntity(
  currentUser: JwtUser,
  entityType: MediaEntityType,
  entityId: string,
  file: UploadedFile,
  entitySlug?: string // NEW: Optional SEO slug
): Promise<SafeMedia> {
  // Validate file type and size
  // ... existing validation ...

  // Generate filename
  const sanitizedName = sanitizeFilename(file.originalFilename);

  let uniqueFilename: string;
  if (entitySlug) {
    // Use SEO-friendly filename
    uniqueFilename = generateSeoFriendlyFilename(sanitizedName, entityType, entitySlug);
  } else {
    // Fallback to UUID-only filename
    uniqueFilename = generateUniqueFilename(sanitizedName);
  }

  // Save file to disk
  const filePath = await saveFile(file.buffer, entityType, uniqueFilename);

  // Create media record
  // ... rest of function ...
}
```

---

## Backward Compatibility

### ✅ No Breaking Changes

#### Old Files Continue Working
```
/uploads/tours/abc12345-DSC_0123.jpg  ← Old format, still works
/uploads/tours/kazbegi-tour-def67890-mountain-view.jpg  ← New format
```

#### Migration Not Required
- Old files keep old names
- New uploads use new format
- Both formats work simultaneously

#### Optional: Rename Existing Files
If you want to rename old files (future enhancement):

```typescript
// Migration script: Rename existing media files
export async function migrateFilenamesForSeo(): Promise<void> {
  const allMedia = await prisma.media.findMany({
    include: {
      // Include entity details to generate slugs
    }
  });

  for (const media of allMedia) {
    // Extract entity information
    const entity = await getEntityDetails(media.entityType, media.entityId);

    // Generate new filename
    const entitySlug = generateEntitySlug(entity.title || entity.name, media.entityType);
    const newFilename = generateSeoFriendlyFilename(
      media.originalName,
      media.entityType,
      entitySlug
    );

    // Rename file on disk
    const oldPath = media.url;
    const newPath = oldPath.replace(media.filename, newFilename);

    await renameFile(oldPath, newPath);

    // Update database
    await prisma.media.update({
      where: { id: media.id },
      data: {
        filename: newFilename,
        url: newPath,
      }
    });
  }
}
```

**NOTE:** Migration is optional and can be done gradually.

---

## Alternative: Alt Text Strategy (Easier)

If you want SEO benefits WITHOUT changing filenames, **focus on alt text**:

### Generate Dynamic Alt Text

```typescript
// In tour controller when serving HTML
function generateImageAltText(tour: Tour, media: SafeMedia): string {
  const location = tour.city || "Georgia";
  const tourType = tour.category || "tour";

  return `${location} ${tourType} - ${tour.title}`;
}
```

**Example:**
```html
<!-- Image with auto-generated alt text -->
<img
  src="/uploads/tours/abc12345-DSC_0123.jpg"
  alt="Kazbegi adventure tour - Mountain hiking experience"
/>
```

**SEO Impact:**
- Alt text: **HIGH** impact (80% of filename benefit)
- Filename: **MEDIUM** impact (20% additional benefit)

**Recommendation:**
Start with alt text (easy), add SEO filenames later (moderate effort).

---

## Implementation Effort

### Option 1: SEO Filenames + Alt Text (Recommended)
**Effort:** 4-6 hours
**SEO Impact:** 100%

**Changes:**
- Update `file-upload.ts` with new filename functions
- Update all media helpers to pass entity slugs
- Update `media.service.ts` to accept entity slug parameter
- Add frontend alt text generation

### Option 2: Alt Text Only (Quick Win)
**Effort:** 1-2 hours
**SEO Impact:** 80%

**Changes:**
- Add frontend helper to generate alt text from entity data
- Update image rendering to use dynamic alt text
- No backend changes needed

### Option 3: SEO Filenames Only (Partial)
**Effort:** 3-4 hours
**SEO Impact:** 60%

**Changes:**
- Backend filename generation only
- No frontend alt text changes
- Easier backend-only implementation

---

## Recommended Implementation Order

### Phase 1: Alt Text (Week 1)
✅ Quick win, high impact, low effort

### Phase 2: SEO Filenames (Week 2-3)
✅ Moderate effort, medium additional impact

### Phase 3: Optional Migration (Future)
⚪ Low priority, can be done gradually

---

## Additional SEO Considerations

### 1. Image Sitemap
Create `/sitemap-images.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://yoursite.com/tours/kazbegi-mountain-tour</loc>
    <image:image>
      <image:loc>https://yoursite.com/uploads/tours/kazbegi-tour-abc12345-mountain-view.jpg</image:loc>
      <image:title>Kazbegi Mountain Tour</image:title>
      <image:caption>Stunning mountain views on guided Kazbegi tour</image:caption>
    </image:image>
  </url>
</urlset>
```

### 2. Structured Data (JSON-LD)
```json
{
  "@context": "https://schema.org",
  "@type": "TouristAttraction",
  "name": "Kazbegi Mountain Tour",
  "image": "https://yoursite.com/uploads/tours/kazbegi-tour-abc12345-mountain-view.jpg",
  "description": "Guided tour to Kazbegi mountains with stunning views"
}
```

### 3. Open Graph Tags
```html
<meta property="og:image" content="/uploads/tours/kazbegi-tour-abc12345-mountain-view.jpg" />
<meta property="og:image:alt" content="Kazbegi mountain view on guided tour" />
```

### 4. Lazy Loading + Responsive Images
```html
<img
  src="/uploads/tours/kazbegi-tour-abc12345-mountain-view.jpg"
  srcset="/uploads/tours/kazbegi-tour-abc12345-mountain-view-400w.jpg 400w,
          /uploads/tours/kazbegi-tour-abc12345-mountain-view-800w.jpg 800w"
  sizes="(max-width: 600px) 400px, 800px"
  alt="Kazbegi mountain view on guided tour"
  loading="lazy"
/>
```

---

## Conclusion

### ✅ Recommended: SEO Filenames + Alt Text

**Pattern:**
```
{entity-slug}-{uuid}-{descriptive-name}.{ext}
```

**Example:**
```
kazbegi-tour-abc12345-mountain-view.jpg
```

**Benefits:**
- 📈 Better Google Image search ranking
- 🎯 Keyword-rich URLs for SEO
- 👥 Higher click-through rates
- 🔗 Better social media sharing
- 🏆 Professional appearance

**Effort:** Moderate (4-6 hours)
**Impact:** High (100% SEO value)

**Start with:** Alt text implementation (quick win)
**Follow up with:** SEO filenames (lasting value)

---

**Last Updated:** January 14, 2026
