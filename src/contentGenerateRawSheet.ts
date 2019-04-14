import { msgType, Mensagem, Mercado, GrupoEmpresarial, PayloadConfigs, EstatisticaEmpresa } from "./types";
import * as $ from 'jquery';
import * as GC from "@grapecity/spread-sheets";
import '@grapecity/spread-sheets/styles/gc.spread.sheets.css';

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

            generateRawSpreadSheet(allData);
        });
});

const prepareHtml = () => {
    $("head").html(`<link rel="styleSheet" href="grape.css" />`);
    const element = "<div style='height:700px ; width :100%;' id='sheet'></div><div class='footer'></div>";
    $("body").html(element);
    $("footer").html("<div class='footer'></div>");   
}

const generateRawSpreadSheet = (data: Mercado[]) => {
    prepareHtml();
    $.support.cors = true;
    GC.Spread.Sheets.LicenseKey = "E628286641333291#B0wN4cKRTN7BlZxBjNYF7Y9E5QYBVZMJlSqh7Zod7RZZTdJRmc8FUcpR4V9NTRFRVNpFzQ8EDOTNmRUBneqdjdpp6YBhjTMxmMiFWNytkQVl6LL3ka0F5Y9QWUZ5ENv5USJdTTrVEcMhFV7l4MqN5ZvQzb4lVMPFnNCNWWSRUO4V7V9UHRUJWUlR4cRxGVqdDOvVnblp4RIFnS7QGa4UzKvRkZEZ5NHFUU4g6Rqp7NKhUTst6Svpkb5AXT5kERuNEUYtET9JXexl6bTtWWu9GaKBzdKFlTR9UY6sUUMJHWSB7LoZHRvJVbVdTerE4TutiVDhDc8JUMa9kYwgmbidzbmlDThtUYwonQMxEeiVGRiojITJCLiUEMFFTO7YjI0ICSiwCMwMzM5gDMyETM0IicfJye#4Xfd5nIJZUOCJiOiMkIsIiMx8idgMlSgQWYlJHcTJiOi8kI1tlOiQmcQJCLiQTM8QDNwAiMyATM8EDMyIiOiQncDJCLi86Yu46bj9Se4l6YlBXYydmLqwSbvNmL9RXajVGchJ7ZuoCLwpmLvNmL9RXajVGchJ7ZuoCLt36YuUmbvRnbl96bw56bj9iKiojIz5GRiwiIuMmbJBSe4l6QlBXYydkI0ISYONkIsUWdyRnOiwmdFJCLiETOyMzMzEDN6YDOygjM6IiOiQWSiwSflNHbhZmOiI7ckJye0ICbuFkI1pjIEJCLi4TPRtCeF56N4FFVCNlNRZ5YmN5LSZkZ6lUU0RUQvdka5x6aq3SRntiMTh5NLNDRwlWcJJ7Y7InevIjS6gmbQdmcsFXdyVXagVIZ";

    const workbook = new GC.Spread.Sheets.Workbook(document.getElementById("sheet"));
    
    workbook.suspendPaint();
    workbook.suspendCalcService(false);

    const metadata = [
        { prop: "dadosEmpresaAtual", stampYear: 0},
        { prop: "dadosEmpresaAnoPassado", stampYear: 1 }
    ];
    data.forEach((mkt, i) =>
        metadata.forEach((mt, z) => {
            const labelSheet = `DB ${mkt.nome} ${(mkt.periodoFinal - (mt.stampYear * 100)).toString().substr(0, 4)}`;
            const positionSheet = (i * metadata.length) + z;
            generateSheets(workbook, mkt[mt.prop], labelSheet, positionSheet);
        }));
}

const generateSheets = (workbook: GC.Spread.Sheets.Workbook, data: EstatisticaEmpresa[], titleSheet: string, position: number) => {
    let sheet = new GC.Spread.Sheets.Worksheet(titleSheet);
    workbook.addSheet(position, sheet);

    const styleTitle = new GC.Spread.Sheets.Style();
    styleTitle.backColor = "red";
    styleTitle.foreColor = "white";
    
    const styleLineEven = new GC.Spread.Sheets.Style();
    styleTitle.backColor = "black";
    styleTitle.foreColor = "white";
    
    const styleLineOdd = new GC.Spread.Sheets.Style();
    styleTitle.backColor = "white";
    styleTitle.foreColor = "green";

    const alphabet = "abcdefghijklmnopqrsuvwxyz";
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

    title.forEach((line, y) => 
        line.forEach((item, x) => {
            sheet.setValue(y, x, item.titulo);
            sheet.setStyle(y, x, styleTitle);
            if(item.sum)
                sheet.setFormula(y, x, `=SUM(${alphabet[x]}${title.length+1}:${alphabet[x]}${data.length+title.length})`)
        }));

    data.forEach((obj, i) => {
        const rowNumber: number = i + title.length;
        const style = !!(i % 2) ? styleLineEven : styleLineOdd;
        [
            obj.idSusep, 
            obj.empresa, 
            obj.premioEmitido, 
            obj.premioGanho, 
            obj.despesaResseguro, 
            obj.sinistroOcorrido, 
            obj.receitaResseguro, 
            obj.despesaComercial, 
            obj.sinistralidade, 
            obj.rvne
        ].forEach((column, x) => {
            sheet.setValue(rowNumber, x, column);
            sheet.setStyle(rowNumber, x, style);
        })
    })

    workbook.resumeCalcService(false);
    workbook.resumePaint();
    //to do uncoment when finishies
    //messager({type: msgType.cleanStorage} as Mensagem)
}