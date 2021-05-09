import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const button = document.querySelector('button');
const div = document.querySelector('.counter');

let counter = 0;

const fn = () => {
  counter -= 1;
  return counter;
};

button.addEventListener('click', () => {
  const num = fn();
  div.textContent = num;
});
