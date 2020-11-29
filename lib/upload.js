const fs = require("fs");
const { Octokit } = require("@octokit/core");

async function upload(screenshot, matrix, auth) {
  let wait = 1;
  for (let i = 0; i < 10; i += 1) {
    if (i) {
      console.log("Wait", wait, "seconds...");
      await new Promise((resolve) => setTimeout(resolve, wait * 1000));
      wait *= 2;
    }
    if (await tryUpload(screenshot, matrix, auth)) {
      return true;
    }
  }
  return false;
}

async function tryUpload(screenshot, matrix, auth) {
  const octokit = new Octokit({ auth });
  const content = fs.readFileSync(screenshot, "base64");
  const path = `${new Date().toISOString().slice(0, 10)}/${matrix}.png`;
  try {
    await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner: "rkaravia",
      repo: "fit-to-screenshot",
      branch: "release",
      path,
      message: `Add ${path}`,
      content,
    });
  } catch (error) {
    console.error("Upload failed with error:", error.message);
    return false;
  }
  return true;
}

module.exports = upload;
