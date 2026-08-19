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
    console.error(error);
    return res.status(500).json({
      message: "Error al buscar el cliente"
    })
  };
};

export default { adminPanel, obtenerClientes, verCliente };