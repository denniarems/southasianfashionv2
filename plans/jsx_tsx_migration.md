# React JSX to TSX Migration Guide

The old codebase from `old-code/frontend/src` uses Create React App with standard JavaScript (`.js`/`.jsx`).
The new codebase requires strict TypeScript (`.ts`/`.tsx`) under the Next.js App Router paradigm.

This migration isn't just a file extension rename; it requires careful typing of props, state, and context, as well as adherence to our React 19 rules.

## Core Migration Rules

1. **File Extension Conversion:**
   - Rename `.jsx` and component-heavy `.js` files to `.tsx`.
   - Rename utility `.js` files to `.ts`.

2. **Prop Interfaces (Mandatory):**
   - Every React component must have an explicit interface or type for its props.
   - Example:
     ```tsx
     // Old
     const ProductCard = ({ product, isFeatured }) => { ... }
     
     // New
     import { Product } from '@/db/schema'; // Import type from Drizzle schema
     
     interface ProductCardProps {
       product: Product;
       isFeatured?: boolean;
     }
     const ProductCard = ({ product, isFeatured = false }: ProductCardProps) => { ... }
     ```

3. **Event Typing:**
   - Extensively type event handlers, especially for form elements.
   - `onChange={(e: React.ChangeEvent<HTMLInputElement>) => ...}`
   - `onSubmit={(e: React.FormEvent<HTMLFormElement>) => ...}`

4. **Hooks Typing:**
   - **`useState`**: Provide a generic type when the initial value is null or ambiguous. `const [user, setUser] = useState<User | null>(null);`
   - **`useRef`**: Provide the specific DOM element type. `const inputRef = useRef<HTMLInputElement>(null);`

5. **Strict React 19 Policy Enforcement:**
   - **Remove `useMemo` and `useCallback`**.
   - **Replace `useEffect` for Data Fetching**: 
     - Move data fetching to Server Components (RSC) where possible.
     - If client-side fetching is absolutely needed, use `use` with Suspense, Server Actions, or an approved data-fetching library (like TanStack Query if pre-approved).
   - **Replace Context for Global State (if applicable)**: Evaluate if the old Context API pattern is still needed or if Server Components and Server Actions remove the necessity for it.

6. **Server vs. Client Components:**
   - Evaluate every component. By default, Next.js components are **React Server Components (RSC)**.
   - Only add `"use client"` at the very top of the `.tsx` file if the component fundamentally requires:
     - `useState`, `useEffect`, `useRef`, or other React hooks.
     - Browser APIs (e.g., `window`, `document`).
     - Event listeners (e.g., `onClick`, `onChange`).
     - Custom hooks that rely on state/effects (e.g., `framer-motion` hooks).
   - *Crucially, if a component only renders UI based on props or data fetched from the server, leave it as an RSC (no `"use client"`).*

7. **Handling `framer-motion` & Styling:**
   - Components using `motion.*` (e.g., `motion.div`) require `"use client"`.
   - Strategy: Keep the main layout and data fetching in RSCs, and wrap animated elements in small, dedicated Client Components to keep the client bundle size small.
   - **CRITICAL: NEVER alter Tailwind classes or framer-motion variants/durations from the old code. The styles must remain a 1:1 exact match.**

## Step-by-Step Execution per Component

1. Identify the component in `old-code/frontend/src/components/...`.
2. Analyze if it should be an RSC or a Client Component based on Rule 6.
3. Create the new `.tsx` file in the appropriate `app/components/` directory.
4. Define the `Props` interface using TypeScript types (importing Drizzle schema types where applicable).
5. Paste and modify the JSX, satisfying the TypeScript compiler and removing `useMemo`/`useCallback`.
6. Verify against `bun run lint` (oxlint) and `tsc --noEmit`.
