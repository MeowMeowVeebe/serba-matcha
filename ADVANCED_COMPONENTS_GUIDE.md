# 🚀 Advanced Components Guide

## 🎉 3 REKOMENDASI BARU - LEVEL LANJUTAN

Setelah implementasi Design System, Dashboard Analytics, dan DataTable selesai, saya telah menambahkan **8 komponen advanced** untuk melengkapi sistem UI Anda!

---

## 📦 **REKOMENDASI #4: Modal & Dialog System**

### ✨ Fitur Modal:
- ✅ **Multiple sizes**: sm, md, lg, xl, full
- ✅ **Backdrop control**: Click outside untuk close
- ✅ **Keyboard support**: ESC untuk close
- ✅ **Focus management**: Auto focus & restore
- ✅ **Accessibility**: ARIA labels, keyboard navigation
- ✅ **Animations**: Smooth slide-up entrance
- ✅ **Stacking support**: Multiple modals

### 📝 Usage:

#### Basic Modal

```tsx
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Edit Profile"
        description="Update your profile information"
        size="md"
        footer={
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        }
      >
        {/* Modal content */}
        <form>...</form>
      </Modal>
    </>
  );
}
```

#### Confirm Modal (Preset)

```tsx
import { ConfirmModal } from "@/components/ui/Modal";

<ConfirmModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete User"
  message="Are you sure you want to delete this user? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  variant="danger"
  isLoading={loading}
/>
```

**Props:**
- `isOpen`: boolean - Modal visibility
- `onClose`: () => void - Close handler
- `title`: string - Modal title
- `description`: string - Subtitle
- `size`: "sm" | "md" | "lg" | "xl" | "full"
- `closeOnBackdrop`: boolean - Click outside to close (default: true)
- `closeOnEscape`: boolean - ESC to close (default: true)
- `showCloseButton`: boolean - Show X button (default: true)
- `footer`: ReactNode - Custom footer

---

## 📦 **REKOMENDASI #5: Advanced Toast/Notification System**

### ✨ Fitur Toast:
- ✅ **4 variants**: success, error, warning, info
- ✅ **Auto-dismiss**: Configurable duration
- ✅ **Action buttons**: Undo, Retry, etc.
- ✅ **Stacking**: Multiple toasts
- ✅ **Position**: Top-right (customizable)
- ✅ **Animations**: Smooth slide-in
- ✅ **Mobile responsive**: Full width pada mobile

### 📝 Usage:

#### Setup (Already done in ClientLayout)

```tsx
import { ToastProvider } from "@/components/ui/Toast";

<ToastProvider>
  {children}
</ToastProvider>
```

#### Using Toast Hook

```tsx
import { useToast } from "@/components/ui/Toast";

function MyComponent() {
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast("Profile updated successfully!", "success", 5000);
  };

  const handleError = () => {
    showToast("Failed to update profile", "error");
  };

  const handleUndo = () => {
    showToast(
      "Item deleted", 
      "info", 
      0, // Don't auto-dismiss
      { 
        label: "Undo", 
        onClick: () => console.log("Undo clicked") 
      }
    );
  };

  return (
    <Button onClick={handleSuccess}>Save</Button>
  );
}
```

**API:**
```tsx
showToast(
  message: string,
  variant?: "success" | "error" | "warning" | "info",
  duration?: number, // 0 = no auto-dismiss
  action?: { label: string; onClick: () => void }
)
```

---

## 📦 **REKOMENDASI #6: Interactive Components Suite**

### 1️⃣ **Dropdown Menu**

Flexible dropdown untuk actions, menus, dan context menus.

```tsx
import { Dropdown } from "@/components/ui/Dropdown";

<Dropdown
  trigger={<Button variant="secondary">Actions ▾</Button>}
  items={[
    { 
      key: "edit", 
      label: "Edit", 
      icon: "✏️",
      onClick: () => handleEdit() 
    },
    { 
      key: "copy", 
      label: "Copy Link", 
      icon: "📋",
      onClick: () => handleCopy() 
    },
    "divider", // Separator
    { 
      key: "delete", 
      label: "Delete", 
      icon: "🗑️",
      danger: true,
      onClick: () => handleDelete() 
    },
    { 
      key: "archive", 
      label: "Archive", 
      disabled: true,
      onClick: () => {} 
    },
  ]}
  align="right"
/>
```

**Features:**
- ✅ Click outside to close
- ✅ ESC key to close
- ✅ Dividers untuk grouping
- ✅ Disabled items
- ✅ Danger variant (red text)
- ✅ Icon support
- ✅ Left/right alignment

