import *  as auditService from '../services/auditorias.service.js';

const obtenerAuditorias = async (req, res) => {
    try{
        const auditorias = await auditService.auditorias(req.query.page);
        return res.status(200).json(auditorias);
    } catch (error){
        console.error(error);
        return res.status(500).json({
            message: "Error al obtener registro."
        })
    };
};

const verAuditoria = async (req, res) => {
    try{
        const id = Number(req.params.id);
        // Evita que un :id no numérico llegue como NaN a Prisma (500 -> 400).
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: 'Id inválido' });
        }
        const auditoria = await auditService.verAuditoria(id);

        if (!auditoria.auditoria) {
            return res.status(404).json({
                message: 'Auditoría no encontrada'
            });
        }

        return res.status(200).json(auditoria)
    } catch( error ) {
        console.error(error);
        return res.status(500).json({
            message: "Error al obtener el registro"
        })
    };
};

export default { obtenerAuditorias, verAuditoria };