# @ovendjs/utils

> Utility package for OvenJS — styled and structured debug output for modern terminal logging.

## Overview

`@ovendjs/utils` provides formatting utilities for clean, readable terminal output. It enables consistent debug messaging across OvenJS packages (and beyond), with features like:

- Colored debug banners
- Support for both string and array messages
- Grouped message formatting utilities

It's designed for internal use in the OvenJS ecosystem, but modular enough for general-purpose usage in any Node.js project.

---

## Installation

```bash
pnpm add @ovendjs/utils
# or
npm install @ovendjs/utils
# or
yarn add @ovendjs/utils
```

---

## Usage

```ts
import { fmtDebug, fmtGroup } from '@ovendjs/utils';

const output = fmtDebug({
  package: { name: 'utils', version: '0.21.7' },
  string: 'Hello from utils!',
});

console.log(output);
```

### Array Input

```ts
const output = fmtDebug({
  package: { name: 'utils', version: '0.21.7' },
  array: {
    input: ['Log message 1', 'Log message 2'],
    formatted: 'exclusive',
  },
});

console.log(output);
```

### Group Utility

```ts
const group = fmtGroup([]);

group.add('Task A completed');
group.add('Task B failed');

console.log(group.fmt());
// or
console.log(group.fmtArray());
```

---

## API

### `fmt(meta: FmtPackage): { debug(input): string }`

Utility method for making it easier to repeat fmtDebug.

### `fmtDebug(options: FmtDebugOptions): string | Error`

Formats a debug message with color-coded output. Accepts either a `string` or `array` input.

#### Options:

- `package.name` – name of the calling package
- `package.version` – version of the calling package
- `string` – plain string to format
- `array.input` – list of lines to format
- `array.formatted` – `"exclusive"` (default) or `"unique"`

---

### `fmtGroup(group: string[])`

Creates a utility object to manage and format a collection of messages.

#### Returns:

- `_.add(string)` – adds an item to the group
- `_.fmt()` – returns a newline-separated string
- `_.fmtArray()` – returns the array as-is

---

## License

ISC — [OvenJS](https://github.com/ovenjs/Oven)

---
