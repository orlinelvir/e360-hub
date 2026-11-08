// Cálculo puro de comisión de Tax Office, sin dependencias de servidor
// (a diferencia de tax-office-service.ts, que importa firebase-admin y no
// puede entrar al bundle de cliente) — así el mismo cálculo se puede usar
// tanto en la vista previa en vivo del modal como en el handler de modo demo
// como en el guardado real del servidor, sin repetir la fórmula 3 veces y
// arriesgar que un cambio futuro (ej. el monto del fee de $60) se actualice
// en un solo lugar y quede desincronizado en los otros.
export function computeTaxCommission(totalReturns: number, grossVolume: number, splitPercentage: number, underMentorship: boolean) {
  const e360FeeDeduction = underMentorship ? totalReturns * 60 : 0;
  const netCommission = Math.round(grossVolume * (splitPercentage / 100)) - e360FeeDeduction;
  return { e360FeeDeduction, netCommission };
}
