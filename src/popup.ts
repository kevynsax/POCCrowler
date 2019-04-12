import * as moment from 'moment';
import * as $ from 'jquery';
import { Mensagem, msgType } from "./types";

$(function() {
  const data = new Date();
  $("#periodoFim").val(`${data.getFullYear()}${padLeft(data.getMonth(), 2, '0')}`)

  $('#generate').click(()=>{
    const periodoFim = parseInt($("#periodoFim").val().toString(), 10);
    chrome.runtime.sendMessage({ type: msgType.startProcess, payload: periodoFim } as Mensagem);
    window.close();
  });
});

const padLeft = function (src, n ,str){
  return Array(n - String(src).length+1).join(str||'0')+src;
}
