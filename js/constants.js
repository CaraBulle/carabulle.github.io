// ==================== CONSTANTES ====================
const GAME_START_DATE = new Date(2026, 0, 1, 0, 0, 0);
const REAL_TO_GAME_RATIO = 60;
const BASE_CYCLE_GAME_MINUTES = 5;
const MACHINE_MAX_USAGE = 100;
const MACHINE_BREAKDOWN_THRESHOLD = 60;
const MACHINE_USAGE_PER_PRODUCT = 2;
const CLEANER_MACHINES_OPTIMAL = 3;
const CLEANER_BREAKDOWN_REDUCTION = 0.10;
const REPAIR_TIME_REAL = 120000;
const TRAINING_DURATION_GAME_DAYS = 30;

const UTILITIES_DEF = [
  {id:'elec', name:'Électricité', icon:'⚡', unit:'kWh', basePricePerUnit:0.14},
  {id:'gaz', name:'Gaz naturel', icon:'🔥', unit:'kWh', basePricePerUnit:0.062},
  {id:'eau', name:'Eau', icon:'💧', unit:'m³', basePricePerUnit:3.50},
  {id:'diesel', name:'Diesel', icon:'🛢️', unit:'L', basePricePerUnit:1.25}
];

const TAX_RATE = 0.2;
const TAX_PAYMENT_INTERVAL_REAL = 120000;
const LOAN_PAYMENT_INTERVAL_REAL = 1440000;
const VACATION_DAYS_PER_6MONTHS = 14;
const SIX_MONTHS_GAME_DAYS = 180;

const MALE_FIRST_NAMES = ['Jean','Pierre','Thomas','Nicolas','David','Lucas','Mathieu','Antoine','Alexandre','Guillaume','Paul','Jacques','Michel','André','Philippe','Laurent','Olivier','Pascal','Frédéric','Sébastien'];
const FEMALE_FIRST_NAMES = ['Marie','Sophie','Laura','Julie','Emma','Chloé','Léa','Camille','Sarah','Pauline','Isabelle','Nathalie','Valérie','Céline','Émilie','Audrey','Marion','Claire','Anne','Hélène'];
const LAST_NAMES = ['Martin','Bernard','Dubois','Thomas','Robert','Richard','Petit','Durand','Leroy','Moreau','Simon','Laurent','Lefebvre','Michel','Garcia','David','Bertrand','Roux','Vincent','Fournier'];

const JOB_TYPES = {
  NONE: 'Aucun',
  MAINTENANCE: 'Agent de maintenance',
  CLEANER: 'Agent d\'entretien',
  LINE_MANAGER: 'Manager de ligne',
  SITE_MANAGER: 'Manager de site',
  HANDLER: 'Manutentionnaire'
};

const MATERIALS = [
  {name:'Acier',icon:'⚙️',base:80},{name:'Aluminium',icon:'🔩',base:55},{name:'Bois',icon:'🌲',base:30},
  {name:'Caoutchouc',icon:'⬛',base:35},{name:'Coton',icon:'🌿',base:25},{name:'Cuivre',icon:'🪙',base:95},
  {name:'Céramique',icon:'🏺',base:45},{name:'Graphène',icon:'🔬',base:250},{name:'Lithium',icon:'⚡',base:180},
  {name:'Plastique',icon:'🧪',base:40},{name:'Pétrole',icon:'🛢️',base:70},{name:'Résine époxy',icon:'🧴',base:60},
  {name:'Silicium',icon:'💎',base:120},{name:'Titane',icon:'🪝',base:160},{name:'Verre',icon:'🔮',base:50}
];

const MAT_MAP = {};
MATERIALS.forEach(m => MAT_MAP[m.name] = m);

