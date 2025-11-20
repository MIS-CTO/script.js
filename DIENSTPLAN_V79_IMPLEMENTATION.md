# Dienstplan System Overhaul - v79 Implementation

## Implementation Complete ✅

The complete Dienstplan system overhaul with role-based access control and request management has been successfully implemented.

---

## What Was Implemented

### 1. Database Migration Script
**Location:** `/home/user/script.js/migrations/dienstplan_v79_migration.sql`

This script includes:
- Renaming `artist_email` column to `email` in `working_times` table
- Creating new `working_time_requests` table for request management
- Setting up Row Level Security (RLS) policies for role-based access
- Creating indexes for optimal query performance

### 2. Frontend Updates
**File:** `/home/user/script.js/management-system (19).html`

#### JavaScript Functions Added:
- `openRequestModal()` - Opens the request creation modal
- `closeRequestModal()` - Closes the request modal
- `submitRequest()` - Submits a new working time request
- `loadDienstplanRequests()` - Loads pending requests (Management only)
- `displayDienstplanRequests()` - Displays request cards
- `handleRequest()` - Approves or rejects requests
- `loadDienstplanData()` - Loads working times with RLS filtering
- `displayDienstplanCalendar()` - Displays the new calendar view
- `formatDate()` - Formats dates in German
- `formatDateTime()` - Formats date and time in German

#### HTML Components Added:
- **Neue Anfrage Button** - In Dienstplan section header
- **Request Modal** - Modal form for creating new requests
- **Requests Section** - Shows pending requests (Management only)
- **New Calendar View** - Displays working times grouped by date and email

#### CSS Styles Added:
- Dienstplan grid layout styles
- Request card styles
- Approve/reject button styles
- Modal styling for request form
- Responsive calendar day cards

---

## CRITICAL: What You Need to Do Now

### Step 1: Execute Database Migration ⚠️ REQUIRED FIRST

**You MUST execute the SQL migration in Supabase BEFORE using the new features.**

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `/home/user/script.js/migrations/dienstplan_v79_migration.sql`
4. Copy the entire content
5. Paste into Supabase SQL Editor
6. Click **Run** to execute

**This will:**
- Rename the `artist_email` column to `email`
- Create the `working_time_requests` table
- Set up all RLS policies
- Create necessary indexes

### Step 2: Verify RLS Policies

After running the migration, verify that RLS is enabled:

```sql
-- Check if RLS is enabled on working_times
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'working_times';

-- Check if RLS is enabled on working_time_requests
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'working_time_requests';

-- List all policies
SELECT * FROM pg_policies
WHERE tablename IN ('working_times', 'working_time_requests');
```

Both should show `rowsecurity = true` and you should see multiple policies listed.

### Step 3: Test Role-Based Access

Test with different user roles to ensure RLS is working correctly:

#### Test as Management/Geschäftsführung/Admin:
- Should see ALL working_times entries
- Should see "Offene Anfragen" section
- Should be able to approve/reject requests

#### Test as Resident Artist/Guest Artist/Booking Team/Media Department:
- Should ONLY see their own entries (matched by email)
- Should NOT see "Offene Anfragen" section
- Should be able to create new requests

### Step 4: Create Test Requests

1. Login as a non-management user
2. Click on **Dienstplan** tab
3. Click **+ Neue Anfrage** button
4. Fill out the form:
   - Select a category (Training, Vacation, Sick, etc.)
   - Choose start and end dates
   - Optionally add times and notes
5. Click **Anfrage senden**

### Step 5: Approve/Reject Requests (as Management)

1. Login as a Management/Admin user
2. Go to Dienstplan tab
3. Scroll to "Offene Anfragen" section
4. Click **✓ Genehmigen** to approve or **✗ Ablehnen** to reject

When approved, the system will automatically create `working_times` entries for:
- Each day in the date range
- 30-minute time slots from 10:00 to 20:00
- Marked with the selected category

---

## Role-Based Access Matrix

| Role | Can See All Entries | Can See Requests Section | Can Create Requests | Can Approve/Reject |
|------|---------------------|-------------------------|---------------------|-------------------|
| Management | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Geschäftsführung | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Admin | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Resident Artist | ❌ Own only | ❌ No | ✅ Yes | ❌ No |
| Guest Artist | ❌ Own only | ❌ No | ✅ Yes | ❌ No |
| Booking Team | ❌ Own only | ❌ No | ✅ Yes | ❌ No |
| Media Department | ❌ Own only | ❌ No | ✅ Yes | ❌ No |

---

## Category Colors

The following categories are available with their respective colors:

| Category | Color | Hex Code |
|----------|-------|----------|
| Training | Blue | #007AFF |
| Vacation | Green | #4CAF50 |
| Sick | Red | #F44336 |
| Home office | Light Blue | #2196F3 |
| Business trip | Orange | #FF9800 |
| Convention | Dark Orange | #FF9500 |
| Guestspot | Brown | #795548 |
| Other | Purple | #9C27B0 |
| Available | White | #FFFFFF |

---

## Email Matching Logic

The system matches users to working_times entries via email:

1. User's email is fetched from `profiles` table
2. RLS policies check if `working_times.email` matches user's email
3. Also checks `artists` table for matching email addresses
4. This allows both profile users and artists to see their entries

**Example:**
- User email: `ata@example.com`
- Profile table: `ata@example.com`
- Artists table: `ata@example.com`
- Working times entries with email `ata@example.com` will be visible to this user

---

## Troubleshooting

### Issue: RLS policies not working
**Solution:** Verify RLS is enabled on both tables and policies are created correctly

### Issue: Users can't see their own entries
**Solution:** Check that user's email in `profiles` table matches the email in `working_times` entries

### Issue: Request approval not creating entries
**Solution:** Check browser console for errors, verify `working_times` table structure

### Issue: Request modal not opening
**Solution:** Check browser console, verify JavaScript functions are loaded

### Issue: Management can't see requests section
**Solution:** Verify user's role in `profiles` table is exactly 'Management', 'Geschäftsführung', or 'Admin' (case-sensitive)

---

## Database Schema

### working_times Table
```sql
- id: uuid (primary key)
- date: date
- time: time
- email: text (renamed from artist_email)
- state: text (category)
```

### working_time_requests Table
```sql
- id: uuid (primary key)
- email: text
- category: text
- notes: text (optional)
- start_date: date
- end_date: date
- start_time: time (optional)
- end_time: time (optional)
- status: text ('pending', 'approved', 'rejected')
- created_at: timestamptz
- created_by: uuid (references auth.users)
- reviewed_by: uuid (references auth.users)
- reviewed_at: timestamptz
```

---

## Next Steps

1. ✅ Execute SQL migration in Supabase
2. ✅ Test with different user roles
3. ✅ Create test requests
4. ✅ Approve/reject requests as management
5. ✅ Verify RLS policies are working correctly
6. ✅ Deploy updated HTML file to production

---

## Support

If you encounter any issues:
1. Check browser console for JavaScript errors
2. Check Supabase logs for database errors
3. Verify RLS policies are active
4. Ensure email matching is correct between tables
5. Test with a management-role account first

---

**Implementation Date:** 2025-11-20
**Version:** v79
**HTML File:** management-system (19).html
**Migration File:** migrations/dienstplan_v79_migration.sql
