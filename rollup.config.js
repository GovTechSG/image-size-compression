import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";

export const plugins = [
    commonjs(), // converts CommonJS to ES6 modules
    typescript({
        useTsconfigDeclarationDir: true,
        tsconfig: "tsconfig.json",
    }),
];

export default [
    {
        input: "src/index.ts",
        output: [
            {
                file: "dist/index.js",
                format: "esm",
                sourcemap: true,
                exports: "named",
            },
            {
                file: "dist/cjs/index.js",
                format: "cjs",
                sourcemap: true,
                exports: "named",
            },
        ],
        plugins,
    },
];
