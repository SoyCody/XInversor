import notificationService from '../services/notification.service.js';

const recentClient = async (req, res) => {
  try {
    const notificaciones = await notificationService.recientesCliente(req.user.id);
    return res.status(200).json({ notificaciones });
  } catch (error) {
    console.error('Error al obtener notificaciones recientes:', error);
    return res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

const listClient = async (req, res) => {
  try {
    const data = await notificationService.listarCliente(req.user.id, req.query.page);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

const recentAdmin = async (req, res) => {
  try {
    const notificaciones = await notificationService.recientesAdmin();
    return res.status(200).json({ notificaciones });
  } catch (error) {
    console.error('Error al obtener notificaciones recientes:', error);
    return res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

const listAdmin = async (req, res) => {
  try {
    const data = await notificationService.listarAdmin(req.query.page);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

export default {
  recentClient,
  listClient,
  recentAdmin,
  listAdmin
};
