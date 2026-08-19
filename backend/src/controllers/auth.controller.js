import * as authService from '../services/auth.service.js';
import { setAuthCookie, COOKIE_NAME, COOKIE_OPTIONS } from '../middlewares/auth.middleware.js';

const register = async (req, res) => {
  try {
    const user = await authService.registerClient(req.body);

    // El token ya no va en el body: viaja como cookie httpOnly.
    setAuthCookie(res, user);

    res.status(201).json(user);
  } catch (error) {
    if (error instanceof authService.EmailAlreadyExistsError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Ya existe una cuenta con este correo electrónico'
      });
    }

    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

const login = async (req, res) => {
  try {
    const user = await authService.logClient(req.body);

    setAuthCookie(res, user);

    res.status(200).json(user);
  } catch (error) {
    if (error instanceof authService.EmailDoesntExistError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof authService.InvalidPasswordError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

const logout = async (req, res) => {
  try {
    // MISMAS opciones que se usaron en setAuthCookie (menos maxAge).
    // Antes limpiabas "access_token" con opciones que nunca coincidían
    // con ninguna cookie real porque el token nunca se seteaba como cookie.
    res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);

    return res.status(200).json({ message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return res.status(500).json({ error: 'Error al cerrar sesión' });
  }
};

const update = async (req, res) => {
  try {
    const id = req.user?.id; // del token, no del param
    const user = await authService.updateClient(id, req.body);
    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

const changePassword = async (req, res) => {
  try{
    const id = req.user?.id;
    const newPassword = await authService.changePassword(id, req.body);
    return res.status(200).json({
      message: "La contraseña se ha cambiado correctamente"
    });
  }catch(error){
    console.log(error);
    return res.status(500).json({
      message: error.message
    })
  }
};
const deleteUser = async (req, res)=> {
  try {
    const id = req.user?.id;
    await authService.deleteUser(id);
    res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
    return res.status(200).json({
      message: "Su cuenta ha sido eliminada exitosamente"
    })
  } catch (error){
    console.log(error);
    return res.status(500).json({
      message: 'Error al eliminar el usuario'
    })
  }
 };
export default { 
  register, 
  login, 
  logout, 
  update, 
  changePassword,
  deleteUser
};