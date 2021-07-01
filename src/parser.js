export default (data) => {
  const XMLdocument = new DOMParser().parseFromString(data, 'application/xml');
  console.log(XMLdocument);
  const errors = XMLdocument.querySelector('parsererror')?.textContent;
  if (errors) {
    const err = new Error(errors);
    err.isParseError = true;
    throw err;
  }
  const items = [...XMLdocument.querySelectorAll('item')]
    .map((item) => ({
      title: item.querySelector('title').textContent,
      description: item.querySelector('description')?.textContent ?? '',
      link: item.querySelector('link').textContent,
    }));
  const channel = {
    title: XMLdocument.querySelector('title').textContent,
    description: XMLdocument.querySelector('description').textContent,
  };
  return { channel, items };
};
