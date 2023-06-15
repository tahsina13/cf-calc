const period = 2000; // 2 sec 
const queue = []; 
const promisesFn = new Map(); 
let processing = false; 

export default function enqueueRequest(url) {
  const controller = new AbortController(); 
  const { abort, signal } = controller; 
  const ready = new Promise((resolve, reject) => {
    const request = { url, done: false }; 
    signal.addEventListener('abort', () => {
      reject(new Error()); 
      request.done = true; 
    }); 
    queue.push(request); 
    if(!promisesFn.has(url)) {
      promisesFn.set(url, []); 
    }
    promisesFn.get(url).push({
      resolve: (res) => {
        resolve(res); 
        request.done = true; 
      },
      reject: (err) => {
        reject(err); 
        request.done = true; 
      }
    }); 
    if(!processing) {
      dequeueRequest(); 
    }
  }); 
  return { abort, ready }; 
}

function dequeueRequest() {
  while(queue.length && queue[0].done) {
    queue.shift(); 
  }
  if(queue.length) {
    processing = true; 
    const startMillis = Date.now(); 
    const { url } = queue.shift(); 
    fetch(url)
      .then(res => promisesFn.get(url).forEach(({ resolve }) => resolve(res)))
      .catch(err => promisesFn.get(url).forEach(({ reject }) => reject(err)))
      .finally(() => {
        promisesFn.delete(url); 
        setTimeout(dequeueRequest, Math.max(0, period - (Date.now() - startMillis)))
      });
  } else {
    processing = false; 
  }  
}