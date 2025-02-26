import dts from "bun-plugin-dts"

console.log("Bundling app...")

await Bun.build({
  target: "bun",
  outdir: "dist",
  sourcemap: "inline",
  splitting: true,
  minify: true,
  entrypoints: ["src/handler.ts"],
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
