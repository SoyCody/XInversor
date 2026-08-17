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
    console.error(error);
    return res.status(500).json({
      message: "Error al obtener clientes"
    })
  };
};

export default { adminPanel, obtenerClientes };