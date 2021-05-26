import onChange from 'on-change';

const render = (state, elements) => (path, value) => {
  switch(value) {
    case 'filling':
      console.log('process setted as filling');
      break;
    case 'sending':
      console.log('process setted as sending');
      break;
    case 'access fault':
      console.log('process setted as accesss fault');
      break;
    case 'validation fault':
      console.log('process setted as validation fault');
      
      break;
  } 
};

export default render;
