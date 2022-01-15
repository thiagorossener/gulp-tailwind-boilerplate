// Based on utils from https://blog.garstasio.com/you-dont-need-jquery/utils/
const data = window.WeakMap
  ? new WeakMap()
  : (function () {
      let lastId = 0,
        store = {};

      return {
        set: function (element, info) {
          let id;
          if (element.myCustomDataTag === undefined) {
            id = lastId++;
            element.myCustomDataTag = id;
          }
          store[id] = info;
        },
        get: function (element) {
          return store[element.myCustomDataTag];
        },
      };
    })();

export function getData(el) {
  return data.get(el);
}

export function setData(el, obj) {
  data.set(el, obj);
}

export function getComponent(el) {
  return getData(el).component;
}

export function findComponent(componentClass, parent) {
  const context = parent ? parent : document;
  return getData(context.querySelector(`[data-component="${componentClass.componentName}"]`)).component;
}

export function findComponents(componentClass) {
  const elements = Array.from(
    document.querySelectorAll(
      `[data-component="${componentClass.componentName}"]`
    )
  );
  return elements.map((element) => getData(element).component);
}

export function findComponentWithId(componentClass, id) {
  return getData(
    document.querySelector(
      `[data-component="${componentClass.componentName}"]#${id}`
    )
  ).component;
}

export class Timer {
  constructor(callback, delay) {
    let timerId,
      start,
      remaining = delay;

    this.pause = function () {
      window.clearTimeout(timerId);
      remaining -= new Date() - start;
    };

    let resume = function () {
      start = new Date();
      timerId = window.setTimeout(function () {
        remaining = delay;
        resume();
        callback();
      }, remaining);
    };
    this.resume = resume;

    this.reset = function () {
      remaining = delay;
    };

    this.resume();
  }
}

/**
 * BreakpointListener
 *
 * Provide information when screen size changes from/to several breakpoints.
 *
 * @param {function} callback
 * @param {json} breakpoints
 */
export class BreakpointListener {
  constructor(callback, breakpoints) {
    this.screenSize = null;
    this.windowWidth = window.innerWidth;
    this.timeout = null;

    this.checkView = () => {
      let keys = Object.keys(breakpoints);

      let screenSize = keys.slice(-1)[0];

      for (let i = keys.length - 1; i >= 0; i--) {
        let value = breakpoints[keys[i]];
        if (this.windowWidth < value) {
          screenSize = keys[i - 1] || 'xs';
        }
      }

      let hasChanged = this.screenSize !== screenSize;

      this.screenSize = screenSize;

      callback({
        screenSize: this.screenSize,
        hasChanged: hasChanged,
      });
    };

    this.listener = () => {
      if (this.windowWidth !== window.innerWidth) {
        this.windowWidth = window.innerWidth;

        if (this.timeout) {
          clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(this.checkView, 250);
      }
    };

    window.addEventListener('resize', this.listener);

    this.checkView();
  }
}