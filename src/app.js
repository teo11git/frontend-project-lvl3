// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';

import axios from 'axios';
import * as yup from 'yup';
import onChange from 'on-change';
import render from './view.js';

const validator = yup.string().required().url();

const meduzaUrl = 'https://meduza.io/rss2/all';

const useProxy = (url) => `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}`;

const parse = (data) => {
  const XMLdocument = new DOMParser().parseFromString(data, 'application/xml');

  const items = XMLdocument.querySelectorAll('item');
  const list = [ ...items ].map((item) => {
    const post = {
      title: item.querySelector('title').textContent,
      description: item.querySelector('description').textContent,
      link: item.querySelector('link').textContent,
    };
    return post;
  });
  return list;
};

const createIdGenerator = (num = 0) => () => {
  num += 1;
  return num;
};

export default () => {
  const state = {
    process: 'filling',
    feeds: [],
    posts: [],
    errors: {
      webError: '',
      validationError: '',
    },
  };
  
  const elements = {
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
    console.log('RUN PROCESS');
    const userUrl = elements.input.value;
    validator.validate(userUrl)
      .then((url) => {
        console.log('MAKE REQUEST TO SERVER');
        const generateFeedsId = createIdGenerator();
        state.feeds.push({id: generateFeedsId(), url});
        console.log(state.feeds);
        watchedState.process = 'sending';
        return axios.get(useProxy(url));
      })
      .then((proxyServerResponce) => {
        console.log(proxyServerResponce);
        if (proxyServerResponce.data.contents === null) {
          const error = new Error('Can not connect to foreign server');
          error.name = 'webAccessError';
          throw error;
        }
        console.log('GET REQUEST');
        return proxyServerResponce.data.contents;
      })
      .then(parse)
      .then((postList) => {
        console.log('PARSE AND POST');
        const generatePostId = createIdGenerator();
        console.log(postList);
        postList.forEach((post) => {
          post.id = generatePostId();
          state.posts.push(post);
        });

        watchedState.process = 'filling';
        console.log('posts is...');
        console.log(state.posts);
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
