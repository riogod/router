/* eslint-disable @typescript-eslint/no-var-requires */
const typescript = require('@rollup/plugin-typescript')
const terser = require('@rollup/plugin-terser').default
const nodeResolve = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')

const makeConfig = ({
    packageName,
    umd = false,
    compress = false,
    file,
    outputDir
}) => {
    const tsconfigOptions = { tsconfig: `./packages/${packageName}/tsconfig.build.json` };

    const plugins = [
        nodeResolve({ mainFields: ['jsnext', 'module'] }),
        commonjs(),
        typescript(tsconfigOptions),
        compress && terser()
    ].filter(Boolean)

    return {
        input: `packages/${packageName}/modules/index.ts`,
        external: umd
            ? []
            : Object.keys(
                  require(`./packages/${packageName}/package.json`)
                      .dependencies || {}
              ).concat(
                  Object.keys(
                      require(`./packages/${packageName}/package.json`)
                          .peerDependencies || {}
                  )
              ),
        output: umd
            ? (outputDir ? {
                  dir: outputDir,
                  name: packageName,
                  format: 'umd',
                  entryFileNames: compress ? `${packageName}.min.js` : `${packageName}.js`,
                  exports: 'named'
              } : {
                  file,
                  name: packageName,
                  format: 'umd',
                  exports: 'named'
              })
            : [
                  {
                      format: 'es',
                      file: `packages/${packageName}/dist/index.es.js`,
                      exports: 'named'
                  },
                  {
                      format: 'cjs',
                      file: `packages/${packageName}/dist/index.js`,
                      exports: 'named'
                  }
              ],
        plugins
    }
}

const makePackageConfig = packageName =>
    makeConfig({
        packageName
    })

module.exports = [
    makePackageConfig('router-transition-path'),
    // makeConfig({
    //     packageName: 'router',
    //     outputDir: 'dist/router.min.js',
    //     umd: true,
    //     compress: true
    // }),
    // makeConfig({
    //     packageName: 'router',
    //     outputDir: 'dist/router.js',
    //     umd: true
    // }),
    makePackageConfig('router'),
    makePackageConfig('router-helpers'),
    makePackageConfig('router-plugin-browser'),
    makePackageConfig('router-plugin-logger'),
    makePackageConfig('router-plugin-persistent-params'),
    makePackageConfig('react-router'),
].filter(Boolean)
