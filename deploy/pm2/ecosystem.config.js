module.exports = {
  apps: [
    {
      name: 'gymapp-api',
      cwd: './backend',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
