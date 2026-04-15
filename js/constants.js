// ==================== CONSTANTES DU JEU ====================

// Configuration du jeu
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
const HIRE_COST = 1000; // Prix fixe d'embauche

// Recrutement - changements
const FREE_REFRESH_START = 2; // 2 changements gratuits au départ
const FREE_REFRESH_AFTER_COOLDOWN = 1; // 1 changement gratuit après cooldown
const REFRESH_COOLDOWN_MS = 600000; // 10 minutes
const REFRESH_BASE_COST = 500; // Prix de base après les gratuits (augmente à chaque fois)

// Actions concurrents (prix ×5)
const ESPIONNAGE_COST = 2500;   // 500 ×5
const SABOTAGE_COST = 10000;    // 2000 ×5
const COLLABORATION_COST = 5000; // 1000 ×5

// Économie et taxes
const UTILITIES_DEF = [
    { id: 'elec', name: 'Électricité', icon: '⚡', unit: 'kWh', basePricePerUnit: 0.14 },
    { id: 'gaz', name: 'Gaz naturel', icon: '🔥', unit: 'kWh', basePricePerUnit: 0.062 },
    { id: 'eau', name: 'Eau', icon: '💧', unit: 'm³', basePricePerUnit: 3.50 },
    { id: 'diesel', name: 'Diesel', icon: '🛢️', unit: 'L', basePricePerUnit: 1.25 }
];
const TAX_RATE = 0.20;
const TAX_PAYMENT_INTERVAL_REAL = 120000;
const LOAN_PAYMENT_INTERVAL_REAL = 1440000;

// Employés et RH
const VACATION_DAYS_PER_6MONTHS = 14;
const SIX_MONTHS_GAME_DAYS = 180;

// Réputation et part de marché
const REPUTATION_PER_SALE = 0.1; // 0.1 réputation par produit vendu
const REPUTATION_PER_CONTRACT = 5; // 5 réputation par contrat réussi
const REPUTATION_LOST_PER_CANCEL = 2; // -2 réputation par contrat annulé
const MARKET_SHARE_START = 15; // 15% au début
const REPUTATION_THRESHOLDS = [
    { min: 0, max: 10, name: "🪴 Micro entreprise", color: "var(--muted)", maxMarketShare: 15 },
    { min: 11, max: 50, name: "🏭 Petite entreprise", color: "var(--blue)", maxMarketShare: 25 },
    { min: 51, max: 200, name: "📈 Entreprise régionale", color: "var(--teal)", maxMarketShare: 40 },
    { min: 201, max: 800, name: "🏛️ Grande entreprise", color: "var(--purple)", maxMarketShare: 60 },
    { min: 801, max: 2500, name: "🌍 Multinationale", color: "var(--gold)", maxMarketShare: 80 },
    { min: 2501, max: Infinity, name: "👑 Empire industriel", color: "var(--pink)", maxMarketShare: 95 }
];

// Noms pour génération aléatoire
const MALE_FIRST_NAMES = ['Jean', 'Pierre', 'Thomas', 'Nicolas', 'David', 'Lucas', 'Mathieu', 'Antoine', 'Alexandre', 'Guillaume', 'Paul', 'Jacques', 'Michel', 'André', 'Philippe', 'Laurent', 'Olivier', 'Pascal', 'Frédéric', 'Sébastien'];
const FEMALE_FIRST_NAMES = ['Marie', 'Sophie', 'Laura', 'Julie', 'Emma', 'Chloé', 'Léa', 'Camille', 'Sarah', 'Pauline', 'Isabelle', 'Nathalie', 'Valérie', 'Céline', 'Émilie', 'Audrey', 'Marion', 'Claire', 'Anne', 'Hélène'];
const LAST_NAMES = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier'];

// Types de postes
const JOB_TYPES = {
    NONE: 'Aucun',
    MAINTENANCE: 'Agent de maintenance',
    CLEANER: 'Agent d\'entretien',
    LINE_MANAGER: 'Manager de ligne',
    SITE_MANAGER: 'Manager de site',
    HANDLER: 'Manutentionnaire'
};

