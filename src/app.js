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

const useProxy = (url) => {
  const proxy = new URL('https://hexlet-allorigins.herokuapp.com/get');
  proxy.searchParams.set('disableCache', 'true');
  proxy.searchParams.set('url', `${url}`);
  return proxy.toString();
};

const makeRequest = (url) => axios.get(useProxy(url))
  .then((serverResponce) => serverResponce.data.contents);

const runUpdater = (watchedState, feed) => {
  const feedId = feed.id;

  const update = () => {
    setTimeout((link) => {
      makeRequest(link)
        .then((data) => {
          const { posts } = parse(data);
          const uniqNews = differenceWith(
            posts,
            watchedState.posts,
            (p1, p2) => p1.link === p2.link,
          );
          if (uniqNews.length !== 0) {
            uniqNews.forEach((item) => {
              item.id = uniqueId();
              item.feedId = feedId;
              watchedState.posts.unshift(item);
            });
          }
          update();
        }).catch(console.error);
    }, 5000, feed.url);
  };
  update();
};

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

    const watchedState = onChange(
      state,
      render(state, elements, i18nInstance),
    );

    $('#myModal').on('show.bs.modal', (e) => {
      const contentId = e.relatedTarget.dataset.postId;
      const currentPost = state.posts.find((post) => post.id === contentId);
      elements.modalWindow.title.textContent = currentPost.title;
      elements.modalWindow.body.innerHTML = DOMPurify.sanitize(currentPost.description);
      elements.modalWindow.button.dataset.postId = contentId;
      const { postsWasRead } = state.ui;
      if (!postsWasRead.includes(contentId)) watchedState.ui.postsWasRead.push(contentId);
    });
    $('#myModal').on('hide.bs.modal', () => {
      elements.modalWindow.body.innerHTML = '';
    });
    elements.modalWindow.button.addEventListener('click', (e) => {
      const neededId = e.target.dataset.postId;
      const { link } = state.posts.find((post) => post.id === neededId);
      window.open(link, '_blank');
    });
    elements.input.addEventListener('input', () => {
      console.log('change!');
      watchedState.formState.validity = true;
    });

    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const userUrl = formData.get('url');
      const validationResult = validate(state, userUrl);
      if (validationResult !== null) {
        watchedState.formState.validationError = validationResult;
        watchedState.formState.validity = false; //                            TRANSITION
        return;
      }
      watchedState.formState.validity = true;
      watchedState.feedRequest.process = 'requesting'; //                      TRANSITION
      makeRequest(userUrl)
        .then((data) => {
          const { feed, posts } = parse(data);
          feed.id = uniqueId();
          feed.url = userUrl;
          posts.forEach((post) => {
            post.feedId = feed.id;
            post.id = uniqueId();
          });

          watchedState.feeds.push(feed);
          watchedState.posts = [...watchedState.posts, ...posts];
          runUpdater(watchedState, feed);
          watchedState.feedRequest.process = 'success'; //                    TRANSITION
        })
        .catch((err) => {
          console.log(err);
          if (err.isAxiosError) watchedState.feedRequest.error = 'networkError';

          if (err.isParseError) watchedState.feedRequest.error = 'parseError';

          watchedState.feedRequest.process = 'failing';
        });
    });
  }); // promise return
};
