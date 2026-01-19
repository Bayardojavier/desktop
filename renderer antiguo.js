const React = require('react');
const ReactDOM = require('react-dom/client');

const { APP_FULL_NAME } = require('../shared/constants');

function App() {
  return React.createElement(
    'div',
    { style: { padding: 40, fontFamily: 'sans-serif', textAlign: 'center' } },
    React.createElement('h1', {}, `🚀 Bienvenido a ${APP_FULL_NAME}`)
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));