// Matières premières
const MATERIALS = [
    { name: 'Minerai', icon: '⛏️', base: 20 },
    { name: 'Charbon', icon: '⚫', base: 15 },
    { name: 'Sable', icon: '🏖️', base: 10 },
    { name: 'Bois', icon: '🌲', base: 30 },
    { name: 'Coton', icon: '🌿', base: 25 },
    { name: 'Pétrole', icon: '🛢️', base: 70 },
    { name: 'Cuivre', icon: '🪙', base: 95 },
    { name: 'Silicium', icon: '💎', base: 120 },
    { name: 'Lithium', icon: '⚡', base: 180 },
    { name: 'Aluminium', icon: '🔩', base: 55 },
    { name: 'Plastique', icon: '🧪', base: 40 },
    { name: 'Verre', icon: '🔮', base: 50 },
    { name: 'Acier', icon: '⚙️', base: 80 }
];
const MAT_MAP = {};
MATERIALS.forEach(m => MAT_MAP[m.name] = m);

// Produits
const PRODUCTS_DEF = [
    { name: 'Planche de bois', complexity: 1, mats: [{ name: 'Bois', qty: 3 }], reqMachines: 1, reqEmployees: 1, price: 45, demand: 25 },
    { name: 'Tissu', complexity: 1, mats: [{ name: 'Coton', qty: 4 }], reqMachines: 1, reqEmployees: 1, price: 35, demand: 28 },
    { name: 'Plastique', complexity: 1, mats: [{ name: 'Pétrole', qty: 3 }], reqMachines: 1, reqEmployees: 2, price: 60, demand: 22 },
    { name: 'Acier', complexity: 2, mats: [{ name: 'Minerai', qty: 3 }, { name: 'Charbon', qty: 2 }], reqMachines: 1, reqEmployees: 2, price: 80, demand: 20 },
    { name: 'Verre', complexity: 2, mats: [{ name: 'Sable', qty: 4 }], reqMachines: 1, reqEmployees: 1, price: 50, demand: 25 },
    { name: 'Câble électrique', complexity: 3, mats: [{ name: 'Cuivre', qty: 3 }, { name: 'Plastique', qty: 2 }], reqMachines: 2, reqEmployees: 2, price: 120, demand: 30 },
    { name: 'Moteur simple', complexity: 4, mats: [{ name: 'Acier', qty: 4 }, { name: 'Cuivre', qty: 3 }], reqMachines: 2, reqEmployees: 3, price: 350, demand: 20 },
    { name: 'Circuit électronique', complexity: 5, mats: [{ name: 'Silicium', qty: 3 }, { name: 'Cuivre', qty: 2 }], reqMachines: 2, reqEmployees: 3, price: 300, demand: 25 },
    { name: 'Batterie', complexity: 6, mats: [{ name: 'Lithium', qty: 3 }, { name: 'Cuivre', qty: 2 }, { name: 'Plastique', qty: 2 }], reqMachines: 3, reqEmployees: 4, price: 500, demand: 22 },
    { name: 'Panneau solaire', complexity: 6, mats: [{ name: 'Verre', qty: 4 }, { name: 'Silicium', qty: 3 }, { name: 'Aluminium', qty: 2 }], reqMachines: 3, reqEmployees: 4, price: 480, demand: 18 },
    { name: 'Pompe', complexity: 7, mats: [{ name: 'Acier', qty: 4 }, { name: 'Moteur simple', qty: 1 }, { name: 'Plastique', qty: 3 }], reqMachines: 3, reqEmployees: 4, price: 550, demand: 20 },
    { name: 'Ventilateur', complexity: 7, mats: [{ name: 'Plastique', qty: 4 }, { name: 'Moteur simple', qty: 1 }], reqMachines: 3, reqEmployees: 3, price: 400, demand: 25 },
    { name: 'Réservoir', complexity: 8, mats: [{ name: 'Acier', qty: 5 }, { name: 'Plastique', qty: 3 }], reqMachines: 3, reqEmployees: 3, price: 600, demand: 18 },
    { name: 'Écran', complexity: 8, mats: [{ name: 'Verre', qty: 3 }, { name: 'Circuit électronique', qty: 2 }], reqMachines: 3, reqEmployees: 4, price: 700, demand: 22 },
    { name: 'Servo-moteur', complexity: 10, mats: [{ name: 'Moteur simple', qty: 2 }, { name: 'Circuit électronique', qty: 1 }, { name: 'Acier', qty: 2 }], reqMachines: 4, reqEmployees: 5, price: 1500, demand: 15 },
    { name: 'Moteur puissant', complexity: 12, mats: [{ name: 'Moteur simple', qty: 2 }, { name: 'Acier', qty: 4 }, { name: 'Cuivre', qty: 4 }], reqMachines: 4, reqEmployees: 5, price: 1200, demand: 20 },
    { name: 'Boîte de vitesses', complexity: 13, mats: [{ name: 'Acier', qty: 6 }, { name: 'Acier', qty: 4 }], reqMachines: 4, reqEmployees: 4, price: 1000, demand: 18 },
    { name: 'Système ABS', complexity: 14, mats: [{ name: 'Circuit électronique', qty: 3 }, { name: 'Pompe', qty: 2 }, { name: 'Capteur infrarouge', qty: 2 }], reqMachines: 4, reqEmployees: 5, price: 1400, demand: 16 },
    { name: 'Centrale électrique', complexity: 15, mats: [{ name: 'Batterie', qty: 3 }, { name: 'Circuit électronique', qty: 3 }, { name: 'Câble électrique', qty: 5 }], reqMachines: 5, reqEmployees: 6, price: 2000, demand: 15 },
    { name: 'Climatiseur', complexity: 16, mats: [{ name: 'Pompe', qty: 2 }, { name: 'Ventilateur', qty: 2 }, { name: 'Circuit électronique', qty: 2 }], reqMachines: 4, reqEmployees: 5, price: 1800, demand: 17 },
    { name: 'Armoire électrique', complexity: 17, mats: [{ name: 'Acier', qty: 5 }, { name: 'Circuit électronique', qty: 4 }, { name: 'Câble électrique', qty: 4 }], reqMachines: 4, reqEmployees: 4, price: 1500, demand: 16 },
    { name: 'Compresseur', complexity: 18, mats: [{ name: 'Pompe', qty: 2 }, { name: 'Moteur simple', qty: 2 }, { name: 'Réservoir', qty: 1 }], reqMachines: 5, reqEmployees: 5, price: 1700, demand: 15 },
    { name: 'Générateur', complexity: 19, mats: [{ name: 'Moteur simple', qty: 3 }, { name: 'Alternateur', qty: 2 }, { name: 'Batterie', qty: 2 }], reqMachines: 5, reqEmployees: 6, price: 2200, demand: 14 },
    { name: 'Bras robotisé', complexity: 20, mats: [{ name: 'Servo-moteur', qty: 2 }, { name: 'Acier', qty: 5 }, { name: 'Circuit électronique', qty: 3 }], reqMachines: 5, reqEmployees: 6, price: 2500, demand: 13 },
    { name: 'Convertisseur', complexity: 22, mats: [{ name: 'Circuit électronique', qty: 4 }, { name: 'Batterie', qty: 3 }, { name: 'Câble électrique', qty: 5 }], reqMachines: 5, reqEmployees: 5, price: 2300, demand: 14 },
    { name: 'Échangeur thermique', complexity: 23, mats: [{ name: 'Cuivre', qty: 6 }, { name: 'Acier', qty: 5 }, { name: 'Pompe', qty: 2 }], reqMachines: 5, reqEmployees: 5, price: 2000, demand: 15 },
    { name: 'Moteur industriel', complexity: 25, mats: [{ name: 'Moteur puissant', qty: 2 }, { name: 'Acier', qty: 8 }, { name: 'Circuit électronique', qty: 4 }], reqMachines: 6, reqEmployees: 7, price: 3500, demand: 12 },
    { name: 'Lave-linge', complexity: 21, mats: [{ name: 'Moteur simple', qty: 2 }, { name: 'Circuit électronique', qty: 2 }, { name: 'Plastique', qty: 5 }, { name: 'Acier', qty: 3 }], reqMachines: 5, reqEmployees: 5, price: 2800, demand: 18 },
    { name: 'Réfrigérateur', complexity: 22, mats: [{ name: 'Compresseur', qty: 2 }, { name: 'Échangeur thermique', qty: 2 }, { name: 'Plastique', qty: 6 }], reqMachines: 5, reqEmployees: 5, price: 3200, demand: 16 },
    { name: 'Grille-pain', complexity: 19, mats: [{ name: 'Circuit électronique', qty: 1 }, { name: 'Plastique', qty: 3 }, { name: 'Acier', qty: 2 }], reqMachines: 4, reqEmployees: 4, price: 1200, demand: 25 },
    { name: 'Cafetière', complexity: 20, mats: [{ name: 'Pompe', qty: 1 }, { name: 'Circuit électronique', qty: 2 }, { name: 'Plastique', qty: 4 }], reqMachines: 4, reqEmployees: 4, price: 1400, demand: 22 },
    { name: 'Télévision', complexity: 23, mats: [{ name: 'Écran', qty: 2 }, { name: 'Circuit électronique', qty: 4 }, { name: 'Plastique', qty: 4 }], reqMachines: 5, reqEmployees: 5, price: 3500, demand: 15 },
    { name: 'Ordinateur', complexity: 24, mats: [{ name: 'Circuit électronique', qty: 5 }, { name: 'Écran', qty: 1 }, { name: 'Plastique', qty: 3 }, { name: 'Aluminium', qty: 2 }], reqMachines: 5, reqEmployees: 5, price: 4000, demand: 14 },
    { name: 'Smartphone', complexity: 21, mats: [{ name: 'Circuit électronique', qty: 3 }, { name: 'Écran', qty: 1 }, { name: 'Batterie', qty: 1 }, { name: 'Plastique', qty: 2 }], reqMachines: 4, reqEmployees: 4, price: 2500, demand: 20 },
    { name: 'Vélo électrique', complexity: 24, mats: [{ name: 'Moteur simple', qty: 2 }, { name: 'Batterie', qty: 2 }, { name: 'Acier', qty: 6 }, { name: 'Plastique', qty: 4 }], reqMachines: 5, reqEmployees: 5, price: 4500, demand: 12 },
    { name: 'Tondeuse', complexity: 22, mats: [{ name: 'Moteur simple', qty: 2 }, { name: 'Acier', qty: 5 }, { name: 'Plastique', qty: 3 }], reqMachines: 5, reqEmployees: 5, price: 3000, demand: 14 },
    { name: 'Perceuse', complexity: 20, mats: [{ name: 'Moteur simple', qty: 1 }, { name: 'Circuit électronique', qty: 1 }, { name: 'Plastique', qty: 3 }, { name: 'Acier', qty: 3 }], reqMachines: 4, reqEmployees: 4, price: 2000, demand: 18 },
    { name: 'Groupe électrogène', complexity: 28, mats: [{ name: 'Générateur', qty: 2 }, { name: 'Moteur simple', qty: 2 }, { name: 'Armoire électrique', qty: 1 }], reqMachines: 6, reqEmployees: 7, price: 8000, demand: 10 },
    { name: 'Station recharge', complexity: 30, mats: [{ name: 'Centrale électrique', qty: 2 }, { name: 'Batterie', qty: 4 }, { name: 'Armoire électrique', qty: 2 }], reqMachines: 6, reqEmployees: 7, price: 10000, demand: 9 },
    { name: 'Automate', complexity: 32, mats: [{ name: 'Circuit électronique', qty: 6 }, { name: 'Armoire électrique', qty: 2 }, { name: 'Bras robotisé', qty: 1 }], reqMachines: 7, reqEmployees: 8, price: 12000, demand: 8 },
    { name: 'Robot industriel', complexity: 35, mats: [{ name: 'Bras robotisé', qty: 3 }, { name: 'Moteur simple', qty: 3 }, { name: 'Circuit électronique', qty: 5 }], reqMachines: 8, reqEmployees: 9, price: 18000, demand: 7 },
    { name: 'Convoyeur', complexity: 38, mats: [{ name: 'Moteur simple', qty: 3 }, { name: 'Acier', qty: 8 }, { name: 'Circuit électronique', qty: 3 }], reqMachines: 7, reqEmployees: 7, price: 15000, demand: 8 },
    { name: 'Ligne production', complexity: 42, mats: [{ name: 'Robot industriel', qty: 2 }, { name: 'Convoyeur', qty: 2 }, { name: 'Armoire électrique', qty: 2 }], reqMachines: 9, reqEmployees: 10, price: 30000, demand: 6 },
    { name: 'Éolienne', complexity: 45, mats: [{ name: 'Générateur', qty: 2 }, { name: 'Moteur simple', qty: 3 }, { name: 'Acier', qty: 10 }], reqMachines: 8, reqEmployees: 8, price: 25000, demand: 7 },
    { name: 'Centrale solaire', complexity: 48, mats: [{ name: 'Panneau solaire', qty: 8 }, { name: 'Batterie', qty: 6 }, { name: 'Convertisseur', qty: 3 }], reqMachines: 8, reqEmployees: 9, price: 28000, demand: 6 },
    { name: 'Chaudière', complexity: 50, mats: [{ name: 'Acier', qty: 12 }, { name: 'Échangeur thermique', qty: 3 }, { name: 'Compresseur', qty: 2 }], reqMachines: 8, reqEmployees: 8, price: 22000, demand: 7 },
    { name: 'Tour refroidissement', complexity: 50, mats: [{ name: 'Acier', qty: 10 }, { name: 'Pompe', qty: 4 }, { name: 'Ventilateur', qty: 4 }], reqMachines: 8, reqEmployees: 8, price: 20000, demand: 7 },
    { name: 'Voiture électrique', complexity: 40, mats: [{ name: 'Moteur puissant', qty: 4 }, { name: 'Batterie', qty: 6 }, { name: 'Boîte de vitesses', qty: 2 }, { name: 'Système ABS', qty: 2 }], reqMachines: 10, reqEmployees: 12, price: 35000, demand: 8 },
    { name: 'Camionnette', complexity: 44, mats: [{ name: 'Moteur puissant', qty: 6 }, { name: 'Batterie', qty: 5 }, { name: 'Boîte de vitesses', qty: 3 }, { name: 'Système ABS', qty: 3 }], reqMachines: 10, reqEmployees: 12, price: 45000, demand: 7 },
    { name: 'Moto', complexity: 36, mats: [{ name: 'Moteur puissant', qty: 3 }, { name: 'Batterie', qty: 3 }, { name: 'Boîte de vitesses', qty: 1 }, { name: 'Système ABS', qty: 1 }], reqMachines: 7, reqEmployees: 8, price: 18000, demand: 9 },
    { name: 'Tracteur', complexity: 48, mats: [{ name: 'Moteur industriel', qty: 8 }, { name: 'Pompe', qty: 4 }, { name: 'Boîte de vitesses', qty: 3 }, { name: 'Système ABS', qty: 2 }], reqMachines: 10, reqEmployees: 10, price: 50000, demand: 6 },
    { name: 'Drone de livraison', complexity: 42, mats: [{ name: 'Drone', qty: 2 }, { name: 'Moteur simple', qty: 2 }, { name: 'Batterie', qty: 3 }, { name: 'Circuit électronique', qty: 2 }], reqMachines: 8, reqEmployees: 9, price: 22000, demand: 8 },
    { name: 'Usine automatisée', complexity: 55, mats: [{ name: 'Ligne production', qty: 2 }, { name: 'Robot industriel', qty: 4 }, { name: 'Armoire électrique', qty: 4 }], reqMachines: 10, reqEmployees: 12, price: 60000, demand: 5 },
    { name: 'Chaîne production', complexity: 58, mats: [{ name: 'Convoyeur', qty: 4 }, { name: 'Robot industriel', qty: 3 }, { name: 'Automate', qty: 2 }], reqMachines: 10, reqEmployees: 11, price: 50000, demand: 5 },
    { name: 'Atelier robotisé', complexity: 62, mats: [{ name: 'Bras robotisé', qty: 6 }, { name: 'Circuit électronique', qty: 8 }, { name: 'Armoire électrique', qty: 4 }], reqMachines: 10, reqEmployees: 12, price: 70000, demand: 4 },
    { name: 'Centrale hydroélectrique', complexity: 65, mats: [{ name: 'Turbine', qty: 3 }, { name: 'Générateur', qty: 4 }, { name: 'Armoire électrique', qty: 4 }], reqMachines: 10, reqEmployees: 10, price: 80000, demand: 4 },
    { name: 'Parc éolien', complexity: 68, mats: [{ name: 'Éolienne', qty: 4 }, { name: 'Centrale électrique', qty: 2 }, { name: 'Armoire électrique', qty: 3 }], reqMachines: 10, reqEmployees: 10, price: 90000, demand: 4 },
    { name: 'Ferme solaire', complexity: 70, mats: [{ name: 'Panneau solaire', qty: 20 }, { name: 'Centrale électrique', qty: 4 }, { name: 'Convertisseur', qty: 6 }], reqMachines: 12, reqEmployees: 12, price: 100000, demand: 4 },
    { name: 'Bus électrique', complexity: 60, mats: [{ name: 'Moteur puissant', qty: 6 }, { name: 'Batterie', qty: 10 }, { name: 'Système ABS', qty: 4 }, { name: 'Boîte de vitesses', qty: 3 }], reqMachines: 12, reqEmployees: 14, price: 70000, demand: 5 },
    { name: 'Camion électrique', complexity: 66, mats: [{ name: 'Moteur puissant', qty: 8 }, { name: 'Batterie', qty: 12 }, { name: 'Système ABS', qty: 5 }, { name: 'Boîte de vitesses', qty: 4 }], reqMachines: 12, reqEmployees: 14, price: 90000, demand: 4 },
    { name: 'Utilitaire', complexity: 64, mats: [{ name: 'Moteur puissant', qty: 7 }, { name: 'Batterie', qty: 8 }, { name: 'Système ABS', qty: 4 }, { name: 'Boîte de vitesses', qty: 3 }], reqMachines: 12, reqEmployees: 13, price: 80000, demand: 5 },
    { name: 'Fourgon aménagé', complexity: 68, mats: [{ name: 'Camionnette', qty: 1 }, { name: 'Armoire électrique', qty: 2 }, { name: 'Batterie', qty: 4 }], reqMachines: 12, reqEmployees: 12, price: 85000, demand: 4 },
    { name: 'Navette autonome', complexity: 72, mats: [{ name: 'Voiture électrique', qty: 2 }, { name: 'Circuit électronique', qty: 8 }, { name: 'Capteur infrarouge', qty: 6 }], reqMachines: 13, reqEmployees: 14, price: 120000, demand: 4 },
    { name: 'Train léger', complexity: 75, mats: [{ name: 'Moteur puissant', qty: 12 }, { name: 'Batterie', qty: 15 }, { name: 'Système ABS', qty: 6 }, { name: 'Boîte de vitesses', qty: 6 }], reqMachines: 15, reqEmployees: 16, price: 150000, demand: 3 },
    { name: 'Métro automatique', complexity: 80, mats: [{ name: 'Train léger', qty: 2 }, { name: 'Centrale électrique', qty: 4 }, { name: 'Automate', qty: 4 }], reqMachines: 16, reqEmployees: 18, price: 200000, demand: 3 },
    { name: 'Trolleybus', complexity: 78, mats: [{ name: 'Bus électrique', qty: 1 }, { name: 'Câble électrique', qty: 10 }, { name: 'Centrale électrique', qty: 2 }], reqMachines: 14, reqEmployees: 15, price: 130000, demand: 4 },
    { name: 'Scie à ruban', complexity: 56, mats: [{ name: 'Moteur puissant', qty: 3 }, { name: 'Acier', qty: 10 }, { name: 'Circuit électronique', qty: 2 }], reqMachines: 9, reqEmployees: 9, price: 40000, demand: 6 },
    { name: 'Presse hydraulique', complexity: 60, mats: [{ name: 'Pompe', qty: 4 }, { name: 'Acier', qty: 15 }, { name: 'Circuit électronique', qty: 3 }], reqMachines: 10, reqEmployees: 10, price: 55000, demand: 5 },
    { name: 'Fraiseuse CNC', complexity: 64, mats: [{ name: 'Moteur puissant', qty: 4 }, { name: 'Circuit électronique', qty: 6 }, { name: 'Acier', qty: 12 }], reqMachines: 10, reqEmployees: 11, price: 65000, demand: 5 },
    { name: 'Imprimante 3D', complexity: 58, mats: [{ name: 'Circuit électronique', qty: 8 }, { name: 'Bras robotisé', qty: 2 }, { name: 'Plastique', qty: 10 }], reqMachines: 9, reqEmployees: 10, price: 48000, demand: 6 }
];

