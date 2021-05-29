import onChange from 'on-change';


const { log } = console;
const render = (state, elements) => (path, value) => {

  const renderList = (list) => {
    elements.feedsContainer.innerHTML = '';
    elements.postsContainer.innerHTML = '';

    const feedHeader = document.createElement('h2');
    feedHeader.classList.add('border-bottom', 'border-primary');
    feedHeader.textContent = 'Feeds';
    elements.feedsContainer.appendChild(feedHeader);

    const postHeader = document.createElement('h2');
    postHeader.classList.add('border-bottom', 'border-primary');
    postHeader.textContent = 'Posts';
    elements.postsContainer.appendChild(postHeader);

    const feedsDl = document.createElement('dl');
    feedsDl.classList.add('mt-3');
    feedsDl.classList.add('row');

    const postsUl = document.createElement('ul');
    postsUl.classList.add('mt-2');
    postsUl.classList.add('list-group', 'list-group-flush');

    list.forEach((feed) => {
      const feedTerm = document.createElement('dt');
      feedTerm.classList.add('col-3');
      feedTerm.textContent = feed.feedInfo.domain;
      feedsDl.appendChild(feedTerm);

      const feedDefinition = document.createElement('dd');
      feedDefinition.classList.add('col-9');
      feedDefinition.textContent = feed.feedInfo.description;

      feedsDl.appendChild(feedDefinition);
      elements.feedsContainer.appendChild(feedsDl);

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

  const showStatus = (text, mode) => {
    const div = elements.statusContainer;
    div.innerHTML = '';
    div.classList.remove(...div.classList);
    div.classList.add('alert');
    switch (mode) {
      case 'success':
        div.classList.add('alert-success');
        break;
      case 'danger':
        div.classList.add('alert-danger');
        break;
      default:
        div.classList.add('alert-info');
    }
    div.textContent = text;
  };
  switch(value) {
    case 'filling':
      console.log('process setted as filling');
      showStatus('News feed downloaded successfully', 'success');
      renderList(state.feeds);
      elements.input.value = '';
      break;
    case 'sending':
      showStatus('Trying to get the news feed')
      console.log('process setted as sending');
      showValidationError(elements, 'hide');
      break;
    case 'access fault':
      showStatus('Cannot connect to server. Please, check url and try again', 'danger');
      console.log('process setted as accesss fault');
      break;
    case 'validation fault':
      console.log('process setted as validation fault');
      showValidationError(elements);
      break;
  } 
};

export default render;
