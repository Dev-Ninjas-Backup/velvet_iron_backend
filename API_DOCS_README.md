# API Documentation Files

This directory contains complete API documentation for the Velvet Iron Backend.

## Files

1. **API_DOCUMENTATION.md** - Markdown format (source)
2. **API_DOCUMENTATION.html** - HTML format (for viewing in browser)
3. **API_DOCUMENTATION.pdf** - PDF format (generate using methods below)

## How to Generate PDF

### Method 1: Using the HTML File (Recommended)

1. Open `API_DOCUMENTATION.html` in your web browser (Chrome, Edge, or Firefox recommended)
2. Click the "Print / Save as PDF" button in the top-right corner
3. OR press `Ctrl+P` (Windows/Linux) or `Cmd+P` (Mac)
4. Select "Save as PDF" as the destination
5. Adjust print settings if needed:
   - **Layout:** Portrait
   - **Margins:** Default or Custom (1.5cm all sides)
   - **Options:** Enable "Background graphics"
6. Click "Save" and choose your destination folder

### Method 2: Using Online Tools

Upload `API_DOCUMENTATION.md` to any of these online converters:
- https://www.markdowntopdf.com/
- https://md2pdf.netlify.app/
- https://cloudconvert.com/md-to-pdf

### Method 3: Using Pandoc (If Installed)

```bash
pandoc API_DOCUMENTATION.md -o API_DOCUMENTATION.pdf --pdf-engine=wkhtmltopdf
```

### Method 4: Using VS Code Extension

1. Install "Markdown PDF" extension in VS Code
2. Open `API_DOCUMENTATION.md`
3. Press `Ctrl+Shift+P` and type "Markdown PDF: Export (pdf)"
4. The PDF will be generated in the same directory

## Viewing Options

- **Raw Markdown:** Open `API_DOCUMENTATION.md` in any text editor or VS Code
- **Rendered HTML:** Open `API_DOCUMENTATION.html` in any web browser
- **PDF:** Generate using one of the methods above

## Documentation Contents

The documentation includes:

- ✅ **Authentication** - 19 endpoints (register, login, social auth, email verification, password management)
- ✅ **Profile Management** - 8 endpoints (profile, XP, leaderboard, charts)
- ✅ **Themes** - 4 endpoints (unlock, activate, manage themes)
- ✅ **Companions** - 4 endpoints (unlock, activate, manage companions)
- ✅ **Onboarding** - 4 endpoints (onboarding flow)
- ✅ **Macro Goals** - 5 endpoints (CRUD operations)
- ✅ **Mood Log** - 6 endpoints (log, history, updates)
- ✅ **Weight Log** - 5 endpoints (log, history, charts)
- ✅ **Meal Log** - 5 endpoints (log, history, nutrition tracking)
- ✅ **Meal Schedule** - 6 endpoints (scheduling, marking complete)
- ✅ **Medication** - 5 endpoints (CRUD operations)
- ✅ **Medication Schedule** - 7 endpoints (scheduling, dose tracking)
- ✅ **Exercise Log** - 12 endpoints (logs and schedules)
- ✅ **XP Statistics** - 8 endpoints (daily, weekly, monthly stats and charts)
- ✅ **File Uploads** - 2 endpoints (S3 uploads)
- ✅ **Payments** - 4 endpoints (RevenueCat webhooks, subscription management)

**Total:** 110+ documented API endpoints

## Features

- Complete request/response examples with JSON
- Authentication requirements clearly marked
- Query parameters and request body schemas
- Error response documentation
- Rate limiting information
- Pagination guidelines
- Date/time format specifications
- File upload limits and specifications

---

**Last Updated:** February 28, 2026  
**Version:** 1.0
