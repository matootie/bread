import tw from "bun-plugin-tailwind"
import dts from "bun-plugin-dts"

console.log("Bundling app...")

await Bun.build({
  target: "browser",
  outdir: "dist",
  sourcemap: "none",
  splitting: false,
  minify: false,
  plugins: [tw],
  entrypoints: ["src/index.html"],
})

console.log("Bundling CDK definitions...")

await Bun.build({
  target: "bun",
  outdir: "lib/out",
  sourcemap: "none",
  splitting: true,
  minify: true,
  external: ["aws-cdk-lib"],
  plugins: [dts()],
  entrypoints: ["lib/stack.ts"],
})

console.log("Done.")