const PRODUCTS_DEF = [
  {name:'Planche de bois',complexity:1,mats:[{name:'Bois',qty:3}],reqM:1,reqE:1,price:45,demand:25},
  {name:'Tissu en coton',complexity:1,mats:[{name:'Coton',qty:4}],reqM:1,reqE:1,price:35,demand:28},
  {name:'Feuille plastique',complexity:1,mats:[{name:'Plastique',qty:3},{name:'Pétrole',qty:1}],reqM:1,reqE:2,price:60,demand:22},
  {name:'Ressort acier',complexity:2,mats:[{name:'Acier',qty:2}],reqM:1,reqE:2,price:70,demand:20},
  {name:'Tuyau PVC',complexity:2,mats:[{name:'Plastique',qty:4},{name:'Pétrole',qty:1}],reqM:1,reqE:2,price:85,demand:18},
  {name:'Brique céramique',complexity:2,mats:[{name:'Céramique',qty:5}],reqM:2,reqE:2,price:95,demand:15},
  {name:'Roulement à billes',complexity:3,mats:[{name:'Acier',qty:4},{name:'Titane',qty:1}],reqM:2,reqE:3,price:180,demand:14},
  {name:'Joint torique',complexity:3,mats:[{name:'Caoutchouc',qty:3},{name:'Plastique',qty:1}],reqM:1,reqE:2,price:65,demand:20},
  {name:'Vitre trempée',complexity:3,mats:[{name:'Verre',qty:5},{name:'Céramique',qty:1}],reqM:2,reqE:3,price:130,demand:12},
  {name:'Engrenage précision',complexity:3,mats:[{name:'Acier',qty:3},{name:'Titane',qty:1},{name:'Résine époxy',qty:1}],reqM:2,reqE:3,price:220,demand:10},
  {name:'Moteur électrique',complexity:4,mats:[{name:'Cuivre',qty:6},{name:'Acier',qty:4},{name:'Plastique',qty:2}],reqM:3,reqE:4,price:350,demand:10},
  {name:'Panneau solaire',complexity:4,mats:[{name:'Silicium',qty:5},{name:'Verre',qty:3},{name:'Aluminium',qty:3}],reqM:3,reqE:5,price:480,demand:8},
  {name:'Capteur infrarouge',complexity:4,mats:[{name:'Silicium',qty:3},{name:'Plastique',qty:2},{name:'Cuivre',qty:2}],reqM:2,reqE:4,price:290,demand:12},
  {name:'Boîtier aluminium',complexity:4,mats:[{name:'Aluminium',qty:6},{name:'Plastique',qty:1},{name:'Caoutchouc',qty:1}],reqM:2,reqE:3,price:160,demand:14},
  {name:'Valve industrielle',complexity:5,mats:[{name:'Acier',qty:5},{name:'Titane',qty:2},{name:'Caoutchouc',qty:3},{name:'Résine époxy',qty:1}],reqM:3,reqE:5,price:420,demand:8},
  {name:'Pompe à chaleur',complexity:5,mats:[{name:'Cuivre',qty:5},{name:'Aluminium',qty:4},{name:'Plastique',qty:3},{name:'Acier',qty:3}],reqM:4,reqE:6,price:550,demand:7},
  {name:'Câble fibre optique',complexity:5,mats:[{name:'Verre',qty:4},{name:'Plastique',qty:3},{name:'Silicium',qty:2}],reqM:3,reqE:4,price:310,demand:10},
  {name:'Condensateur HT',complexity:5,mats:[{name:'Cuivre',qty:4},{name:'Céramique',qty:3},{name:'Aluminium',qty:3},{name:'Résine époxy',qty:1}],reqM:3,reqE:5,price:380,demand:9},
  {name:'Circuit intégré',complexity:6,mats:[{name:'Silicium',qty:6},{name:'Cuivre',qty:3},{name:'Plastique',qty:2},{name:'Céramique',qty:1}],reqM:4,reqE:6,price:520,demand:8},
  {name:'Transformateur',complexity:6,mats:[{name:'Cuivre',qty:8},{name:'Acier',qty:5},{name:'Plastique',qty:2},{name:'Résine époxy',qty:1}],reqM:3,reqE:5,price:440,demand:9},
  {name:'Filtre HEPA',complexity:6,mats:[{name:'Plastique',qty:4},{name:'Coton',qty:3},{name:'Verre',qty:2},{name:'Aluminium',qty:2}],reqM:3,reqE:4,price:270,demand:11},
  {name:'Dissipateur thermique',complexity:6,mats:[{name:'Aluminium',qty:7},{name:'Cuivre',qty:3},{name:'Titane',qty:1}],reqM:3,reqE:5,price:310,demand:10},
  {name:'Batterie Li-Ion',complexity:7,mats:[{name:'Lithium',qty:5},{name:'Cuivre',qty:3},{name:'Aluminium',qty:3},{name:'Plastique',qty:3},{name:'Graphène',qty:1}],reqM:4,reqE:7,price:850,demand:6},
  {name:'Écran OLED',complexity:7,mats:[{name:'Verre',qty:5},{name:'Silicium',qty:4},{name:'Plastique',qty:3},{name:'Cuivre',qty:2},{name:'Résine époxy',qty:1}],reqM:4,reqE:7,price:720,demand:7},
  {name:'Convertisseur DC',complexity:7,mats:[{name:'Cuivre',qty:6},{name:'Silicium',qty:4},{name:'Aluminium',qty:4},{name:'Céramique',qty:2},{name:'Plastique',qty:2}],reqM:4,reqE:6,price:580,demand:8},
  {name:'Turbine éolienne',complexity:8,mats:[{name:'Acier',qty:10},{name:'Aluminium',qty:5},{name:'Cuivre',qty:5},{name:'Titane',qty:2},{name:'Résine époxy',qty:2}],reqM:5,reqE:8,price:1200,demand:5},
  {name:'Drone compact',complexity:8,mats:[{name:'Aluminium',qty:5},{name:'Plastique',qty:4},{name:'Silicium',qty:3},{name:'Cuivre',qty:3},{name:'Lithium',qty:2},{name:'Graphène',qty:1}],reqM:5,reqE:8,price:980,demand:6},
  {name:'Module WiFi',complexity:8,mats:[{name:'Silicium',qty:6},{name:'Cuivre',qty:4},{name:'Plastique',qty:3},{name:'Céramique',qty:2},{name:'Résine époxy',qty:1}],reqM:4,reqE:7,price:650,demand:7},
  {name:'Piston hydraulique',complexity:9,mats:[{name:'Acier',qty:12},{name:'Titane',qty:4},{name:'Caoutchouc',qty:4},{name:'Pétrole',qty:3},{name:'Résine époxy',qty:2}],reqM:5,reqE:9,price:1500,demand:4},
  {name:'Capteur ultrason',complexity:9,mats:[{name:'Silicium',qty:5},{name:'Céramique',qty:4},{name:'Plastique',qty:4},{name:'Cuivre',qty:3},{name:'Aluminium',qty:3},{name:'Résine époxy',qty:1}],reqM:5,reqE:8,price:880,demand:5},
  {name:'Servo moteur',complexity:10,mats:[{name:'Cuivre',qty:8},{name:'Acier',qty:8},{name:'Titane',qty:4},{name:'Plastique',qty:3},{name:'Céramique',qty:2},{name:'Résine époxy',qty:2},{name:'Graphène',qty:1}],reqM:6,reqE:10,price:2200,demand:3}
];

