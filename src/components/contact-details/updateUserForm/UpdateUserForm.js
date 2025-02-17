import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { connect } from 'react-redux';
import { Field, reduxForm } from 'redux-form';
import { FormattedMessage, useIntl } from 'react-intl';

import { emailValidator, renderField, requiredField } from '../../common/form';

export const UpdateUserForm = ({
  handleSubmit,
  updateUserSuccess,
  submitting,
  error,
  children,
}) => {
  const { formatMessage } = useIntl();

  return (
    <form id="update-user-form" onSubmit={handleSubmit}>
      {updateUserSuccess && (
        <div className="alert alert-success" role="alert">
          <FormattedMessage id="update.user.success.message" />
        </div>
      )}

      <div className="mb-3">
        <label className="form-label" htmlFor="update-user-form-email">
          <FormattedMessage id="new.user.flow.signup.email" />
        </label>
        <Field
          component={renderField}
          type="email"
          name="email"
          id="update-user-form-email"
          validate={[requiredField, emailValidator]}
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="update-user-form-phoneNumber">
          <FormattedMessage id="new.user.flow.signup.phoneNumber" />
        </label>
        <Field
          component={renderField}
          type="tel"
          name="phoneNumber"
          id="update-user-form-phoneNumber"
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="update-user-form-country">
          <FormattedMessage id="new.user.flow.signup.country" />
        </label>
        <Field
          component={renderField}
          type="select"
          name="address.countryCode"
          id="update-user-form-country"
          validate={[requiredField]}
        >
          <option value="">{formatMessage({ id: 'select' })}</option>
          <option value="AF">Afganistan</option>
          <option value="AX">Ahvenamaa</option>
          <option value="AL">Albaania</option>
          <option value="DZ">Alžeeria</option>
          <option value="AS">Ameerika Samoa</option>
          <option value="AD">Andorra</option>
          <option value="AO">Angola</option>
          <option value="AI">Anguilla</option>
          <option value="AQ">Antarktika</option>
          <option value="AG">Antigua ja Barbuda</option>
          <option value="AR">Argentina</option>
          <option value="AM">Armeenia</option>
          <option value="AW">Aruba</option>
          <option value="AU">Austraalia</option>
          <option value="AT">Austria</option>
          <option value="AZ">Aserbaidžaan</option>
          <option value="BS">Bahama</option>
          <option value="BH">Bahrein</option>
          <option value="BD">Bangladesh</option>
          <option value="BB">Barbados</option>
          <option value="BY">Valgevene</option>
          <option value="BE">Belgia</option>
          <option value="BZ">Belize</option>
          <option value="BJ">Benin</option>
          <option value="BM">Bermuda</option>
          <option value="BT">Bhutan</option>
          <option value="BO">Boliivia</option>
          <option value="BQ">Bonaire, Sint Eustatius ja Saba</option>
          <option value="BA">Bosnia ja Hertsegoviina</option>
          <option value="BW">Botswana</option>
          <option value="BV">Bouvet’ saar</option>
          <option value="BR">Brasiilia</option>
          <option value="IO">Briti India ookeani ala</option>
          <option value="BN">Brunei</option>
          <option value="BG">Bulgaaria</option>
          <option value="BF">Burkina Faso</option>
          <option value="BI">Burundi</option>
          <option value="KH">Kambodža</option>
          <option value="CM">Kamerun</option>
          <option value="CA">Kanada</option>
          <option value="CV">Roheneemesaared</option>
          <option value="KY">Kaimanisaared</option>
          <option value="CF">Kesk-Aafrika Vabariik</option>
          <option value="TD">Tšaad</option>
          <option value="CL">Tšiili</option>
          <option value="CN">Hiina</option>
          <option value="CX">Jõulusaar</option>
          <option value="CC">Kookossaared</option>
          <option value="CO">Colombia</option>
          <option value="KM">Komoorid</option>
          <option value="CG">Kongo</option>
          <option value="CD">Kongo Demokraatlik Vabariik</option>
          <option value="CK">Cooki saared</option>
          <option value="CR">Costa Rica</option>
          <option value="CI">Elevandiluurannik</option>
          <option value="HR">Horvaatia</option>
          <option value="CU">Kuuba</option>
          <option value="CW">Curaçao</option>
          <option value="CY">Küpros</option>
          <option value="CZ">Tšehhi</option>
          <option value="DK">Taani</option>
          <option value="DJ">Djibouti</option>
          <option value="DM">Dominica</option>
          <option value="DO">Dominikaani Vabariik</option>
          <option value="EC">Ecuador</option>
          <option value="EG">Egiptus</option>
          <option value="SV">El Salvador</option>
          <option value="GQ">Ekvatoriaal-Guinea</option>
          <option value="ER">Eritrea</option>
          <option value="EE">Eesti</option>
          <option value="ET">Etioopia</option>
          <option value="FK">Falklandi saared</option>
          <option value="FO">Fääri saared</option>
          <option value="FJ">Fidži</option>
          <option value="FI">Soome</option>
          <option value="FR">Prantsusmaa</option>
          <option value="GF">Prantsuse Guajaana</option>
          <option value="PF">Prantsuse Polüneesia</option>
          <option value="TF">Prantsuse Lõunaalad</option>
          <option value="GA">Gabon</option>
          <option value="GM">Gambia</option>
          <option value="GE">Gruusia</option>
          <option value="DE">Saksamaa</option>
          <option value="GH">Ghana</option>
          <option value="GI">Gibraltar</option>
          <option value="GR">Kreeka</option>
          <option value="GL">Gröönimaa</option>
          <option value="GD">Grenada</option>
          <option value="GP">Guadeloupe</option>
          <option value="GU">Guam</option>
          <option value="GT">Guatemala</option>
          <option value="GG">Guernsey</option>
          <option value="GN">Guinea</option>
          <option value="GW">Guinea-Bissau</option>
          <option value="GY">Guyana</option>
          <option value="HT">Haiti</option>
          <option value="HM">Heard ja McDonald saared</option>
          <option value="VA">Vatikan</option>
          <option value="HN">Honduras</option>
          <option value="HK">Hongkong</option>
          <option value="HU">Ungari</option>
          <option value="IS">Island</option>
          <option value="IN">India</option>
          <option value="ID">Indoneesia</option>
          <option value="IR">Iraan</option>
          <option value="IQ">Iraak</option>
          <option value="IE">Iirimaa</option>
          <option value="IM">Mani saar</option>
          <option value="IL">Iisrael</option>
          <option value="IT">Itaalia</option>
          <option value="JM">Jamaica</option>
          <option value="JP">Jaapan</option>
          <option value="JE">Jersey</option>
          <option value="JO">Jordaania</option>
          <option value="KZ">Kasahstan</option>
          <option value="KE">Keenia</option>
          <option value="KI">Kiribati</option>
          <option value="KP">Põhja-Korea</option>
          <option value="KR">Lõuna-Korea</option>
          <option value="KW">Kuveit</option>
          <option value="KG">Kõrgõzstan</option>
          <option value="LA">Laos</option>
          <option value="LV">Läti</option>
          <option value="LB">Liibanon</option>
          <option value="LS">Lesotho</option>
          <option value="LR">Libeeria</option>
          <option value="LY">Liibüa</option>
          <option value="LI">Liechtenstein</option>
          <option value="LT">Leedu</option>
          <option value="LU">Luksemburg</option>
          <option value="MO">Macao</option>
          <option value="MK">Makedoonia</option>
          <option value="MG">Madagaskar</option>
          <option value="MW">Malawi</option>
          <option value="MY">Malaisia</option>
          <option value="MV">Maldiivid</option>
          <option value="ML">Mali</option>
          <option value="MT">Malta</option>
          <option value="MH">Marshalli Saared</option>
          <option value="MQ">Martinique</option>
          <option value="MR">Mauritaania</option>
          <option value="MU">Mauritius</option>
          <option value="YT">Mayotte</option>
          <option value="MX">Mehhiko</option>
          <option value="FM">Mikroneesia</option>
          <option value="MD">Moldova</option>
          <option value="MC">Monaco</option>
          <option value="MN">Mongoolia</option>
          <option value="ME">Montenegro</option>
          <option value="MS">Montserrat</option>
          <option value="MA">Maroko</option>
          <option value="MZ">Mosambiik</option>
          <option value="MM">Myanmar</option>
          <option value="NA">Namiibia</option>
          <option value="NR">Nauru</option>
          <option value="NP">Nepal</option>
          <option value="NL">Holland</option>
          <option value="NC">Uus-Kaledoonia</option>
          <option value="NZ">Uus-Meremaa</option>
          <option value="NI">Nicaragua</option>
          <option value="NE">Niger</option>
          <option value="NG">Nigeeria</option>
          <option value="NU">Niue</option>
          <option value="NF">Norfolki saar</option>
          <option value="MP">Põhja-Mariaanid</option>
          <option value="NO">Norra</option>
          <option value="OM">Omaan</option>
          <option value="PK">Pakistan</option>
          <option value="PW">Palau</option>
          <option value="PS">Palestiina alad</option>
          <option value="PA">Panama</option>
          <option value="PG">Paapua Uus-Guinea</option>
          <option value="PY">Paraguay</option>
          <option value="PE">Peruu</option>
          <option value="PH">Filipiinid</option>
          <option value="PN">Pitcairni saared</option>
          <option value="PL">Poola</option>
          <option value="PT">Portugal</option>
          <option value="PR">Puerto Rico</option>
          <option value="QA">Katar</option>
          <option value="RE">Réunion</option>
          <option value="RO">Rumeenia</option>
          <option value="RU">Venemaa</option>
          <option value="RW">Rwanda</option>
          <option value="BL">Saint Barthélemy</option>
          <option value="SH">Saint Helena</option>
          <option value="KN">Saint Kitts ja Nevis</option>
          <option value="LC">Saint Lucia</option>
          <option value="MF">Saint Martin</option>
          <option value="PM">Saint Pierre ja Miquelon</option>
          <option value="VC">Saint Vincent ja Grenadiinid</option>
          <option value="WS">Samoa</option>
          <option value="SM">San Marino</option>
          <option value="ST">São Tomé ja Príncipe</option>
          <option value="SA">Saudi Araabia</option>
          <option value="SN">Senegal</option>
          <option value="RS">Serbia</option>
          <option value="SC">Seišellid</option>
          <option value="SL">Sierra Leone</option>
          <option value="SG">Singapur</option>
          <option value="SX">Sint Maarten</option>
          <option value="SK">Slovakkia</option>
          <option value="SI">Sloveenia</option>
          <option value="SB">Saalomoni Saared</option>
          <option value="SO">Somaalia</option>
          <option value="ZA">Lõuna-Aafrika Vabariik</option>
          <option value="GS">Lõuna-Georgia ja Lõuna-Sandwichi saared</option>
          <option value="SS">Lõuna-Sudaan</option>
          <option value="ES">Hispaania</option>
          <option value="LK">Sri Lanka</option>
          <option value="SD">Sudaan</option>
          <option value="SR">Suriname</option>
          <option value="SJ">Svalbard ja Jan Mayen</option>
          <option value="SZ">Svaasimaa</option>
          <option value="SE">Rootsi</option>
          <option value="CH">Šveits</option>
          <option value="SY">Süüria</option>
          <option value="TW">Taiwan</option>
          <option value="TJ">Tadžikistan</option>
          <option value="TZ">Tansaania</option>
          <option value="TH">Tai</option>
          <option value="TL">Ida-Timor</option>
          <option value="TG">Togo</option>
          <option value="TK">Tokelau</option>
          <option value="TO">Tonga</option>
          <option value="TT">Trinidad ja Tobago</option>
          <option value="TN">Tuneesia</option>
          <option value="TR">Türgi</option>
          <option value="TM">Türkmenistan</option>
          <option value="TC">Turks ja Caicos</option>
          <option value="TV">Tuvalu</option>
          <option value="UG">Uganda</option>
          <option value="UA">Ukraina</option>
          <option value="AE">Araabia Ühendemiraadid</option>
          <option value="GB">Suurbritannia</option>
          <option value="US">Ameerika Ühendriigid</option>
          <option value="UM">USA väikesed hajasaared</option>
          <option value="UY">Uruguay</option>
          <option value="UZ">Usbekistan</option>
          <option value="VU">Vanuatu</option>
          <option value="VE">Venezuela</option>
          <option value="VN">Vietnam</option>
          <option value="VG">Briti Neitsisaared</option>
          <option value="VI">USA Neitsisaared</option>
          <option value="WF">Wallis ja Futuna</option>
          <option value="EH">Lääne-Sahara</option>
          <option value="YE">Jeemen</option>
          <option value="ZM">Sambia</option>
          <option value="ZW">Zimbabwe</option>
        </Field>
      </div>
      {children}
      <div className={`${error ? 'text-danger' : ''}`}>
        {error && (
          <p className="m-0 mt-2">
            <FormattedMessage id={error} />
          </p>
        )}
        <div className="d-grid mt-4">
          <button type="submit" disabled={submitting} className="btn btn-primary">
            <FormattedMessage id="update.user.save" />
          </button>
        </div>
      </div>
    </form>
  );
};

UpdateUserForm.defaultProps = {
  handleSubmit: () => null,
  submitting: false,
  error: '',
  updateUserSuccess: false,
};

UpdateUserForm.propTypes = {
  handleSubmit: Types.func,
  submitting: Types.bool,
  error: Types.string,
  updateUserSuccess: Types.bool,
};

const reduxSignUpForm = reduxForm({ form: 'updateUser' })(UpdateUserForm);

const mapStateToProps = (state) => ({
  initialValues: state.login.user ? { ...state.login.user } : null,
  updateUserSuccess: state.contactDetails.updateUserSuccess,
  submitting: state.contactDetails.submitting,
});

export default connect(mapStateToProps, null)(reduxSignUpForm);
