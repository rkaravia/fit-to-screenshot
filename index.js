const capture = require("./lib/capture");
const upload = require("./lib/upload");

const config = {
  os: process.env.OS,
  browserType: process.env.BROWSER_TYPE,
  headfulness: process.env.HEADFULNESS,
};

(async () => {
  const matrix = `${config.os}_${config.browserType}_${config.headfulness}`;
  console.log(matrix);

  const screenshot = await capture(config, matrix);
  await upload(screenshot, matrix);
})();

