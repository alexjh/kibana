# Code Organization Plan

This document describes the domain-based code organization implemented for `@kbn/docs-utils`.

## Goals

1. **Domain clarity**: Group related functionality into cohesive directories.
2. **Package extraction readiness**: Each domain should function as a potential standalone package.
3. **Import clarity**: Use barrel exports to define public APIs; avoid deep imports across domains.
4. **Test co-location**: Place test files alongside the modules they test.

## Domain Structure

### `analysis/`
API analysis and declaration building using `ts-morph`.

- `build_declaration.ts` - Main dispatcher for building API declarations.
- `get_plugin_api.ts` - Extracts API from a single plugin.
- `get_plugin_api_map.ts` - Builds API map across multiple plugins.
- `stats.ts` - Collects validation statistics (missing comments, any types, etc.).
- `paths.ts` - Contains `pathsOutsideScopes` for tracking non-standard import paths.
- `tsmorph_utils.ts` - Utilities for working with `ts-morph` nodes.

#### `analysis/builders/`
Individual declaration builders, one per node type.

| File | Purpose |
|------|---------|
| `arrow_fn.ts` | Arrow function declarations |
| `basic.ts` | Basic API declaration structure |
| `call_signature.ts` | Call signature declarations |
| `class.ts` | Class declarations |
| `fn.ts` | Function declarations |
| `fn_type.ts` | Function type declarations |
| `interface.ts` | Interface declarations |
| `multiple_call_signatures.ts` | Overloaded function signatures |
| `parameters.ts` | Parameter extraction |
| `type_literal.ts` | Type literal declarations |
| `variable.ts` | Variable declarations |
| `types.ts` | Builder-specific types (`BuildApiDecOpts`) |

#### `analysis/builders/lib/`
Shared utilities for builders.

| File | Purpose |
|------|---------|
| `extract_import_refs.ts` | Extracts import references from signatures |
| `get_references.ts` | Collects cross-references between APIs |
| `get_signature.ts` | Generates type signatures |
| `get_type_kind.ts` | Determines `TypeKind` from nodes |
| `js_doc_utils.ts` | JSDoc parsing utilities |
| `utils.ts` | Helper functions (paths, IDs, etc.) |

### `cli/`
Command-line interface entry points and tasks.

- `build_api_docs.ts` - Main CLI for building API documentation.
- `check_package_docs.ts` - CLI for validating package documentation.
- `parse_flags.ts` - Flag parsing and normalization.
- `types.ts` - CLI-specific types (`CliFlags`, `CliContext`, etc.).

#### `cli/tasks/`
Modular tasks extracted from the CLI.

| File | Purpose |
|------|---------|
| `setup_project.ts` | Project initialization, plugin discovery |
| `build_api_map.ts` | Building the plugin API map |
| `collect_stats.ts` | Collecting validation statistics |
| `write_docs.ts` | Writing documentation files |
| `report_metrics.ts` | Reporting metrics to CI |
| `flat_stats.ts` | Flattening stats for output |

### `discovery/`
Plugin and package discovery.

| File | Purpose |
|------|---------|
| `find_plugins.ts` | Finds plugins and packages in the repo |
| `get_paths_by_package.ts` | Groups file paths by package |
| `get_declaration_nodes_for_plugin.ts` | Gets exportable nodes for a plugin scope |

### `metrics/`
Code health metrics collection.

#### `metrics/count_enzyme_imports/`
Counts Enzyme imports for migration tracking.

#### `metrics/count_eslint_disable/`
Counts ESLint disable comments.

### `output/`
Documentation output generation.

- `auto_generated_warning.ts` - Warning banner for generated files.
- `trim_deleted_docs_from_nav.ts` - Removes deleted docs from navigation.

#### `output/mdx/`
MDX documentation generation.

- `get_all_doc_file_ids.ts` - Extracts doc IDs from existing MDX files.
- `types.ts` - Output-specific types (`WritePluginDocsOpts`).

#### `output/mdx/deprecations/`
Deprecation documentation.

