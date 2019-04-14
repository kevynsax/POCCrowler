
import { Mensagem, msgType, Mercado, PayloadTableData, GrupoEmpresarial, PayloadConfigs, PayloadStartProcess } from "./types";
const queryInfo = {
    active: true,
    currentWindow: true
};

const store = "SusepData";
const storeConfig = "ConfigAxaCrowler";
const storage = chrome.storage.local;
const urlSusep = "http://www2.susep.gov.br/menuestatistica/SES/premiosesinistros.aspx?id=54";
const urlSpreadSheet = "https://www.grapecity.com/en/generateSpreadSheet";
//const urlRawSpreadSheet = "https://www.grapecity.com/en/generateRawSpreadSheet";
const urlRawSpreadSheet = "https://www.grapecity.com/en/login/";
const urlAxa = "https://www.axa.com.br/";

let tabId: number = 0;
let count: number = 0;

chrome.runtime.onMessage.addListener((msg: Mensagem, info, sendResponse) => {
    const lstHandlers: {type: msgType, handler: (msg: Mensagem, sendResponse) => void}[] = [
        { type: msgType.startProcess, handler: startProcess },
        { type: msgType.insertData, handler: handleInsert },
        { type: msgType.getNext, handler: getNext },
        { type: msgType.getCrowlerIsActive, handler: getIsActive },
        { type: msgType.getDataToExport, handler: getDataToExport },
        { type: msgType.getAggregatedCompanies, handler: getAggregatedCompanies },
        { type: msgType.finishiesExportSpreadSheet, handler: handleFinishiesExport },
        { type: msgType.cleanStorage, handler: cleanStorageAndGoToAxaSite },
        { type: msgType.getConfigs, handler: handlerGetConfigs },
        { type: msgType.saveConfigs, handler: handleUpdateConfigs },
        { type: msgType.resetConfigs, handler: resetConfigs },
    ]
    const { handler } = lstHandlers.find(x => x.type === msg.type) || { handler: null };
    if(!handler) return;

    handler(msg, sendResponse);
    return true;
})

const updateCounter = (n = null) => {
    count = n || count - 1;
    if(count === -1)
        count = null;
    const labelCount = (count || "").toString();
    chrome.browserAction.setBadgeText({text: labelCount});
}

const startProcess = (msg: Mensagem) => 
    getConfigs(configs => {
        const {periodoFinal, periodoInicial} = msg.payload as PayloadStartProcess;

        updateCounter(configs.markets.length * 2);
        cleanStorage();
        
        storage.set({[store]: configs.markets.map(x => ({
            nome: x.nome,
            idRamos: x.idRamos,
            periodoInicial: periodoInicial,
            periodoFinal: periodoFinal,
            dadosEmpresaAnoPassado: [],
            dadosEmpresaAtual: []
        } as Mercado))});

        chrome.tabs.query(queryInfo, tabs => {
            tabId = tabs[0].id;
            openUrl();
        });
    });

const getIsActive = (msg: Mensagem, sendResponse: Function) =>
    storage.get(store, response => {
        const storeData = response[store];
        sendResponse(!!storeData)
    })


const openUrl = (url = urlSusep) => chrome.tabs.update(tabId, {url});

const getLastYear = (mkt: Mercado): Mercado =>
    ({
        nome: mkt.nome,
        idRamos: mkt.idRamos,
        periodoInicial: mkt.periodoInicial - 100,
        periodoFinal: mkt.periodoFinal - 100
    } as Mercado);

const getNext = (msg, sendResponse) => 
    storage.get(store, response => {
        const results = response[store] as Mercado[];
        if(!results){
            sendResponse(null);
            return;
        }

        const nextActualYear = results.find(x => !x.dadosEmpresaAtual.length);
        if(!!nextActualYear){
            updateCounter();
            sendResponse(nextActualYear)
            return;
        }

        const nextLastYear = results.find(x => !x.dadosEmpresaAnoPassado.length);
        if(!!nextLastYear){
            updateCounter();
            sendResponse(getLastYear(nextLastYear));
            return;
        }

        updateCounter();

        sendResponse(null);
        openUrl(urlSpreadSheet);
        return;
    })

