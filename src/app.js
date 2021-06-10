import $ from 'jquery';
import axios from 'axios';
import * as yup from 'yup';
import onChange from 'on-change';
import url from 'url';
import i18next from 'i18next';
import resources from './locales';
import render from './view.js';
import DOMPurify from 'dompurify';
import parse from './parser.js';

const validate = ({ feeds }, userUrl, i18n) => {
  yup.setLocale({
    mixed: {
      'default': 'Validation error',
      required: i18n.t('validationMessages.required'),
      url: i18n.t('validationMessages.url'),
    },
  });
  const validator = yup.string().required().url();
  try {
    validator.validateSync(userUrl);
  } catch (error) {
    return error.message;
  }
  const isAlreadyExist = !(feeds.every((feed) => feed.url !== userUrl));
  if (isAlreadyExist) return 'this URL allready exist';
  return '';
};

const useProxy = (url) => `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(url)}`;

const createIdGenerator = (num = 0) => () => {
  num += 1;
  return num;
};
const generateFeedId = createIdGenerator();
const generatePostId = createIdGenerator();

export default () => {
  const state = {
    currentLang: 'en',
    process: 'filling',
    feeds: [],
    errors: {
      webError: '',
      validationError: '',
    },
    modalWindow: {
      content: '1::1',
    },
  };

  const i18nInstance = i18next.createInstance();
  i18nInstance.init({
    lng: 'en',
    debug: false,
    resources,
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

  const makeRequest = (url) => {
    return axios.get(useProxy(url))
      .then((serverResponce) => {
        const { contents } = serverResponce.data;
        if (contents === null) {
          const error = new Error('cannot connect to server');
          error.name = 'webAccessError';
          throw error;
        }
        return contents;
      });
  };

  const startUpdater = (feed) => {
    console.log(`start updater on ${feed.domain}`);
    feed.onUpdate = true;
  
    const update = (link) => {
      window.setTimeout((link) => {
        isWork += 1;
        makeRequest(link) 
          .then(parse)
          .then((news) => {
            const uniqNews = news.posts.filter((item) => {
              return feed.posts.every((post) => post.link !== item.link);
            });
            if (uniqNews.length === 0) {
              console.log('no news!');
            } else {
              uniqNews.forEach((item) => {
                item.id = generatePostId();
                feed.posts.unshift(item);
                watchedState.process = 'updating';
                watchedState.process = '';
              });
            }
            update();
          }).catch((err) => {
            feed.onUpdate = false;
            console.log('update failed');
            console.log(err);
          });
      }, 5000, feed.url);
    };
    update();
  };

  $('#myModal').on('shown.bs.modal', function (e) {
    const contentID = e.relatedTarget.id;
    state.modalWindow.content = contentID;
    const [ feedID, postID ] = contentID.split('::');
    const currentPost = state.feeds
      .find((feed) => feed.id === Number(feedID))
      .posts
      .find((post) => post.id === Number(postID));
    elements.modalWindow.title.textContent = currentPost.title;
    elements.modalWindow.body.innerHTML = DOMPurify.sanitize(currentPost.description);
    elements.modalWindow.button.addEventListener('click', (e) => {
      window.location.href = currentPost.link;
    })
  });
  $('#myModal').on('hide.bs.modal', function (e) {
    elements.modalWindow.body.innerHTML = '';
  });

  const handler = render(state, elements, i18nInstance);
  const watchedState = onChange(state, handler);

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('--------------RUN PROCESS'); console.log(state);
    const userUrl = elements.input.value;
    const validationResult = validate(state, userUrl, i18nInstance);
    if (validationResult !== '') {
      state.errors.validationError = validationResult;
      watchedState.process = 'validation fault'; //           TRANSITION
      watchedState.process = ''; //                           TRANSITION
      return;
    }
    watchedState.process = 'sending'; //                      TRANSITION
    makeRequest(userUrl)
      .then(parse)
      .then((feed) => {
        feed.id = generateFeedId();
        feed.url = userUrl;
        feed.onUpdate = false;
        feed.posts.map((post) => { 
          post.id = generatePostId();
          post.isNew = true;
        });
        state.feeds.push(feed);
        watchedState.process = 'filling'; //                  TRANSITION
        state.feeds.forEach((feed) => {
          if (feed.onUpdate === false) startUpdater(feed);
        });


      })
      .catch((err) => {
          state.errors.webError = err.message;
          watchedState.process = 'access fault'; //           TRANSITION
      });
  });
};
