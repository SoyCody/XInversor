import adminRepository from '../repositories/admin.repository.js';
import userRepository from '../repositories/user.repository.js';

// Error de dominio: se traduce a un código de estado en el controller.
class UserNotFoundError extends Error {
  constructor() {
    super('Usuario no encontrado');
    this.name = 'UserNotFoundError';
    this.statusCode = 404;
  }
}

class AlreadyAdminError extends Error {
  constructor() {
    super('Este usuario ya es administrador');
    this.name = 'AlreadyAdminError';
    this.statusCode = 409;
  }
}

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

const obtenerClientes = async () => {
  const [ totalClientes, clientes ] = await Promise.all([
    adminRepository.countByRole('CLIENT'),
    adminRepository.obtenerClientes()
  ]);

  return { 
    totalClientes,
    clientes
  }
};

const verCliente = async (id) => {
  const [cliente] = await Promise.all([
    adminRepository.verCliente(id)
  ]);
  return{ cliente }
};

const promoteToAdmin = async (id) => {
  const user = await userRepository.findActiveById(id);
  if (!user) {
    throw new UserNotFoundError();
  }

  if (user.role === 'ADMIN') {
    throw new AlreadyAdminError();
  }

  // El Client del usuario se conserva tal cual: el ascenso solo
  // agrega el perfil Admin y cambia el rol, no borra nada.
  const updatedUser = await adminRepository.promoteToAdmin(id);

  const { passwordHash, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
};

export {
  readDashboard,
  obtenerClientes,
  verCliente,
  promoteToAdmin,
  UserNotFoundError,
  AlreadyAdminError
};