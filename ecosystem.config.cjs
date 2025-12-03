module.exports = {
  apps: [{
    name: 'arsipku-fe',
    script: './.output/server/index.mjs',
    env: {
      PORT: 3012,
      HOST: '0.0.0.0'
    }
  }]
}