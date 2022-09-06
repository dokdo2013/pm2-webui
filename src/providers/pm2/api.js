const pm2 = require("pm2");
const simpleGit = require("simple-git");
const { bytesToSize, timeSince } = require("./ux.helper");
const { getCurrentGitBranch } = require("../../utils/git.util");

function listApps() {
  return new Promise((resolve, reject) => {
    pm2.connect((err) => {
      if (err) {
        reject(err);
      }
      pm2.list((err, apps) => {
        pm2.disconnect();
        if (err) {
          reject(err);
        }
        apps = apps.map((app) => {
          return {
            name: app.name,
            status: app.pm2_env.status,
            cpu: app.monit.cpu,
            memory: bytesToSize(app.monit.memory),
            uptime: timeSince(app.pm2_env.pm_uptime),
            pm_id: app.pm_id,
            pm2_env_cwd: app.pm2_env.pm_cwd,
          };
        });
        resolve(apps);
      });
    });
  });
}

function describeApp(appName) {
  return new Promise((resolve, reject) => {
    pm2.connect((err) => {
      if (err) {
        reject(err);
      }
      pm2.describe(appName, (err, apps) => {
        pm2.disconnect();
        if (err) {
          reject(err);
        }
        if (Array.isArray(apps) && apps.length > 0) {
          const app = {
            name: apps[0].name,
            status: apps[0].pm2_env.status,
            cpu: apps[0].monit.cpu,
            memory: bytesToSize(apps[0].monit.memory),
            uptime: timeSince(apps[0].pm2_env.pm_uptime),
            pm_id: apps[0].pm_id,
            pm_out_log_path: apps[0].pm2_env.pm_out_log_path,
            pm_err_log_path: apps[0].pm2_env.pm_err_log_path,
            pm2_env_cwd: apps[0].pm2_env.pm_cwd,
          };
          resolve(app);
        } else {
          resolve(null);
        }
      });
    });
  });
}

function reloadApp(process) {
  return new Promise((resolve, reject) => {
    pm2.connect((err) => {
      if (err) {
        reject(err);
      }
      pm2.reload(process, (err, proc) => {
        pm2.disconnect();
        if (err) {
          reject(err);
        }
        resolve(proc);
      });
    });
  });
}

function stopApp(process) {
  return new Promise((resolve, reject) => {
    pm2.connect((err) => {
      if (err) {
        reject(err);
      }
      pm2.stop(process, (err, proc) => {
        pm2.disconnect();
        if (err) {
          reject(err);
        }
        resolve(proc);
      });
    });
  });
}

function restartApp(process) {
  return new Promise((resolve, reject) => {
    pm2.connect((err) => {
      if (err) {
        reject(err);
      }
      pm2.restart(process, (err, proc) => {
        pm2.disconnect();
        if (err) {
          reject(err);
        }
        resolve(proc);
      });
    });
  });
}

async function pullApp(pm2_app_name) {
  // get pm2 app's path
  const appData = await describeApp(pm2_app_name);
  const pm2_app_path = appData.pm2_env_cwd;
  console.log("app path : ", pm2_app_path);

  // set git repo
  const git = simpleGit(pm2_app_path);
  const res = await git.pull();
  console.log("[GIT PULL]", res);
  return res;
}

module.exports = {
  listApps,
  describeApp,
  reloadApp,
  stopApp,
  restartApp,
  pullApp,
};
