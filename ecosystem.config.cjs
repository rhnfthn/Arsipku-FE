module.exports = {
  apps: [
    {
      name: 'arsipku-frontend',
      script: 'npm',
      args: 'run start',
      instances: 1,           // fork mode cukup untuk QA
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        PORT: 3012,
        NODE_ENV: 'qa'
      }
    }
  ]
}