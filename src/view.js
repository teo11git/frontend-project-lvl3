/* eslint-disable no-param-reassign */
/* eslint no-unused-expressions: ["error", { allowTernary: true }] */

export default (state, elements, i18n) => (path, value) => {
  const renderList = ({ feeds, posts }) => {
    if (feeds.length === 0) return;
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

    feeds.forEach((feed) => {
      const feedTerm = document.createElement('dt');
      feedTerm.classList.add('col-3');
      feedTerm.textContent = feed.domain;
      feedsDl.appendChild(feedTerm);

      const feedDefinition = document.createElement('dd');
      feedDefinition.classList.add('col-9');
      feedDefinition.textContent = feed.description;

      feedsDl.appendChild(feedDefinition);
      elements.feedsContainer.appendChild(feedsDl);
    });
    posts
      .forEach((post) => {
        const li = document.createElement('li');
        li.classList.add('list-group-item');
        li.classList.add('d-flex',
          'justify-content-between',
          'align-items-baseline');

        const a = document.createElement('a');
        a.href = post.link;
        a.textContent = post.title;
        state.ui.postsWasRead.includes(post.id)
          ? a.classList.add('fw-normal', 'font-weight-normal')
          : a.classList.add('fw-bold', 'font-weight-bold');

        const viewBtn = document.createElement('button');
        viewBtn.setAttribute('type', 'button');
        viewBtn.setAttribute('data-toggle', 'modal');
        viewBtn.setAttribute('data-target', '#myModal');
        viewBtn.dataset.postId = `${post.id}`;
        viewBtn.classList.add('btn', 'btn-primary', 'readBtn');
        viewBtn.textContent = i18n.t('commonView.readButton');

        li.appendChild(a);
        li.appendChild(viewBtn);
        postsUl.appendChild(li);
      });
    elements.postsContainer.appendChild(postsUl);
  };
  const updateErrorMessage = ({ errorDiv }) => {
    console.log('updateed message');
    errorDiv.textContent = i18n.t(
      `validationMessages.${state.formState.validationError}`,
    );
  };

  const disableElements = (elements, command = true) => {
    if (command === false) {
      elements.input.removeAttribute('readonly');
      elements.button.removeAttribute('disable');
    }
    if (command === true)
      elements.input.setAttribute('readonly', true);
      elements.button.setAttribute('disable', true);
  };
  const showValidationError = ({ input }, command = 'show') => {
    if (command === 'show') {
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

  if (path === 'formState.validationError') {
    updateErrorMessage(elements);
  }

  if (path === 'formState.validity') {
    switch (value) {
      case false:
        updateErrorMessage(elements);
        showValidationError(elements);
        showStatus(i18n.t('statusBar.validationError'), 'danger');
        break;
      case true:
        showValidationError(elements, 'hide');
        break;
      default:
    }
  }
  if (path === 'feedRequest.process') {
    switch (value) {
      case 'requesting':
        console.log('trying');
        disableInput(elements);
        showStatus(i18n.t('statusBar.trying'));
        break;
      case 'getting':
        console.log('got it');
        showStatus(i18n.t('statusBar.success'), 'success');
        elements.input.value = '';
        disableElements(elements, false);
        renderList(state);
        break;
      case 'failing':
        disableElements(elements, false);
        showStatus(
          i18n.t(`statusBar.${state.feedRequest.error}`),
          'danger',
        );
        break;
      default:
    }
  }
  if (path === 'posts') {
    console.log('render new post!');
    renderList(state);
  }
  if (path === 'ui.postsWasRead') {
    renderList(state);
  }
};
