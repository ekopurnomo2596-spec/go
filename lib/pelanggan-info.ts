// Bagian murni (tanpa database) supaya aman dipakai di komponen browser.

export const STATUS = [
  { id: "prospek", name: "Prospek" },
  { id: "pembeli", name: "Sudah beli" },
  { id: "langganan", name: "Langganan" },
] as const;
export type PelStatus = (typeof STATUS)[number]["id"];

export type Pelanggan = {
  id: string;
  nama: string;
  negara: string; // kode negara 2 huruf, atau kosong
  email: string;
  wa: string;
  hp: string;
  ig: string; // username tanpa @
  status: PelStatus;
  catatan: string;
  dibuat: number;
  diubah: number;
};

export const COUNTRY_CODES =
  "AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CD CF CG CH CI CK CL CM CN CO CR CU CV CW CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NG NI NL NO NP NR NZ OM PA PE PF PG PH PK PL PM PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" ");
