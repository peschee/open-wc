const path = require('path');
const copy = require('rollup-plugin-copy');
const { rollup } = require('rollup');
const Eleventy = require('@11ty/eleventy');
const { createMpaConfig } = require('./docs/_building-rollup/createMpaConfig.js');

const elev = new Eleventy('./docs', './_site');
elev.setConfigPathOverride('./docs/.eleventy.js');
elev.setDryRun(true); // do not write to file system

/**
 * @param {object} config
 */
async function buildAndWrite(config) {
  const bundle = await rollup(config);

  if (Array.isArray(config.output)) {
    await bundle.write(config.output[0]);
    await bundle.write(config.output[1]);
  } else {
    await bundle.write(config.output);
  }
}

async function productionBuild(multipleInputHtml) {
  const mpaConfig = createMpaConfig({
    outputDir: '_site',
    legacyBuild: false,
    multipleInputHtml,

    // // development mode creates a non-minified build for debugging or development
    // developmentMode: true, // process.env.ROLLUP_WATCH === 'true',

    // injectServiceWorker: false,
    // workbox: false,
  });

  const dest = '_site/';
  mpaConfig.plugins.push(
    copy({
      targets: [
        { src: 'docs/styles.css', dest },
        { src: 'docs/demoing/demo/custom-elements.json', dest },
        { src: 'docs/manifest.json', dest },
        { src: 'docs/**/*.{png,gif}', dest },
      ],
      flatten: false,
    }),
  );

  await buildAndWrite(mpaConfig);
}

async function main() {
  const htmlFiles = [];

  elev.config.filters['hook-for-dev-server'] = (inputHtml, outputPath, inputPath) => {
    htmlFiles.push({
      inputHtml,
      name: outputPath.substring(8),
      rootDir: path.dirname(path.resolve(inputPath)),
    });
    return inputHtml;
  };

  await elev.init();
  await elev.write();

  await productionBuild(htmlFiles);
}

main();
