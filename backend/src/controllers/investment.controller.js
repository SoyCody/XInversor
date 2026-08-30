import InvestmentService from '../services/investment.service.js';

const createInvestment = async (req, res) => {
  try {
    const { id } = req.user;
    const inversion = await InvestmentService.newInvestment(id, req.body);
    return res.status(201).json(inversion)
  } catch ( error ) {
    console.log(error.message)
    return res.status(500).json({
      message: error.message
    }) 
  }
};

const list = async(req, res) => {
    try {
        const data = await InvestmentService.list(req.query.tipo);
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
    const data = await InvestmentService.myList(id, req.query.tipo);
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

export default {
    createInvestment,
    list,
    myList
}