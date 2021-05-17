import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import axios from 'axios';
import * as yup from 'yup';

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

const input = document.querySelector('input');
const button = document.querySelector('button');

button.addEventListener('click', (e) => {
  const userUrl = input.value;
  validator.validate(userUrl)
    .then((url) => {
      return axios.get(useProxy(url))
    })
    .then((res) => {
      // console.log(res.data.contents);
      return res.data.contents;
    })
    .then((str) => {
      // console.log(str);
      // parse(str);
      return parse(str)
    })
    .then((xml) => {
      const items = getList(xml);
      console.log(items);
    })
    .catch(console.log);
});
