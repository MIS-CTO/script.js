# 🎨 Waitlist Carousel Embed System

## Overview

Universal HTML embed code for displaying tattoo studio guest artists in a carousel format. Designed for Webflow and other web platforms with embed support.

---

## 📋 Features

✅ **Single Variable Configuration** - Change `SLOT_NUMBER` to display different artists (1-60)
✅ **Auto-Hide Empty Slots** - Automatically hides when no data is available
✅ **Smart Fallbacks** - Handles missing images, styles, and other fields gracefully
✅ **German Date Formatting** - Displays dates as "20.Nov-4.Dez"
✅ **Auto-Refresh** - Reloads data every 5 minutes
✅ **Mobile Responsive** - Works on all device sizes
✅ **Error Handling** - Clear debug messages for troubleshooting
✅ **Zero Dependencies** - Pure HTML/CSS/JS, no external libraries

---

## 🚀 Quick Start

### Step 1: Copy the Embed Code

Open `waitlist-carousel-embed.html` and copy the entire contents.

### Step 2: Configure Slot Number

Find this line near the top of the `<script>` section:

```javascript
// ⚙️ CHANGE THIS NUMBER TO SWITCH SLOTS (1-60)
const SLOT_NUMBER = 1;
```

Change the number to display a different slot:
- `const SLOT_NUMBER = 1;` → Displays artist in slot 1
- `const SLOT_NUMBER = 15;` → Displays artist in slot 15
- `const SLOT_NUMBER = 60;` → Displays artist in slot 60

### Step 3: Embed in Webflow

1. In Webflow, add an **Embed** element where you want the carousel
2. Paste the entire HTML code
3. Publish your site
4. Done! The carousel will fetch and display the artist data

---

## 📐 Layout Specifications

```
┌─────────────────────────────────────┐
│                                     │
│         ARTIST IMAGE (35vh)         │
│                                     │
│  Style: Blackwork    @instagram  ←  │
│                                     │
├─────────────────────────────────────┤
│  Artist Name        [Book now]   ←  │
│  20.Nov-4.Dez                       │
│  Bio text about the artist...       │
│  (15vh)                             │
└─────────────────────────────────────┘
        Total Height: 50vh
```

### Visual Breakdown

**Image Section (35vh):**
- Full-width artist photo
- Top-left: Style label + style name (white text with shadow)
- Top-right: Clickable Instagram handle (white text with shadow)
- Gradient placeholder if no image available

