import React, { PropTypes as Types } from 'react';
import { Field, reduxForm } from 'redux-form';
import { Message } from 'retranslate';
import { Link } from 'react-router';

// eslint-disable-next-line no-confusing-arrow
const required = value => value ? undefined : 'Palun täida ikka ära :)';
// eslint-disable-next-line no-confusing-arrow
const email = value =>
// eslint-disable-next-line no-useless-escape
  value && !/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()\.,;\s@\"]+\.{0,1})+[^<>()\.,;:\s@\"]{2,})$/.test(value) ?
    'Vigane email' : undefined;

const renderField = ({ input, type, placeholder, meta: { touched, error } }) => (
  <div>
    <div className={`form-group ${touched && error ? 'has-danger' : ''}`}>
      <input {...input} type={type} placeholder={placeholder} className="form-control" />
      {touched && error && <div className="form-control-feedback">{error}</div>}
    </div>
  </div>
);

renderField.defaultProps = {
  input: {},
  meta: {},
  type: 'text',
  placeholder: '',
};

renderField.propTypes = {
  input: Types.shape(),
  meta: Types.shape(),
  type: Types.string,
  placeholder: Types.string,
};


export const SignUpForm = ({ handleSubmit, pristine, submitting }) => (
  <div>
    <form id="register-form" onSubmit={handleSubmit} role="form">
      <div className="form-group">
        <Field
          component={renderField} type="text" name="firstName" placeholder="Eesnimi*"
          validate={required}
        />
      </div>
      <div className="form-group">
        <Field
          component={renderField} type="text" name="lastName" placeholder="Perekonnanimi*"
          validate={required}
        />
      </div>
      <div className="form-group">
        <Field
          component={renderField} type="number" name="personalCode" placeholder="Isikukood*"
          validate={required}
        />
      </div>
      <div className="form-group">
        <Field
          component={renderField} type="email" name="email" placeholder="Email*"
          validate={[required, email]}
        />
      </div>
      <div className="form-group">
        <Field
          component={renderField} type="number" name="phoneNumber" placeholder="Telefoninumber"
        />
      </div>
      <div className="form-group">
        <button type="submit" disabled={pristine || submitting} className={'btn btn-primary mb-2 mr-2'}>
          <Message>Liitun Tulevaga</Message>
        </button>
        <Link to="/new-user" className={'btn btn-secondary mb-2'}>
          <Message>Tagasi</Message>
        </Link>
      </div>
    </form>
  </div>
);

const noop = () => null;

SignUpForm.defaultProps = {
  handleSubmit: noop,
  pristine: true,
  submitting: false,
};

SignUpForm.propTypes = {
  handleSubmit: Types.func,
  pristine: Types.bool,
  submitting: Types.bool,
};

export default reduxForm({ form: 'signUp' })(SignUpForm);
