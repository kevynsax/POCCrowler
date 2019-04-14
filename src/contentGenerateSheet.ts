import { msgType, Mensagem, Mercado, GrupoEmpresarial } from "./types";
import * as $ from 'jquery';
import * as GC from "@grapecity/spread-sheets";
import '@grapecity/spread-sheets/styles/gc.spread.sheets.excel2016colorful.css';

const messager = chrome.runtime.sendMessage;
messager({
    type: msgType.getDataToExport
} as Mensagem, response => {
    if(!response)
        return;

    const lst = response as Mercado[];

    console.log(lst);
    generateSpreadSheet(lst)
})

const generateSpreadSheet = (lst: Mercado[]) => {
    
    let element = "<div style='height:700px ; width :100%;' id='sheet'></div>";
    $("body").html(element);

    messager({ type: msgType.getAggregatedCompanies } as Mensagem, lstGroups => teste(lst, lstGroups));    
}

const teste = (lst: Mercado[], lstAggregateCompanies: GrupoEmpresarial[]) => {
    
    $.support.cors = true;
    GC.Spread.Sheets.LicenseKey = "E628286641333291#B0wN4cKRTN7BlZxBjNYF7Y9E5QYBVZMJlSqh7Zod7RZZTdJRmc8FUcpR4V9NTRFRVNpFzQ8EDOTNmRUBneqdjdpp6YBhjTMxmMiFWNytkQVl6LL3ka0F5Y9QWUZ5ENv5USJdTTrVEcMhFV7l4MqN5ZvQzb4lVMPFnNCNWWSRUO4V7V9UHRUJWUlR4cRxGVqdDOvVnblp4RIFnS7QGa4UzKvRkZEZ5NHFUU4g6Rqp7NKhUTst6Svpkb5AXT5kERuNEUYtET9JXexl6bTtWWu9GaKBzdKFlTR9UY6sUUMJHWSB7LoZHRvJVbVdTerE4TutiVDhDc8JUMa9kYwgmbidzbmlDThtUYwonQMxEeiVGRiojITJCLiUEMFFTO7YjI0ICSiwCMwMzM5gDMyETM0IicfJye#4Xfd5nIJZUOCJiOiMkIsIiMx8idgMlSgQWYlJHcTJiOi8kI1tlOiQmcQJCLiQTM8QDNwAiMyATM8EDMyIiOiQncDJCLi86Yu46bj9Se4l6YlBXYydmLqwSbvNmL9RXajVGchJ7ZuoCLwpmLvNmL9RXajVGchJ7ZuoCLt36YuUmbvRnbl96bw56bj9iKiojIz5GRiwiIuMmbJBSe4l6QlBXYydkI0ISYONkIsUWdyRnOiwmdFJCLiETOyMzMzEDN6YDOygjM6IiOiQWSiwSflNHbhZmOiI7ckJye0ICbuFkI1pjIEJCLi4TPRtCeF56N4FFVCNlNRZ5YmN5LSZkZ6lUU0RUQvdka5x6aq3SRntiMTh5NLNDRwlWcJJ7Y7InevIjS6gmbQdmcsFXdyVXagVIZ";
    const workbook = new GC.Spread.Sheets.Workbook(document.getElementById("sheet"));

    //workbook.suspendPaint();
    //workbook.suspendCalcService(false);

    const mercado1 = lst[0];

    let sheet = workbook.getActiveSheet();
    sheet.name(mercado1.nome);
    
    const styleRed = new GC.Spread.Sheets.Style();
    styleRed.backColor = "red";
    styleRed.foreColor = "white";
    
    const styleBlack = new GC.Spread.Sheets.Style();
    styleBlack.backColor = "black";
    styleBlack.foreColor = "white";

    const labelPeriodoInicial = mercado1.periodoFinal.toString().substr(0,4);
    const labelPeriodoFinal = mercado1.periodoFinal.toString().substr(4,2);
    const firsLabel = `YTD ${labelPeriodoInicial}/${labelPeriodoFinal}  - ${mercado1.nome} (${mercado1.idRamos.join(', ')})`;
    [[
        { name: firsLabel, style: styleRed, agrupar: 2 },
        { name: `Prêmio Emitido (${mercado1.periodoFinal.toString().substr(0,4)})` },
        { name: `MKT Share` },
        { name: `Prêmio Emitido (${mercado1.periodoInicial.toString().substr(0,4)})` },
        { name: `Var.` },
        { name: `Prêmio Ganho` },
        { name: `Despesa c/ Resseguro` },
        { name: `Sinistro Ocorrido` },
        { name: `Receita c/ Resseguro` },
        { name: `Despesa Comercial` },
        { name: `Sinistralidade` },
        { name: `RVNE` },
    ],
    [  
        { name: `Class.`},
        { name: `Totais`},
        { name: ``},
        { name: `100%`},
        ...Array.from({length: 9}, z => ({name: ''}))
    ]]
    .forEach((line, y) => 
        line.forEach((item, i, list) => {
            if (item.agrupar) 
                sheet.addSpan(0,0,1,item.agrupar);
            const skip = list.slice(0, i).filter(x => x.agrupar).reduce((agregado, atual) => agregado + atual.agrupar -1, 0);

            sheet.setValue(y, skip + i, item.name);
            sheet.setStyle(y, skip + i, item.style || styleBlack);
        })
    )

    //messager({ type: msgType.finishiesExportSpreadSheet } as Mensagem);

    return;
    sheet.addRows(11, 1);
    sheet.copyTo(10, 1, 11, 1, 1, 19, GC.Spread.Sheets.CopyToOptions.style);

    sheet.setValue(11, 1, "Revenue 8");

    for (var c = 3; c < 15; c++) {
        sheet.setValue(11, c, Math.floor(Math.random() * 200) + 10);
    }

    var data = new GC.Spread.Sheets.Range(11, 3, 1, 12);
    var setting = new GC.Spread.Sheets.Sparklines.SparklineSetting();
    var opt = setting.options as any;
    opt.seriesColor = "Text 2";
    opt.lineWeight = 1;
    opt.showLow = true;
    opt.showHigh = true;
    opt.lowMarkerColor = "Text 2";
    opt.highMarkerColor = "Text 1";

    sheet.setSparkline(11, 2, data, GC.Spread.Sheets.Sparklines.DataOrientation.horizontal, GC.Spread.Sheets.Sparklines.SparklineType.line, setting);

    sheet.setFormula(11, 15, "=SUM([@[Jan]:[Dec]])")
    sheet.setValue(11, 16, 0.15);
    sheet.copyTo(10, 17, 11, 17, 1, 13, GC.Spread.Sheets.CopyToOptions.formula);

    workbook.resumeCalcService(false);
    workbook.resumePaint();

}