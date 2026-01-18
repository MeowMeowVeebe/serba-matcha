# 🚀 Quick Start Guide - Frontend Improvements

## 📦 Yang Sudah Diimplementasikan

### 1️⃣ Design System Lengkap
### 2️⃣ Dashboard Analytics Interaktif
### 3️⃣ Advanced DataTable dengan Mobile Support

---

## 🎨 Cara Menggunakan Design System

### Button Component

```tsx
import { Button } from "@/components/ui/Button";

// Primary button dengan loading
<Button variant="primary" isLoading={loading}>
  Submit
</Button>

// Secondary button dengan icon
<Button variant="secondary" leftIcon={<span>📁</span>}>
  Upload
</Button>

// Danger button full width
<Button variant="danger" fullWidth onClick={handleDelete}>
  Delete Account
</Button>

// Small ghost button
<Button variant="ghost" size="sm">
  Cancel
</Button>
```

**Variants:** `primary` | `secondary` | `ghost` | `danger` | `success`  
**Sizes:** `sm` | `md` | `lg`

---

### Input Component

```tsx
import { Input } from "@/components/ui/Input";

// Basic input dengan error
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  helperText="We'll never share your email"
/>

// Input dengan icon
<Input
  label="Search"
  leftIcon={<span>🔍</span>}
  placeholder="Search users..."
/>

// Password input
<Input
  type="password"
  label="Password"
  error={errors.password}
/>
```

---

### Card Component

```tsx
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

<Card variant="elevated">
  <CardHeader 
    title="User Profile" 
    description="Manage your account settings"
    action={<Button size="sm">Edit</Button>}
  />
  <CardBody>
    {/* Your content here */}
  </CardBody>
  <CardFooter align="right">
    <Button variant="secondary">Cancel</Button>
    <Button variant="primary">Save Changes</Button>
  </CardFooter>
</Card>
```

**Variants:** `default` | `bordered` | `elevated` | `flat`  
**Padding:** `none` | `sm` | `md` | `lg`

---

### Badge Component

```tsx
import { Badge } from "@/components/ui/Badge";

// Status badges
<Badge variant="success">Active</Badge>
<Badge variant="danger">Failed</Badge>
<Badge variant="warning">Pending</Badge>

// With dot indicator
<Badge variant="primary" dot>Online</Badge>

// Small badge
<Badge variant="info" size="sm">New</Badge>
```

**Variants:** `default` | `primary` | `success` | `warning` | `danger` | `info`

---

### Skeleton Loading

```tsx
import { Skeleton, SkeletonText, SkeletonCard } from "@/components/ui/Skeleton";

// Basic skeleton
<Skeleton width={200} height={20} />

// Text skeleton (multiple lines)
<SkeletonText lines={3} />

// Card skeleton
<SkeletonCard hasHeader lines={5} />
```

---

### Select Component

```tsx
import { Select } from "@/components/ui/Select";

<Select
  label="Country"
  options={[
    { value: "id", label: "Indonesia" },
    { value: "us", label: "United States" },
    { value: "sg", label: "Singapore" },
  ]}
  value={country}
  onChange={(e) => setCountry(e.target.value)}
  placeholder="Select country"
  error={errors.country}
/>
```

---

### Avatar Component

```tsx
import { Avatar } from "@/components/ui/Avatar";

// With image
<Avatar src="/avatar.jpg" name="John Doe" size="md" />

// Without image (shows initials)
<Avatar name="John Doe" size="lg" />

// Different sizes
<Avatar name="Jane" size="xs" />
<Avatar name="Jane" size="sm" />
<Avatar name="Jane" size="md" />
<Avatar name="Jane" size="lg" />
<Avatar name="Jane" size="xl" />
```

---

### Dark Mode Toggle

```tsx
import { DarkModeToggle } from "@/components/ui/DarkModeToggle";

// Add to your navbar/header
<DarkModeToggle />
```

---

## 📊 Dashboard Analytics

### Menggunakan Dashboard Lengkap

```tsx
import { DashboardClient } from "@/components/dashboard/DashboardClient";

// Di halaman admin dashboard
export default function AdminDashboard() {
  return <DashboardClient />;
}
```

**Features:**
- ✅ 4 Metric cards (Total Users, Active Sessions, Failed Logins, Security Events)
- ✅ User Growth Chart (Line Chart)
- ✅ Login Activity Chart (Bar Chart)
- ✅ Top Actions Chart (Horizontal Bar)
- ✅ Recent Activity Stream
- ✅ Auto-refresh setiap 30 detik
- ✅ Date range filter

