export default (state, elements, i18n) => (path, value) => {
  const renderList = (list) => {
    if (list.length === 0) return;
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
      feedTerm.textContent = feed.domain;
      feedsDl.appendChild(feedTerm);

      const feedDefinition = document.createElement('dd');
      feedDefinition.classList.add('col-9');
      feedDefinition.textContent = feed.description;

      feedsDl.appendChild(feedDefinition);
      elements.feedsContainer.appendChild(feedsDl);

      feed.posts.forEach((post) => {
        const li = document.createElement('li');
        li.classList.add('list-group-item');
        li.classList.add('d-flex',
          'justify-content-between',
          'align-items-baseline');

        const a = document.createElement('a');
        a.href = post.link;
        a.textContent = post.title;
        post.wasRead
          ? a.classList.add('fw-normal', 'font-weight-normal')
          : a.classList.add('fw-bold', 'font-weight-bold');

        const viewBtn = document.createElement('button');
        viewBtn.setAttribute('type', 'button');
        viewBtn.setAttribute('data-toggle', 'modal');
        viewBtn.setAttribute('data-target', '#myModal');
        viewBtn.id = `${feed.id}::${post.id}`;
        viewBtn.classList.add('btn', 'btn-primary', 'readBtn');
        viewBtn.textContent = 'Read';

        li.appendChild(a);
        li.appendChild(viewBtn);
        postsUl.appendChild(li);
      });
      elements.postsContainer.appendChild(postsUl);
    });
  };

  const showValidationError = ({ input, errorDiv }, command = 'show') => {
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
  /*
  const disableForm = (command = true) => {
    const { input, button } = elements;
    if (command === true) {
      input.setAttribute('disabled', true);
      button.setAttribute('disabled', true);
    }
    if (command === false) {
      input.removeAttribute('disabled');
      button.removeAttribute('disabled');
    }
  };
*/

  switch (value) {
    case 'filling':
      showStatus(i18n.t('statusBar.success'), 'success');
      renderList(state.feeds);
      // disableForm(false);
      elements.input.value = '';
      break;
    case 'sending':
      // disableForm();
      showStatus(i18n.t('statusBar.trying'));
      showValidationError(elements, 'hide');
      break;
    case 'updating':
      renderList(state.feeds);
      break;
    case 'access fault':
      showStatus(state.errors.webError, 'danger');
      // disableForm(false);
      break;
    case 'validation fault':
      showStatus(i18n.t('statusBar.validationError'), 'danger');
      showValidationError(elements);
      break;
    default:
      // Do nothing
  }
};
