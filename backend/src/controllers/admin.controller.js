import * as adminService from '../services/admin.service.js'
import investmentService from '../services/investment.service.js'

const adminPanel = async (req, res) => {
  try {
    const dashboard = await adminService.readDashboard();
    return res.status(200).json(dashboard);
  } catch (error) {
    console.error('Error al cargar el panel de admin:', error);
    return res.status(500).json({ error: 'Error con la petición' });
  }
};

const obtenerPersonas = async (req, res) => {
  try {
    const data = await adminService.obtenerPersonas(req.query.tipo, req.query.page);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({
      message: "Error al obtener usuarios"
    });
  }
};

const verCliente = async (req, res) => {
  try{
    const id = Number(req.params.id);
    // Sin este guard, un :id no numérico llega como NaN a
    // prisma.user.findUnique y Prisma lanza un PrismaClientValidationError
    // que se traducía a un 500 en vez de a un 400.
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Id inválido' });
    }

    const cliente = await adminService.verCliente(id);

    if (!cliente.cliente) {
      return res.status(404).json({
        message: 'Cliente no encontrado'
      });
    }

    const inversiones = await investmentService.inversionesCliente(
      id,
      req.query.tipo,
      req.query.page
    );

    return res.status(200).json({ ...cliente, inversiones })

  }catch(error){
    console.error('Error al buscar el cliente:', error);
    return res.status(500).json({
      message: "Error al buscar el cliente"
    })
  };
};

const promoteToAdmin = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Id inválido' });
    }
    const user = await adminService.promoteToAdmin(id, req.user.id);
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
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Id inválido' });
    }
    const blocked = await adminService.blockClient(id, req.user.id);
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
  obtenerPersonas,
  verCliente,
  promoteToAdmin,
  blockClient
};