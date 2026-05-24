import React, { useState, useRef, useEffect, useMemo } from "react";
import { JAKIM_ZONES } from "../lib/zones";
import { Search, MapPin, X, Crosshair, Map as MapIcon, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";
import { M3_MOTION } from "../lib/motion";
import { motion, AnimatePresence } from "motion/react";
import "@material/web/iconbutton/filled-icon-button.js";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/button/filled-tonal-button.js";
import "@material/web/ripple/ripple.js";
import "@material/web/switch/switch.js";
import "@material/web/tabs/tabs.js";
import "@material/web/tabs/primary-tab.js";
import { useAppContext } from "../AppContext";
import { MapModal } from "./MapModal";
import { useVisualStyle } from "../hooks/useVisualStyle";

const STATE_FLAGS: Record<string, string> = {
  Johor:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Johor.svg",
  Kedah:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Kedah.svg",
  Kelantan:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Kelantan.svg",
  Melaka:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Malacca.svg",
  "Negeri Sembilan":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Negeri_Sembilan.svg",
  Pahang:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Pahang.svg",
  Perak:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Perak.svg",
  Perlis:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Perlis.svg",
  "Pulau Pinang":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Penang_(Malaysia).svg",
  Sabah:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Sabah.svg",
  Sarawak:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Sarawak.svg",
  Selangor:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Selangor.svg",
  Terengganu:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Terengganu.svg",
  "Wilayah Persekutuan":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_the_Federal_Territories.svg",
};

const ALIASES: Record<string, string> = {
  ampang: "SGR01",
  kajang: "SGR01",
  bangi: "SGR01",
  semenyih: "SGR01",
  "hulu langat": "SGR01",
  cheras: "WLY01",
  "kelana jaya": "SGR01",
  puchong: "SGR01",
  subang: "SGR01",
  "subang jaya": "SGR01",
  "petaling jaya": "SGR01",
  pj: "SGR01",
  damansara: "SGR01",
  "bandar utama": "SGR01",
  cyberjaya: "SGR01",
  sepang: "SGR01",
  dengkil: "SGR01",
  klia: "SGR01",
  "salak tinggi": "SGR01",
  banting: "SGR03",
  jenjarom: "SGR03",
  "teluk panglima garang": "SGR03",
  "shah alam": "SGR01",
  gombak: "SGR01",
  "batu caves": "SGR01",
  selayang: "SGR01",
  rawang: "SGR01",
  "kuala kubu bharu": "SGR01",
  "hulu selangor": "SGR01",
  "sungai buloh": "SGR01",
  serendah: "SGR01",
  "batang kali": "SGR01",
  klang: "SGR03",
  "port klang": "SGR03",
  kapar: "SGR03",
  meru: "SGR03",
  "kuala langat": "SGR03",
  "pulau carey": "SGR03",
  morib: "SGR03",
  jugra: "SGR03",
  "kuala selangor": "SGR02",
  "tanjong karang": "SGR02",
  "sabak bernam": "SGR02",
  sekinchan: "SGR02",
  "sungai besar": "SGR02",
  ijok: "SGR02",
  jeram: "SGR02",
  "bestari jaya": "SGR02",
  "kuala lumpur": "WLY01",
  putrajaya: "WLY01",
  labuan: "WLY02",
  kepong: "WLY01",
  "wangsa maju": "WLY01",
  setapak: "WLY01",
  sentul: "WLY01",
  "bukit jalil": "WLY01",
  "bandar tun razak": "WLY01",
  titiwangsa: "WLY01",
  bangsar: "WLY01",
  "mont kiara": "WLY01",
  "sri petaling": "WLY01",
  "sungai besi": "WLY01",
  "johor bahru": "JHR02",
  jb: "JHR02",
  "pasir gudang": "JHR02",
  skudai: "JHR02",
  masai: "JHR02",
  "gelang patah": "JHR02",
  kulai: "JHR02",
  senai: "JHR02",
  "kota tinggi": "JHR02",
  mersing: "JHR02",
  "ulu tiram": "JHR02",
  plentong: "JHR02",
  kempas: "JHR02",
  tampoi: "JHR02",
  "layang-layang": "JHR03",
  sedili: "JHR02",
  pengerang: "JHR02",
  desaru: "JHR02",
  "batu pahat": "JHR04",
  "yong peng": "JHR04",
  muar: "JHR04",
  pagoh: "JHR04",
  segamat: "JHR04",
  tangkak: "JHR04",
  labis: "JHR04",
  "parit sulong": "JHR04",
  "ayer hitam": "JHR04",
  "sri gading": "JHR04",
  "parit raja": "JHR04",
  "bukit gambir": "JHR04",
  bekok: "JHR04",
  chaah: "JHR04",
  "buloh kasap": "JHR04",
  kluang: "JHR03",
  "simpang renggam": "JHR03",
  pontian: "JHR03",
  "pekan nenas": "JHR03",
  benut: "JHR03",
  kukup: "JHR03",
  mengkibol: "JHR03",
  paloh: "JHR03",
  kahang: "JHR03",
  "pulau aur": "JHR01",
  "pulau pemanggil": "JHR01",
  melaka: "MLK01",
  "ayer keroh": "MLK01",
  jasin: "MLK01",
  "alor gajah": "MLK01",
  "masjid tanah": "MLK01",
  "sg udang": "MLK01",
  "batu berendam": "MLK01",
  merlimau: "MLK01",
  "pulau sebang": "MLK01",
  machap: "MLK01",
  "kuala sungai baru": "MLK01",
  klebang: "MLK01",
  bemban: "MLK01",
  seremban: "NGS03",
  "port dickson": "NGS03",
  pd: "NGS03",
  senawang: "NGS03",
  nilai: "NGS03",
  mantin: "NGS03",
  rantau: "NGS03",
  lukut: "NGS03",
  chuah: "NGS03",
  "bandar sri sendayan": "NGS03",
  lenggeng: "NGS03",
  "kuala pilah": "NGS02",
  rembau: "NGS02",
  jelebu: "NGS02",
  "kuala klawang": "NGS02",
  johol: "NGS02",
  juasseh: "NGS02",
  "seri menanti": "NGS02",
  pedas: "NGS02",
  kota: "NGS02",
  pertang: "NGS02",
  "simpang durian": "NGS02",
  tampin: "NGS01",
  jempol: "NGS01",
  bahau: "NGS01",
  gemas: "NGS01",
  gemencheh: "NGS01",
  "bandar seri jempol": "NGS01",
  "batu kikir": "NGS01",
  "rompin negeri sembilan": "NGS01",
  ipoh: "PRK02",
  "kuala kangsar": "PRK02",
  "sungai siput": "PRK02",
  "batu gajah": "PRK02",
  kampar: "PRK02",
  gopeng: "PRK02",
  tambun: "PRK02",
  menglembu: "PRK02",
  jelapang: "PRK02",
  chemor: "PRK02",
  "ulu kinta": "PRK02",
  pusing: "PRK02",
  tronoh: "PRK02",
  "malim nawar": "PRK02",
  "padang rengas": "PRK02",
  karai: "PRK02",
  taiping: "PRK06",
  "bagan serai": "PRK06",
  "parit buntar": "PRK06",
  kamunting: "PRK06",
  selama: "PRK06",
  matang: "PRK06",
  "kuala kurau": "PRK06",
  "simpang empat": "PRK06",
  "batu kurau": "PRK06",
  "kuala sepetang": "PRK06",
  "changkat jering": "PRK06",
  "teluk intan": "PRK05",
  manjung: "PRK05",
  sitiawan: "PRK05",
  lumut: "PRK05",
  "seri iskandar": "PRK05",
  "pulau pangkor": "PRK05",
  "bagan datuk": "PRK05",
  "kg gajah": "PRK05",
  beruas: "PRK05",
  "pantai remis": "PRK05",
  "hutan melintang": "PRK05",
  selekoh: "PRK05",
  parit: "PRK05",
  bota: "PRK05",
  "chenderong balai": "PRK05",
  tapah: "PRK01",
  bidor: "PRK01",
  "slim river": "PRK01",
  "tanjung malim": "PRK01",
  sungkai: "PRK01",
  behrang: "PRK01",
  banir: "PRK01",
  temoh: "PRK01",
  chenderiang: "PRK01",
  trolak: "PRK01",
  gerik: "PRK03",
  grik: "PRK03",
  lenggong: "PRK03",
  "pengkalan hulu": "PRK03",
  lawin: "PRK03",
  kroh: "PRK03",
  "kelian intan": "PRK03",
  temengor: "PRK04",
  belum: "PRK04",
  "bukit larut": "PRK07",
  "maxwell hill": "PRK07",
  georgetown: "PNG01",
  "bayan lepas": "PNG01",
  butterworth: "PNG01",
  "bukit mertajam": "PNG01",
  "nibong tebal": "PNG01",
  perai: "PNG01",
  "batu kawan": "PNG01",
  "kepala batas": "PNG01",
  "balik pulau": "PNG01",
  "batu ferringhi": "PNG01",
  "tanjung bungah": "PNG01",
  gelugor: "PNG01",
  jelutong: "PNG01",
  "air itam": "PNG01",
  "payar terubong": "PNG01",
  relau: "PNG01",
  "teluk kumbar": "PNG01",
  "bayan baru": "PNG01",
  "mak mandin": "PNG01",
  "seberang jaya": "PNG01",
  "kubang semang": "PNG01",
  penanti: "PNG01",
  "bukit minyak": "PNG01",
  juru: "PNG01",
  "simpang ampat": "PNG01",
  "sungai bakap": "PNG01",
  jawi: "PNG01",
  "alor setar": "KDH01",
  jitra: "KDH01",
  "pokok sena": "KDH01",
  "kubang pasu": "KDH01",
  "kuala kedah": "KDH01",
  changlun: "KDH01",
  "bukit kayu hitam": "KDH01",
  kodiang: "KDH01",
  "kepala batas kedah": "KDH01",
  langgar: "KDH01",
  pendang: "KDH02",
  "simpang empat kedah": "KDH01",
  "kuala nerang": "KDH03",
  "padang terap": "KDH03",
  "sungai petani": "KDH02",
  yan: "KDH02",
  gurun: "KDH02",
  bedong: "KDH02",
  merbok: "KDH02",
  "tanjung dawai": "KDH02",
  "tikam batu": "KDH02",
  "kota kuala muda": "KDH02",
  "guar chempedak": "KDH02",
  sala: "KDH02",
  kulim: "KDH05",
  lunas: "KDH05",
  "bandar baharu": "KDH05",
  "padang serai": "KDH05",
  karangan: "KDH05",
  serdang: "KDH05",
  "selama kedah": "KDH05",
  baling: "KDH04",
  kupang: "KDH04",
  "kuala pegang": "KDH04",
  malau: "KDH04",
  sik: "KDH03",
  gulai: "KDH03",
  jeneri: "KDH03",
  langkawi: "KDH06",
  kuah: "KDH06",
  "padang matsirat": "KDH06",
  "ayer hangat": "KDH06",
  bohor: "KDH06",
  kedawang: "KDH06",
  "ulu melaka": "KDH06",
  "puncak gunung jerai": "KDH07",
  "gunung jerai": "KDH07",
  kangar: "PLS01",
  arau: "PLS01",
  "padang besar": "PLS01",
  "kuala perlis": "PLS01",
  beseri: "PLS01",
  cuping: "PLS01",
  bintong: "PLS01",
  "simpang empat perlis": "PLS01",
  sanglang: "PLS01",
  "mata ayer": "PLS01",
  "kurong anai": "PLS01",
  "kota bharu": "KTN01",
  "pasir mas": "KTN01",
  tumpat: "KTN01",
  "tanah merah": "KTN01",
  bachok: "KTN01",
  "pasir puteh": "KTN01",
  machang: "KTN01",
  "kuala krai": "KTN01",
  ketereh: "KTN01",
  "pengkalan chepa": "KTN01",
  "kubang kerian": "KTN01",
  "wakaf bharu": "KTN01",
  "rantau panjang": "KTN01",
  salor: "KTN01",
  pendek: "KTN01",
  peringat: "KTN01",
  jelawat: "KTN01",
  "awang besut": "KTN01",
  "kok lanas": "KTN01",
  melor: "KTN01",
  kadok: "KTN01",
  "bukit panau": "KTN01",
  kusial: "KTN01",
  jedok: "KTN01",
  dabung: "KTN01",
  "manek urai": "KTN01",
  kemahang: "KTN01",
  jerek: "KTN01",
  "gua musang": "KTN02",
  jeli: "KTN02",
  bertam: "KTN02",
  galas: "KTN02",
  loji: "KTN02",
  "batu melintang": "KTN02",
  "kuala balah": "KTN02",
  "kuala terengganu": "TRG01",
  "kuala nerus": "TRG01",
  marang: "TRG01",
  "batu rakit": "TRG01",
  "bukit payong": "TRG01",
  manir: "TRG01",
  "gong badak": "TRG01",
  "wakaf tapai": "TRG01",
  "kuala ibai": "TRG01",
  chedang: "TRG01",
  merchang: "TRG01",
  kemaman: "TRG04",
  cukai: "TRG04",
  dungun: "TRG04",
  kerteh: "TRG04",
  paka: "TRG04",
  kijal: "TRG04",
  kemasik: "TRG04",
  cheneh: "TRG04",
  "ketengah jaya": "TRG04",
  binjai: "TRG04",
  "kuala abang": "TRG04",
  besut: "TRG02",
  jerteh: "TRG02",
  setiu: "TRG02",
  "kampung raja": "TRG02",
  "kuala besut": "TRG02",
  jabi: "TRG02",
  permaisuri: "TRG02",
  chalok: "TRG02",
  "sungai tong": "TRG02",
  penarik: "TRG02",
  "hulu terengganu": "TRG03",
  "kuala berang": "TRG03",
  ajit: "TRG03",
  tersat: "TRG03",
  "kuala telemong": "TRG03",
  jenagor: "TRG03",
  "sungai telemong": "TRG03",
  kuantan: "PHG02",
  pekan: "PHG02",
  "rompin pahang": "PHG02",
  "muadzam shah": "PHG02",
  "indera mahkota": "PHG02",
  gambang: "PHG02",
  beserah: "PHG02",
  balok: "PHG02",
  "sungai lembing": "PHG02",
  nenasi: "PHG02",
  chuping: "PHG02",
  "kuala rompin": "PHG02",
  endau: "PHG02",
  temerloh: "PHG03",
  mentakab: "PHG03",
  maran: "PHG03",
  bera: "PHG03",
  jengka: "PHG03",
  jerantut: "PHG03",
  lancang: "PHG03",
  "kuala krau": "PHG03",
  chenor: "PHG03",
  "bandar tun razak pahang": "PHG03",
  triang: "PHG03",
  kemayan: "PHG03",
  mengkarak: "PHG03",
  "bandar bera": "PHG03",
  "taman negara": "PHG03",
  "kuala tahan": "PHG03",
  bentong: "PHG04",
  raub: "PHG04",
  lipis: "PHG04",
  "kuala lipis": "PHG04",
  karak: "PHG04",
  benta: "PHG04",
  dong: "PHG04",
  tras: "PHG04",
  "padang tengku": "PHG04",
  merapoh: "PHG04",
  "batu talam": "PHG04",
  "bukit tinggi": "PHG05",
  "janda baik": "PHG05",
  "genting sempah": "PHG05",
  "cameron highlands": "PHG06",
  "tanah rata": "PHG06",
  brinchang: "PHG06",
  "genting highlands": "PHG06",
  ringlet: "PHG06",
  "kampung raja pahang": "PHG06",
  "fraser's hill": "PHG06",
  "bukit fraser": "PHG06",
  "pulau tioman": "PHG01",
  kuching: "SWK08",
  bau: "SWK08",
  lundu: "SWK08",
  sematan: "SWK08",
  padawan: "SWK08",
  "batu kawa": "SWK08",
  "matang sarawak": "SWK08",
  santubong: "SWK08",
  bako: "SWK08",
  siniawan: "SWK08",
  miri: "SWK02",
  marudi: "SWK02",
  bekenu: "SWK02",
  niah: "SWK02",
  sibuti: "SWK02",
  lutong: "SWK02",
  pujut: "SWK02",
  bakam: "SWK02",
  "long lama": "SWK02",
  beluru: "SWK02",
  sibu: "SWK04",
  kanowit: "SWK04",
  mukah: "SWK04",
  dalat: "SWK04",
  kapit: "SWK04",
  song: "SWK04",
  igan: "SWK04",
  oya: "SWK04",
  balingian: "SWK04",
  selangau: "SWK04",
  belaga: "SWK04",
  "sungai merah": "SWK04",
  bintulu: "SWK03",
  tatau: "SWK03",
  "belaga swk03": "SWK03",
  suai: "SWK03",
  sebauh: "SWK03",
  pandan: "SWK03",
  kemena: "SWK03",
  kidurong: "SWK03",
  samarahan: "SWK07",
  serian: "SWK07",
  simunjan: "SWK07",
  asanajaya: "SWK07",
  sebuyau: "SWK07",
  meludam: "SWK07",
  siburan: "SWK07",
  tebedu: "SWK07",
  "balai ringin": "SWK07",
  "sri aman": "SWK06",
  "lubok antu": "SWK06",
  betong: "SWK06",
  saratok: "SWK06",
  spaoh: "SWK06",
  lingga: "SWK06",
  engkilili: "SWK06",
  pusa: "SWK06",
  roban: "SWK06",
  debak: "SWK06",
  kabong: "SWK06",
  maludam: "SWK06",
  sarikei: "SWK05",
  bintangor: "SWK05",
  julau: "SWK05",
  daro: "SWK05",
  matu: "SWK05",
  "tanjung manis": "SWK05",
  belawai: "SWK05",
  rajang: "SWK05",
  meradong: "SWK05",
  pakan: "SWK05",
  limbang: "SWK01",
  lawas: "SWK01",
  sundar: "SWK01",
  trusan: "SWK01",
  "nanga medamit": "SWK01",
  merapok: "SWK01",
  "kota kinabalu": "SBH07",
  penampang: "SBH07",
  putatan: "SBH07",
  papar: "SBH07",
  tuaran: "SBH07",
  "kota belud": "SBH07",
  ranau: "SBH07",
  inanam: "SBH07",
  menggatal: "SBH07",
  telipok: "SBH07",
  tamparuli: "SBH07",
  kinarit: "SBH07",
  bongawan: "SBH07",
  donggongon: "SBH07",
  kepayan: "SBH07",
  likas: "SBH07",
  tangkarason: "SBH07",
  sandakan: "SBH01",
  beluran: "SBH01",
  kinabatangan: "SBH01",
  "bukit garam": "SBH01",
  semawang: "SBH01",
  temanggong: "SBH01",
  sukau: "SBH01",
  "batu sapi": "SBH01",
  "gum gum": "SBH01",
  telupid: "SBH02",
  tongod: "SBH02",
  pinangah: "SBH02",
  terusan: "SBH02",
  kuamut: "SBH02",
  bohayan: "SBH02",
  halogilat: "SBH02",
  paitan: "SBH02",
  tawau: "SBH03",
  "lahad datu": "SBH03",
  semporna: "SBH03",
  kunak: "SBH03",
  kalabakan: "SBH04",
  tambisan: "SBH03",
  sahabat: "SBH03",
  tungku: "SBH03",
  silabukan: "SBH03",
  balung: "SBH04",
  merotai: "SBH04",
  keningau: "SBH08",
  tambunan: "SBH08",
  nabawan: "SBH08",
  pensiangan: "SBH08",
  bingkor: "SBH08",
  tambaig: "SBH08",
  sokid: "SBH08",
  sook: "SBH08",
  tulid: "SBH08",
  tenom: "SBH09",
  beaufort: "SBH09",
  "kuala penyu": "SBH09",
  sipitang: "SBH09",
  "long pasia": "SBH09",
  membakut: "SBH09",
  weston: "SBH09",
  sindumin: "SBH09",
  lumadan: "SBH09",
  kemabong: "SBH09",
  melalap: "SBH09",
  kudat: "SBH05",
  "kota marudu": "SBH05",
  pitas: "SBH05",
  "pulau banggi": "SBH05",
  matunggong: "SBH05",
  sikuati: "SBH05",
  tandek: "SBH05",
  langkon: "SBH05",
  "gunung kinabalu": "SBH06",
};

export function ZoneSelector({
  selectedZone,
  onZoneSelect,
  isAutoDetecting,
  currentLocationName,
}: {
  selectedZone: string;
  onZoneSelect: (zone: string) => void;
  isAutoDetecting?: boolean;
  currentLocationName?: string | null;
}) {
  const { t, settings, updateSettings } = useAppContext();
  const visualStyle = useVisualStyle();
  const [isOpen, setIsOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [locationPermission, setLocationPermission] = useState<PermissionState | null>(null);

  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        setLocationPermission(result.state);
        result.onchange = () => {
          setLocationPermission(result.state);
        };
      }).catch(() => {});
    }
  }, []);

  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeScrollState, setActiveScrollState] = useState<string | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set focus on input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setSearchQuery(""); // clear search when closed
    }
  }, [isOpen]);

  const [detectReason, setDetectReason] = useState<string | null>(null);

  const handleAutoDetect = () => {
    if ("geolocation" in navigator) {
      setIsDetecting(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserCoords({ lat: latitude, lng: longitude });
          try {
            const res = await fetch(
              `/api/geocode?lat=${latitude}&lng=${longitude}`,
            );
            if (!res.ok) throw new Error("Failed to fetch geocode");

            let data;
            try {
              data = await res.json();
            } catch (e) {
              throw new Error("Invalid geocode JSON");
            }

            const cleanText = (text: string) => {
              return text
                .toLowerCase()
                .replace(
                  /\b(mukim|daerah|bandar|kampung|pekan|taman|parlimen|dun|kg|kg\.|kpg|kpg\.)\b/g,
                  "",
                )
                .replace(/[^a-z0-9 ]/g, " ")
                .replace(/\s+/g, " ")
                .trim();
            };

            const traverse = (obj: any): string[] => {
              let strings: string[] = [];
              if (typeof obj === "string") strings.push(obj.toLowerCase());
              else if (Array.isArray(obj))
                obj.forEach((item) => strings.push(...traverse(item)));
              else if (typeof obj === "object" && obj !== null) {
                Object.values(obj).forEach((item) =>
                  strings.push(...traverse(item)),
                );
              }
              return strings;
            };

            // Prioritized location extraction from OSM and BDC
            const extractPrioritizedLocations = (): string[] => {
              const locs: string[] = [];
              if (data.osm?.address) {
                const a = data.osm.address;
                if (a.village) locs.push(a.village);
                if (a.suburb) locs.push(a.suburb);
                if (a.city_district) locs.push(a.city_district);
                if (a.town) locs.push(a.town);
                if (a.city) locs.push(a.city);
                if (a.county) locs.push(a.county); // Sometimes county matches district
                if (a.state_district) locs.push(a.state_district);
              }
              if (data.bdc) {
                if (data.bdc.locality) locs.push(data.bdc.locality);
                if (data.bdc.city) locs.push(data.bdc.city);
              }
              return locs.map(cleanText).filter((s) => s.length > 2);
            };

            const prioritizedStrings = extractPrioritizedLocations();
            const allStringsRaw = traverse(data);
            const allStrings = allStringsRaw
              .map(cleanText)
              .filter((s) => s.length > 2);
            // Combine prioritized ones first, then all strings to give them priority
            const combinedStrings = [
              ...new Set([
                ...prioritizedStrings,
                ...allStringsRaw.filter((s) => s.length > 2),
                ...allStrings,
              ]),
            ];

            let foundZone = "WLY01"; // Default to KL
            let reasonFound = "Kuala Lumpur (Lalai)";

            let matched = false;

            // 1. Alias Match
            for (const str of combinedStrings) {
              if (ALIASES[str] && !matched) {
                foundZone = ALIASES[str];
                const displayName = str
                  .split(" ")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ");
                reasonFound = t("reasonMatchingArea").replace(
                  "{area}",
                  str
                    .split(" ")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" "),
                );
                matched = true;
                break;
              }
            }

            // 2. Exact Zone Name Match & Substring Match
            if (!matched) {
              // Try exact match on cleaned tokens first, then substring
              const matches: {
                zone: string;
                priority: number;
                display: string;
              }[] = [];

              for (const state of JAKIM_ZONES) {
                for (const z of state.zones) {
                  const parts = z.l
                    .toLowerCase()
                    .split(/[,()\/]/)
                    .map((p) => cleanText(p))
                    .filter(Boolean);
                  for (const part of parts) {
                    for (const str of combinedStrings) {
                      if (str === part) {
                        // Highest priority: exact match with prioritized string
                        const isPrioritized = prioritizedStrings.includes(str);
                        matches.push({
                          zone: z.v,
                          priority: isPrioritized ? 4 : 3,
                          display: part,
                        });
                      } else if (
                        (str.includes(` ${part} `) ||
                          str.startsWith(`${part} `) ||
                          str.endsWith(` ${part}`)) &&
                        part.length > 3
                      ) {
                        matches.push({ zone: z.v, priority: 2, display: part });
                      } else if (
                        (str.includes(part) || part.includes(str)) &&
                        str.length > 4 &&
                        part.length > 4
                      ) {
                        matches.push({ zone: z.v, priority: 1, display: part });
                      }
                    }
                  }
                }
              }

              if (matches.length > 0) {
                // sort by priority
                matches.sort((a, b) => b.priority - a.priority);
                foundZone = matches[0].zone;
                const displayName = matches[0].display
                  .split(" ")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ");
                reasonFound = t("reasonMatchingLocality").replace(
                  "{locality}",
                  displayName,
                );
                matched = true;
              }
            }

            // 3. Fallback to state
            if (!matched) {
              // combine both fallback names
              const stateName = (
                data.osm?.address?.state ||
                data.bdc?.principalSubdivision ||
                data.bdc?.city ||
                data.osm?.address?.city ||
                ""
              ).toLowerCase();
              if (stateName) {
                const s = stateName.toLowerCase();
                reasonFound = t("reasonStateCapital").replace(
                  "{state}",
                  stateName
                    .split(" ")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" "),
                );
                if (s.includes("johor")) foundZone = "JHR02";
                else if (s.includes("kedah")) foundZone = "KDH01";
                else if (s.includes("kelantan")) foundZone = "KTN01";
                else if (s.includes("melaka") || s.includes("malacca"))
                  foundZone = "MLK01";
                else if (s.includes("negeri sembilan")) foundZone = "NGS02";
                else if (s.includes("pahang")) foundZone = "PHG02";
                else if (s.includes("perak")) foundZone = "PRK02";
                else if (s.includes("perlis")) foundZone = "PLS01";
                else if (s.includes("pulau pinang") || s.includes("penang"))
                  foundZone = "PNG01";
                else if (s.includes("sabah")) foundZone = "SBH07";
                else if (s.includes("sarawak")) foundZone = "SWK08";
                else if (s.includes("selangor")) foundZone = "SGR01";
                else if (s.includes("terengganu")) foundZone = "TRG01";
                else if (
                  s.includes("kuala lumpur") ||
                  s.includes("putrajaya") ||
                  s.includes("federal territory")
                )
                  foundZone = "WLY01";
                else if (s.includes("labuan")) foundZone = "WLY02";
              }
            }

            onZoneSelect(foundZone);
            setDetectReason(reasonFound);
            setTimeout(() => setDetectReason(null), 5000);
            setIsOpen(false);
          } finally {
            setIsDetecting(false);
          }
        },
        () => {
          setIsDetecting(false);
          alert(t("failDetectLocation"));
        },
        { timeout: 5000 },
      );
    } else {
      alert(t("noSupportLocation"));
    }
  };

  // Find the label for the selected zone
  let selectedLabel = t("selectZone");
  let selectedState = "";
  for (const state of JAKIM_ZONES) {
    const zone = state.zones.find((z) => z.v === selectedZone);
    if (zone) {
      selectedLabel = zone.l;
      selectedState = state.state;
      break;
    }
  }

  const filteredZones = useMemo(() => {
    if (!searchQuery.trim()) return JAKIM_ZONES;

    const query = searchQuery.toLowerCase().trim();

    // Check if the query matches an alias
    const aliasZoneCode = ALIASES[query];

    return JAKIM_ZONES.map((state) => {
      const matchingZones = state.zones.filter(
        (zone) =>
          zone.l.toLowerCase().includes(query) ||
          zone.v.toLowerCase().includes(query) ||
          (aliasZoneCode && zone.v === aliasZoneCode),
      );
      return {
        ...state,
        zones: matchingZones,
      };
    }).filter((state) => state.zones.length > 0);
  }, [searchQuery]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;

    const stateSections = container.querySelectorAll('.state-group-marker');
    let closestState: string | null = null;
    let minDistance = Infinity;
    
    stateSections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      // Calculate distance from top of container
      const distance = Math.abs(rect.top - containerRect.top);
      // If it's near the top (e.g. within 300px)
      if (distance < minDistance && distance < 300) {
        minDistance = distance;
        closestState = section.getAttribute('data-state');
      }
    });

    if (closestState && closestState !== activeScrollState) {
      setActiveScrollState(closestState);
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setActiveScrollState(null);
    }, 800);
  };

  return (
    <>
      <AnimatePresence>
        {detectReason && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] max-w-[90vw] w-max bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] px-6 py-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--md-sys-color-primary)]/20 flex items-center gap-3 font-semibold text-sm"
          >
            <MapPin
              size={20}
              className="text-[var(--md-sys-color-primary)] animate-pulse"
            />
            <span className="truncate">{detectReason}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(true)}
          className={cn(
            "relative flex-1 max-w-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] hover:bg-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-on-primary)] rounded-[20px] sm:rounded-[24px] overflow-hidden transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between group shadow-sm border border-[var(--md-sys-color-outline)]/5",
            visualStyle === 'retro' && "border-2 border-[var(--md-sys-color-on-surface)] shadow-[4px_4px_0px_0px_var(--md-sys-color-on-surface)] hover:shadow-[2px_2px_0px_0px_var(--md-sys-color-on-surface)]",
            visualStyle === 'glass' && "bg-[var(--glass-bg)] backdrop-blur-[8px] border border-[var(--glass-border)]",
            visualStyle === 'soft' && "shadow-[var(--soft-shadow-light)] border-0"
          )}
        >
          {/* @ts-ignore */}
          <md-ripple></md-ripple>
          <div className="flex items-center w-full min-w-0">
            <div className="w-9 h-9 lg:w-11 lg:h-11 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-[10px] sm:rounded-[12px] flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-sm mr-3">
              <MapPin size={20} className={cn(
                "lg:w-6 lg:h-6",
                visualStyle === 'retro' && "stroke-[3]",
                (visualStyle === 'glass' || visualStyle === 'soft') && "stroke-[1.5]",
                !(visualStyle === 'retro' || visualStyle === 'glass' || visualStyle === 'soft') && "stroke-[2.5]"
              )} />
            </div>
            <div className="flex flex-col overflow-hidden min-w-0 flex-1 text-left justify-center">
              <span className="text-lg sm:text-xl lg:text-2xl leading-tight font-black tracking-tighter truncate w-full group-hover:text-[var(--md-sys-color-primary)] transition-colors">
                {selectedLabel}
              </span>
              <span className="text-[10px] sm:text-[11px] lg:text-xs font-bold tracking-wide flex items-center gap-1.5 truncate mt-0.5 opacity-80">
                {STATE_FLAGS[selectedState] && (
                  <div className="flex items-center justify-center w-[16px] h-[12px] sm:w-[18px] sm:h-[14px] bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.1)] shrink-0 rounded-[2px]">
                    <img
                      src={STATE_FLAGS[selectedState]}
                      alt=""
                      className="w-full h-full object-cover select-none pointer-events-none"
                    />
                  </div>
                )}
                <span className="truncate">{selectedState}</span>
                <span className="font-mono font-black ml-auto flex-shrink-0 opacity-70">
                  {selectedZone}
                </span>
              </span>
            </div>
          </div>
        </motion.button>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="shrink-0 inline-flex w-[48px] h-[48px] lg:w-[56px] lg:h-[56px]"
        >
          {/* @ts-ignore */}
          <md-filled-tonal-icon-button
            onClick={() => setIsMapOpen(true)}
            title={t("viewMap")}
            style={{ '--md-filled-tonal-icon-button-container-shape': '20px', width: '100%', height: '100%' }}
          >
            <MapIcon className={cn(
              "w-[22px] h-[22px] lg:w-[24px] lg:h-[24px]",
              visualStyle === 'retro' && "stroke-[3]",
              (visualStyle === 'glass' || visualStyle === 'soft') && "stroke-[1.5]",
              !(visualStyle === 'retro' || visualStyle === 'glass' || visualStyle === 'soft') && "stroke-[2.5]"
            )} />
          </md-filled-tonal-icon-button>
        </motion.div>
      </div>

      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        selectedZone={selectedZone}
        userLocation={userCoords}
        onZoneSelect={(zone) => {
          onZoneSelect(zone);
          setIsMapOpen(false);
        }}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 sm:overflow-y-auto"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: "100%" }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: "100%" }}
              transition={M3_MOTION.expressiveSpring}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--md-sys-color-surface)] w-full max-w-2xl h-[85vh] sm:h-[85vh] max-h-[800px] flex flex-col rounded-[var(--md-sys-shape-corner-extra-large)] overflow-hidden shadow-2xl sm:my-auto"
            >
              <div className="p-6 md:p-8 bg-[var(--md-sys-color-surface)] z-10 shrink-0 border-b border-[var(--md-sys-color-outline)]/5 flex flex-col gap-6">
                <div className="flex items-start justify-between">
                  <div className="pr-4">
                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--md-sys-color-primary)] leading-none mb-2">
                      {t("selectZone")}
                    </h2>
                    <p className="text-[var(--md-sys-color-on-surface-variant)] text-base font-medium opacity-80">
                      {t("selectZoneDesc")}
                    </p>
                  </div>
                  {/* @ts-ignore */}
                  <md-icon-button onClick={() => setIsOpen(false)}>
                    <md-icon>close</md-icon>
                  </md-icon-button>
                </div>

                <div className="mb-2 w-full bg-[var(--md-sys-color-surface-container)] rounded-[20px] overflow-hidden">
                  {/* @ts-ignore */}
                  <md-tabs active-tab-index={settings.locationMode === 'auto' ? 1 : 0}>
                    {/* @ts-ignore */}
                    <md-primary-tab onClick={() => updateSettings({ locationMode: 'manual' })}>
                      {t('modeManual' as any) || "Manual Selection"}
                      <md-icon slot="icon">search</md-icon>
                    </md-primary-tab>
                    {/* @ts-ignore */}
                    <md-primary-tab onClick={() => {
                      updateSettings({ locationMode: 'auto' });
                      setSearchQuery("");
                    }}>
                      {t('modeAuto' as any) || "Auto Tracking"}
                      <md-icon slot="icon">my_location</md-icon>
                    </md-primary-tab>
                  </md-tabs>
                </div>

                <AnimatePresence mode="wait">
                  {locationPermission === 'denied' && (
                    <motion.div
                      initial={{ opacity: 0, scaleY: 0.95, y: -10 }}
                      animate={{ opacity: 1, scaleY: 1, y: 0 }}
                      exit={{ opacity: 0, scaleY: 0.95, y: -10 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      style={{ transformOrigin: "top" }}
                      className="bg-[var(--md-sys-color-error-container)]/80 text-[var(--md-sys-color-on-error-container)] px-5 py-4 rounded-2xl mb-2 text-sm shadow-sm"
                    >
                      <h4 className="font-bold mb-1">Akses Lokasi Ditolak</h4>
                      <p className="opacity-90 leading-tight">Sila benarkan akses lokasi dalam tetapan pelayar web anda untuk menggunakan ciri kemas kini zon automatik.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {settings.locationMode !== 'auto' && (
                    <motion.div 
                      key="manual-mode"
                      initial={{ opacity: 0, scaleY: 0.95, y: -10 }}
                      animate={{ opacity: 1, scaleY: 1, y: 0 }}
                      exit={{ opacity: 0, scaleY: 0.95, y: -10 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      style={{ transformOrigin: "top", willChange: "transform, opacity" }}
                      className="flex flex-col gap-4"
                    >
                      <div className="relative group w-full mb-2">
                        {/* @ts-ignore */}
                        <md-filled-text-field
                          type="text"
                          placeholder={t("searchPlaceholder")}
                          value={searchQuery}
                          onInput={(e: any) => setSearchQuery(e.target.value)}
                          className="w-full"
                          style={{ 
                            '--md-filled-text-field-container-shape': '28px',
                            '--md-filled-text-field-active-indicator-height': '0px',
                            '--md-filled-text-field-hover-active-indicator-height': '0px',
                            '--md-filled-text-field-focus-active-indicator-height': '0px',
                            '--md-sys-color-surface-variant': 'var(--md-sys-color-surface-container-high)'
                          } as any}
                        >
                          <md-icon slot="leading-icon">search</md-icon>
                          {searchQuery && (
                            /* @ts-ignore */
                            <md-icon-button
                              slot="trailing-icon"
                              onClick={() => setSearchQuery("")}
                            >
                              <md-icon>close</md-icon>
                            </md-icon-button>
                          )}
                        </md-filled-text-field>
                      </div>

                      {!searchQuery && (
                        <md-filled-tonal-button
                          onClick={handleAutoDetect}
                          disabled={isDetecting}
                          className="w-full"
                          style={{ '--md-filled-tonal-button-container-height': '48px', '--md-filled-tonal-button-container-shape': '24px' } as any}
                        >
                          <Crosshair
                            size={20}
                            slot="icon"
                            className={isDetecting ? "animate-spin" : ""}
                          />
                          {isDetecting ? t("detecting") : t("detectLocation")}
                        </md-filled-tonal-button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div 
                className="flex-1 overflow-y-auto bg-[var(--md-sys-color-surface)] scroll-smooth custom-scrollbar relative"
                onScroll={handleScroll}
                onTouchMove={() => {
                  if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }
                }}
              >
                {settings.locationMode === 'auto' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center h-full p-6 text-center"
                  >
                    <div className="w-16 h-16 bg-[var(--md-sys-color-secondary-container)] rounded-full flex items-center justify-center mb-4 text-[var(--md-sys-color-on-secondary-container)]">
                      <Crosshair size={28} className={cn("opacity-80", isAutoDetecting && "animate-spin")} />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] mb-1">
                      {isAutoDetecting ? t("detecting") : (t('autoModeActive' as any) || "Auto Mode Active")}
                    </h3>
                    <p className="text-[var(--md-sys-color-on-surface-variant)] text-sm max-w-[250px] mx-auto mb-8 opacity-80">
                      {isAutoDetecting ? "Memeriksa isyarat GPS..." : (t('autoModeActiveDesc' as any) || "Your zone will update automatically as you travel.")}
                    </p>
                    
                    <div className="bg-[var(--md-sys-color-surface-container)] rounded-[24px] p-5 w-full max-w-xs border border-[var(--md-sys-color-outline)]/5 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--md-sys-color-primary)] mb-1.5 opacity-80">
                        {t('autoModeCurrent' as any) || "Current Detected Location:"}
                      </p>
                      <p className="text-xl font-black leading-tight text-[var(--md-sys-color-on-surface)] mb-1 truncate">
                        {isAutoDetecting ? "Sedang menjejak..." : (currentLocationName || selectedLabel)}
                      </p>
                      <div className="inline-flex bg-[var(--md-sys-color-surface-variant)]/50 px-2 py-0.5 rounded text-xs font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] mt-1">
                        {selectedZone}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {/* Recent Zones Section */}
                    {!searchQuery && (() => {
                      try {
                        const recent = JSON.parse(localStorage.getItem("waktu-solat-recent-zones") || "[]");
                        // Filter out the currently selected zone and limit to 3
                        const filtered = Array.isArray(recent) 
                          ? recent.filter((z: string) => z !== selectedZone).slice(0, 3) 
                          : [];
                        if (filtered.length > 0) {
                          return (
                            <div className="px-6 md:px-8 pt-6 pb-2">
                              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--md-sys-color-on-surface-variant)] mb-4 flex items-center gap-2">
                                <span className="opacity-60">🕐</span>
                                {t('recentLocations' as any) || "Recent Locations"}
                              </h3>
                              {/* @ts-ignore */}
                              <md-list className="bg-transparent overflow-visible flex flex-col gap-2 p-0">
                                {filtered.map((code: string) => {
                                  let label = code;
                                  let stateName = "";
                                  for (const state of JAKIM_ZONES) {
                                    const found = state.zones.find(z => z.v === code);
                                    if (found) { label = found.l; stateName = state.state; break; }
                                  }
                                  return (
                                    /* @ts-ignore */
                                    <md-list-item
                                      key={`recent-${code}`}
                                      type="button"
                                      onClick={() => {
                                        onZoneSelect(code);
                                        setIsOpen(false);
                                      }}
                                      className="bg-[var(--md-sys-color-surface-container)] rounded-2xl overflow-hidden shadow-sm border border-[var(--md-sys-color-outline)]/5"
                                    >
                                      {STATE_FLAGS[stateName] && (
                                        <div slot="start" className="w-[32px] h-[20px] bg-white overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.1)] shrink-0 rounded-[2px] mr-2">
                                          <img
                                            src={STATE_FLAGS[stateName]}
                                            alt=""
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      )}
                                      <div slot="headline" className="font-bold text-sm text-[var(--md-sys-color-on-surface)] truncate">{label}</div>
                                      <div slot="supporting-text" className="text-[10px] opacity-80 truncate">{stateName}</div>
                                      <div slot="end" className="text-[11px] font-mono font-black tracking-wider bg-[var(--md-sys-color-surface-variant)]/50 px-2 py-0.5 rounded-md text-[var(--md-sys-color-on-surface-variant)] shrink-0 opacity-70">
                                        {code}
                                      </div>
                                    </md-list-item>
                                  );
                                })}
                              </md-list>
                            </div>
                          );
                        }
                      } catch(e) {}
                      return null;
                    })()}

                    {/* Active Scroll Indicator & List */}
                <AnimatePresence>
                  {activeScrollState && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: -20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 20 }}
                      className="fixed top-[40%] left-1/2 -translate-x-1/2 z-[300] pointer-events-none bg-[var(--md-sys-color-surface-container-highest)]/90 backdrop-blur-2xl p-6 rounded-[32px] shadow-[0_16px_32px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center gap-3 border border-white/10"
                    >
                      {STATE_FLAGS[activeScrollState] && (
                        <div className="w-[72px] h-[48px] bg-white rounded-lg overflow-hidden shadow-sm">
                           <img src={STATE_FLAGS[activeScrollState]} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <h3 className="text-xl md:text-2xl font-black text-[var(--md-sys-color-on-surface)] uppercase tracking-widest leading-none">
                        {activeScrollState}
                      </h3>
                    </motion.div>
                  )}
                </AnimatePresence>

                {filteredZones.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex flex-col items-center justify-center opacity-70 space-y-4 p-4 md:p-6"
                  >
                    <div className="w-16 h-16 rounded-full bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center">
                      <Search
                        size={32}
                        className="text-[var(--md-sys-color-on-surface-variant)]"
                      />
                    </div>
                    <p className="text-[var(--md-sys-color-on-surface-variant)] font-medium text-lg">
                      {t("noMatch")} "{searchQuery}"
                    </p>
                  </motion.div>
                ) : (
                  <div className="pb-12">
                    {filteredZones.map((state) => (
                      <div key={state.state} className="mb-8 state-group-marker" data-state={state.state}>
                        <div className="flex items-center gap-3 sm:gap-4 sticky top-0 md:top-0 z-20 bg-[var(--md-sys-color-surface)]/80 backdrop-blur-xl py-3 px-4 md:px-6 shadow-sm border-b border-[var(--md-sys-color-outline)]/10">
                          <div className="flex items-center justify-center w-[22px] h-[14px] sm:w-[28px] sm:h-[18px] bg-white overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.1)] shrink-0 rounded-[1px]">
                            {STATE_FLAGS[state.state] ? (
                              <img
                                src={STATE_FLAGS[state.state]}
                                alt={`Bendera ${state.state}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <MapPin size={16} className="text-gray-400" />
                            )}
                          </div>
                          <h3 className="text-[var(--md-sys-color-primary)] font-black uppercase tracking-widest text-sm sm:text-base pr-2 inline-block">
                            {state.state}
                          </h3>
                          {/* @ts-ignore */}
                          <md-divider className="flex-1"></md-divider>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 px-4 md:px-6 pt-3">
                          {state.zones.map((zone) => {
                            const isSelected = selectedZone === zone.v;
                            return (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                key={zone.v}
                                onClick={() => {
                                  onZoneSelect(zone.v);
                                  setIsOpen(false);
                                }}
                                className={cn(
                                  "relative overflow-hidden group text-left px-6 py-6 min-h-[120px] rounded-[32px] transition-all duration-300 flex flex-col focus:outline-none focus:ring-[3px] focus:ring-[var(--md-sys-color-primary)]",
                                  isSelected
                                    ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-[0_8px_16px_-6px_rgba(0,0,0,0.2)] scale-[1.02]"
                                    : "bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] hover:shadow-md",
                                )}
                              >
                                {/* @ts-ignore */}
                                <md-ripple></md-ripple>
                                
                                {/* Watermark Background */}
                                <div className={cn(
                                  "absolute -right-2 -bottom-4 text-[5rem] font-black pointer-events-none transition-all duration-500 group-hover:scale-110",
                                  isSelected ? "opacity-[0.15] text-[var(--md-sys-color-on-primary)]" : "opacity-[0.03] text-[var(--md-sys-color-on-surface)]"
                                )}>
                                  {zone.v}
                                </div>

                                <div className="flex items-start justify-between w-full relative z-10 flex-1">
                                  <span
                                    className={cn(
                                      "text-lg sm:text-xl font-bold leading-tight line-clamp-3 pr-2 transition-colors",
                                      isSelected
                                        ? "text-[var(--md-sys-color-on-primary)]"
                                        : "text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)]",
                                    )}
                                  >
                                    {zone.l}
                                  </span>
                                  {isSelected && (
                                    <CheckCircle2
                                      size={28}
                                      className="text-[var(--md-sys-color-on-primary)] shrink-0 opacity-90"
                                      strokeWidth={2.5}
                                    />
                                  )}
                                </div>
                                <span
                                  className={cn(
                                    "text-[13px] font-black tracking-widest px-3 py-1 rounded-full inline-flex self-start mt-4 transition-colors relative z-10",
                                    isSelected
                                      ? "bg-white/20 text-[var(--md-sys-color-on-primary)]"
                                      : "bg-[var(--md-sys-color-surface-variant)]/50 text-[var(--md-sys-color-on-surface-variant)]",
                                  )}
                                >
                                  {zone.v}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </>
              )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