const EVENTS_DEF = [
  {type:'boom',label:'📈 Boom',text:'Demande ×2',fn:s=>s.demandMult=2.0},
  {type:'crisis',label:'📉 Récession',text:'Demande ×0.4',fn:s=>s.demandMult=0.4},
  {type:'boom',label:'🌍 Export',text:'Demande ×1.8',fn:s=>s.demandMult=1.8},
  {type:'crisis',label:'🔧 Grève',text:'Prod ×0.6',fn:s=>s.prodMult=0.6},
  {type:'neutral',label:'💰 Subvention',text:'Prix −25%',fn:s=>MATERIALS.forEach(m=>s.prices[m.name]=Math.round(s.prices[m.name]*0.75))},
  {type:'crisis',label:'📦 Pénurie',text:'Prix +40%',fn:s=>MATERIALS.forEach(m=>s.prices[m.name]=Math.round(s.prices[m.name]*1.4))},
  {type:'boom',label:'🤖 Innovation',text:'Prod +30%',fn:s=>s.prodMult=1.3},
  {type:'neutral',label:'⚖️ Stabilité',text:'Marchés stabilisés',fn:s=>{s.demandMult=1.0;s.prodMult=1.0;}},
  {type:'crisis',label:'⚡ Crise énergétique',text:'Électricité ×3',fn:s=>{utilityPrices['elec']=utilityPrices['elec']*3;}}
];

const CONTRACTS_DEF = [
  {id:1,client:'Industries Aéro',icon:'✈️',product:'Moteur électrique',quantity:5,reward:2500,timeLimit:1800000},
  {id:2,client:'Green Energy',icon:'🌱',product:'Panneau solaire',quantity:3,reward:2000,timeLimit:1500000},
  {id:3,client:'Tech Innov',icon:'💻',product:'Circuit intégré',quantity:4,reward:3000,timeLimit:2100000},
  {id:4,client:'Auto Plus',icon:'🚗',product:'Batterie Li-Ion',quantity:2,reward:2500,timeLimit:2400000},
  {id:5,client:'Construction',icon:'🏗️',product:'Tuyau PVC',quantity:10,reward:1200,timeLimit:1200000}
];