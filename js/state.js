// ==================== VARIABLES GLOBALES ====================
let S = null;
let products = [];
let chart = null;
let accountingChart = null;
let chartHistory = [];
let logProdEntries = [];
let logAccEntries = [];
let chartView = 'realtime';

let eventTimer, priceTimer, chartTimer, progressTimer, autoSaveTimer, realTimeTimer, gameTimeTimer;
let dailyWageTimer, taxPaymentTimer, loanPaymentTimer, demandUpdateTimer, utilityTimer, repairTimer;
let contractTimer, repairProgressTimer, happinessTimer, contractRefreshTimer, trainingTimer;
let contractProgressTimer, electricityTimer;

let productionTimers = {};
let eventEndTime = 0;
let eventDuration = 0;
let currentEvent = null;
let timerBarInterval;
let toastT = null;
let cart = {};
let confirmCallback = null;
let gameTime = new Date(GAME_START_DATE);
let prodSearchTerm = '';
let demandSearchTerm = '';
let marketSearchTerm = '';

let machines = [];
let employees = [];
let pendingTaxes = 0;
let currentLoan = {amount: 0, total: 0, remaining: 0};
let bspClickCount = 0;
let selectedEmployees = {maintenance:[], cleaner:[], lineManager:[], siteManager:[], handler:[], training:[]};
let bonusLog = [];
let bonusTotalMonth = 0;
let utilityPrices = {};
let activeContracts = [];
let repairsInProgress = {};
let hireCount = 0;
let currentCandidates = [];
let selectedCandidate = null;
let machineSelections = {};
let stateContractBonus = false;