**Text Section (15vh):**
- Background: Light gray (#f5f5f5)
- Top row: Artist name + dates (left) vs "Book now" button (right)
- Bottom: Bio text (auto-truncated with "..." if too long)

---

## 🎯 States & Behavior

### Loading State
```
┌─────────────────────────┐
│   Loading Slot 1...     │
│   Fetching artist data  │
└─────────────────────────┘
```

### Empty State
```
┌──────────────────────────┐
│ ⚠️ No artist in Slot 1   │
│ This slot is inactive    │
│ [debug info]             │
└──────────────────────────┘
```

### Success State
```
┌─────────────────────────┐
│    [Full carousel]       │
│    with artist data      │
└─────────────────────────┘
```

### Error State
```
┌──────────────────────────┐
│ ❌ Error Loading Slot 1  │
│ Failed to fetch data     │
│ [error details]          │
└──────────────────────────┘
```

---

## 🔧 Configuration

### Supabase Connection

Already configured in the code:

```javascript
const SUPABASE_URL = 'https://auxxyehgzkozdjylhqnx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### Data Source

Fetches from: `active_waitlist_view` table

Query parameters:
- `slot_number`: eq.{SLOT_NUMBER}
- `select`: * (all fields)

### Auto-Refresh Interval

Default: 5 minutes (300,000ms)

To change, modify this line:

```javascript
const REFRESH_INTERVAL = 5 * 60 * 1000; // milliseconds
```

Examples:
- 1 minute: `1 * 60 * 1000`
- 10 minutes: `10 * 60 * 1000`
- 30 minutes: `30 * 60 * 1000`

---

## 📊 Expected Data Structure

The embed expects this data from `active_waitlist_view`:

```json
{
  "slot_number": 1,
  "artist_name": "Jane Doe",
  "style": "Blackwork",
  "date_from": "2025-11-20",
  "date_to": "2025-12-04",
  "profile_picture_url": "https://...",
  "background_image_url": "https://...",
  "bio": "Specialized in geometric blackwork tattoos...",
  "short_description": "Geometric blackwork artist",
  "instagram": "@janedoetattoo",
  "location_name": "Stuttgart"
}
```

### Field Fallbacks

| Field | Fallback |
|-------|----------|
| `profile_picture_url` / `background_image_url` | Gradient placeholder |
| `style` | "Various Styles" |
| `instagram` | "@—" (not clickable) |
| `artist_name` | "Unknown Artist" |
| `bio` / `short_description` | "No bio available" |
| `date_from` / `date_to` | "—" |

---

## 🎨 Styling & Customization

### Colors

```css
/* Change these in the <style> section */
--text-dark: #2d2d2d;      /* Main text */
--text-medium: #555;       /* Dates, bio */
--text-light: #999;        /* Debug info */
--background: #f5f5f5;     /* Text section */
--button-bg: #000;         /* Book button */
--button-hover: #333;      /* Button hover */
```

### Typography

```css
/* Main font */
font-family: -apple-system, BlinkMacSystemFont, sans-serif;

/* Artist name */
font-size: 22px;
font-weight: 700;

/* Dates */
font-size: 13px;
font-weight: 500;

/* Bio */
font-size: 12px;
line-height: 1.5;
```

### Height Adjustment

To change the total height, modify both the container and sections:

```css
.waitlist-carousel {
    height: 50vh; /* Total height */
}

.carousel-image-section {
    height: 35vh; /* Image height */
}

.carousel-text-section {
    height: 15vh; /* Text height */
}
```

**Note:** Keep the ratio at approximately 70/30 (image/text) for best visual balance.

---

## 🔍 Debugging

### Console Logs

The embed logs key events to the browser console:

```
🚀 Initializing Waitlist Carousel...
📍 Configured for Slot: 1
🌐 Fetching from: https://...
📡 Response status: 200
📦 Response data: {...}
✅ Successfully loaded Slot 1: {...}
📊 Carousel populated with data
```

### Common Issues

**1. No data showing:**
- Check that the slot number has data in Supabase
- Verify the `active_waitlist_view` exists and is accessible
- Check browser console for errors

**2. Image not loading:**
- Verify the image URL is publicly accessible
- Check CORS settings on the image host
- The embed will show a gradient placeholder if image fails

**3. "Error Loading" message:**
- Check Supabase API key is valid
- Verify network connectivity
- Check browser console for detailed error message

**4. Dates showing as "—":**
- Verify `date_from` and `date_to` are in ISO format (YYYY-MM-DD)
- Check that dates are not null in database

### Testing

To test the embed:

1. Open `waitlist-carousel-embed.html` in a browser
2. Open browser console (F12)
3. Watch the console logs for data fetching
4. Try different slot numbers to test multiple artists

---

## 📱 Responsive Design

The embed automatically adjusts for different screen sizes:

### Desktop (> 768px)
- Full 50vh height
- Artist name: 22px
- All elements at full size

### Mobile (≤ 768px)
- Same height (50vh)
- Artist name: 18px (smaller)
- Bio: 11px (smaller)
- Padding adjusted for smaller screens

---

## 🔗 Integration Examples

### Webflow

```html
<!-- In Webflow Embed element -->
<div class="custom-carousel-container">
  [Paste entire HTML here]
</div>
```

### WordPress

```html
<!-- In HTML block or Custom HTML widget -->
[Paste entire HTML here]
```

### React/Next.js

```jsx
// Use dangerouslySetInnerHTML or iframe
<div dangerouslySetInnerHTML={{__html: embedCode}} />
```

### Static Site

```html
<!-- Directly in HTML file -->
[Paste entire HTML here]
```

---

## 🎯 Multiple Carousels on One Page

To display multiple slots on the same page:

1. Copy the entire HTML code for each slot
2. Change the `SLOT_NUMBER` in each copy
3. Add unique IDs to avoid conflicts:

```javascript
// First carousel
const SLOT_NUMBER = 1;
const carouselId = 'carousel-1';

// Second carousel
const SLOT_NUMBER = 2;
const carouselId = 'carousel-2';
```

Then update all `getElementById` calls to use `carouselId`.

**Alternative:** Use an iframe for each carousel to avoid ID conflicts.

---

## 📈 Performance

- **Initial load:** ~1-2 seconds (depends on network)
- **Image load:** Progressive (doesn't block text)
- **Auto-refresh:** Every 5 minutes
- **File size:** ~12KB (uncompressed)
- **No external dependencies:** Zero additional HTTP requests

---

## 🛡️ Security

- Uses HTTPS for all requests
- Supabase anon key (safe for client-side use)
- No user input processing (XSS-safe)
- Read-only database access
- CORS-enabled for public access

---

## 📝 License & Support

This embed code is part of the MIS-CTO/script.js project.

For issues or questions:
1. Check the browser console for debug logs
2. Verify Supabase data is correct
3. Review this README for common solutions

---

## 🎉 Quick Reference

**Change slot:** Modify `const SLOT_NUMBER = X;`
**Change refresh time:** Modify `const REFRESH_INTERVAL = X;`
**Customize colors:** Edit CSS variables in `<style>`
**Debug:** Open browser console (F12)
**Test:** Open HTML file directly in browser

---

**Version:** 1.0.0
**Last Updated:** 2025-11-20
**Author:** Claude Code Assistant