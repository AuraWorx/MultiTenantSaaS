# Frontend Architecture Documentation

This document describes the architecture and organization of the frontend code for the AI Governance Platform. The frontend is built with React, TypeScript, and various modern libraries for a responsive and user-friendly experience.

## Technology Stack

- **React**: JavaScript library for building user interfaces
- **TypeScript**: Typed superset of JavaScript
- **Wouter**: Lightweight routing library
- **@tanstack/react-query**: Data fetching, caching, and state management
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library built on Radix UI primitives
- **Zod**: Schema validation
- **Lucide React**: Icon library

## Project Structure

```
client/
├── public/                # Static files
├── src/
│   ├── components/        # React components
│   │   ├── auth/          # Authentication components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── layout/        # Layout components
│   │   ├── map/           # Map feature components
│   │   ├── measure/       # Measure feature components
│   │   ├── manage/        # Manage feature components
│   │   └── ui/            # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── pages/             # Page components
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Main application component
│   ├── index.css          # Global styles
│   └── main.tsx           # Application entry point
```

## Component Organization

### UI Components

The application uses the `shadcn/ui` component library, which provides a set of accessible, reusable, and customizable UI components. These components are located in the `components/ui` directory.

Key UI components include:
- Button
- Card
- Dialog
- Dropdown
- Form
- Input
- Select
- Tabs
- Table

### Layout Components

Layout components define the overall structure of the application:

- **Sidebar**: Main navigation sidebar with links to different sections
- **TopNavbar**: Top navigation bar showing the current page and user information
- **FeatureTabs**: Tabs for switching between features within a section

### Feature Components

Feature components are organized by the three main modules:

1. **Map Components** (`components/map/`):
   - AI Usage Finder
   - Use Case Database
   - CMDB Integration
   - Risk Documentation

2. **Measure Components** (`components/measure/`):
   - Compliance Rules Engine
   - AuraAI Wizard
   - PII Leak Detection
   - Bias Analysis
   - Toxicity Analysis

3. **Manage Components** (`components/manage/`):
   - Frontier Model Alerts
   - Risk Register
   - Lifecycle Management

### Page Components

Page components (`pages/`) integrate multiple feature components to create complete pages:

- **AuthPage**: User authentication page
- **DashboardPage**: Main dashboard
- **MapPage**: Map module page
- **MeasurePage**: Measure module page
- **ManagePage**: Manage module page
- **UserManagementPage**: User management page

## Routing

The application uses the `wouter` library for routing. Routes are defined in `App.tsx`:

```tsx
function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/map" component={MapPage} />
      <ProtectedRoute path="/measure" component={MeasurePage} />
      <ProtectedRoute path="/manage" component={ManagePage} />
      <ProtectedRoute path="/users" component={UserManagementPage} />
      <Route component={NotFound} />
    </Switch>
  );
}
```

Protected routes (`ProtectedRoute`) require authentication. Unauthenticated users are redirected to the authentication page.

## State Management

### Authentication State

Authentication state is managed using React Context and React Query:

```tsx
// hooks/use-auth.tsx
export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Query to fetch the current user
  const { data: user, error, isLoading } = useQuery<UserWithDetails>(...);
  
  // Mutations for login, logout, registration
  const loginMutation = useMutation(...);
  const logoutMutation = useMutation(...);
  const registerMutation = useMutation(...);
  
  return (
    <AuthContext.Provider value={{ user, isLoading, error, loginMutation, logoutMutation, registerMutation }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

Usage in components:

```tsx
const { user, loginMutation } = useAuth();

const handleLogin = (data) => {
  loginMutation.mutate(data);
};
```

### Data Fetching and Mutations

Data fetching and mutations are handled using React Query:

```tsx
// Example of data fetching
const { data: organizations, isLoading, error } = useQuery({
  queryKey: ['/api/organizations'],
  queryFn: getQueryFn({ on401: "throw" }),
});

// Example of mutation
const createOrganizationMutation = useMutation({
  mutationFn: async (data: InsertOrganization) => {
    const res = await apiRequest('POST', '/api/organizations', data);
    return await res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
    toast({
      title: "Organization created",
      description: "The organization has been created successfully.",
    });
  },
});
```

### Form State

Form state is managed using `react-hook-form` with Zod validation:

```tsx
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    name: "",
    description: "",
  },
});

const onSubmit = (data: z.infer<typeof formSchema>) => {
  createMutation.mutate(data);
};

return (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  </Form>
);
```

## API Integration

API requests are handled using the `apiRequest` utility from `lib/queryClient.ts`:

```tsx
export async function apiRequest(
  method: string,
  path: string,
  body?: any,
  customHeaders?: Record<string, string>,
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  const options: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  return fetch(path, options).then(throwIfResNotOk);
}
```

This utility ensures consistent request handling across the application.

## Styling

The application uses Tailwind CSS for styling, with custom themes defined in `index.css` and `tailwind.config.ts`.

```tsx
// Example of component styling with Tailwind
<div className="flex flex-col space-y-4 p-4 bg-white rounded-lg shadow">
  <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
  <p className="text-gray-500">Welcome to your dashboard.</p>
  <Button className="w-full">View Details</Button>
</div>
```

Custom UI components are built using the `cn` utility for composing class names:

```tsx
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

## Responsive Design

The application is responsive and works on mobile, tablet, and desktop devices. This is achieved using Tailwind's responsive utilities:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content adapts to screen size */}
</div>
```

## Error Handling

Error handling is implemented at multiple levels:

1. **API Requests**: The `apiRequest` utility handles API errors.
2. **React Query**: Error states from queries and mutations are used to display error messages.
3. **Form Validation**: Zod schemas validate form inputs before submission.
4. **Global Error Boundary**: Catches and logs unexpected errors.

```tsx
// Example of error handling in a component
const { data, isLoading, error } = useQuery(...);

if (isLoading) {
  return <LoadingSpinner />;
}

if (error) {
  return <ErrorMessage message={error.message} />;
}

return <DataDisplay data={data} />;
```

## Accessibility

The application follows accessibility best practices:

1. All interactive elements are keyboard accessible
2. ARIA attributes are used where appropriate
3. Color contrast meets WCAG standards
4. Focus management for modal dialogs and other interactive components

## Performance Optimization

Several techniques are used to optimize performance:

1. **Code Splitting**: The application uses dynamic imports to split code into smaller chunks.
2. **Memoization**: React's `useMemo` and `useCallback` hooks prevent unnecessary re-renders.
3. **Pagination**: Large datasets are paginated to reduce initial load time.
4. **Virtualization**: Long lists use virtualization to render only visible items.

## Testing

The frontend code can be tested using:

1. **Unit Tests**: Tests for individual components and utilities
2. **Integration Tests**: Tests for component interactions
3. **End-to-End Tests**: Tests for complete user flows

## Conclusion

The frontend architecture follows modern React best practices, with a focus on component reusability, clean separation of concerns, and optimal performance. The modular structure allows for easy maintenance and extension as the application evolves.