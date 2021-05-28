import onChange from 'on-change';

const render = (state, elements) => (path, value) => {

  const renderList = (list) => {
    // console.log('>>>from renderList');
    // console.log(list);
    list.forEach((feed) => {
      const postsUl = document.createElement('ul');
      postsUl.classList.add('list-group', 'list-group-flush');

      feed.posts.forEach((post) => {
        const li = document.createElement('li');
        li.classList.add('list-group-item');
        const a = document.createElement('a');
        a.href = post.link;
        a.textContent = post.title;
        li.appendChild(a);
        postsUl.appendChild(li);
      });
      elements.postsContainer.appendChild(postsUl);
    });  
  };

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
      renderList(state.feeds);
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
