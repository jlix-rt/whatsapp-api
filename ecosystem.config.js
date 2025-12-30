module.exports = {
  apps: [
    {
      name: "whatsapp-crunchypaws",
      script: "dist/index.js",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "whatsapp-dkape",
      script: "dist/index.js",
      env: {
        NODE_ENV: "sandbox"
      }
    }
  ]
}