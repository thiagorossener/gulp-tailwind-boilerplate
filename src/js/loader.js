import { getData, setData } from './utils';

export default {
  load(root, componentsList, isDependency) {
    root.querySelectorAll('[data-component]').forEach((el) => {
      let names = el.getAttribute('data-component').split(',');
      names.forEach((name) => {
        let component = componentsList.find((c) => c.componentName === name);
        if (!component) {
          return false;
        } else {
          if (component.dependencies && component.dependencies.length) {
            this.load(el, component.dependencies, true);
          }
          let existing = getData(el) && getData(el).loadedComponents;
          if (!existing) {
            existing = [];
            setData(el, { loadedComponents: existing });
          }
          if (!(name in getData(el).loadedComponents)) {
            let options;
            try {
              options =
                eval('(' + el.getAttribute('data-component-options') + ')') ||
                {};
            } catch (ex) {
              options = {};
            }
            let Constructor = component;
            let obj = new Constructor(el, options);
            existing.push(name);
            setData(el, { component: obj });
            if (isDependency) {
              console.debug(`[App] Component '${name}' loaded as dependency.`);
            } else {
              console.debug(`[App] Component '${name}' loaded.`);
            }
          } else {
            console.debug(`[App] Component '${name}' already loaded`);
          }
        }
      });
      setTimeout(() =>
        document.documentElement.classList.remove('app-loading')
      );
    });
  },
};