---

### 2️⃣ **Tabs Component**

Organize content dalam tabs dengan variants dan badges.

```tsx
import { Tabs } from "@/components/ui/Tabs";

<Tabs
  tabs={[
    {
      key: "profile",
      label: "Profile",
      icon: "👤",
      content: <ProfileForm />,
    },
    {
      key: "security",
      label: "Security",
      icon: "🔐",
      badge: "3", // Notification badge
      content: <SecuritySettings />,
    },
    {
      key: "billing",
      label: "Billing",
      icon: "💳",
      disabled: true,
      content: <BillingInfo />,
    },
  ]}
  defaultTab="profile"
  variant="pills"
  size="md"
  onChange={(key) => console.log("Tab changed:", key)}
/>
```

**Variants:**
- `line` - Underline style (default)
- `pills` - Pill/button style
- `enclosed` - Tab with borders

**Sizes:** `sm` | `md` | `lg`

---

### 3️⃣ **File Upload**

Drag & drop file uploader dengan preview.

```tsx
import { FileUpload } from "@/components/ui/FileUpload";

<FileUpload
  accept="image/*,.pdf"
  multiple
  maxSize={5 * 1024 * 1024} // 5MB
  maxFiles={5}
  onFilesSelected={(files) => {
    console.log("Files:", files);
    // Upload files
  }}
  onError={(error) => {
    console.error("Error:", error);
  }}
  label="Upload Documents"
  helperText="Max 5MB per file. Supports images and PDF."
  showPreview={true}
/>
```

**Features:**
- ✅ Drag & drop
- ✅ File validation (size, type)
- ✅ Image preview
- ✅ Multiple files
- ✅ Remove individual files
- ✅ File size formatting
- ✅ Progress indicator ready

---

### 4️⃣ **Search Input**

Debounced search dengan highlighting.

```tsx
import { SearchInput, highlightText } from "@/components/ui/SearchInput";

function SearchableList() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    // Fetch results
    const data = await fetchResults(searchQuery);
    setResults(data);
  };

  return (
    <>
      <SearchInput
        onSearch={handleSearch}
        debounceMs={300}
        placeholder="Search users..."
        minChars={2}
        showClearButton
        isLoading={loading}
      />

      <div>
        {results.map(item => (
          <div key={item.id}>
            {highlightText(item.name, query)}
          </div>
        ))}
      </div>
    </>
  );
}
```

**Features:**
- ✅ Debounced input (no API spam)
- ✅ Min characters threshold
- ✅ Clear button
- ✅ Loading indicator
- ✅ Text highlighting helper

---

### 5️⃣ **Breadcrumbs**

Auto-generated atau custom breadcrumb navigation.

```tsx
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

// Auto-generate dari pathname
<Breadcrumbs showHome />

// Custom breadcrumbs
<Breadcrumbs
  items={[
    { label: "Home", href: "/", icon: "🏠" },
    { label: "Admin", href: "/admin" },
    { label: "Users", href: "/admin/users" },
    { label: "John Doe" }, // Current page (no href)
  ]}
  separator="›"
  maxItems={5}
/>
```

**Features:**
- ✅ Auto-generate dari URL
- ✅ Custom items
- ✅ Collapse middle items (dengan "...")
- ✅ Icon support
- ✅ Custom separator

---

### 6️⃣ **Loading Bar**

Global loading indicator (NProgress-like).

```tsx
import { LoadingBar } from "@/components/ui/LoadingBar";

// Already added to ClientLayout - works automatically!
// Shows on route changes

// Manual trigger (optional)
import { useLoadingBar } from "@/components/ui/LoadingBar";

function MyComponent() {
  const { startLoading, stopLoading } = useLoadingBar();

  const handleLongOperation = async () => {
    startLoading();
    await doSomething();
    stopLoading();
  };
}
```

**Features:**
- ✅ Auto-trigger pada route change
- ✅ Smooth progress animation
- ✅ Gradient shimmer effect
- ✅ Manual trigger support
- ✅ Global state

---

## 📊 **SUMMARY - 8 Komponen Baru**

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **Modal** | Dialogs, forms | 5 sizes, focus mgmt, animations |
| **Toast** | Notifications | 4 variants, actions, stacking |
| **Dropdown** | Context menus | Click outside, dividers, icons |
| **Tabs** | Content organization | 3 variants, badges, disabled |
| **FileUpload** | File handling | Drag&drop, preview, validation |
| **SearchInput** | Search UX | Debounce, highlight, loading |
| **Breadcrumbs** | Navigation | Auto-gen, collapse, icons |
| **LoadingBar** | Progress indication | Auto route, manual trigger |

