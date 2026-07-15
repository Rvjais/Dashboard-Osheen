const { User } = require('./src/models');

async function reset() {
  const [admin, created] = await User.findOrCreate({
    where: { email: 'admin@taskstudio.com' },
    defaults: { name: 'Admin', password: 'password123', role: 'admin' }
  });
  if (!created) {
    admin.password = 'password123';
    await admin.save();
    console.log('Admin password reset to: password123');
  } else {
    console.log('Admin user created (email: admin@taskstudio.com, password: password123)');
  }
  process.exit(0);
}
reset().catch(err => { console.error(err); process.exit(1); });
