import onChange from 'on-change';
/*
const showError = ({ input, button, errorDiv }, command = 'show') => {
  if (command === 'show') {
     errorDiv.textContent = state.errors.validationError; 

    input.classList.add('is-invalid');
    input.classList.remove('border-primary');
    input.classList.add('border-danger');
    button.classList.remove('btn-outline-primary');
    button.classList.add('btn-outline-danger');
  }
  if (command === 'hide') {
    input.classList.remove('is-invalid');
    button.classList.remove('btn-outline-danger');
    button.classList.add('btn-outline-primary');
  }
}
*/

const render = (state, elements) => (path, value) => {

  const showValidationError = ({ input, button, errorDiv }, command = 'show') => {
    if (command === 'show') {
      errorDiv.textContent = state.errors.validationError;

      input.classList.add('is-invalid');
      input.classList.remove('border-primary');
      input.classList.add('border-danger');
    }
    if (command === 'hide') {
      input.classList.remove('is-invalid');
      input.classList.remove('border-danger');
      input.classList.add('border-primary');
    }
  };

  switch(value) {
    case 'filling':
      console.log('process setted as filling');
      break;
    case 'sending':
      console.log('process setted as sending');
      showValidationError(elements, 'hide')
      break;
    case 'access fault':
      console.log('process setted as accesss fault');
      break;
    case 'validation fault':
      console.log('process setted as validation fault');
      showValidationError(elements);

      break;
  } 
};

export default render;
