import { component } from '../decorators'


@component('body')
class Body {
  constructor(element, options) {
    console.log('This is the Body component!', element, options);
  }
}

export default Body