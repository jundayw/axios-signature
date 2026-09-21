import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    minify: false,          // 库一般不压缩，交给使用方处理
    splitting: false,       // 库不需要代码分割
    treeshake: true,        // 开启 tree-shaking
    target: 'es2020',       // 和 tsconfig 里的 target 保持一致
    platform: 'browser',
    outExtension({ format }) {
        return {
            js: format === 'esm' ? '.mjs' : '.cjs',
        };
    },
});