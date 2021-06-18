import url from 'url';

const isValidRss = (dom) => !(dom.querySelector('parsererror'));

export default (data) => {
  const XMLdocument = new DOMParser().parseFromString(data, 'application/xml');

  if (isValidRss(XMLdocument) === false) {
    const error = new Error();
    error.isParseError = true;
    error.message = 'parseError';
    throw error;
  }
  const items = XMLdocument.querySelectorAll('item');
  const posts = [...items].map((item) => ({
    title: item.querySelector('title').textContent,
    description: item.querySelector('description')?.textContent ?? '',
    link: item.querySelector('link').textContent,
  }));
  const feed = {
    domain: url.parse(XMLdocument.querySelector('link').textContent).hostname,
    description: XMLdocument.querySelector('description').textContent,
  };
  return { feed, posts };
};
