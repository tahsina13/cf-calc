const period = 2000; // 2 sec 
const requests = []; 
let processing = false; 

export default function enqueueRequest(url, options) {
  return new Promise((resolve, reject) => {
    requests.push({ url, options, resolve, reject }); 
    if(!processing) {
      dequeueRequest(); 
    }
  }); 
}

function dequeueRequest() {
  if(requests.length) {
    processing = true; 
    const startMillis = Date.now(); 
    const { url, options, resolve, reject } = requests.shift(); 
    fetch(url, options)
      .then(resolve, reject)
      .finally(() => {
        setTimeout(dequeueRequest, Math.max(0, period - (Date.now() - startMillis))); 
      }); 
  } else {
    processing = false; 
  }  
}