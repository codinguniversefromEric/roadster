export const K = 273.15;
export const GAS = {
  air: { name: '空氣',     cp: 1005, gam: 1.40, R: 287  },
  n2:  { name: '氮氣',     cp: 1040, gam: 1.40, R: 297  },
  co2: { name: '二氧化碳', cp: 850,  gam: 1.29, R: 189  },
  he:  { name: '氦氣',     cp: 5190, gam: 1.67, R: 2077 }
};
export const es = T => 0.61094 * Math.exp(17.625 * T / (T + 243.04));
export const dew = (T, rh) => { const m = Math.log(rh / 100) + 17.625 * T / (243.04 + T); return 243.04 * m / (17.625 - m); };

/* 單一噴嘴：P0、Pa 單位 Pa，T0K 單位 K，A 單位 m² */
export function nozzle(g, P0, T0K, Pa, A) {
  const gm = g.gam, R = g.R, crit = Math.pow(2 / (gm + 1), gm / (gm - 1));
  if (P0 <= Pa || T0K <= 0) return { md: 0, ve: 0, Pe: Pa, F: 0, Tj: T0K, choked: false };
  if (Pa / P0 <= crit) {                       // 阻塞：喉部音速
    const C = Math.pow(2 / (gm + 1), (gm + 1) / (2 * (gm - 1)));
    const md = C * A * P0 * Math.sqrt(gm / (R * T0K));
    const Te = T0K * 2 / (gm + 1), ve = Math.sqrt(gm * R * Te), Pe = P0 * crit;
    return { md, ve, Pe, F: md * ve + (Pe - Pa) * A, Tj: Te, choked: true };
  }
  const pr = Math.pow(P0 / Pa, (gm - 1) / gm), Te = T0K / pr;   // 亞音速
  const ve = Math.sqrt(2 / (gm - 1) * (pr - 1) * gm * R * Te), md = Pa / (R * Te) * ve * A;
  return { md, ve, Pe: Pa, F: md * ve, Tj: Te, choked: false };
}

/* 絕熱放氣後的槽內狀態 */
export function tank(g, P0, T0K, m0, m) {
  const r = Math.max(m / m0, 0);
  return { P: P0 * Math.pow(r, g.gam), T: T0K * Math.pow(r, g.gam - 1) };
}

/* 混合線是否穿過飽和曲線 */
export function fogRange(Ta, RH, Tj, ej = 0) {
  Tj = Math.max(Tj, -100);
  const ea = RH / 100 * es(Ta); let lo = -1, hi = -1;
  for (let i = 0; i <= 100; i++) {
    const f = i / 100, T = f * Ta + (1 - f) * Tj, e = f * ea + (1 - f) * ej;
    if (e > es(T)) { if (lo < 0) lo = f; hi = f; }
  }
  return { fog: lo >= 0, lo, hi, ea, Td: RH > 0 ? dew(Ta, RH) : -Infinity };
}