export default (data) => {
  const XMLdocument = new DOMParser().parseFromString(data, 'application/xml');
  console.log('>>>from Parse');
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

