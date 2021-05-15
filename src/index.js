import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import axios from 'axios';

const meduzaUrl = 'https://habr.com/ru/rss/all/all/?fl=ru';

const useProxy = (url) => `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}`;

axios.get(useProxy(meduzaUrl))
  .then((res) => res.data.content)
  .then((str) => {
    console.log(str);
    return new DOMParser().parseFromString(str, 'application/xml')})
  .then(console.log);
