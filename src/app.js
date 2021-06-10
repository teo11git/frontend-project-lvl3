import $ from 'jquery';
import axios from 'axios';
import * as yup from 'yup';
import onChange from 'on-change';
import url from 'url';
import i18next from 'i18next';
import resources from './locales';
import render from './view.js';
import DOMPurify from 'dompurify';

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
  const isDouble = !(feeds.every((feed) => feed.url !== userUrl));
  if (isDouble) return 'this URL allready exist';
  return '';
};

const useProxy = (url) => `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(url)}`;

const createIdGenerator = (num = 0) => () => {
  num += 1;
  return num;
};
const generateFeedId = createIdGenerator();
const generatePostId = createIdGenerator();

const parse = (data) => {
  const XMLdocument = new DOMParser().parseFromString(data, 'application/xml');
  console.log('>>>from Parse');
  console.log(XMLdocument);

  const items = XMLdocument.querySelectorAll('item');
  const posts = [...items].map((item) => {
    const post = {
      title: item.querySelector('title').textContent,
      description: item.querySelector('description')?.textContent ?? '',
      link: item.querySelector('link').textContent,
    };
    return post;
  });
  const result = {
    domain: url.parse(XMLdocument.querySelector('link').textContent).hostname,
    description: XMLdocument.querySelector('description').textContent,
    posts,
  };
  return result;
};

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
    statusContainer: document.querySelector('#status'),
    feedsContainer: document.querySelector('.feeds'),
    postsContainer: document.querySelector('.posts'),
    container: document.querySelector('.container'),
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
        console.log(serverResponce);
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
    let isWork = 0;
  
    const update = (link) => {
      window.setTimeout((link) => {
        console.log(`update ${feed.domain} ${isWork} times`);
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
                console.log(`find new post ${item.title}`);
                console.log('push to state!');
                item.id = generatePostId();
                feed.posts.unshift(item);
                watchedState.process = 'updating';
                watchedState.process = '';
              });
            }
           if (isWork < 60000) {
              update();
            }
          }).catch((err) => {
            feed.onUpdate = false;
            console.log('update fault');
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
    watchedState.process = '';
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
        console.log(feed);
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
