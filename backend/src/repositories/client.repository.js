import prisma from '../db.js';

const getMe = async (userId) => {
  return prisma.user.findFirst({
    where: {
      id: userId,
      state: 'ACTIVO',
    },
    include: {
      client: true,
    },
    omit: { avatar: true },
  });
};

// Falla con P2025 si el usuario no tiene perfil de Client (p. ej. un
// admin puro); el controller lo traduce a 404.
const updateWallet = async (userId, wallet) => {
  return prisma.client.update({
    where: { userId },
    data: { wallet },
    select: { wallet: true },
  });
};

// Inversión con el mayor `monto` del cliente, para el acceso directo del
// sidebar a "Detalles de la inversión": preferentemente EN_PROGRESO (es
// la que realmente está generando algo); si no tiene ninguna, cualquier
// otra sirve MENOS una RETIRADA -- una inversión ya cerrada no tiene
// sentido como acceso directo, así que nunca se muestra en el sidebar.
//
// El estado actual vive en la relación `estados` (no hay una columna
// "estadoActual" que filtrar directo en SQL, ver la misma nota en
// investment.repository.js#list), así que se trae todo y se filtra/ordena
// acá. El volumen por cliente es chico (unas pocas inversiones), así que
// no hace falta más que esto.
const highest = async (userId) => {
  const client = await prisma.client.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!client) return null;

  const inversiones = await prisma.inversion.findMany({
    where: { clientId: client.id },
    select: {
      id: true,
      monto: true,
      estados: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { estado: true },
      },
    },
  });

  const noRetiradas = inversiones.filter((inv) => inv.estados[0]?.estado !== 'RETIRADO');
  if (noRetiradas.length === 0) return null;

  const enProgreso = noRetiradas.filter((inv) => inv.estados[0]?.estado === 'EN_PROGRESO');
  const candidatas = enProgreso.length > 0 ? enProgreso : noRetiradas;

  const mejor = candidatas.reduce((mejor, actual) =>
    Number(actual.monto) > Number(mejor.monto) ? actual : mejor
  );

  return { id: mejor.id, monto: mejor.monto };
};

export default {
  getMe,
  updateWallet,
  highest,
};