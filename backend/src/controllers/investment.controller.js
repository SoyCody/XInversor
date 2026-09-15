import InvestmentService from '../services/investment.service.js';

const createInvestment = async (req, res) => {
  try {
    const { id } = req.user;
    const inversion = await InvestmentService.newInvestment(id, req.body);
    return res.status(201).json(inversion)
  } catch ( error ) {
    // Con statusCode (errores de dominio via fail()) se devuelve el
    // mensaje; sin él es un error inesperado -> 500 genérico sin filtrar
    // detalle interno.
    if (!error.statusCode) console.error(error);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : 'Error al crear la inversión.'
    })
  }
};

const list = async(req, res) => {
    try {
        const data = await InvestmentService.list(req.query.tipo, req.query.page);
        return res.status(200).json(data);
    } catch( error ) {
        console.error(error);
        return res.status(500).json({
            message: 'Error al obtener las inversiones'
        })
    };
};

const myList = async(req, res) => {
  try {
    const { id } = req.user;
    // myList siempre devuelve un objeto (listado paginado, aunque venga
    // vacío) o lanza; el chequeo `if (!data) -> 404` anterior era código
    // muerto.
    const data = await InvestmentService.myList(id, req.query.tipo, req.query.page);
    return res.status(200).json(data);
  } catch ( error ) {
    console.error(error);
    return res.status(500).json({
      message: "Error al obtener inversiones"
    })
  };
};

// Resumen agregado (totales + desglose por estado) para "Mis inversiones"
// e Inicio. No pagina: son unos pocos números, no una lista.
const summary = async (req, res) => {
  try {
    const { id } = req.user;
    const data = await InvestmentService.resumenInversiones(id);
    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Error al obtener el resumen de inversiones'
    });
  }
};

const createApplication = async (req, res) => {
  try {
    const { id } = req.user;
    const inversionId = Number(req.params.inversionId);
    const { montoRetiro } = req.body;
    const solicitud = await InvestmentService.createApplication(id, inversionId, montoRetiro);
    return res.status(201).json(solicitud);
  } catch ( error ) {
    if (!error.statusCode) console.error(error);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : 'Error en la nueva solicitud.'
    });
  };
};

const getInvestment = async (req, res) => {
  try {
    const { id } = req.user;
    const inversionId = Number(req.params.inversionId);
    const data = await InvestmentService.getInvestment(id, inversionId);
    return res.status(200).json(data);
  } catch ( error ) {
    if (!error.statusCode) console.error(error);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : 'Error al obtener la inversión.'
    });
  };
};

const getInvestmentAdmin = async (req, res) => {
  try {
    const inversionId = Number(req.params.inversionId);
    const data = await InvestmentService.getInvestmentAdmin(inversionId);
    return res.status(200).json(data);
  } catch ( error ) {
    if (!error.statusCode) console.error(error);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : 'Error al obtener la inversión.'
    });
  };
};

const percent = async (req, res) => {
  try {
    const { id } = req.user;
    const { porcentaje } = req.body;
    const data = await InvestmentService.updatePorcentaje(id, porcentaje);
    return res.status(200).json(data);
  } catch ( error ) {
    if (!error.statusCode) console.error(error);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : 'Error en el cambio de porcentaje.'
    });
  };
};

const approve = async (req, res) => {
  try {
    const applicationId = Number(req.params.applicationId);
    const { id } = req.user;
    const application = await InvestmentService.approve(applicationId, id);
    return res.status(200).json(application);
  } catch ( error ) {
    if (!error.statusCode) console.error(error);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : 'Error al aprobar la solicitud.'
    });
  };
};

const reject = async (req, res) => {
  try {
    const applicationId = Number(req.params.applicationId);
    const { id } = req.user;
    const application = await InvestmentService.reject(applicationId, id);
    return res.status(200).json(application);
  } catch ( error ) {
    if (!error.statusCode) console.error(error);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : 'Error al rechazar la solicitud.'
    });
  };
};

export default {
    createInvestment,
    list,
    myList,
    summary,
    createApplication,
    getInvestment,
    getInvestmentAdmin,
    percent,
    approve,
    reject
}