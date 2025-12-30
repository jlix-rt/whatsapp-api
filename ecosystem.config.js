module.exports = {
  apps: [{
    name: "whatsapp-api",
    script: "apps/api/dist/index.js",
    cwd: ".",
    env: {
      NODE_ENV: "production"
    }
  }]
};

