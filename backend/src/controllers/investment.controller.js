import InvestmentService from '../services/investment.service.js';

const createInvestment = async (req, res) => {
  try {
    const { id } = req.user;
    const inversion = await InvestmentService.newInvestment(id, req.body);
    return res.status(201).json(inversion)
  } catch ( error ) {
    console.log(error.message)
    return res.status(error.statusCode || 500).json({
      message: error.message
    })
  }
};

const list = async(req, res) => {
    try {
        const data = await InvestmentService.list(req.query.tipo, req.query.page);
        return res.status(200).json(data);
    } catch( error ) {
        return res.status(500).json({
            message: error.message
        })
    };
};

const myList = async(req, res) => {
  try {
    const { id } = req.user;
    const data = await InvestmentService.myList(id, req.query.tipo, req.query.page);
    if (!data) {
      return res.status(404).json({
        message:"No se encontraron inversiones"
      });
    };
    return res.status(200).json(data);
  } catch ( error ) {
    console.log(error.message);
    return res.status(500).json({
      message: "Error al obtener inversiones"
    })
  };
};

const createApplication = async (req, res) => {
  try {
    const { id } = req.user;
    const inversionId = Number(req.params.inversionId);
    const { montoRetiro } = req.body;
    const solicitud = await InvestmentService.createApplication(id, inversionId, montoRetiro);
    return res.status(201).json(solicitud);
  } catch ( error ) {
    console.log(error.message);
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
    console.log(error.message);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : 'Error al obtener la inversión.'
    });
  };
};

export default {
    createInvestment,
    list,
    myList,
    createApplication,
    getInvestment
}