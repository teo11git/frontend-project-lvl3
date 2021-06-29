/* eslint-disable no-param-reassign */
/* eslint no-unused-expressions: ["error", { allowTernary: true }] */

export default (state, elements, i18n) => {
  const renderFeeds = ({ feeds }) => {
    elements.feedsContainer.innerHTML = '';

    const feedHeader = document.createElement('h2');
    feedHeader.classList.add('border-bottom', 'border-primary');
    feedHeader.textContent = 'Feeds';
    elements.feedsContainer.appendChild(feedHeader);

    const feedsDl = document.createElement('dl');
    feedsDl.classList.add('mt-3');
    feedsDl.classList.add('row');

    feeds.forEach((feed) => {
      const feedTerm = document.createElement('dt');
      feedTerm.classList.add('col-3');
      feedTerm.textContent = feed.title;
      feedsDl.appendChild(feedTerm);

      const feedDefinition = document.createElement('dd');
      feedDefinition.classList.add('col-9');
      feedDefinition.textContent = feed.description;

      feedsDl.appendChild(feedDefinition);
      elements.feedsContainer.appendChild(feedsDl);
    });
  };

  const renderPosts = ({ posts }) => {
    elements.postsContainer.innerHTML = '';

    const postHeader = document.createElement('h2');
    postHeader.classList.add('border-bottom', 'border-primary');
    postHeader.textContent = 'Posts';
    elements.postsContainer.appendChild(postHeader);

    const postsUl = document.createElement('ul');
    postsUl.classList.add('mt-2');
    postsUl.classList.add('list-group', 'list-group-flush');

    posts.forEach((post) => {
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

  const disableElements = ({ input, button }, command = true) => {
    if (command === false) {
      input.removeAttribute('readonly');
      button.removeAttribute('disabled');
    } else if (command === true) {
      input.setAttribute('readonly', true);
      button.setAttribute('disabled', 'disabled');
    }
  };

  const showValidationError = ({ input, errorDiv }) => {
    errorDiv.textContent = i18n.t(
      `validationMessages.${state.formState.validationError}`,
    );
    input.classList.add('is-invalid');
    input.classList.remove('border-primary');
    input.classList.add('border-danger');
  };

  const hideValidationError = ({ input }) => {
    input.classList.remove('is-invalid');
    input.classList.remove('border-danger');
    input.classList.add('border-primary');
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

  const formHandler = (val) => {
    if (val === false) {
      showValidationError(elements);
      showStatus(i18n.t('statusBar.validationError'), 'danger');
    } else if (val === true) {
      hideValidationError(elements, 'hide');
    }
  };

  const processHandler = (val) => {
    switch (val) {
      case 'requesting':
        disableElements(elements);
        showStatus(i18n.t('statusBar.trying'));
        break;
      case 'success':
        showStatus(i18n.t('statusBar.success'), 'success');
        elements.input.value = '';
        disableElements(elements, false);
        break;
      case 'failing':
        disableElements(elements, false);
        showStatus(
          i18n.t(`statusBar.${state.feedRequest.error}`),
          'danger',
        );
        break;
      default:
        throw new Error(`Unknown input value: '${val}'!`);
    }
  };

  return (path, value) => {
    switch (path) {
      case 'formState.isValid':
        formHandler(value);
        break;
      case 'feedRequest.process':
        processHandler(value);
        break;
      case 'posts':
        renderPosts(state);
        break;
      case 'feeds':
        renderFeeds(state);
        break;
      case 'ui.postsWasRead':
        renderPosts(state);
        break;
      default:
        /* do nothing */
    }
  };
};
