/* eslint-disable no-param-reassign */
import $ from 'jquery';
import axios from 'axios';
import { uniqueId, differenceWith } from 'lodash';
import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import DOMPurify from 'dompurify';
import resources from './locales';
import render from './view.js';
import parse from './parser.js';

const validate = ({ feeds }, userUrl) => {
  const validator = yup
    .string()
    .required()
    .url()
    .notOneOf(feeds.map(({ url }) => url));
  try {
    validator.validateSync(userUrl);
  } catch (error) {
    return error.message;
  }
  return null;
};

const useProxy = (url, command = true) => {
  if (command === false) return url;
  const proxy = new URL('https://hexlet-allorigins.herokuapp.com/get');
  proxy.searchParams.set('disableCache', 'true');
  proxy.searchParams.set('url', `${url}`);
  return proxy.toString();
};

const makeRequest = (url) => axios.get(useProxy(url, true))
  .then((serverResponce) => {
    if (serverResponce.data.status?.error) {
      throw new Error('RequestError');
    }
    console.log(serverResponce.data.contents);
    return serverResponce.data.contents;
  }).catch((err) => {
    console.log('from network error');
    console.log(err);
    const error = new Error('networkError');
    error.isNetworkError = true;
    throw error;
  });

const runUpdater = (state, watchedState, feed) => {
  const feedID = feed.id;

  const update = () => {
    setTimeout((link) => {
      makeRequest(link)
        .then((data) => parse(data))
        .then(({ posts }) => {
          const uniqNews = differenceWith(posts, state.posts, (p1, p2) => p1.link === p2.link);
          if (uniqNews.length === 0) {
            // no news
          } else {
            uniqNews.forEach((item) => {
              item.id = uniqueId();
              item.feedId = feedID;
              watchedState.posts.unshift(item);
            });
          }
          update(link);
        }).catch(console.error);
    }, 5000, feed.url);
  };
  update();
};

export default () => {
  console.log('start app!!');
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
    feeds: [],
    posts: [],
    ui: {
      postsWasRead: [],
    },
  };

  const i18nInstance = i18next.createInstance();

  return i18nInstance.init({
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
      button: document.querySelector('.addBtn'),
      input: document.querySelector('input'),
      errorDiv: document.querySelector('.invalid-feedback'),
      modalWindow: {
        title: document.querySelector('.modal-title'),
        body: document.querySelector('.modal-body'),
        button: document.querySelector('.readMoreBtn'),
      },
    };
    console.log(elements);
    const handler = render(state, elements, i18nInstance);
    const watchedState = onChange(state, handler);

    $('#myModal').on('show.bs.modal', (e) => {
      const contentID = e.relatedTarget.dataset.postId;
      const currentPost = state.posts.find((post) => post.id === contentID);
      elements.modalWindow.title.textContent = currentPost.title;
      elements.modalWindow.body.innerHTML = DOMPurify.sanitize(currentPost.description);
      elements.modalWindow.button.dataset.postID = contentID;
      const { postsWasRead } = state.ui;
      if (!postsWasRead.includes(contentID)) watchedState.ui.postsWasRead.push(contentID);
    });
    $('#myModal').on('hide.bs.modal', () => {
      elements.modalWindow.body.innerHTML = '';
    });
    elements.modalWindow.button.addEventListener('click', (e) => {
      const neededID = e.target.dataset.postID;
      const { link } = state.posts.find((post) => post.id === neededID);
      window.open(link, '_blank');
    });

    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const userUrl = formData.get('url');
      console.log(`USER URL IS ${userUrl}`);
      const validationResult = validate(state, userUrl);
      if (validationResult !== null) {
        watchedState.formState.validationError = validationResult;
        watchedState.formState.validity = false; //           TRANSITION
        return;
      }
      watchedState.formState.validity = true;
      watchedState.feedRequest.process = 'requesting'; //                      TRANSITION
      makeRequest(userUrl)
        .then((data) => parse(data))
        .then(({ feed, posts }) => {
          feed.id = uniqueId();
          feed.url = userUrl;
          posts.forEach((post) => {
            post.feedId = feed.id;
            post.id = uniqueId();
            state.posts.push(post);
          });
          state.feeds.push(feed);
          runUpdater(state, watchedState, feed);
          watchedState.feedRequest.process = 'getting'; //                  TRANSITION
        })
        .catch((err) => {
          console.log(err);
          if (err.isNetworkError) watchedState.feedRequest.error = 'networkError';

          if (err.isParseError) watchedState.feedRequest.error = 'parseError';

          watchedState.feedRequest.process = 'failing';
        });
    });
  }); // promise return
};
