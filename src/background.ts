
import { Mensagem, msgType, Mercado, PayloadTableData } from "./types";
const queryInfo = {
    active: true,
    currentWindow: true
};

const store = "SUSEP";
const storage = chrome.storage.local;
const urlSusep = "http://www2.susep.gov.br/menuestatistica/SES/premiosesinistros.aspx?id=54";
const urlLocal = "https://www.grapecity.com/en/login/"
let tabId: number = 0;
let count: number = 0;
chrome.runtime.onMessage.addListener((msg: Mensagem, info, sendResponse) => {
    const lstHandlers: {type: msgType, handler: (msg: Mensagem, sendResponse) => void}[] = [
        { type: msgType.startProcess, handler: startProcess },
        { type: msgType.insertData, handler: handleInsert },
        { type: msgType.getNext, handler: getNext },
        { type: msgType.getCrowlerIsActive, handler: getIsActive },
        { type: msgType.getDataToExport, handler: getDataToExport }
    ]
    const { handler } = lstHandlers.find(x => x.type === msg.type) || { handler: null };
    if(!handler) return;

    handler(msg, sendResponse);
    return true;
})

const updateCounter = (n = null) => {
    count = n || count-1;
    chrome.browserAction.setBadgeText({text: count.toString()});
}

const startProcess = (msg: Mensagem) => {
    const periodoFim = msg.payload as Number;

    //todo: Mapear todos
    const lst: {nome: string, idRamos: number[]}[] = [
        { nome: "Aviation", idRamos: [1528, 1535, 1537, 1597] },
        { nome: "Financial Lines", idRamos: [310, 378] },
        { nome: "PRCB", idRamos: [748, 749] }
    ];

    updateCounter(lst.length * 2);

    //todo pegar periodo inicial do ano atual
    storage.remove(store);
    storage.set({[store]: lst.map(x => ({
        nome: x.nome,
        idRamos: x.idRamos,
        periodoInicial: 201901,
        periodoFinal: periodoFim,
        dadosEmpresaAnoPassado: [],
        dadosEmpresaAtual: []
    } as Mercado))});

    chrome.tabs.query(queryInfo, tabs => {
        tabId = tabs[0].id;
        openUrl();
    });
}

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
        openUrl(urlLocal);
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

const equalsMarket = (src: Mercado, to: Mercado): boolean =>
    src.idRamos.join(",") === to.idRamos.join(",");


const getDataToExport = (msg, sendResponse) => 
    chrome.storage.local.get(store, response => {
        const lst = response[store] as Mercado[];
        const hasToDo = !!lst.find(x => !x.dadosEmpresaAnoPassado.length || !x.dadosEmpresaAtual.length);

        if(hasToDo){
            sendResponse(null);
            return;
        }

        sendResponse(lst);
    })