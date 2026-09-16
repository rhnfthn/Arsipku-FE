module.exports = {
  apps: [
    {
      name: 'arsipku-frontend',
      script: 'npm',
      args: 'run start',
      instances: 1, // fork mode cukup untuk QA
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        PORT: 3012,
        HOST: '0.0.0.0',
        NODE_ENV: 'qa',
        NUXT_PUBLIC_API_BASE_URL: 'http://172.20.16.116:3011',
        NUXT_PUBLIC_SOCKET_URL: 'http://172.20.16.116:3011',
        NUXT_PUBLIC_AUTH_LOCAL_BACKEND_URL: 'http://172.20.16.116:3011',
        NUXT_PUBLIC_AUTH_SERVER_BACKEND_URL: 'http://172.20.16.116:3011',
      },
    },
  ],
};
