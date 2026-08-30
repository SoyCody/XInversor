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

export default {
    createInvestment,
    list
}