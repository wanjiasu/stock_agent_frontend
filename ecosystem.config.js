module.exports = {
  apps: [
    {
      name: 'stock-agent-frontend',
      script: 'pnpm',
      args: 'run dev',
      cwd: '.',
      env: { PORT: 3004 }
    }
  ]
};
