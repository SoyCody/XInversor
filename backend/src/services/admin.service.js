import adminRepository from '../repositories/admin.repository.js';

const readDashboard = async () => {
  const [totalUsers, totalAdmins, totalClients, recentUsers] = await Promise.all([
    adminRepository.countAll(),
    adminRepository.countByRole('ADMIN'),
    adminRepository.countByRole('CLIENT'),
    adminRepository.findRecent(10)
  ]);

  return {
    totalUsers,
    totalAdmins,
    totalClients,
    recentUsers
  };
};

export { readDashboard };