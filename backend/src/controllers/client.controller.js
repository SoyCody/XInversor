import * as clientService from '../services/client.service.js';

const dashboard = async (req, res) => {
  try {
    const dashboard = await clientService.readDashboard(req.user.id);
    return res.status(200).json({ ...dashboard, blocked: req.user.blocked });
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

const updateWallet = async (req, res) => {
  try {
    const result = await clientService.updateWallet(req.user.id, req.body.wallet);
    return res.status(200).json(result);
  } catch (error) {
    // P2025: el usuario no tiene un perfil de Client (p. ej. un admin puro).
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'No tienes un perfil de cliente' });
    }
    console.error('Error al actualizar la wallet:', error);
    return res.status(500).json({ error: 'Error al actualizar la wallet' });
  }
};

const highestInvestment = async (req, res) => {
  try {
    const investment = await clientService.highestInvestment(req.user.id);
    return res.status(200).json(investment);
  } catch ( error ) {
    console.error('Error al retornar inversion: ', error);
    return res.status(500).json({ error: 'Error al obtener inversiones.'})
  };
};

export default {
  dashboard,
  me,
  updateWallet,
  highestInvestment
};