var pm2 = require("pm2");
const cron = require("node-cron");

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
