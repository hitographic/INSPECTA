export const PLANTS = {
  'Plant-1': Array.from({length: 8}, (_, i) => i + 1),
  'Plant-2': Array.from({length: 15}, (_, i) => i + 16),
  'Plant-3': Array.from({length: 3}, (_, i) => i + 31)
};

export const AREAS = [
  'Silo',
  'Mixer',
  'Roll Press',
  'Steambox',
  'Cutter dan Folder',
  'Fryer',
  'Cooling Box',
  'Packing'
];

export const BAGIAN_BY_AREA: { [key: string]: string[] } = {
  'Silo': [
    'Sievter Silo',
    'Pembersihan selongsong sieveter silo'
  ],
  'Mixer': [
    'Bagian dalam mixer',
    'Baling - Baling mixer dan pipa distribusi alkali',
    'Bagian dalam corong mixer dan flexible hose',
    'Motor penggerak mixer bagian depan',
    'Motor penggerak mixer bagian belakang',
    'Weighing Tank Alkali'
  ],
  'Roll Press': [
    'Feeder doughsheet',
    'Chute feeder',
    'Roll press ganda',
    'Belt kotak cangkulan press',
    'Scrapper roll ganda',
    'Conveyor/ban Chord doughsheet',
    'Kolong bagian bawah press',
    'Roll press continous',
    'Slitter',
    'Waving net',
    'Mesin press keseluruhan'
  ],
  'Steambox': [
    'Net steambox',
    'Bagian dalam steambox',
    'Bodi steambox keseluruhan',
    'Lantai bawah steambox'
  ],
  'Cutter dan Folder': [
    'Cutter',
    'Palet/net distributor',
    'Bagian bawah roll cutter folder'
  ],
  'Fryer': [
    'Mangkok fryer',
    'Bagian dalam kuali fryer',
    'Strainer',
    'Talang out fryer'
  ],
  'Cooling Box': [
    'Plat perforasi / net cooling',
    'Cover bagian bawah cooling',
    'Filter Cooling',
    'Exhaust cooling',
    'Body cooling keseluruhan'
  ],
  'Packing': [
    'Conveyor pembagi / chanilizer out cooling',
    'Talang penampung conveyor chanelizer',
    'Bak penampung mie',
    'Anting-anting',
    'Autoloader',
    'Meja infeed packing',
    'Infeed packing',
    'Mesin packing'
  ]
};

export const KETERANGAN_TEMPLATES: { [key: string]: string } = {
  // Silo
  'Sievter Silo': 'Pembersihan sievter dari sisa tepung terigu',
  'Pembersihan selongsong sieveter silo': 'Pembersihan selongsong sievter dari sisa tepung terigu',

  // Mixer
  'Bagian dalam mixer': 'Wet cleaning menggunakan Vosen Divertig',
  'Baling - Baling mixer dan pipa distribusi alkali': 'Wet cleaning menggunakan Vosen Divertig',
  'Bagian dalam corong mixer dan flexible hose': 'Pembersihan flexible hoose dari sisa tepung terigu',
  'Motor penggerak mixer bagian depan': 'Pembersihan motor penggerak bagian depan mixer',
  'Motor penggerak mixer bagian belakang': 'Pembersihan motor penggerak bagian belakang mixer',
  'Weighing Tank Alkali': 'Pembersihan weighting tank alkali dari sisa alkali',

  // Roll Press
  'Feeder doughsheet': 'Pembersihan feeder doughsheet dari sisa adonan',
  'Chute feeder': 'Pembersihan chute feeder dari sisa adonan',
  'Roll press ganda': 'Pembersihan roll press ganda dari sisa adonan',
  'Belt kotak cangkulan press': 'Pembersihan belt cangkulan press dari sisa adonan',
  'Scrapper roll ganda': 'Pembersihan scrapper roll ganda dari sisa adonan',
  'Conveyor/ban Chord doughsheet': 'Pembersihan conveyor penghantar adonan roll press dari sisa adonan',
  'Kolong bagian bawah press': 'Pembersihan bagian bawah roll press d',
  'Roll press continous': 'Pembersihan roll press continues dari sisa adonan',
  'Slitter': 'Pembersihan slitter dari sisa adonan',
  'Waving net': 'Pembersihan waving net dari sisa adonan',
  'Mesin press keseluruhan': 'Pembersihan bodi luar dan dalam roll press mixer',

  // Steambox
  'Net steambox': 'Pembersihan net steambox dari sisa untaian mie',
  'Bagian dalam steambox': 'Pembersihan bagian dalam steambox dari sisa untaian mie',
  'Bodi steambox keseluruhan': 'Pembersihan bodi luar steambox',
  'Lantai bawah steambox': 'Pembersihan lantai bawah steambox',

  // Cutter Folder
  'Cutter': 'Pembersihan cutter dan folder dari sisa untaian mie',
  'Palet/net distributor': 'Pembersihan net distributor dari sisa untaian mie',
  'Bagian bawah roll cutter folder': 'Pembersihan bagian bawah cutter dan folder',

  // Fryer
  'Mangkok fryer': 'Pembersihan mangkok fryer dari sisa mie HH/HP',
  'Bagian dalam kuali fryer': 'Pembersihan kuali fryer dari sisa mie HH/HP',
  'Strainer': 'Pembersihan strainer dari sisa mie HH/HP',
  'Talang out fryer': 'Pembersihan talang out fryer dari sisa mie HH/HP',

  // Cooling Box
  'Plat perforasi / net cooling': 'Pembersihan plat perforasi cooling bagian atas dan bawah dari sisa mie HH/HP',
  'Cover bagian bawah cooling': 'Pembersihan bagian bawah coolingdari sisa mie HH/HP',
  'Filter Cooling': 'Pembersihan dan pencucian filter cooling',
  'Exhaust cooling': 'Pembersihan exhaust cooling',
  'Body cooling keseluruhan': 'Pembersihan bodi luar dan dalam cooling',

  // Packing
  'Conveyor pembagi / chanilizer out cooling': 'Pembersihan channelizer',
  'Talang penampung conveyor chanelizer': 'Pembersihan talang penampung mie ex-channelizer',
  'Bak penampung mie': 'Pembersihan bak penampung mie di area packing',
  'Anting-anting': 'Pembersihan dan pencucian anting-anting',
  'Autoloader': 'Pembersihan autoloader :\n- chute autoloader\n- pusher lug conveyor\n- bodi autoloader',
  'Meja infeed packing': 'Pembersihan meja panampung seasoning',
  'Infeed packing': 'Pembersihan area infeed packing',
  'Mesin packing': 'Pembersihan mesin packing secara menyeluruh\n- talang penampung bagian bawah mesin\n- bodi mesin packing\n- heater longsealer dan endsealer'
};