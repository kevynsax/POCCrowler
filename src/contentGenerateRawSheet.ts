import { msgType, Mensagem, Mercado, PayloadConfigs, EstatisticaEmpresa } from "./types";
import * as $ from 'jquery';
import * as Excel from "exceljs";
const ExcelJS = require("exceljs/dist/es5/exceljs.browser");

const messager = chrome.runtime.sendMessage;
messager({
    type: msgType.getDataToExport
} as Mensagem, (allData: Mercado[]) => {
    if(!allData)
        return;

    messager({ type: msgType.getConfigs } as Mensagem, 
        (cfgs: PayloadConfigs) => {
            if(!cfgs.generateRawData)
                return;
            prepareHtml();
            generateRawSpreadSheet(allData, cfgs);
        });
});

const prepareHtml = () => {
    $("head").html(`<link rel="styleSheet" href="grape.css" />`);
    $("body").html("<div class='footer'></div>");
    $("footer").html("<div class='footer'></div>");   
}

const generateRawSpreadSheet = (data: Mercado[], cfgs: PayloadConfigs) => {
    var workbook = new ExcelJS.Workbook();
    workbook.creator = "Kevyn Pinheiro Klava";
    workbook.created = new Date();
    workbook.properties.date1904 = true;

    workbook.views = [
        {
          x: 0, y: 0, width: 10000, height: 20000,
          firstSheet: 0, activeTab: 1, visibility: 'visible'
        }
    ];

    const metadata = [
        { prop: "dadosEmpresaAtual", stampYear: 0},
        { prop: "dadosEmpresaAnoPassado", stampYear: 1 }
    ];
    data.forEach(mkt =>
        metadata.forEach(meta => {
            const labelSheet = `DB ${mkt.nome} ${(mkt.periodoFinal - (meta.stampYear * 100)).toString().substr(0, 4)}`;
            generateSheets(workbook, mkt[meta.prop], labelSheet);
        }));
        
    downloadFile(workbook, cfgs.nameExportedFile);
}

const generateSheets = (workbook: Excel.Workbook, data: EstatisticaEmpresa[], titleSheet: string) => {
    const sheet = workbook.addWorksheet(titleSheet);
    const title = [[
        { titulo: `Código SUSEP` },
        { titulo: `Empresa` },
        { titulo: `Prêmio Emitido ³` },
        { titulo: `Prêmio Ganho ¹` },
        { titulo: `Despesa com Resseguro ³` },
        { titulo: `Sinistro Ocorrido ³` },
        { titulo: `Receita com Resseguro ³` },
        { titulo: `Despesa Comercial` },
        { titulo: `Sinistralidade ¹` },
        { titulo: `RVNE ³`, sum: false },
    ],
    [  
        { titulo: ``},
        { titulo: `Totais`},
        ...Array.from({length: 8}, z => ({titulo: "", sum: true}))
    ]];
    
    title.forEach(line => sheet.addRows([...line].map(a => a.titulo)));
}

const downloadFile = (workbook: Excel.Workbook, fileName: string) => {
    workbook.xlsx.writeBuffer()
    .then(res => {
        const dataFile = new Blob([res], {type: "octet/stream"});
        const url = window.URL.createObjectURL(dataFile);

        const a = document.createElement("a");
        a.setAttribute("style", "display: none");
        a.href = url;
        a.download = `${fileName}.xlsx`;
        a.click();

        window.URL.revokeObjectURL(url);
    });
}