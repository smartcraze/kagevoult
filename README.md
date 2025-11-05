# 🔐 Kagevoult - Device Fingerprinting Library<img width="883" height="190" alt="image" src="https://github.com/user-attachments/assets/5b1a51f2-b6e1-4d91-a527-f55b832ab5a6" />



A comprehensive device fingerprinting library for fraud detection, payment verification, and customer tracking. Built to match Fingerprint.com's capabilities with full TypeScript support.# Turborepo starter



## ✨ FeaturesThis Turborepo starter is maintained by the Turborepo core team.



### Browser Fingerprinting## Using this example

- ✅ **Canvas Fingerprinting**: GPU rendering differences, spoofing detection

- ✅ **WebGL Fingerprinting**: GPU vendor/renderer, 50+ parametersRun the following command:

- ✅ **Audio Fingerprinting**: Oscillator/compressor analysis

- ✅ **Font Detection**: 100+ fonts across all platforms```sh

- ✅ **Basic Signals**: Browser, screen, hardware, storagenpx create-turbo@latest

```

### Advanced Detection

- ✅ **VPN Detection**: 5 detection methods with confidence scoring## What's inside?

- ✅ **Proxy Detection**: WebRTC leak, connection analysis

- ✅ **Incognito Mode**: Storage quota, IndexedDB checksThis Turborepo includes the following packages/apps:

- ✅ **Tampering**: Anti-detect browser signatures (10+ tools)

- ✅ **Bot Detection**: 20+ bot signatures### Apps and Packages

- ✅ **Developer Tools**: Console/debugger detection

- ✅ **Virtual Machine**: VMware, VirtualBox, QEMU detection- `docs`: a [Next.js](https://nextjs.org/) app

- `web`: another [Next.js](https://nextjs.org/) app

### Network Analysis- `@repo/ui`: a stub React component library shared by both `web` and `docs` applications

- ✅ **HTTP Headers**: Bot/proxy detection, header order- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)

- ✅ **TLS/JA3**: ClientHello parsing- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

- ✅ **Network Timing**: RTT, connection quality

- ✅ **IP Geolocation**: Multiple providers with fallbackEach package/app is 100% [TypeScript](https://www.typescriptlang.org/).



### Velocity Tracking### Utilities

- ✅ Track activity over 5m/1h/24h intervals

- ✅ Distinct IPs, countries, linked IDsThis Turborepo has some additional tools already setup for you:

- ✅ Risk scoring based on patterns

- [TypeScript](https://www.typescriptlang.org/) for static type checking

## 📦 Installation- [ESLint](https://eslint.org/) for code linting

- [Prettier](https://prettier.io) for code formatting

```bash

bun add @kagevoult/core @kagevoult/types### Build

```

To build all apps and packages, run the following command:

## 🚀 Quick Start

```

```typescriptcd my-turborepo

import { getFingerprint } from '@kagevoult/core';

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)

const response = await getFingerprint('session_id_12345');turbo build



console.log('Visitor ID:', response.products.identification.data.visitorId);# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager

console.log('VPN:', response.products.vpn.data.result);npx turbo build

console.log('Risk Score:', response.products.suspectScore.data.result);yarn dlx turbo build

```pnpm exec turbo build

```

## 📚 Full Documentation

You can build a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

See [DOCUMENTATION.md](./DOCUMENTATION.md) for complete API reference, examples, and best practices.

```

## 🎯 Use Cases# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)

turbo build --filter=docs

- **E-commerce**: Fraud detection, account sharing prevention

- **Payment Processing**: Risk scoring, chargeback prevention# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager

- **Content Platforms**: Account abuse detectionnpx turbo build --filter=docs

- **Financial Services**: KYC verification, bot preventionyarn exec turbo build --filter=docs

pnpm exec turbo build --filter=docs

## 🏗️ Project Structure```



```### Develop

packages/

├── core/           # Core fingerprinting libraryTo develop all apps and packages, run the following command:

│   ├── browser/    # Browser-side collectors

│   ├── network/    # Network analysis```

│   └── velocity/   # Velocity trackingcd my-turborepo

├── types/          # TypeScript definitions

└── utils/          # Shared utilities# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)

turbo dev

apps/

└── collector-demo/ # Interactive demo# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager

```npx turbo dev

yarn exec turbo dev

## 🚦 Demopnpm exec turbo dev

```

```bash

cd apps/collector-demoYou can develop a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

bun run dev

``````

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)

Visit `http://localhost:3000` to see all features in action.turbo dev --filter=web



## 🔒 Privacy & Compliance# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager

npx turbo dev --filter=web

- No PII collectionyarn exec turbo dev --filter=web

- GDPR/CCPA compliant designpnpm exec turbo dev --filter=web

- User consent management ready```

- See [Privacy Policy Template](./PRIVACY.md)

### Remote Caching

## 📊 Comparison

> [!TIP]

| Feature | Kagevoult | Fingerprint.com |> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

|---------|-----------|-----------------|

| Canvas Fingerprint | ✅ | ✅ |Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

| WebGL Fingerprint | ✅ | ✅ |

| Audio Fingerprint | ✅ | ✅ |By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

| VPN Detection | ✅ | ✅ |

| Proxy Detection | ✅ | ✅ |```

| Tampering Detection | ✅ | ✅ |cd my-turborepo

| Velocity Tracking | ✅ | ✅ |

| IP Geolocation | ✅ | ✅ |# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)

| Bot Detection | ✅ | ✅ |turbo login

| **Open Source** | ✅ | ❌ |

| **Self-Hosted** | ✅ | ❌ |# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager

| **No Monthly Fees** | ✅ | ❌ |npx turbo login

yarn exec turbo login

## 🛠️ Developmentpnpm exec turbo login

```

```bash

# Install dependenciesThis will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

bun install

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

# Run demo

cd apps/collector-demo```

bun run dev# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)

turbo link

# Build all packages

turbo build# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager

npx turbo link

# Lintyarn exec turbo link

turbo lintpnpm exec turbo link

``````



## 📄 License## Useful Links



MIT License - see [LICENSE](./LICENSE) for detailsLearn more about the power of Turborepo:



## 🤝 Contributing- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)

- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)

Contributions welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)

- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)

## ⚠️ Disclaimer- [Configuration Options](https://turborepo.com/docs/reference/configuration)

- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)

For legitimate fraud prevention and security only. Ensure compliance with applicable laws and obtain proper user consent.

---

Built with ❤️ using [Bun](https://bun.sh) + [TypeScript](https://www.typescriptlang.org/) + [Next.js](https://nextjs.org/)