// Événements
const EVENTS_DEF = [
    { type: 'boom', label: '📈 Boom', text: 'Demande ×2', fn: s => s.demandMult = 2.0 },
    { type: 'crisis', label: '📉 Récession', text: 'Demande ×0.4', fn: s => s.demandMult = 0.4 },
    { type: 'boom', label: '🌍 Export', text: 'Demande ×1.8', fn: s => s.demandMult = 1.8 },
    { type: 'crisis', label: '🔧 Grève', text: 'Prod ×0.6', fn: s => s.prodMult = 0.6 },
    { type: 'neutral', label: '💰 Subvention', text: 'Prix −25%', fn: s => MATERIALS.forEach(m => s.prices[m.name] = Math.round(s.prices[m.name] * 0.75)) },
    { type: 'crisis', label: '📦 Pénurie', text: 'Prix +40%', fn: s => MATERIALS.forEach(m => s.prices[m.name] = Math.round(s.prices[m.name] * 1.4)) },
    { type: 'boom', label: '🤖 Innovation', text: 'Prod +30%', fn: s => s.prodMult = 1.3 },
    { type: 'neutral', label: '⚖️ Stabilité', text: 'Marchés stabilisés', fn: s => { s.demandMult = 1.0; s.prodMult = 1.0; } },
    { type: 'crisis', label: '⚡ Crise énergétique', text: 'Électricité ×3', fn: s => { utilityPrices['elec'] = utilityPrices['elec'] * 3; } }
];
for (let i = 0; i < 5; i++) EVENTS_DEF.push({ type: 'neutral', label: '⚖️ Stabilité', text: 'Marchés stabilisés', fn: s => { s.demandMult = 1.0; s.prodMult = 1.0; } });

