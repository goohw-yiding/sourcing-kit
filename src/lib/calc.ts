export interface CalcInput {
  costCny: number;
  exchangeRate: number;
  packagingCost: number;
  chinaShipping: number;
  agentFeeRate: number;
  cbm: number;
  cbmRate: number;
  hasCoOrigin: boolean;
  coOriginCost: number;
  customsRate: number;
  inlandShipping: number;
}

export interface CalcResult {
  costKrw: number;
  agentFee: number;
  cbmShipping: number;
  coOriginCost: number;
  customsBase: number;
  customsDuty: number;
  vat: number;
  inlandShipping: number;
  landedCost: number;
}

export function calcLandedCost(input: CalcInput): CalcResult {
  const costKrw = Math.round(input.costCny * input.exchangeRate);
  const agentFee = Math.round(costKrw * input.agentFeeRate);
  const cbmShipping = Math.round(input.cbm * input.cbmRate);
  const coOriginCost = input.hasCoOrigin ? Math.round(input.coOriginCost) : 0;

  // 과세가격 = 원화원가 (참고용 견적)
  const customsBase = costKrw;
  const customsDuty = Math.round(customsBase * input.customsRate);
  const vat = Math.round((customsBase + customsDuty) * 0.1);

  const landedCost =
    costKrw +
    input.packagingCost +
    input.chinaShipping +
    agentFee +
    cbmShipping +
    coOriginCost +
    customsDuty +
    vat +
    input.inlandShipping;

  return {
    costKrw,
    agentFee,
    cbmShipping,
    coOriginCost,
    customsBase,
    customsDuty,
    vat,
    inlandShipping: input.inlandShipping,
    landedCost: Math.round(landedCost),
  };
}

export function formatKrw(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}
