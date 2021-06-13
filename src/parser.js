import url from 'url';

const isValidRss = (dom) => dom.documentElement.nodeName === 'rss';

export default (data, i18n) => {
  const XMLdocument = new DOMParser().parseFromString(data, 'application/xml');

  console.log('>>>from Parse');
  if (!isValidRss(XMLdocument)) {
    const error = new Error();
    error.name = 'parseError';
    error.message = i18n.t('statusBar.parseError');
    throw error;
  }
  console.log(XMLdocument);

  const items = XMLdocument.querySelectorAll('item');
  const posts = [...items].map((item) => ({
    title: item.querySelector('title').textContent,
    description: item.querySelector('description')?.textContent ?? '',
    link: item.querySelector('link').textContent,
  }));
  return {
    domain: url.parse(XMLdocument.querySelector('link').textContent).hostname,
    description: XMLdocument.querySelector('description').textContent,
    posts,
  };
};
