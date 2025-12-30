module.exports = {
    apps: [
      {
        name: 'whatsapp-crunchypaws',
        script: 'dist/index.js',
        env: {
          NODE_ENV: 'production',
          STORE_ID: 'crunchypaws',
          PORT: 3333
        }
      }
    ]
  };
  