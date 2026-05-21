export type MalaysiaZone = {
  v: string;
  l: string; // Used as label
};

export type StateZones = {
  state: string;
  zones: MalaysiaZone[];
};

export const JAKIM_ZONES: StateZones[] = [
  {
    state: "Johor",
    zones: [
      { v: "JHR01", l: "Pulau Aur dan Pulau Pemanggil" },
      { v: "JHR02", l: "Johor Bahru, Kota Tinggi, Mersing, Kulai" },
      { v: "JHR03", l: "Kluang, Pontian" },
      { v: "JHR04", l: "Batu Pahat, Muar, Segamat, Gemas Johor, Tangkak" }
    ]
  },
  {
    state: "Kedah",
    zones: [
      { v: "KDH01", l: "Kota Setar, Kubang Pasu, Pokok Sena (Daerah Kecil)" },
      { v: "KDH02", l: "Kuala Muda, Yan, Pendang" },
      { v: "KDH03", l: "Padang Terap, Sik" },
      { v: "KDH04", l: "Baling" },
      { v: "KDH05", l: "Bandar Baharu, Kulim" },
      { v: "KDH06", l: "Langkawi" },
      { v: "KDH07", l: "Puncak Gunung Jerai" }
    ]
  },
  {
    state: "Kelantan",
    zones: [
      { v: "KTN01", l: "Bachok, Kota Bharu, Machang, Pasir Mas, Pasir Puteh, Tanah Merah, Tumpat, Kuala Krai, Mukim Chiku" },
      { v: "KTN02", l: "Gua Musang (Daerah Galas Dan Bertam), Jeli, Jajahan Kecil Lojing" }
    ]
  },
  {
    state: "Melaka",
    zones: [
      { v: "MLK01", l: "Seluruh Negeri Melaka" }
    ]
  },
  {
    state: "Negeri Sembilan",
    zones: [
      { v: "NGS01", l: "Tampin, Jempol" },
      { v: "NGS02", l: "Jelebu, Kuala Pilah, Rembau" },
      { v: "NGS03", l: "Port Dickson, Seremban" }
    ]
  },
  {
    state: "Pahang",
    zones: [
      { v: "PHG01", l: "Pulau Tioman" },
      { v: "PHG02", l: "Kuantan, Pekan, Rompin, Muadzam Shah" },
      { v: "PHG03", l: "Jerantut, Temerloh, Maran, Bera, Chenor, Jengka" },
      { v: "PHG04", l: "Bentong, Lipis, Raub" },
      { v: "PHG05", l: "Genting Sempah, Janda Baik, Bukit Tinggi" },
      { v: "PHG06", l: "Cameron Highlands, Genting Highlands, Bukit Fraser" }
    ]
  },
  {
    state: "Perak",
    zones: [
      { v: "PRK01", l: "Tapah, Slim River, Tanjung Malim" },
      { v: "PRK02", l: "Kuala Kangsar, Sg. Siput, Ipoh, Batu Gajah, Kampar" },
      { v: "PRK03", l: "Lenggong, Pengkalan Hulu, Grik" },
      { v: "PRK04", l: "Temengor, Belum" },
      { v: "PRK05", l: "Kg Gajah, Teluk Intan, Bagan Datuk, Seri Iskandar, Beruas, Parit, Lumut, Sitiawan, Pulau Pangkor" },
      { v: "PRK06", l: "Selama, Taiping, Bagan Serai, Parit Buntar" },
      { v: "PRK07", l: "Bukit Larut" }
    ]
  },
  {
    state: "Perlis",
    zones: [
      { v: "PLS01", l: "Seluruh Negeri Perlis" }
    ]
  },
  {
    state: "Pulau Pinang",
    zones: [
      { v: "PNG01", l: "Seluruh Negeri Pulau Pinang" }
    ]
  },
  {
    state: "Sabah",
    zones: [
      { v: "SBH01", l: "Bahagian Sandakan (Timur), Bukit Garam, Semawang, Temanggong, Tambisan, Bandar Sandakan, Beluran" },
      { v: "SBH02", l: "Beluran, Telupid, Pinangah, Terusan, Kuamut, Bahagian Sandakan (Barat)" },
      { v: "SBH03", l: "Lahad Datu, Silabukan, Tungku, Sahabat, Semporna, Tawau" },
      { v: "SBH04", l: "Bandar Tawau, Balong, Merotai, Kalabakan" },
      { v: "SBH05", l: "Kudat, Kota Marudu, Pitas, Pulau Banggi" },
      { v: "SBH06", l: "Gunung Kinabalu" },
      { v: "SBH07", l: "Kota Kinabalu, Ranau, Kota Belud, Tuaran, Penampang, Papar, Putatan" },
      { v: "SBH08", l: "Pensiangan, Keningau, Tambunan, Nabawan" },
      { v: "SBH09", l: "Beaufort, Kuala Penyu, Sipitang, Tenom, Long Pa Shia" }
    ]
  },
  {
    state: "Sarawak",
    zones: [
      { v: "SWK01", l: "Limbang, Lawas, Sundar, Trusan" },
      { v: "SWK02", l: "Miri, Niah, Bekenu, Sibuti, Marudi" },
      { v: "SWK03", l: "Pandan, Belaga, Suai, Kurubong, Batu Niah, Bintulu" },
      { v: "SWK04", l: "Sibu, Mukah, Dalat, Song, Igan, Oya, Balingian, Kanowit, Kapit" },
      { v: "SWK05", l: "Sarikei, Matu, Julau, Rajang, Daro, Bintangor, Belawai" },
      { v: "SWK06", l: "Lubok Antu, Sri Aman, Roban, Debak, Kabong, Lingga, Engkilili, Betong, Spaoh, Pusa, Saratok, Romang, Ulu Sebuyau" },
      { v: "SWK07", l: "Serian, Simunjan, Samarahan, Sebuyau, Meludam" },
      { v: "SWK08", l: "Kuching, Bau, Lundu, Sematan" },
      { v: "SWK09", l: "Zon Khas (Kampung Pichin, Kampung Tesu)" }
    ]
  },
  {
    state: "Selangor",
    zones: [
      { v: "SGR01", l: "Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, S.Alam" },
      { v: "SGR02", l: "Kuala Selangor, Sabak Bernam" },
      { v: "SGR03", l: "Klang, Kuala Langat" }
    ]
  },
  {
    state: "Terengganu",
    zones: [
      { v: "TRG01", l: "Kuala Terengganu, Marang, Kuala Nerus" },
      { v: "TRG02", l: "Besut, Setiu" },
      { v: "TRG03", l: "Hulu Terengganu" },
      { v: "TRG04", l: "Dungun, Kemaman" }
    ]
  },
  {
    state: "Wilayah Persekutuan",
    zones: [
      { v: "WLY01", l: "Kuala Lumpur, Putrajaya" },
      { v: "WLY02", l: "Labuan" }
    ]
  }
];