---

### Menggunakan Chart Individual

#### Line Chart

```tsx
import { LineChart } from "@/components/dashboard/LineChart";

<LineChart
  data={{
    labels: ["Jan", "Feb", "Mar", "Apr", "May"],
    datasets: [
      {
        label: "Sales",
        data: [100, 150, 130, 180, 200],
        borderColor: "#FF4B3E",
        backgroundColor: "rgba(255, 75, 62, 0.1)",
      }
    ]
  }}
  height={300}
/>
```

#### Bar Chart

```tsx
import { BarChart } from "@/components/dashboard/BarChart";

<BarChart
  data={{
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    datasets: [
      {
        label: "Views",
        data: [50, 70, 60, 90, 80],
      }
    ]
  }}
  horizontal={false}
/>
```

#### Metric Card

```tsx
import { MetricCard } from "@/components/dashboard/MetricCard";

<MetricCard
  title="Total Revenue"
  value="$45,231"
  icon={<span>💰</span>}
  change={12.5}
  changeLabel="vs last month"
  trend="up"
/>
```

---

## 📋 Advanced DataTable

### Basic Usage

```tsx
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";

const users = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "admin", status: "active" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "user", status: "inactive" },
];

const columns = [
  {
    key: "name",
    label: "Name",
    sortable: true,
  },
  {
    key: "email",
    label: "Email",
    sortable: true,
  },
  {
    key: "role",
    label: "Role",
    filterable: true,
    filterOptions: [
      { value: "admin", label: "Admin" },
      { value: "user", label: "User" },
    ],
    render: (value) => (
      <Badge variant={value === "admin" ? "primary" : "default"}>
        {value}
      </Badge>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <Badge variant={value === "active" ? "success" : "default"}>
        {value}
      </Badge>
    ),
  },
];

<DataTable
  data={users}
  columns={columns}
  keyField="id"
  searchable
  searchPlaceholder="Search users..."
  onRowClick={(user) => router.push(`/users/${user.id}`)}
/>
```

---

### DataTable dengan Bulk Actions

```tsx
<DataTable
  data={users}
  columns={columns}
  selectable
  bulkActions={[
    {
      label: "Delete Selected",
      action: (selectedUsers) => handleBulkDelete(selectedUsers),
      variant: "danger",
    },
    {
      label: "Export Selected",
      action: (selectedUsers) => handleExport(selectedUsers),
      variant: "secondary",
    },
  ]}
  onSelectionChange={(selected) => console.log("Selected:", selected)}
/>
```

---

### DataTable dengan Custom Empty State

```tsx
<DataTable
  data={[]}
  columns={columns}
  emptyState={
    <div style={{ textAlign: "center", padding: "48px" }}>
      <h3>No users found</h3>
      <p>Try adjusting your search filters</p>
      <Button variant="primary" onClick={handleAddUser}>
        Add First User
      </Button>
    </div>
  }
/>
```

---

### DataTable dengan Loading State

```tsx
const [loading, setLoading] = useState(true);

<DataTable
  data={users}
  columns={columns}
  isLoading={loading}
/>
```

---

### Mobile Responsive (Automatic)

DataTable otomatis beralih ke **Card View** di mobile (< 768px).

Untuk custom mobile card rendering:

```tsx
<DataTable
  data={users}
  columns={columns}
  mobileView="cards"
  renderMobileCard={(user, columns) => (
    <div>
      <h4>{user.name}</h4>
      <p>{user.email}</p>
      <Badge>{user.role}</Badge>
    </div>
  )}
/>
```

---

## 🎨 Design Tokens (CSS Variables)

Gunakan design tokens untuk konsistensi:

```css
/* Spacing */
padding: var(--spacing-md); /* 16px */
margin: var(--spacing-lg); /* 24px */
gap: var(--spacing-sm); /* 8px */

/* Colors */
color: var(--color-primary); /* #FF4B3E */
background-color: var(--color-success); /* #10B981 */
border-color: var(--color-border); /* Auto light/dark */

/* Typography */
font-size: var(--font-size-lg); /* 18px */
font-weight: var(--font-weight-semibold); /* 600 */
line-height: var(--line-height-normal); /* 1.5 */

/* Border Radius */
border-radius: var(--radius-md); /* 8px */
border-radius: var(--radius-lg); /* 12px */

/* Shadows */
box-shadow: var(--shadow-md); /* 0 4px 12px rgba(...) */
box-shadow: var(--shadow-lg); /* 0 8px 24px rgba(...) */

/* Transitions */
transition: all var(--transition-fast); /* 150ms ease */
transition: all var(--transition-base); /* 250ms ease */
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
@media (max-width: 768px) {
  /* Mobile styles */
}

@media (min-width: 769px) and (max-width: 1024px) {
  /* Tablet styles */
}

@media (min-width: 1025px) {
  /* Desktop styles */
}
```

