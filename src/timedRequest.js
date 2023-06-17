const period = 2000; // 2 sec 
const queue = []; 
const promisesFn = new Map(); 
let processing = false; 

export default function enqueueRequest(url) {
  const controller = new AbortController(); 
  const abort = controller.abort.bind(controller); 
  const { signal } = controller; 
  const ready = new Promise((resolve, reject) => {
    const request = { url, done: false }; 
    signal.addEventListener('abort', () => {
      if(!request.done) {
        request.done = true; 
        reject(signal.reason); 
      }
    }); 
    queue.push(request); 
    if(!promisesFn.has(url)) {
      promisesFn.set(url, []); 
    }
    promisesFn.get(url).push({
      resolve: (res) => {
        if(!request.done) {
          request.done = true; 
          resolve(res); 
        }
      },
      reject: (err) => {
        if(!request.done) {
          request.done = true; 
          reject(err); 
        }
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
      .then(res => res.json())
      .then(data => promisesFn.get(url).forEach(({ resolve }) => resolve(data)))
      .catch(err => promisesFn.get(url).forEach(({ reject }) => reject(err)))
      .finally(() => {
        promisesFn.delete(url); 
        setTimeout(dequeueRequest, Math.max(0, period - (Date.now() - startMillis)))
      });
  } else {
    processing = false; 
  }  
}