import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { connect } from 'react-redux';
import { Field, formValueSelector, reduxForm } from 'redux-form';
import { Message, withTranslations } from 'retranslate';

import { requiredField, emailValidator, renderField } from '../../common/form';

export const UpdateUserForm = ({
  handleSubmit,
  updateUserSuccess,
  invalid,
  submitting,
  error,
  isCountryEstonia,
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
              <option value="AF">Afghanistan</option>
              <option value="AX">Åland Islands</option>
              <option value="AL">Albania</option>
              <option value="DZ">Algeria</option>
              <option value="AS">American Samoa</option>
              <option value="AD">Andorra</option>
              <option value="AO">Angola</option>
              <option value="AI">Anguilla</option>
              <option value="AQ">Antarctica</option>
              <option value="AG">Antigua and Barbuda</option>
              <option value="AR">Argentina</option>
              <option value="AM">Armenia</option>
              <option value="AW">Aruba</option>
              <option value="AU">Australia</option>
              <option value="AT">Austria</option>
              <option value="AZ">Azerbaijan</option>
              <option value="BS">Bahamas</option>
              <option value="BH">Bahrain</option>
              <option value="BD">Bangladesh</option>
              <option value="BB">Barbados</option>
              <option value="BY">Belarus</option>
              <option value="BE">Belgium</option>
              <option value="BZ">Belize</option>
              <option value="BJ">Benin</option>
              <option value="BM">Bermuda</option>
              <option value="BT">Bhutan</option>
              <option value="BO">Bolivia, Plurinational State of</option>
              <option value="BQ">Bonaire, Sint Eustatius and Saba</option>
              <option value="BA">Bosnia and Herzegovina</option>
              <option value="BW">Botswana</option>
              <option value="BV">Bouvet Island</option>
              <option value="BR">Brazil</option>
              <option value="IO">British Indian Ocean Territory</option>
              <option value="BN">Brunei Darussalam</option>
              <option value="BG">Bulgaria</option>
              <option value="BF">Burkina Faso</option>
              <option value="BI">Burundi</option>
              <option value="KH">Cambodia</option>
              <option value="CM">Cameroon</option>
              <option value="CA">Canada</option>
              <option value="CV">Cape Verde</option>
              <option value="KY">Cayman Islands</option>
              <option value="CF">Central African Republic</option>
              <option value="TD">Chad</option>
              <option value="CL">Chile</option>
              <option value="CN">China</option>
              <option value="CX">Christmas Island</option>
              <option value="CC">Cocos (Keeling) Islands</option>
              <option value="CO">Colombia</option>
              <option value="KM">Comoros</option>
              <option value="CG">Congo</option>
              <option value="CD">Congo, the Democratic Republic of the</option>
              <option value="CK">Cook Islands</option>
              <option value="CR">Costa Rica</option>
              <option value="CI">Côte d&#39;Ivoire</option>
              <option value="HR">Croatia</option>
              <option value="CU">Cuba</option>
              <option value="CW">Curaçao</option>
              <option value="CY">Cyprus</option>
              <option value="CZ">Czech Republic</option>
              <option value="DK">Denmark</option>
              <option value="DJ">Djibouti</option>
              <option value="DM">Dominica</option>
              <option value="DO">Dominican Republic</option>
              <option value="EC">Ecuador</option>
              <option value="EG">Egypt</option>
              <option value="SV">El Salvador</option>
              <option value="GQ">Equatorial Guinea</option>
              <option value="ER">Eritrea</option>
              <option value="EE">Estonia</option>
              <option value="ET">Ethiopia</option>
              <option value="FK">Falkland Islands (Malvinas)</option>
              <option value="FO">Faroe Islands</option>
              <option value="FJ">Fiji</option>
              <option value="FI">Finland</option>
              <option value="FR">France</option>
              <option value="GF">French Guiana</option>
              <option value="PF">French Polynesia</option>
              <option value="TF">French Southern Territories</option>
              <option value="GA">Gabon</option>
              <option value="GM">Gambia</option>
              <option value="GE">Georgia</option>
              <option value="DE">Germany</option>
              <option value="GH">Ghana</option>
              <option value="GI">Gibraltar</option>
              <option value="GR">Greece</option>
              <option value="GL">Greenland</option>
              <option value="GD">Grenada</option>
              <option value="GP">Guadeloupe</option>
              <option value="GU">Guam</option>
              <option value="GT">Guatemala</option>
              <option value="GG">Guernsey</option>
              <option value="GN">Guinea</option>
              <option value="GW">Guinea-Bissau</option>
              <option value="GY">Guyana</option>
              <option value="HT">Haiti</option>
              <option value="HM">Heard Island and McDonald Islands</option>
              <option value="VA">Holy See (Vatican City State)</option>
              <option value="HN">Honduras</option>
              <option value="HK">Hong Kong</option>
              <option value="HU">Hungary</option>
              <option value="IS">Iceland</option>
              <option value="IN">India</option>
              <option value="ID">Indonesia</option>
              <option value="IR">Iran, Islamic Republic of</option>
              <option value="IQ">Iraq</option>
              <option value="IE">Ireland</option>
              <option value="IM">Isle of Man</option>
              <option value="IL">Israel</option>
              <option value="IT">Italy</option>
              <option value="JM">Jamaica</option>
              <option value="JP">Japan</option>
              <option value="JE">Jersey</option>
              <option value="JO">Jordan</option>
              <option value="KZ">Kazakhstan</option>
              <option value="KE">Kenya</option>
              <option value="KI">Kiribati</option>
              <option value="KP">Korea, Democratic People&#39;s Republic of</option>
              <option value="KR">Korea, Republic of</option>
              <option value="KW">Kuwait</option>
              <option value="KG">Kyrgyzstan</option>
              <option value="LA">Lao People&#39;s Democratic Republic</option>
              <option value="LV">Latvia</option>
              <option value="LB">Lebanon</option>
              <option value="LS">Lesotho</option>
              <option value="LR">Liberia</option>
              <option value="LY">Libya</option>
              <option value="LI">Liechtenstein</option>
              <option value="LT">Lithuania</option>
              <option value="LU">Luxembourg</option>
              <option value="MO">Macao</option>
              <option value="MK">Macedonia, the former Yugoslav Republic of</option>
              <option value="MG">Madagascar</option>
              <option value="MW">Malawi</option>
              <option value="MY">Malaysia</option>
              <option value="MV">Maldives</option>
              <option value="ML">Mali</option>
              <option value="MT">Malta</option>
              <option value="MH">Marshall Islands</option>
              <option value="MQ">Martinique</option>
              <option value="MR">Mauritania</option>
              <option value="MU">Mauritius</option>
              <option value="YT">Mayotte</option>
              <option value="MX">Mexico</option>
              <option value="FM">Micronesia, Federated States of</option>
              <option value="MD">Moldova, Republic of</option>
              <option value="MC">Monaco</option>
              <option value="MN">Mongolia</option>
              <option value="ME">Montenegro</option>
              <option value="MS">Montserrat</option>
              <option value="MA">Morocco</option>
              <option value="MZ">Mozambique</option>
              <option value="MM">Myanmar</option>
              <option value="NA">Namibia</option>
              <option value="NR">Nauru</option>
              <option value="NP">Nepal</option>
              <option value="NL">Netherlands</option>
              <option value="NC">New Caledonia</option>
              <option value="NZ">New Zealand</option>
              <option value="NI">Nicaragua</option>
              <option value="NE">Niger</option>
              <option value="NG">Nigeria</option>
              <option value="NU">Niue</option>
              <option value="NF">Norfolk Island</option>
              <option value="MP">Northern Mariana Islands</option>
              <option value="NO">Norway</option>
              <option value="OM">Oman</option>
              <option value="PK">Pakistan</option>
              <option value="PW">Palau</option>
              <option value="PS">Palestinian Territory, Occupied</option>
              <option value="PA">Panama</option>
              <option value="PG">Papua New Guinea</option>
              <option value="PY">Paraguay</option>
              <option value="PE">Peru</option>
              <option value="PH">Philippines</option>
              <option value="PN">Pitcairn</option>
              <option value="PL">Poland</option>
              <option value="PT">Portugal</option>
              <option value="PR">Puerto Rico</option>
              <option value="QA">Qatar</option>
              <option value="RE">Réunion</option>
              <option value="RO">Romania</option>
              <option value="RU">Russian Federation</option>
              <option value="RW">Rwanda</option>
              <option value="BL">Saint Barthélemy</option>
              <option value="SH">Saint Helena, Ascension and Tristan da Cunha</option>
              <option value="KN">Saint Kitts and Nevis</option>
              <option value="LC">Saint Lucia</option>
              <option value="MF">Saint Martin (French part)</option>
              <option value="PM">Saint Pierre and Miquelon</option>
              <option value="VC">Saint Vincent and the Grenadines</option>
              <option value="WS">Samoa</option>
              <option value="SM">San Marino</option>
              <option value="ST">Sao Tome and Principe</option>
              <option value="SA">Saudi Arabia</option>
              <option value="SN">Senegal</option>
              <option value="RS">Serbia</option>
              <option value="SC">Seychelles</option>
              <option value="SL">Sierra Leone</option>
              <option value="SG">Singapore</option>
              <option value="SX">Sint Maarten (Dutch part)</option>
              <option value="SK">Slovakia</option>
              <option value="SI">Slovenia</option>
              <option value="SB">Solomon Islands</option>
              <option value="SO">Somalia</option>
              <option value="ZA">South Africa</option>
              <option value="GS">South Georgia and the South Sandwich Islands</option>
              <option value="SS">South Sudan</option>
              <option value="ES">Spain</option>
              <option value="LK">Sri Lanka</option>
              <option value="SD">Sudan</option>
              <option value="SR">Suriname</option>
              <option value="SJ">Svalbard and Jan Mayen</option>
              <option value="SZ">Swaziland</option>
              <option value="SE">Sweden</option>
              <option value="CH">Switzerland</option>
              <option value="SY">Syrian Arab Republic</option>
              <option value="TW">Taiwan, Province of China</option>
              <option value="TJ">Tajikistan</option>
              <option value="TZ">Tanzania, United Republic of</option>
              <option value="TH">Thailand</option>
              <option value="TL">Timor-Leste</option>
              <option value="TG">Togo</option>
              <option value="TK">Tokelau</option>
              <option value="TO">Tonga</option>
              <option value="TT">Trinidad and Tobago</option>
              <option value="TN">Tunisia</option>
              <option value="TR">Turkey</option>
              <option value="TM">Turkmenistan</option>
              <option value="TC">Turks and Caicos Islands</option>
              <option value="TV">Tuvalu</option>
              <option value="UG">Uganda</option>
              <option value="UA">Ukraine</option>
              <option value="AE">United Arab Emirates</option>
              <option value="GB">United Kingdom</option>
              <option value="US">United States</option>
              <option value="UM">United States Minor Outlying Islands</option>
              <option value="UY">Uruguay</option>
              <option value="UZ">Uzbekistan</option>
              <option value="VU">Vanuatu</option>
              <option value="VE">Venezuela, Bolivarian Republic of</option>
              <option value="VN">Viet Nam</option>
              <option value="VG">Virgin Islands, British</option>
              <option value="VI">Virgin Islands, U.S.</option>
              <option value="WF">Wallis and Futuna</option>
              <option value="EH">Western Sahara</option>
              <option value="YE">Yemen</option>
              <option value="ZM">Zambia</option>
              <option value="ZW">Zimbabwe</option>
            </Field>
          </div>
          {isCountryEstonia && (
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
          )}
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
  isCountryEstonia: true,
};

UpdateUserForm.propTypes = {
  handleSubmit: Types.func,
  invalid: Types.bool,
  submitting: Types.bool,
  error: Types.string,
  translations: Types.shape({ translate: Types.func.isRequired }).isRequired,
  updateUserSuccess: Types.bool,
  isCountryEstonia: Types.bool,
};

const reduxSignUpForm = reduxForm({ form: 'updateUser' })(UpdateUserForm);
const translatedForm = withTranslations(reduxSignUpForm);
const selector = formValueSelector('updateUser');

const mapStateToProps = state => ({
  initialValues: state.login.user ? { ...state.login.user } : null,
  updateUserSuccess: state.contactDetail.updateUserSuccess,
  isCountryEstonia: selector(state, 'address.countryCode') === 'EE',
});

const connectToRedux = connect(
  mapStateToProps,
  null,
);

const prefilledForm = connectToRedux(translatedForm);

export default prefilledForm;