| File | Purpose |
|------|---------|
| `build_table.ts` | Builds deprecation tables |
| `write_by_api.ts` | Writes deprecations grouped by API |
| `write_by_plugin.ts` | Writes deprecations grouped by plugin |
| `write_by_team.ts` | Writes deprecations grouped by team |

#### `output/mdx/plugin/`
Plugin documentation.

| File | Purpose |
|------|---------|
| `write_mdx.ts` | Writes plugin MDX documentation |
| `write_directory.ts` | Writes plugin directory listing |
| `write_by_folder.ts` | Splits plugin docs by service folder |

### `types/`
Shared type definitions.

| File | Purpose |
|------|---------|
| `api.ts` | API declaration types (`ApiDeclaration`, `TypeKind`, etc.) |
| `deprecations.ts` | Deprecation tracking types |
| `plugin.ts` | Plugin and package types (`PluginOrPackage`, etc.) |
| `stats.ts` | Statistics types (`ApiStats`, etc.) |

## Import Patterns

### Barrel Exports
Each domain has an `index.ts` that exports its public API:

```typescript
// Import from domain barrels, not individual files
import { getPluginApiMap, collectApiStatsForPlugin } from '../analysis';
import { findPlugins, getPathsByPackage } from '../discovery';
import { writePluginDocs, trimDeletedDocsFromNav } from '../output';
import { countEslintDisableLines, countEnzymeImports } from '../metrics';
```

### No Re-exports from Parent Directories
Subdirectories should not create `types.ts` or `utils.ts` files that simply re-export from parent directories. Instead, import directly from the source:

```typescript
// Good: Import directly from source
import type { ApiDeclaration } from '../../../types';
import { getPluginApiDocId } from '../../../utils';

// Bad: Re-exporting in subdirectory
// output/mdx/types.ts that just does: export * from '../../types';
```

### Within-Domain Imports
Within a domain, relative imports to sibling files are acceptable:

```typescript
// Within analysis/builders/
import { buildBasicApiDeclaration } from './basic';
import { getTypeKind } from './lib/get_type_kind';
```

## Test Co-location

Test files are placed alongside the modules they test:

```
analysis/
├── stats.ts
├── stats.test.ts
├── build_declaration.ts
├── build_declaration.test.ts
├── builders/
│   ├── lib/
│   │   ├── js_doc_utils.ts
│   │   ├── js_doc_utils.test.ts
│   │   ├── extract_import_refs.ts
│   │   └── extract_import_refs.test.ts
```

### Test File Naming
- Unit tests: `{module}.test.ts`
- Integration/run tests: `{module}.run.test.ts`

## File Naming Conventions

### Builders
- Simplified names without `build_` prefix or `_dec` suffix.
- `function` renamed to `fn` to avoid reserved word issues.
- `function_type` renamed to `fn_type` for consistency.

### Output Writers
- Removed redundant `write_` prefix where the directory context is clear.
- Grouped by output type (deprecations, plugin).

## Directory Structure