---

## 🌙 Dark Mode

Dark mode otomatis aktif! Gunakan semantic colors:

```css
/* Gunakan semantic colors, bukan hardcode */
color: var(--color-text-primary); /* Auto light/dark */
background-color: var(--color-bg); /* Auto light/dark */
border-color: var(--color-border); /* Auto light/dark */
```

Untuk toggle dark mode, tambahkan `<DarkModeToggle />` di navbar.

---

## 📂 File Locations

```
serba-matcha/
├── components/ui/          # Design System Components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Skeleton.tsx
│   ├── Select.tsx
│   ├── Avatar.tsx
│   ├── Tooltip.tsx
│   ├── DataTable.tsx
│   ├── DataTableMobile.tsx
│   └── DarkModeToggle.tsx
├── components/dashboard/   # Dashboard Components
│   ├── DashboardClient.tsx
│   ├── MetricCard.tsx
│   ├── LineChart.tsx
│   ├── BarChart.tsx
│   └── HeatmapChart.tsx
├── styles/
│   ├── design-system.css   # Design tokens & components
│   └── datatable.css       # DataTable styles
└── app/api/dashboard/      # Dashboard APIs
    ├── metrics/route.ts
    └── recent-activity/route.ts
```

---

## 🎯 Migration dari Komponen Lama

### Login Form (Before → After)

**Before:**
```tsx
<input type="email" className="form-input" />
<button className="auth-primary-btn">Login</button>
```

**After:**
```tsx
<Input 
  type="email" 
  label="Email" 
  error={errors.email}
/>
<Button variant="primary" isLoading={loading}>
  Login
</Button>
```

### Users Table (Before → After)

**Before:**
```tsx
<table>
  <thead>...</thead>
  <tbody>
    {users.map(user => <tr>...</tr>)}
  </tbody>
</table>
```

**After:**
```tsx
<DataTable
  data={users}
  columns={columns}
  searchable
  selectable
  onRowClick={handleRowClick}
/>
```

---

## ✨ Best Practices

1. **Gunakan Design Tokens**
   ```css
   /* ❌ Jangan */
   padding: 16px;
   color: #FF4B3E;
   
   /* ✅ Lakukan */
   padding: var(--spacing-md);
   color: var(--color-primary);
   ```

2. **Gunakan Komponen UI**
   ```tsx
   /* ❌ Jangan */
   <button className="btn btn-primary">Click</button>
   
   /* ✅ Lakukan */
   <Button variant="primary">Click</Button>
   ```

3. **Gunakan Skeleton untuk Loading**
   ```tsx
   /* ❌ Jangan */
   {loading ? "Loading..." : <Content />}
   
   /* ✅ Lakukan */
   {loading ? <SkeletonCard /> : <Content />}
   ```

4. **Mobile Responsive**
   ```tsx
   /* ✅ DataTable otomatis responsive */
   <DataTable data={data} columns={columns} />
   ```

---

## 🚀 Performance Tips

1. **Lazy Load Charts**
   ```tsx
   import dynamic from "next/dynamic";
   
   const LineChart = dynamic(() => 
     import("@/components/dashboard/LineChart").then(mod => mod.LineChart),
     { loading: () => <Skeleton height={300} /> }
   );
   ```

2. **Pagination untuk Large Data**
   ```tsx
   <DataTable
     data={largeDataset}
     pageSize={20}
     showPagination
   />
   ```

3. **Debounce Search**
   ```tsx
   // DataTable sudah handle ini internally
   <DataTable searchable />
   ```

---

## 📞 Support

Untuk pertanyaan atau issue:
1. Cek `IMPLEMENTATION_SUMMARY.md` untuk detail teknis
2. Lihat example implementations di:
   - `app/admin/users/UsersClientNew.tsx`
   - `app/admin/audit-logs/AuditLogsClientNew.tsx`
   - `app/login/LoginClient.tsx`
   - `app/register/RegisterClient.tsx`

---

## 🎉 Selamat Coding!

Semua komponen sudah TypeScript-safe, accessible, dan production-ready!
