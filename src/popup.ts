import * as moment from 'moment';
import * as $ from 'jquery';
import { Mensagem, msgType } from "./types";

let count = 0;
$(function() {
  const queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    $('#url').text(tabs[0].url);
    $('#time').text(moment().format('YYYY-MM-DD HH:mm:ss'));
  });

  chrome.browserAction.setBadgeText({text: count.toString()});
  $('#countUp').click(()=>{
    chrome.browserAction.setBadgeText({text: (++count).toString()});
  });

  $('#generate').click(()=>
    chrome.runtime.sendMessage({ type: msgType.startProcess, payload: null} as Mensagem));
});
