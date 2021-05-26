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
  console.log(XMLdocument);
  return XMLdocument;
};

const getList = (xml) => {
  const items = xml.querySelectorAll('item');
  const list = [ ...items ].map((item) => {
    const post = {
      title: item.querySelector('title').textContent,
      description: item.querySelector('description').textContent,
      link: item.querySelector('link').textContent,
    };
    return post;
  });
  console.log(list);
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
  
  const elements = {};
  const handler = render(state, elements);
  const watchedState = onChange(state, handler);

  const form = document.querySelector('form');
  const input = document.querySelector('input');
  const button = document.querySelector('button');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const userUrl = input.value;
    validator.validate(userUrl)
      .then((url) => {
        watchedState.process = 'sending';
        return axios.get(useProxy(url));
      })
      .then((res) => {
        console.log(res);
        if (res.data.contents === null) {
          const error = new Error('Can not connect to foreign server');
          error.name = 'webAccessError';
          throw error;
        }
        return res.data.contents;
      })
      .then((str) => {
        // console.log(str);
        // parse(str);
        return parse(str)
      })
      .then((xml) => {
        watchedState.process = 'filling';
        const items = getList(xml);
        console.log(items);
      })
      .catch((err) => {
        if (err.name === 'ValidationError') {
          state.errors.validationErrors = err.message;
          watchedState.process = 'validation fault';
        }
        if (err.name === 'webAccessError') {
          state.errors.webErrors = err.message;
          watchedState.process = 'access fault';
        }
      });
  });
};
