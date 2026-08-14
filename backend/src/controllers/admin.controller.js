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

export default { adminPanel };