// Contrats par défaut
const CONTRACTS_DEF = [
    { id: 1, client: 'Industries Aéro', icon: '✈️', product: 'Moteur électrique', quantity: 5, reward: 2500, timeLimit: 1800000 },
    { id: 2, client: 'Green Energy', icon: '🌱', product: 'Panneau solaire', quantity: 3, reward: 2000, timeLimit: 1500000 },
    { id: 3, client: 'Tech Innov', icon: '💻', product: 'Circuit intégré', quantity: 4, reward: 3000, timeLimit: 2100000 },
    { id: 4, client: 'Auto Plus', icon: '🚗', product: 'Batterie Li-Ion', quantity: 2, reward: 2500, timeLimit: 2400000 },
    { id: 5, client: 'Construction', icon: '🏗️', product: 'Tuyau PVC', quantity: 10, reward: 1200, timeLimit: 1200000 }
];

// Concurrents
const COMPETITOR_NAMES = ['Globex Corp', 'Initech', 'Umbrella Corp', 'Tyrell Corp', 'Weyland Corp', 'Cyberdyne', 'OCP', 'Solyent', 'Veidt Industries', 'Massive Dynamic'];
const COMPETITOR_ICONS = ['🏦', '🏭', '🔬', '🤖', '⚡', '📡', '🔧', '💊', '🌍', '🎯'];

