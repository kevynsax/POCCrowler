
import { Mensagem, msgType, Mercado, PayloadTableData } from "./types";
const queryInfo = {
    active: true,
    currentWindow: true
};

const store = "SUSEP";
const storage = chrome.storage.local;
const messager = chrome.runtime.sendMessage;
const urlSusep = "http://www2.susep.gov.br/menuestatistica/SES/premiosesinistros.aspx?id=54";
let tabId: number = 0;

chrome.runtime.onMessage.addListener((msg: Mensagem) => {
    const lstHandlers: {type: msgType, handler: (msg: Mensagem) => void}[] = [
        { type: msgType.startProcess, handler: startProcess },
        { type: msgType.finishedGetStatistics, handler: getTableData },
        { type: msgType.finishedGetTableData, handler: handleInsert },
    ]
    const { handler } = lstHandlers.find(x => x.type === msg.type) || { handler: null };
    if(!handler) return;

    handler(msg);
})

const startProcess = (msg: Mensagem) => {
    storage.remove(store);
    storage.set({[store]: [{
        nome: "PRCB",
        idRamos: [748, 749],
        periodoInicial: 201901,
        periodoFinal: 201902,
        dadosEmpresaAnoPassado: [],
        dadosEmpresaAtual: []
    } as Mercado]});

    chrome.tabs.query(queryInfo, tabs => {
        tabId = tabs[0].id;
        handleNext();
    })
}

const getStatistics = (mkt: Mercado) => {
    const callBack = () => messager({ type: msgType.getStatistics, payload: mkt } as Mensagem);

    chrome.tabs.update(tabId, {url: urlSusep}, tab => executeWhenFinishesLoad(callBack))
}

const getLastYear = (mkt: Mercado) =>
    getStatistics({
        nome: mkt.nome,
        idRamos: mkt.idRamos,
        periodoInicial: mkt.periodoInicial - 100,
        periodoFinal: mkt.periodoFinal - 100
    } as Mercado);


const handleNext = () => 
    storage.get(store, response => {
        const results = response[store] as Mercado[];
        const nextActualYear = results.find(x => !x.dadosEmpresaAtual.length);
        if(!!nextActualYear){
            getStatistics(nextActualYear);
            return;
        }

        const nextLastYear = results.find(x => !x.dadosEmpresaAnoPassado.length);
        if(!!nextLastYear){
            getLastYear(nextLastYear);
            return;
        }

        storage.get(store, console.log)
    })


const handleInsert = (msg: Mensagem) =>
    insertData(msg, handleNext)

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

const getTableData = (msg: Mensagem) => 
    messager({ type: msgType.getTableData, payload: null} as Mensagem)

const executeWhenFinishesLoad = (callback: Function) => {
    const listenner = (idTab, info) => {
        console.log(info);
        if (info.status !== 'complete' || tabId !== idTab) 
            return;

        chrome.tabs.onUpdated.removeListener(listenner);
        callback();
    }
    chrome.tabs.onUpdated.addListener(listenner);
}
