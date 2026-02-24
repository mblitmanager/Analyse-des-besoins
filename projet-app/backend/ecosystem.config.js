module.exports = {
  apps: [
    {
      name: "aopia-backend",
      script: "dist/main.js",
      cwd: "/var/www/analyse/projet-app/backend",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        FRONTEND_URL: "https://nsconseil.mbl-service.com"
      }
    }
  ]
};