// Machines
const MACHINE_TIERS = {
    basic: { name: 'Machine Basic', price: 15000, reqLevel: 1 },
    advanced: { name: 'Machine Avancée', price: 40000, reqLevel: 5 },
    pro: { name: 'Machine Pro', price: 120000, reqLevel: 15 },
    complex: { name: 'Machine Complexe', price: 450000, reqLevel: 30 }
};

// Arbre de recherche (version horizontale)
const RESEARCH_TREE_DATA = [{
    name: "🔬 ARBRE DE RECHERCHE",
    branches: [{
        name: "📈 Recherches",
        children: [
            { id: "r1", name: "📈 Analyse marché", cost: 5000, time: 180000, levelReq: 2, effect: { type: 'demand', value: 1.05 }, desc: "Demande globale +5%", requires: null, x: 0, y: 0 },
            { id: "r2", name: "⚙️ Production optimisée", cost: 8000, time: 240000, levelReq: 3, effect: { type: 'speed', value: 0.96 }, desc: "Vitesse production +4%", requires: "r1", x: 1, y: 0 },
            { id: "r3", name: "💰 Négociation fournisseurs", cost: 10000, time: 300000, levelReq: 4, effect: { type: 'price', value: 1.04 }, desc: "Prix vente +4%", requires: "r2", x: 2, y: 0 },
            { id: "r4", name: "📦 Stockage optimisé", cost: 15000, time: 360000, levelReq: 5, effect: { type: 'capacity', value: 5 }, desc: "Capacité stockage +5", requires: "r3", x: 3, y: 0 },
            { id: "r5", name: "🔧 Maintenance préventive", cost: 12000, time: 300000, levelReq: 6, effect: { type: 'breakdown', value: 0.92 }, desc: "Pannes -8%", requires: "r4", x: 4, y: 0 },
            { id: "r6", name: "👥 Formation rapide", cost: 18000, time: 420000, levelReq: 8, effect: { type: 'efficiency', value: 1.05 }, desc: "Efficacité employés +5%", requires: "r5", x: 5, y: 0 },
            { id: "r7", name: "🔋 Énergie renouvelable", cost: 25000, time: 480000, levelReq: 10, effect: { type: 'utility', value: 0.85 }, desc: "Factures énergie -15%", requires: "r6", x: 6, y: 0 },
            { id: "r8", name: "🏭 Chaîne d'assemblage", cost: 30000, time: 540000, levelReq: 12, effect: { type: 'speed', value: 0.92 }, desc: "Vitesse production +8%", requires: "r7", x: 7, y: 0 },
            { id: "r9", name: "📋 Logistique avancée", cost: 35000, time: 600000, levelReq: 14, effect: { type: 'demand', value: 1.1 }, desc: "Demande globale +10%", requires: "r8", x: 8, y: 0 },
            { id: "r10", name: "🎓 Formation intensive", cost: 40000, time: 660000, levelReq: 16, effect: { type: 'efficiency', value: 1.1 }, desc: "Efficacité employés +10%", requires: "r9", x: 9, y: 0 },
            { id: "r11", name: "⚡ Production quantique", cost: 50000, time: 720000, levelReq: 18, effect: { type: 'speed', value: 0.88 }, desc: "Vitesse production +12%", requires: "r10", x: 10, y: 0 },
            { id: "r12", name: "🛡️ Maintenance prédictive", cost: 45000, time: 680000, levelReq: 20, effect: { type: 'breakdown', value: 0.85 }, desc: "Pannes -15%", requires: "r11", x: 11, y: 0 },
            { id: "r13", name: "🌍 Expansion marché", cost: 55000, time: 780000, levelReq: 22, effect: { type: 'demand', value: 1.15 }, desc: "Demande globale +15%", requires: "r12", x: 12, y: 0 },
            { id: "r14", name: "🤖 Automatisation", cost: 60000, time: 840000, levelReq: 25, effect: { type: 'capacity', value: 2 }, desc: "+2 capacité machine", requires: "r13", x: 13, y: 0 },
            { id: "r15", name: "💎 R&D avancée", cost: 70000, time: 900000, levelReq: 28, effect: { type: 'price', value: 1.12 }, desc: "Prix vente +12%", requires: "r14", x: 14, y: 0 },
            { id: "r16", name: "🔬 Nanotechnologies", cost: 80000, time: 960000, levelReq: 32, effect: { type: 'speed', value: 0.85 }, desc: "Vitesse production +15%", requires: "r15", x: 15, y: 0 },
            { id: "r17", name: "⚙️ Robotique industrielle", cost: 90000, time: 1020000, levelReq: 36, effect: { type: 'efficiency', value: 1.15 }, desc: "Efficacité employés +15%", requires: "r16", x: 16, y: 0 },
            { id: "r18", name: "🧠 Intelligence artificielle", cost: 100000, time: 1080000, levelReq: 40, effect: { type: 'demand', value: 1.2 }, desc: "Demande globale +20%", requires: "r17", x: 17, y: 0 },
            { id: "r19", name: "⚡ Fusion énergétique", cost: 120000, time: 1140000, levelReq: 44, effect: { type: 'utility', value: 0.7 }, desc: "Factures énergie -30%", requires: "r18", x: 18, y: 0 },
            { id: "r20", name: "🌌 Production quantique II", cost: 150000, time: 1200000, levelReq: 48, effect: { type: 'speed', value: 0.8 }, desc: "Vitesse production +20%", requires: "r19", x: 19, y: 0 },
            { id: "r21", name: "💡 Innovation totale", cost: 180000, time: 1260000, levelReq: 50, effect: { type: 'price', value: 1.2 }, desc: "Prix vente +20%", requires: "r20", x: 20, y: 0 },
            { id: "r22", name: "🏆 Suprématie industrielle", cost: 200000, time: 1320000, levelReq: 50, effect: { type: 'competitor', value: 0.6 }, desc: "Impact concurrent -40%", requires: "r21", x: 21, y: 0 },
            { id: "r23", name: "⭐ Excellence opérationnelle", cost: 220000, time: 1380000, levelReq: 50, effect: { type: 'efficiency', value: 1.25 }, desc: "Efficacité employés +25%", requires: "r22", x: 22, y: 0 },
            { id: "r24", name: "🔮 Futur de l'industrie", cost: 250000, time: 1440000, levelReq: 50, effect: { type: 'capacity', value: 3 }, desc: "+3 capacité machine", requires: "r23", x: 23, y: 0 },
            { id: "r25", name: "🤝 Négociation avancée", cost: 75000, time: 720000, levelReq: 35, effect: { type: 'contracts', value: 1.15 }, desc: "Contrats premium +15% récompense (débloque à 60% de part de marché)", requires: "r18", x: 17, y: 1 }
        ]
    }]
}];