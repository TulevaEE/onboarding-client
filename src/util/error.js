
function captureException(err, extraData) {
  if (window.Rollbar && window.Rollbar.log) {
    window.Rollbar.log(err.message, err, extraData);
  }
}

function captureMessage(msg, extraData) {
  if (window.Rollbar && window.Rollbar.log) {
    window.Rollbar.log(msg, extraData);
  }
}

export {
  captureException,
  captureMessage,
};
