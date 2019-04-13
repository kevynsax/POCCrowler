import * as $ from 'jquery';
import { Mensagem, msgType, PayloadConfigs } from "./types";

const messager = chrome.runtime.sendMessage;
$(function() {
  const data = new Date();
  $("#periodoFim").val(`${data.getFullYear()}${padLeft(data.getMonth(), 2, '0')}`)

  $('#generate').click(()=>{
    const periodoFim = parseInt($("#periodoFim").val().toString(), 10);
    chrome.runtime.sendMessage({ type: msgType.startProcess, payload: periodoFim } as Mensagem);
    window.close();
  });

  const fields = ['markets', 'aggregatedCompanies'];

  const toggleSettings = () => {
    $("body").toggleClass("bodyConfig");
    $(".form").toggleClass("hide");
    $(".menuConfig").toggleClass("hide");
    updateConfigs();
  }

  const updateConfigs = () => 
    messager({
      type: msgType.getConfigs
    } as Mensagem, (configs: PayloadConfigs) => 
    fields.forEach(field => $(`#${field}`).val(JSON.stringify(configs[field]))))

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
      const changeClass = () => fields.forEach(x => $(`#${x}`).toggleClass('hasSuccess'));
      changeClass();
      setTimeout(changeClass, 800);
    }));

  $('#btnBack').click(toggleSettings);

  $('#btnSave').click(() => {
    let obj : PayloadConfigs | object = {};

    const hasError = !!fields.filter(x => {
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
    
    messager({
      type: msgType.saveConfigs,
      payload: obj
    } as Mensagem, toggleSettings)
  });
});

const padLeft = function (src, n ,str){
  return Array(n - String(src).length+1).join(str||'0')+src;
}