```
src/
├── analysis/
│   ├── builders/
│   │   ├── lib/
│   │   │   ├── extract_import_refs.ts
│   │   │   ├── extract_import_refs.test.ts
│   │   │   ├── get_references.ts
│   │   │   ├── get_signature.ts
│   │   │   ├── get_type_kind.ts
│   │   │   ├── js_doc_utils.ts
│   │   │   ├── js_doc_utils.test.ts
│   │   │   ├── utils.ts
│   │   │   └── index.ts
│   │   ├── arrow_fn.ts
│   │   ├── basic.ts
│   │   ├── call_signature.ts
│   │   ├── class.ts
│   │   ├── fn.ts
│   │   ├── fn_type.ts
│   │   ├── interface.ts
│   │   ├── multiple_call_signatures.ts
│   │   ├── parameters.ts
│   │   ├── type_literal.ts
│   │   ├── variable.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── build_declaration.ts
│   ├── build_declaration.test.ts
│   ├── get_plugin_api.ts
│   ├── get_plugin_api_map.ts
│   ├── get_plugin_api_map.test.ts
│   ├── paths.ts
│   ├── stats.ts
│   ├── stats.test.ts
│   ├── tsmorph_utils.ts
│   └── index.ts
├── cli/
│   ├── tasks/
│   │   ├── build_api_map.ts
│   │   ├── build_api_map.test.ts
│   │   ├── collect_stats.ts
│   │   ├── collect_stats.test.ts
│   │   ├── flat_stats.ts
│   │   ├── report_metrics.ts
│   │   ├── report_metrics.test.ts
│   │   ├── setup_project.ts
│   │   ├── setup_project.test.ts
│   │   ├── write_docs.ts
│   │   ├── write_docs.test.ts
│   │   └── index.ts
│   ├── build_api_docs.ts
│   ├── build_api_docs.test.ts
│   ├── check_package_docs.ts
│   ├── check_package_docs.test.ts
│   ├── check_package_docs.run.test.ts
│   ├── parse_flags.ts
│   ├── parse_flags.test.ts
│   ├── types.ts
│   └── index.ts
├── discovery/
│   ├── find_plugins.ts
│   ├── find_plugins.test.ts
│   ├── get_declaration_nodes_for_plugin.ts
│   ├── get_declaration_nodes_for_plugin.test.ts
│   ├── get_paths_by_package.ts
│   ├── get_paths_by_package.test.ts
│   └── index.ts
├── metrics/
│   ├── count_enzyme_imports/
│   │   ├── count_enzyme_imports.ts
│   │   ├── count_enzyme_imports.test.ts
│   │   ├── test_enzyme_import.test.ts
│   │   └── index.ts
│   ├── count_eslint_disable/
│   │   ├── count_eslint_disable.ts
│   │   ├── count_eslint_disable.test.ts
│   │   └── index.ts
│   └── index.ts
├── output/
│   ├── mdx/
│   │   ├── deprecations/
│   │   │   ├── build_table.ts
│   │   │   ├── build_table.test.ts
│   │   │   ├── write_by_api.ts
│   │   │   ├── write_by_api.test.ts
│   │   │   ├── write_by_plugin.ts
│   │   │   ├── write_by_plugin.test.ts
│   │   │   ├── write_by_team.ts
│   │   │   ├── write_by_team.test.ts
│   │   │   └── index.ts
│   │   ├── plugin/
│   │   │   ├── write_by_folder.ts
│   │   │   ├── write_by_folder.test.ts
│   │   │   ├── write_directory.ts
│   │   │   ├── write_directory.test.ts
│   │   │   ├── write_mdx.ts
│   │   │   ├── write_mdx.test.ts
│   │   │   └── index.ts
│   │   ├── get_all_doc_file_ids.ts
│   │   ├── get_all_doc_file_ids.test.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── auto_generated_warning.ts
│   ├── trim_deleted_docs_from_nav.ts
│   ├── trim_deleted_docs_from_nav.test.ts
│   └── index.ts
├── types/
│   ├── api.ts
│   ├── deprecations.ts
│   ├── plugin.ts
│   ├── stats.ts
│   └── index.ts
├── integration_tests/
│   ├── __fixtures__/
│   ├── api_doc_suite.test.ts
│   └── kibana_platform_plugin_mock.ts
├── __test_helpers__/
│   └── mocks.ts
├── index.ts
├── types.ts
├── utils.ts
└── utils.test.ts
```

## Implementation Status

- [ ] Created domain directories (`analysis/`, `cli/`, `discovery/`, `metrics/`, `output/`, `types/`)
- [ ] Restructured builders with simplified naming
- [ ] Moved helpers to `analysis/builders/lib/`
- [ ] Reorganized CLI with tasks in `cli/tasks/`
- [ ] Consolidated output writers into `output/mdx/deprecations/` and `output/mdx/plugin/`
- [ ] Created barrel exports for each domain
- [ ] Eliminated re-export patterns
- [ ] Refactored deep imports to use barrel exports
- [ ] Co-located test files with modules
- [ ] All 303 tests passing
- [ ] 82.66% line coverage, 90.08% function coverage