const handleInsert = (msg: Mensagem) =>
    insertData(msg, () => openUrl())

const insertData = (msg: Mensagem, callBack: () => void) =>
    storage.get(store, response => {
        const results = response[store] as Mercado[];

        const payload = msg.payload as PayloadTableData;
        const meta = payload.metadata;
        let mkt = results.find(x => equalsMarket(x, meta));

        if(mkt.periodoInicial === meta.periodoInicial)
            mkt.dadosEmpresaAtual = payload.tableData;
        else
            mkt.dadosEmpresaAnoPassado = payload.tableData;

        const newValues = [...results.filter(x => !equalsMarket(x, meta)), mkt];
        storage.set({[store]: newValues}, callBack)
    });

const equalsMarket = (src: Mercado, to: Mercado): boolean => {
    const createHash = (lst: number[]): string => lst.sort((a, b) => a - b).join(",");
    return createHash(src.idRamos) === createHash(to.idRamos);
}

const getDataToExport = (msg, sendResponse) => 
    storage.get(store, response => {
        const lst = response[store] as Mercado[];
        const hasToDo = lst && !!lst.find(x => !x.dadosEmpresaAnoPassado.length || !x.dadosEmpresaAtual.length);

        if(hasToDo){
            sendResponse(null);
            return;
        }

        sendResponse(lst);
    });

const cleanStorageAndGoToAxaSite = () => cleanStorage(() => openUrl(urlAxa))
const cleanStorage = (callBack = () => {}) => storage.remove(store, callBack);

const updateConfigs = (cfg: PayloadConfigs, callBack) => storage.set({[storeConfig]: cfg}, callBack);
const handleUpdateConfigs = (msg, sendresponse) => updateConfigs(msg.payload as PayloadConfigs, sendresponse)

const getAggregatedCompanies = (msg, sendReponse) =>
    getConfigs(configs => sendReponse(configs.aggregatedCompanies))

const handlerGetConfigs = (msg, sendResponse) => getConfigs(sendResponse);

const getConfigs = (callback: (obj: PayloadConfigs) => void): void => 
    storage.get(storeConfig, response => {
        var configs = response[storeConfig] as PayloadConfigs;
        if(!configs){
            setupConfigs(() => getConfigs(callback));
            return;
        }

        callback(configs);
    });

const handleFinishiesExport = (msg, sendResponse) => 
    getConfigs(cfgs => {
        if(!cfgs.generateRawData){
            cleanStorageAndGoToAxaSite();
            return;
        }

        openUrl(urlRawSpreadSheet);
    })

const resetConfigs = (msg, sendResponse) => setupConfigs(sendResponse);    
//todo completar lista de grupos empresariais
const setupConfigs = callback => {
    const idDpvat = 588;
    const mkts = [
        { nome: "Aviation", idRamos: [1528, 1535, 1537, 1597] },
        { nome: "Financial Lines", idRamos: [310, 378] },
        { nome: "Cargo", idRamos: [621, 622, 632, 638, 652, 654, 655, 656, 658] },
        { nome: "Casualty", idRamos: [351] },
        { nome: "Construction", idRamos: [167] },
        { nome: "Environmental", idRamos: [313] },
        { nome: "Port", idRamos: [1417] },
        { nome: "Property", idRamos: [196, 141, 118] },
        { nome: "PRCB", idRamos: [748, 749] },
    ];

    const allIds = mkts.map(x => x.idRamos).reduce((all, item) => [...all, ...item], []);

    updateConfigs({
        markets: [
            ...mkts,
            { nome: "Total sem DPVAT", idRamos: allIds },
            { nome: "DPVAT", idRamos: [idDpvat] },
            { nome: "Total com DPVAT", idRamos: [...allIds, idDpvat] },
        ],
        aggregatedCompanies: [
            {nome: "MAPFRE BANCO DO BRASIL", idEmpresas: [6238, 6785]},
        ],
        generateRawData: false,
        nameExportedFile: "Template comparativo de mercado"
    } as PayloadConfigs, callback);
}

