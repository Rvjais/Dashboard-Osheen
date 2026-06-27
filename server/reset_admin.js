const { User } = require('./src/models');
const bcrypt = require('bcryptjs');

async function reset() {
  const admin = await User.findOne({ where: { email: 'admin@taskstudio.com' } });
  if (admin) {
    admin.password = 'password123';
    await admin.save();
    console.log('Admin password reset to: password123');
  } else {
    console.log('Admin user not found');
  }
}
reset();
