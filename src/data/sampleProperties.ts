import type { PropertyInput } from '../types/firestore';

type Sample = Omit<PropertyInput, 'agentId'>;

/**
 * Catálogo de muestra: agua mineral Del Pedregal en sus cuatro presentaciones. Cada tamaño es su propia categoría
 * (filtro en el catálogo). Los precios son provisorios (pesos uruguayos por unidad, `price` = minorista,
 * `wholesalePrice` = mayorista): ajustalos desde el panel.
 */
function sample(title: string, category: string, price: number, wholesale: number, description: string): Sample {
  return {
    title,
    description,
    type: category,
    weight: 1,
    unit: 'each',
    pricingMode: 'por_unidad',
    price,
    wholesalePrice: wholesale,
    inStock: true,
    // Los campos de abajo no se usan en este catálogo; solo mantienen los datos válidos para las reglas de seguridad.
    operation: 'sale',
    currency: 'UYU',
    location: { city: '', country: '' },
    specs: { bedrooms: 0, bathrooms: 0, areaM2: 0 },
    photos: [{ url: '/Dosbidones-tapa-azul.png' }],
    deliveryAreas: ['Maldonado'],
    status: 'active',
  };
}

/** Los productos de muestra del sitio (el botón "Importar productos de muestra" carga estos). */
export const sampleProperties: Sample[] = [
  sample('Del Pedregal 600 ml', 'agua-600ml', 40, 32, 'Agua mineral natural sin gas, botella individual de 600 ml.'),
  sample('Del Pedregal 1 L', 'agua-1l', 60, 48, 'Agua mineral natural sin gas, botella de 1 litro.'),
  sample('Del Pedregal 6 L', 'agua-6l', 150, 125, 'Agua mineral natural sin gas, botellón de 6 litros.'),
  sample('Del Pedregal 20 L', 'agua-20l', 280, 240, 'Agua mineral natural sin gas, bidón retornable de 20 litros.'),
];
