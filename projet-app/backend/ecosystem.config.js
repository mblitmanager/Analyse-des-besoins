module.exports = {
  apps: [
    {
      name: "aopia-backend",
      script: "dist/main.js",
      cwd: "/var/www/projet-app/backend",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
