import * as clientService from '../services/client.service.js';

const dashboard = async (req, res) => {
  try {
    const dashboard = await clientService.readDashboard(req.user.id);
    return res.status(200).json(dashboard);
  } catch (error) {
    console.error('Error al cargar el panel de cliente:', error);
    return res.status(500).json({ error: 'Error con la petición' });
  }
};

const me = async (req, res) => {
  try {
    const user = await clientService.getMe(req.user.id);
    return res.status(200).json(user);
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    return res.status(500).json({ error: 'Error con la petición' });
  }
};

export default { 
  dashboard, 
  me
};