import 'lazysizes';
import 'lazysizes/plugins/unveilhooks/ls.unveilhooks';
import 'lazysizes/plugins/object-fit/ls.object-fit';

import Loader from './loader';

import Body from './components/body';


(() => {
  Loader.load(document, [
    Body
  ]);
})();