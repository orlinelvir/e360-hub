// Antes esto era un literal de string repetido en 3 lugares distintos
// (AuthProvider.tsx dos veces con valores DIFERENTES — "Junior Broker" vs
// "Senior Broker VIP" — y broker-service.ts con un tercero), lo que dejó
// pasar una inconsistencia real: el tier por defecto de un broker nuevo
// dependía de qué camino de registro había tomado, sin ninguna razón de
// negocio detrás. Confirmado con Fernando: fue un bug, no una regla — todo
// broker nuevo arranca igual sin importar el método de registro.
export const DEFAULT_BROKER_TIER = "Junior Broker";

// Comisión de referido ($100) acreditada la primera vez que se confirma el
// pago de un broker referido — compartida entre el endpoint admin manual
// (app/api/admin/brokers/onboarding/route.ts) y el webhook automático de GHL
// (app/api/webhooks/ghl/route.ts, evento "payment_completed") para que no
// puedan quedar desincronizados si este monto cambia algún día.
export const REFERRAL_COMMISSION = 100;
