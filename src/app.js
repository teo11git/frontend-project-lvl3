// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';

import axios from 'axios';
import * as yup from 'yup';
import onChange from 'on-change';
import render from './view.js';
import url from 'url';

const validator = yup.string().required().url();

const useProxy = (url) => `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}`;

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
  const feedInfo = {
    id: generateFeedId(),
    domain: url.parse(XMLdocument.querySelector('link').textContent).hostname,
    description: XMLdocument.querySelector('description').textContent,
  };
  const items = XMLdocument.querySelectorAll('item');
  const posts = [ ...items ].map((item) => {
    const post = {
      id: generatePostId(),
      title: item.querySelector('title').textContent,
      description: item.querySelector('description').textContent,
      link: item.querySelector('link').textContent,
    };
    return post;
  });
  const result = { feedInfo, posts };
  return result;
};

export default () => {
  const state = {
    process: 'filling',
    feeds: [],
    errors: {
      webError: '',
      validationError: '',
    },
  };
  
  const elements = {
    feedsContainer: document.querySelector('.feeds'),
    postsContainer : document.querySelector('.posts'),
    container: document.querySelector('.container'),
    form: document.querySelector('form'),
    button: document.querySelector('button'),
    input: document.querySelector('input'),
    errorDiv: document.querySelector('.invalid-feedback'),
  };

  const handler = render(state, elements);
  const watchedState = onChange(state, handler);

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('--------------RUN PROCESS');
    const userUrl = elements.input.value;
    validator.validate(userUrl)
      .then((url) => {
        console.log('-----------------MAKE REQUEST TO SERVER');
        watchedState.process = 'sending';
        return axios.get(useProxy(url));
      })
      .then((proxyServerResponce) => {
        // console.log(proxyServerResponce);
        if (proxyServerResponce.data.contents === null) {
          const error = new Error('Can not connect to foreign server');
          error.name = 'webAccessError';
          throw error;
        }
        console.log('--------------GET REQUEST');
        return proxyServerResponce.data.contents;
      })
      .then(parse)
      .then((feed) => {
        state.feeds.push(feed);
        console.log(state.feeds);

        console.log('---------PARSE AND POST');
        watchedState.process = 'filling';
      })
      .catch((err) => {
        if (err.name === 'ValidationError') {
          state.errors.validationError = err.message;
          watchedState.process = 'validation fault';
        }
        if (err.name === 'webAccessError') {
          state.errors.webError = err.message;
          watchedState.process = 'access fault';
        }
      });
  });
};
