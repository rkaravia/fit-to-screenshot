const capture = require("./lib/capture");
const upload = require("./lib/upload");

const config = {
  os: process.env.OS,
  browserType: process.env.BROWSER_TYPE,
  headfulness: process.env.HEADFULNESS,
};

const auth = process.env.GITHUB_TOKEN;

(async () => {
  const matrix = `${config.os}_${config.browserType}_${config.headfulness}`;
  console.log(matrix);

  const screenshot = await capture(config, matrix);
  
  if (auth) {
    await upload(screenshot, matrix, auth);
  } else {
    console.log("Skipping upload because GITHUB_TOKEN has not been provided.");
  }
})();
