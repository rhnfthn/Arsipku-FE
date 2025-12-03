module.exports = {
  apps: [{
    name: 'arsipku-fe',
    script: 'npm',
    args: 'run dev',
    cwd: '/var/www/ArsipKu',
    env: {
      PORT: 3012,
      HOST: '0.0.0.0',
      NODE_ENV: 'development'
    },
    watch: false,
    autorestart: true,
    max_memory_restart: '500M'
  }]
}