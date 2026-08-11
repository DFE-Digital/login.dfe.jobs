var pm2 = require("pm2");
const cron = require("node-cron");
// Required for its side effect: writes config to a temp file and sets
// process.env.settings, which login.dfe.dao reads to configure its DB
// connection. The dfe-jobs worker process inherits this env var when
// PM2 spawns it below — without it, login.dfe.dao's config loader
// returns null and the worker crashes on startup.
require("./infrastructure/config");

const COOLING_PERIOD = 2 * 60 * 1000;
const APP_NAME = "dfe-jobs";

pm2.connect(function (err) {
  function scaleDown() {
    pm2.scale(APP_NAME, 1, (err) => {
      if (err) {
        setTimeout(() => {
          scaleDown();
        }, COOLING_PERIOD);
      }
    });
  }

  function scaleUp() {
    pm2.scale(APP_NAME, "+1", (err) => {
      if (err) {
        setTimeout(() => {
          scaleUp();
        }, COOLING_PERIOD);
      } else {
        setTimeout(() => {
          scaleDown();
        }, COOLING_PERIOD);
      }
    });
  }

  function reloadCluster() {
    pm2.list((err, list) => {
      const instances = list.filter((x) => x.name === APP_NAME);
      if (instances.length <= 1) {
        scaleUp();
      }
    });
  }

  function monitorCluster() {
    cron.schedule("0 4 * * 1-5", () => {
      reloadCluster();
    });
  }

  if (err) {
    process.exit(2);
  }

  pm2.start(
    {
      script: "src/index.js",
      name: APP_NAME,
      exec_mode: "cluster",
      instances: 1,
    },
    (err) => {
      if (err) {
        throw err;
      } else {
        monitorCluster();
      }
    },
  );
});
