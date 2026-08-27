import * as adminService from '../services/admin.service.js'

const adminPanel = async (req, res) => {
  try {
    const dashboard = await adminService.readDashboard();
    return res.status(200).json(dashboard);
  } catch (error) {
    console.error('Error al cargar el panel de admin:', error);
    return res.status(500).json({ error: 'Error con la petición' });
  }
};

const obtenerClientes = async (req, res) => {
  try{
    const users = await adminService.obtenerClientes();
    return res.status(200).json(users)
  }catch(error){
    return res.status(500).json({
      message: "Error al obtener clientes"
    })
  };
};

const verCliente = async (req, res) => {
  try{
    const { id } = req.params;
    const cliente = await adminService.verCliente(Number(id));

    if (!cliente.cliente) {
      return res.status(404).json({
        message: 'Cliente no encontrado'
      });
    }

    return res.status(200).json(cliente)
    
  }catch(error){
    return res.status(500).json({
      message: "Error al buscar el cliente"
    })
  };
};

const promoteToAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await adminService.promoteToAdmin(Number(id), req.user.id);
    return res.status(200).json(user);
  } catch (error) {
    if (error instanceof adminService.UserNotFoundError ||
        error instanceof adminService.AlreadyAdminError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error(error);
    return res.status(500).json({
      message: "Error al ascender al usuario"
    });
  }
};

const blockClient = async (req, res) => {
  try{
    const { id } = req.params;
    const blocked = await adminService.blockClient(Number(id), req.user.id);
    return res.status(200).json(blocked);
  } catch ( error ) {
    if (error instanceof adminService.UserNotFoundError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error(error);
    return res.status(500).json({
      message: "Error al bloquear el cliente"
    })
  };
};

export default {
  adminPanel,
  obtenerClientes,
  verCliente,
  promoteToAdmin,
  blockClient
};