---

## 🎨 **CSS Added**

File: `styles/advanced-components.css` (850+ lines)

- Modal backdrop & animations
- Toast stacking & slide-in
- Dropdown positioning & hover
- Tabs variants (line, pills, enclosed)
- File upload dropzone & preview
- Search highlight styling
- Breadcrumbs navigation
- Loading bar shimmer

---

## 🚀 **Quick Start**

### 1. View Demo Page

Navigate to: **`/components-demo`**

Ini halaman showcase yang mendemonstrasikan semua komponen baru!

### 2. Import & Use

```tsx
// Import komponen
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Dropdown } from "@/components/ui/Dropdown";
import { Tabs } from "@/components/ui/Tabs";
import { FileUpload } from "@/components/ui/FileUpload";
import { SearchInput } from "@/components/ui/SearchInput";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

// Use in your components!
```

---

## 📁 **Files Added**

```
components/ui/
├── Modal.tsx ✨ NEW
├── Toast.tsx ✨ NEW
├── Dropdown.tsx ✨ NEW
├── Tabs.tsx ✨ NEW
├── FileUpload.tsx ✨ NEW
├── SearchInput.tsx ✨ NEW
├── Breadcrumbs.tsx ✨ NEW
└── LoadingBar.tsx ✨ NEW

styles/
└── advanced-components.css ✨ NEW (850+ lines)

app/
├── ClientLayout.tsx (updated - Toast & LoadingBar)
├── layout.tsx (updated - import CSS)
└── components-demo/
    ├── page.tsx ✨ NEW
    └── ComponentsDemo.tsx ✨ NEW
```

---

## 🎯 **Use Cases**

### Modal
- Edit forms
- Confirmation dialogs
- Image lightbox
- Terms & conditions
- Multi-step wizards

### Toast
- Success notifications
- Error messages
- Undo actions
- Copy confirmation
- Save success

### Dropdown
- User menu (profile, settings, logout)
- Row actions (edit, delete, archive)
- Context menus
- Filter options
- More actions (...)

### Tabs
- Settings pages (profile, security, billing)
- Dashboard sections
- Documentation navigation
- Product details
- Admin panels

### FileUpload
- Profile photo upload
- Document attachments
- Bulk image upload
- CSV import
- Avatar upload

### SearchInput
- User search
- Product search
- Global search
- Filter lists
- Auto-complete

### Breadcrumbs
- Navigation trail
- Page hierarchy
- Back navigation
- Sitemap indication

### LoadingBar
- Route transitions
- API calls
- Form submissions
- File uploads
- Data processing

---

## 💡 **Best Practices**

### Modal
```tsx
// ✅ Good - Proper focus management
<Modal isOpen={isOpen} onClose={handleClose}>
  <form onSubmit={handleSubmit}>
    <Input autoFocus /> {/* Focus first input */}
  </form>
</Modal>

// ❌ Bad - No close handler
<Modal isOpen={true}> {/* Can't close! */}
```

### Toast
```tsx
// ✅ Good - Short, actionable messages
showToast("Profile updated", "success", 3000);

// ❌ Bad - Too long
showToast("Your profile has been successfully updated with all the new information...", "success");
```

### Dropdown
```tsx
// ✅ Good - Logical grouping with dividers
items={[
  { key: "edit", label: "Edit" },
  { key: "copy", label: "Copy" },
  "divider",
  { key: "delete", label: "Delete", danger: true },
]}

// ❌ Bad - No visual separation
items={[
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete", danger: true },
]}
```

---

## 🎉 **COMPLETE COMPONENT LIBRARY**

Total komponen UI sekarang: **19 komponen!**

1. Button
2. Input
3. Card
4. Badge
5. Skeleton
6. Select
7. Tooltip
8. Avatar
9. DataTable
10. DataTableMobile
11. DarkModeToggle
12. **Modal** ✨
13. **Toast** ✨
14. **Dropdown** ✨
15. **Tabs** ✨
16. **FileUpload** ✨
17. **SearchInput** ✨
18. **Breadcrumbs** ✨
19. **LoadingBar** ✨

Plus 5 Dashboard components!

**Total: 24 production-ready components! 🚀**

---

## 🔗 **Next Steps**

1. Visit `/components-demo` untuk melihat semua komponen
2. Integrate ke halaman existing
3. Customize styling sesuai brand
4. Add more presets (Info Modal, Warning Modal, etc.)
5. Add animations library (Framer Motion)

---

Selamat! Anda sekarang memiliki **complete UI component library** yang production-ready! 🎊
