import * as $ from 'jquery';
import { Mensagem, msgType, PayloadConfigs, PayloadStartProcess } from "./types";
// import manifest from '../dist/js/manifest.json';

const messager = chrome.runtime.sendMessage;
$(function() {
  const getIntVal = fieldId => parseInt($(`#${fieldId}`).val().toString(), 10)
  const data = new Date();
  $("#periodoFim").val(`${data.getFullYear()}${padLeft(data.getMonth(), 2, '0')}`);
  $("#periodoInicial").val(`${data.getFullYear()}01`);

  $('#generate').click(()=>{
    const periodoFinal = getIntVal("periodoFim");
    const periodoInicial = getIntVal("periodoInicial");
    chrome.runtime.sendMessage({ type: msgType.startProcess, payload: {periodoInicial, periodoFinal} as PayloadStartProcess } as Mensagem);
    window.close();
  });

  const textAreaFields = ['markets', 'aggregatedCompanies'];

  const toggleSettings = () => {
    $("body").toggleClass("bodyConfig");
    $(".form").toggleClass("hide");
    $(".menuConfig").toggleClass("hide");
    updateConfigs();
  }

  const updateConfigs = () => 
    messager({
      type: msgType.getConfigs
    } as Mensagem, 
    (configs: PayloadConfigs) => {
      textAreaFields.forEach(field => 
        $(`#${field}`).val(JSON.stringify(configs[field], null, 2)));

      ($('#generateRowData')[0] as any).checked = configs.generateRawData;
      $("#nameExportedFile").val(configs.nameExportedFile);
    });

  const getValue = (idField: string): string => $.trim($(`#${idField}`).val() as string);

  const isValidJson = (idField: string): boolean =>{
    try{
      JSON.parse(getValue(idField));
      return true;
    }catch{
      return false;
    }
  }

  $('#btnSettings').click(toggleSettings);
  
  $('#btnReestoreSettings').click(() => 
    messager({ type: msgType.resetConfigs } as Mensagem, () => {
      updateConfigs();
      const changeClass = () => textAreaFields.forEach(x => $(`#${x}`).toggleClass('hasSuccess'));
      changeClass();
      setTimeout(changeClass, 800);
    }));

  $('#btnBack').click(toggleSettings);

  $('#btnSave').click(() => {
    let obj : PayloadConfigs = {} as PayloadConfigs;

    const hasError = !!textAreaFields.filter(x => {
      var field =  $(`#${x}`);
      field.removeClass("hasError");

      if(!isValidJson(x)){
        field.addClass("hasError")
        return true;
      }
      obj[x] = JSON.parse(getValue(x));
      return false
    }).length;

    if(hasError)
      return;

    obj.generateRawData = !!($('#generateRowData')[0] as any).checked;
    obj.nameExportedFile = $("#nameExportedFile").val() as string;
    
    messager({
      type: msgType.saveConfigs,
      payload: obj
    } as Mensagem, toggleSettings)
  });
});

const padLeft = function (src, n ,str){
  return Array(n - String(src).length+1).join(str||'0')+src;
}


