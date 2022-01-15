export function component(name) {
  return function (target) {
    target.componentName = name;
  };
}

export function dependencies(list) {
  return function (target) {
    target.dependencies = list;
  };
}