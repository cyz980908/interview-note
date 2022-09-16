const isFunction = function(fun) {
  return fun && typeof fun === "function";
};

const isObject = function(value) {
  return value && typeof value === "object";
};

class MyPromise {
  static RESOLVE = 'RESOLVE';
  static REJECT = 'REJECT';
  static PENDING = 'PENDING';
  constructor(fun){
    if (!isFunction(fun)) {
      throw new TypeError("Promise constructor's argument must be a function");
    }
    this.status = MyPromise.PENDING
    this.result = null
    this.resolveCb = []
    this.rejectCb = []
    try {
      // when throw a error in promise it will reject
      fun(this.resolve, this.reject)
    } catch (error) {
      this.reject(error)
    }
  }
  resolve = (x) => {
      // 2.3.1 If promise and x refer to the same object, reject promise with a TypeError as the reason.
      if(this === x) return this.reject(new TypeError("Promise can not resolved with it seft"));
      // 2.3.2 If x is a promise, adopt its state
      else if ( x instanceof MyPromise ) return x.then(this.resolve,this.reject)
      // 2.3.3 Otherwise, if x is an object or function
      else if (isObject(x) || isFunction(x) ) {
        let called = false
        // 2.3.3.1 Let then be x.then；
        // 2.3.3.2 If retrieving the property x.then results in a thrown exception e, reject promise with e as the reason.
        try {
          let then = x.then
          // 2.3.3 If then is a function, call it with x as this, first argument resolvePromise, and second argument rejectPromise
          if (isFunction(then)) {
            // IMPORTANT: do not use x.then(), the x.then property may be chanegd, so the then variable is checked before and it's right
            then.call(x, (res)=>{
              if(called) return
              called = true
              this.resolve(res)
            }, error => {
              if(called) return
              called = true
              this.reject(error)
            })
            return
          }
        } catch (error) {
          if(called) return
          called = true
          this.reject(error)
        }

      }
      if(this.status === MyPromise.PENDING){
        this.status = MyPromise.RESOLVE
        this.result = x
        this.resolveCb.forEach(callback=>callback())
      } 
  }

  reject = (val) => {
      if(this.status === MyPromise.PENDING) {
        this.status = MyPromise.REJECT
        this.result = val
        this.rejectCb.forEach(callback=>callback())
      } 
  }

  then = (onFulfilled, onRejected) => {
    // can support the type of not a function
    onFulfilled = isFunction(onFulfilled) ? onFulfilled : (value) => value
    onRejected = isFunction(onRejected) ? onRejected : (error) => { throw error}
    // thenable chain return a Promise
    return new MyPromise((resolve, reject)=>{
      const wrapOnFulfilled = ()=> { 
        setTimeout(()=>{
          try {
            resolve(onFulfilled(this.result))
          } catch (error) {
            reject(error)
          }
        })
      }
      const wrapOnRejected = ()=> { 
        setTimeout(()=>{
          try {
            resolve(onRejected(this.result))
          } catch (error) {
            reject(error)
          }
        })
      }
      if(this.status === MyPromise.RESOLVE) wrapOnFulfilled()
      else if(this.status === MyPromise.REJECT) wrapOnRejected()
      else {
        // pending status, save the callback function
        this.resolveCb.push(wrapOnFulfilled)
        this.rejectCb.push(wrapOnRejected)
      }
    })
  }

  catch = (callback) => {
    return this.then(null, callback)
  }

  finally = (callback) => {
    return this.then((res)=>{
      callback()
      return res
    }, (error)=>{
      callback()
      throw error
    })
  }

  static resolve = (value) => {
    return value?value:new MyPromise((res)=>{
      res(value)
    })
  }

  static reject = (reason) => {
    return new MyPromise((resolve, reject) => reject(reason))
  }

  static race = (arr) => {
    return new MyPromise((resolve, reject)=>{
      arr.forEach(val=>{
        MyPromise.resolve(val).then(resolve, reject)
      })
    })
  }

  static all = (arr) => {
    return new MyPromise((resolve, reject) => {
      if(!arr.length) {
        resolve([])
        return
      }
      let result = [], count = 0
      arr.forEach((item,idx)=>{
        MyPromise.resolve(item).then((res)=>{
          result[idx] = res
          if(++count == arr.length) {
            resolve(result)
          }
        },error => {
          reject(error)
        })
      })
    })
  }

  static allSettled = () => {
    return new MyPromise((resolve, reject) => {
      if(!arr.length) {
        resolve([])
        return
      }
      let result = [], count = 0
      arr.forEach((item,idx)=>{
        MyPromise.resolve(item).then((res)=>{
          result[idx] = {
            status: MyPromise.RESOLVE,
            reason: res
          }
          if(++count == arr.length) {
            resolve(result)
          }
        }, error => {
          result[idx] = {
            status: MyPromise.REJECT,
            reason: error
          }
          if(++count == arr.length) {
            resolve(result)
          }
        })
      })
    })
  }
  
  // for the promises-aplus-tests
  static deferred = () => {
    const obj = {}
    obj.promise = new MyPromise((res,rej)=>{
      obj.resolve = res
      obj.reject = rej
    })
    return obj
  }

}

module.exports = MyPromise