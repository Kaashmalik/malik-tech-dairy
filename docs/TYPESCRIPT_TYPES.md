# TypeScript Types Generation from Supabase

## Overview

This document describes how to generate TypeScript types from the Supabase database schema to eliminate `as any` type assertions and improve type safety.

## Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- Supabase project linked locally

## Generate Types

### Option 1: Using Supabase CLI (Recommended)

```bash
# Generate types from your Supabase project
npx supabase gen types typescript --project-id gdditqkvzlpnklcoxspj --schema public > src/types/supabase.ts
```

### Option 2: Using Supabase REST API

```bash
# Generate types using the Supabase REST API
curl -L 'https://gdditqkvzlpnklcoxspj.supabase.co/rest/v1/' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" | \
  npx supabase gen types typescript > src/types/supabase.ts
```

## Type Generation Script

Create `scripts/generate-types.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateTypes() {
  const { data, error } = await supabase.from('_').select('*').limit(1);

  if (error) {
    console.error('Error generating types:', error);
    process.exit(1);
  }

  // Generate types using Supabase CLI
  const { spawn } = require('child_process');

  const child = spawn(
    'npx',
    [
      'supabase',
      'gen',
      'types',
      'typescript',
      '--project-id',
      'gdditqkvzlpnklcoxspj',
      '--schema',
      'public',
      '--local',
    ],
    {
      stdio: 'inherit',
      cwd: process.cwd(),
    }
  );

  child.on('exit', (code: number) => {
    if (code === 0) {
      console.log('✅ Types generated successfully');
    } else {
      console.error('❌ Failed to generate types');
      process.exit(code);
    }
  });
}

generateTypes();
```

## Usage in Code

### Before (with `as any`):

```typescript
const { data } = await (supabase.from('animals') as any).select('*').eq('tenant_id', tenantId);
```

### After (with proper types):

```typescript
import { Database } from '@/types/supabase';

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

const { data } = await supabase
  .from('animals')
  .select('*')
  .eq('tenant_id', tenantId)
  .returns<Database['public']['Tables']['animals']['Row'][]>();
```

## Type-Safe Query Examples

### Select with type inference:

```typescript
const { data: animals } = await supabase.from('animals').select('*').eq('tenant_id', tenantId);

// animals is automatically typed as:
// Database['public']['Tables']['animals']['Row'][] | null
```

### Insert with type safety:

```typescript
const { data: newAnimal } = await supabase
  .from('animals')
  .insert({
    tenant_id: tenantId,
    tag: 'TAG001',
    species: 'cattle',
    gender: 'female',
    status: 'active',
  })
  .select()
  .single();

// TypeScript will validate the insert object
```

### Update with type safety:

```typescript
const { data: updatedAnimal } = await supabase
  .from('animals')
  .update({
    status: 'sold',
    updated_at: new Date().toISOString(),
  })
  .eq('id', animalId)
  .select()
  .single();
```

### Join queries with type safety:

```typescript
const { data: animalsWithMilk } = await supabase
  .from('animals')
  .select(
    `
    *,
    milk_logs (
      id,
      date,
      quantity,
      session
    )
  `
  )
  .eq('tenant_id', tenantId);

// Properly typed with nested relations
```

## Migration Plan

1. **Generate types**: Run the type generation script
2. **Update Supabase client**: Use the generated types
3. **Replace `as any`**: Systematically remove all `as any` assertions
4. **Add type guards**: Where needed, add proper type guards
5. **Test**: Ensure all queries still work correctly

## Common Patterns

### Type-safe select with specific columns:

```typescript
const { data } = await supabase
  .from('animals')
  .select('id, tag, name, species')
  .eq('tenant_id', tenantId)
  .returns<
    Pick<Database['public']['Tables']['animals']['Row'], 'id' | 'tag' | 'name' | 'species'>[]
  >();
```

### Type-safe insert with partial:

```typescript
const animalData: Partial<Database['public']['Tables']['animals']['Insert']> = {
  tenant_id: tenantId,
  tag: 'TAG001',
  species: 'cattle',
};

const { data } = await supabase.from('animals').insert(animalData).select().single();
```

### Type-safe update:

```typescript
const updateData: Partial<Database['public']['Tables']['animals']['Update']> = {
  status: 'sold',
};

const { data } = await supabase
  .from('animals')
  .update(updateData)
  .eq('id', animalId)
  .select()
  .single();
```

## Automated Type Generation

Add to `package.json`:

```json
{
  "scripts": {
    "types:generate": "npx supabase gen types typescript --project-id gdditqkvzlpnklcoxspj --schema public > src/types/supabase.ts",
    "types:watch": "nodemon --watch src/db/schema.ts --exec npm run types:generate"
  }
}
```

Run before development:

```bash
npm run types:generate
```

## Benefits

1. **Type Safety**: Catch errors at compile time
2. **Autocomplete**: Better IDE support
3. **Refactoring**: Safer code changes
4. **Documentation**: Types serve as documentation
5. **Confidence**: Know exactly what data you're working with

## Troubleshooting

### Types not generating:

- Ensure Supabase project ID is correct
- Check network connectivity
- Verify API key permissions

### Type errors after generation:

- Run `npm run typecheck` to see all errors
- Update queries to match new types
- Add proper type guards where needed

### Missing types for new tables:

- Regenerate types after schema changes
- Ensure tables are in the `public` schema
- Check RLS policies don't block type generation
