import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    {
      name: "weakref-polyfill",
      enforce: "pre",
      configResolved(config) {
        if (!globalThis.WeakRef) {
          // A minimal WeakRef polyfill strictly for React's RSC loader
          globalThis.WeakRef = class WeakRef<T extends object> {
            private target: T | undefined;
            constructor(target: T) {
              this.target = target;
            }
            deref() {
              return this.target;
            }
          } as any;
        }
      },
    },
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
