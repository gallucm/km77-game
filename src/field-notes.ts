import type { TargetId } from './progress';

export const notes: Partial<Record<TargetId, { title: string; text: string }>> = {
    'entry-plate': { title: 'Cartel del kilómetro', text: 'KM 17 · Propiedad forestal.\nPlaca de guardia: 2.' },
    'cabin-plate': { title: 'Placa del porche', text: 'Bajo la lámpara del porche, una chapa lleva el número 4.' },
    'shed-plate': { title: 'Chapa del cobertizo', text: 'Grabado sobre la chapa: 7.' },
    'well-plate': { title: 'Pozo seco', text: 'En el soporte donde colgaba el balde hay una placa: 1.' },
    map: {
        title: 'Croquis de la finca',
        text: 'De espaldas al portón, el cobertizo queda a la derecha y el pozo a la izquierda. Las marcas junto a las placas son nombres que anotó el guardia.\n\nAgua — pozo seco.\nTecho — chapa del cobertizo.\nInicio — cartel del kilómetro.\nLuz — lámpara del porche.'
    },
    log: {
        title: 'Registro de guardia',
        text: 'Ronda nocturna. Salí por Inicio. Pasé por Luz antes de revisar Techo. Dejé Agua para el final.\n\nGenerador: revisar fusible y combustible.\n\n23:47. El conductor volvió a dejar a alguien en el portón.'
    }
};

export const labels: Record<TargetId, string> = {
    'entry-plate': 'Examinar cartel del kilómetro',
    'cabin-plate': 'Examinar placa del porche',
    'shed-plate': 'Examinar chapa del cobertizo',
    'well-plate': 'Examinar placa del pozo',
    map: 'Leer croquis',
    log: 'Leer registro de guardia',
    'shed-key': 'Recoger llave del cobertizo',
    'basement-key': 'Recoger llave del sótano',
    fuse: 'Recoger fusible',
    fuel: 'Recoger bidón',
    crank: 'Recoger manivela',
    'shed-door': 'Abrir cobertizo',
    'basement-door': 'Abrir sótano',
    generator: 'Revisar generador',
    'gate-panel': 'Examinar panel del portón',
    'gate-crank': 'Usar seguro manual'
};
