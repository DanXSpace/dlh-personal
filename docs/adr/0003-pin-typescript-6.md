# Pin TypeScript to 6.0.x

TypeScript 7.x is the latest release, but `@astrojs/check` (0.9.x) declares a peer range of `typescript: ^5.0.0 || ^6.0.0`, so `astro check` (our type and template gate in CI) is unsupported on 7. TypeScript stays pinned to 6.0.x until `@astrojs/check` supports 7. Don't bump it to "fix" an outdated-dependency warning without checking that peer range first.
