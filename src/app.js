import $ from 'jquery';
import axios from 'axios';
import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import DOMPurify from 'dompurify';
import resources from './locales';
import render from './view.js';
import parse from './parser.js';

const validate = ({ feeds }, userUrl, i18n) => {
  const validator = yup.string().required().url()
    .notOneOf(feeds.map(({ url }) => url));
  try {
    validator.validateSync(userUrl);
  } catch (error) {
    console.log(error.message);
    return error.message;
  }
  return null;
};

const useProxy = (url) => {
  const proxy = new URL('https://hexlet-allorigins.herokuapp.com/get');
  proxy.searchParams.set('disableCache', 'true');
  proxy.searchParams.set('url', `${url}`);
  return proxy.toString();
};

const createIdGenerator = () => {
  let num = 0;
  return () => {
    num += 1;
    return num;
  };
};

const generateFeedId = createIdGenerator();
const generatePostId = createIdGenerator();

const runUpdater = (feed) => {
  feed.onUpdate = true;
  const update = () => {
    window.setTimeout((link) => {
      makeRequest(link)
        .then((data) => parse(data, i18nInstance))
        .then((news) => {
          const uniqNews = news.posts.filter(
            (item) => feed.posts.every((post) => post.link !== item.link)
          );
          if (uniqNews.length === 0) {
            // no news
          } else {
            uniqNews.forEach((item) => {
              item.id = generatePostId();
              feed.posts.unshift(item);
              watchedState.process = 'updating';
              watchedState.process = '';
            });
          }
          update(link);
        }).catch((err) => {
          feed.onUpdate = false;
        });
    }, 5000, feed.url);
  };
  update();
};

const makeRequest = (url) => axios.get(useProxy(url))
  .catch((err) => console.log(err))
  .then((serverResponce) => {
    const { contents } = serverResponce.data;
    if (contents === null) {
      const error = new Error('cannot connect to server');
      error.name = 'webAccessError';
      throw error;
    }
    return contents;
  });


export default () => {
  const state = {
    currentLang: 'ru',
    formState: {
      validity: true,
      validationError: null,
    },
    feedRequest: {
      process: 'preparation',
      error: null,
    },
    // process: 'filling',
    feeds: [],
    posts: [],
    errors: {
      webError: '',
      validationError: '',
    },
    modalWindow: {
      content: '1::1', // this code means feed id and post id
    },
  };

  const i18nInstance = i18next.createInstance();

  return  i18nInstance.init({
    lng: 'ru',
    debug: false,
    resources,
  }).then(() => {

    yup.setLocale({
      mixed: {
        required: 'required',
        notOneOf: 'alreadyExist',
      },
      string: {
        url: 'mustBeUrl',
      },
    });

  const elements = {
    container: document.querySelector('.container'),
    statusContainer: document.querySelector('#status'),
    feedsContainer: document.querySelector('.feeds'),
    postsContainer: document.querySelector('.posts'),
    form: document.querySelector('form'),
    button: document.querySelector('button'),
    input: document.querySelector('input'),
    errorDiv: document.querySelector('.invalid-feedback'),
    modalWindow: {
      title: document.querySelector('.modal-title'),
      body: document.querySelector('.modal-body'),
      button: document.querySelector('.readMoreBtn'),
    },
  };

  const handler = render(state, elements, i18nInstance);
  const watchedState = onChange(state, handler);


  $('#myModal').on('show.bs.modal', (e) => {
    watchedState.process = 'showingModal';
    const contentID = e.relatedTarget.id;
    state.modalWindow.content = contentID;
    const [feedID, postID] = contentID.split('::');
    const currentPost = state.feeds
      .find((feed) => feed.id === Number(feedID))
      .posts
      .find((post) => post.id === Number(postID));
    elements.modalWindow.title.textContent = currentPost.title;
    elements.modalWindow.body.innerHTML = DOMPurify.sanitize(currentPost.description);
    elements.modalWindow.button.addEventListener('click', () => {
      window.open(currentPost.link, '_blank');
    });
    currentPost.wasRead = true;
  });
  $('#myModal').on('hide.bs.modal', () => {
    watchedState.process = 'updating';
    elements.modalWindow.body.innerHTML = '';
  });

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const userUrl = elements.input.value;
    const validationResult = validate(state, userUrl, i18nInstance);
    if (validationResult !== null) {
      watchedState.formState.validationError = validationResult;
      console.log('validation fault!!');
      watchedState.formState.validity = false; //           TRANSITION
      return;
    }
    watchedState.formState.validity = true;
    watchedState.process = 'sending'; //                      TRANSITION
    makeRequest(userUrl)
      .then((data) => parse(data, i18nInstance))
      .then((feed) => {
        feed.id = generateFeedId();
        feed.url = userUrl;
        feed.onUpdate = false;
        feed.posts.forEach((post) => {
          post.id = generatePostId();
          post.wasRead = false;
        });
        state.feeds.push(feed);
        watchedState.process = 'filling'; //                  TRANSITION
        state.feeds.forEach((feed) => {
          if (feed.onUpdate === false) runUpdater(feed);
        });
      })
      .catch((err) => {
        console.log(JSON.stringify(err));
        switch (err.name) {
          case 'parseError':
            state.errors.webError = i18nInstance.t('statusBar.parseError');
            break;
          default:
            state.errors.webError = i18nInstance.t('statusBar.webError');
        }
        watchedState.process = 'access fault';
      });
  });
  }); // promise return 
};
