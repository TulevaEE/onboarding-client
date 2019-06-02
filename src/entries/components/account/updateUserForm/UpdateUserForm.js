import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { connect } from 'react-redux';
import { Field, reduxForm } from 'redux-form';
import { Message, withTranslations } from 'retranslate';

import { requiredField, emailValidator, renderField } from '../../common/form';

export const UpdateUserForm = ({
  handleSubmit,
  updateUserSuccess,
  invalid,
  submitting,
  error,
  translations: { translate },
}) => (
  <div>
    <form id="update-user-form" onSubmit={handleSubmit}>
      {updateUserSuccess && (
        <div className="alert alert-success" role="alert">
          <strong>
            <Message>update.user.thanks</Message>
          </strong>{' '}
          <Message>update.user.success.message</Message>
        </div>
      )}

      <div className="row">
        <div className="col-md-4">
          <div className="form-group">
            <label htmlFor="update-user-form-email">
              <Message>new.user.flow.signup.email</Message>
            </label>
            <Field
              component={renderField}
              type="email"
              name="email"
              id="update-user-form-email"
              placeholder={translate('new.user.flow.signup.email')}
              validate={[requiredField, emailValidator]}
            />
          </div>
          <div className="form-group">
            <label htmlFor="update-user-form-phoneNumber">
              <Message>new.user.flow.signup.phoneNumber</Message>
            </label>
            <Field
              component={renderField}
              type="number"
              name="phoneNumber"
              id="update-user-form-phoneNumber"
              placeholder={translate('new.user.flow.signup.phoneNumber')}
            />
          </div>
          <div className="form-group">
            <label htmlFor="update-user-form-address">
              <Message>new.user.flow.signup.address</Message>
            </label>
            <Field
              component={renderField}
              type="text"
              name="address.street"
              id="update-user-form-address"
              placeholder={translate('new.user.flow.signup.address')}
              validate={[requiredField]}
            />
          </div>
          <div className="form-group">
            <label htmlFor="update-user-form-district">
              <Message>new.user.flow.signup.district</Message>
            </label>
            <Field
              component={renderField}
              type="select"
              name="address.districtCode"
              id="update-user-form-district"
              validate={[requiredField]}
            >
              <option />
              <option value="1060">Abja-Paluoja linn</option>
              <option value="1301">Antsla linn</option>
              <option value="0170">Elva linn</option>
              <option value="0183">Haapsalu linn</option>
              <option value="0037">Harju maakond</option>
              <option value="0039">Hiiu maakond</option>
              <option value="0044">Ida-Viru maakond</option>
              <option value="0051">Järva maakond</option>
              <option value="0249">Jõgeva linn</option>
              <option value="0049">Jõgeva maakond</option>
              <option value="2270">Jõhvi linn</option>
              <option value="0279">Kallaste linn</option>
              <option value="3895">Kärdla linn</option>
              <option value="2761">Karksi-Nuia linn</option>
              <option value="2928">Kehra linn</option>
              <option value="0296">Keila linn</option>
              <option value="3083">Kilingi-Nõmme linn</option>
              <option value="0309">Kiviõli linn</option>
              <option value="0322">Kohtla-Järve linn</option>
              <option value="0345">Kunda linn</option>
              <option value="0349">Kuressaare linn</option>
              <option value="0057">Lääne maakond</option>
              <option value="0059">Lääne-Viru maakond</option>
              <option value="4330">Lihula linn</option>
              <option value="0424">Loksa linn</option>
              <option value="0446">Maardu linn</option>
              <option value="0490">Mõisaküla linn</option>
              <option value="0485">Mustvee linn</option>
              <option value="0513">Narva-Jõesuu linn</option>
              <option value="0511">Narva linn</option>
              <option value="5754">Otepää linn</option>
              <option value="0566">Paide linn</option>
              <option value="0580">Paldiski linn</option>
              <option value="0625">Pärnu linn</option>
              <option value="0067">Pärnu maakond</option>
              <option value="0617">Põltsamaa linn</option>
              <option value="6536">Põlva linn</option>
              <option value="0065">Põlva maakond</option>
              <option value="6671">Püssi linn</option>
              <option value="0663">Rakvere linn</option>
              <option value="7216">Räpina linn</option>
              <option value="6826">Rapla linn</option>
              <option value="0070">Rapla maakond</option>
              <option value="0074">Saare maakond</option>
              <option value="0728">Saue linn</option>
              <option value="0735">Sillamäe linn</option>
              <option value="0741">Sindi linn</option>
              <option value="7836">Suure-Jaani linn</option>
              <option value="0784">Tallinn</option>
              <option value="8130">Tamsalu linn</option>
              <option value="8140">Tapa linn</option>
              <option value="0795">Tartu linn</option>
              <option value="0078">Tartu maakond</option>
              <option value="0823">Tõrva linn</option>
              <option value="8595">Türi linn</option>
              <option value="0854">Valga linn</option>
              <option value="0082">Valga maakond</option>
              <option value="0897">Viljandi linn</option>
              <option value="0084">Viljandi maakond</option>
              <option value="0912">Võhma linn</option>
              <option value="0919">Võru linn</option>
              <option value="0086">Võru maakond</option>
            </Field>
          </div>
          <div className="form-group">
            <label htmlFor="update-user-form-postalCode">
              <Message>new.user.flow.signup.postalCode</Message>
            </label>
            <Field
              component={renderField}
              type="text"
              name="address.postalCode"
              id="update-user-form-postalCode"
              placeholder={translate('new.user.flow.signup.postalCode')}
              validate={[requiredField]}
            />
          </div>
          <div className="form-group">
            <label htmlFor="update-user-form-country">
              <Message>new.user.flow.signup.country</Message>
            </label>
            <Field
              component={renderField}
              type="select"
              name="address.countryCode"
              id="update-user-form-country"
              validate={[requiredField]}
            >
              <option />
              <option value="EE">Estonia</option>
            </Field>
          </div>
          <div className={`form-group ${error ? 'has-danger' : ''}`}>
            {error && <div className="form-control-feedback mb-3">{error}</div>}
            <button
              type="submit"
              disabled={invalid || submitting}
              className="btn btn-primary btn-block mb-2 mr-2"
            >
              <Message>update.user.save</Message>
            </button>
          </div>
        </div>
      </div>
    </form>
  </div>
);

const noop = () => null;

UpdateUserForm.defaultProps = {
  handleSubmit: noop,
  invalid: true,
  submitting: false,
  error: '',
  updateUserSuccess: false,
};

UpdateUserForm.propTypes = {
  handleSubmit: Types.func,
  invalid: Types.bool,
  submitting: Types.bool,
  error: Types.string,
  translations: Types.shape({ translate: Types.func.isRequired }).isRequired,
  updateUserSuccess: Types.bool,
};

const reduxSignUpForm = reduxForm({ form: 'updateUser' })(UpdateUserForm);
const translatedForm = withTranslations(reduxSignUpForm);

const mapStateToProps = state => ({
  initialValues: state.login.user ? { ...state.login.user } : null,
  updateUserSuccess: state.account.updateUserSuccess,
});

const connectToRedux = connect(
  mapStateToProps,
  null,
);

const prefilledForm = connectToRedux(translatedForm);

export default prefilledForm;
