/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { readMockModeConfiguration, writeMockModeConfiguration } from '../common/requestMocker';
import {
  getAllProfileNames,
  getProfileOptions,
  mockModeProfiles,
} from '../common/requestMocker/profiles';
import { MockModeConfiguration } from '../common/requestMocker/types';

export const DevSidebar = () => {
  const [configuration, setConfiguration] = useState(readMockModeConfiguration());

  const availableOptions = getAllProfileNames();

  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    document.body.style.paddingRight = '400px';
  }, []);

  useEffect(() => {
    writeMockModeConfiguration(configuration);
  }, [configuration]);

  const handleProfileSelected = (
    profileName: keyof MockModeConfiguration,
    selectedProfileOption: string | 'null',
  ) => {
    const profileOptionToWrite = selectedProfileOption !== 'null' ? selectedProfileOption : null;

    // @ts-ignore
    setConfiguration({
      ...configuration,
      [profileName]: profileOptionToWrite,
    });
    window.location.reload();
  };

  const handleClearConfiguration = () => {
    setConfiguration(null);

    history.push(location.pathname);
    window.location.reload();
  };

  const configurationWithExpandedProfileValue = Object.fromEntries(
    Object.entries(configuration ?? {}).map(([key, value]) => [
      key,
      value ? mockModeProfiles[key as keyof MockModeConfiguration][value] : null,
    ]),
  );

  return (
    <aside
      className="offcanvas offcanvas-end show bg-gray-2"
      data-bs-scroll="true"
      data-bs-backdrop="false"
    >
      <div className="offcanvas-header">
        <h2 className="offcanvas-title" id="offcanvasLabel">
          Mock mode
        </h2>
        <button
          type="button"
          className="btn-close"
          data-bs-dismiss="offcanvas"
          aria-label="Clear and close"
          title="Clear and close"
          onClick={() => handleClearConfiguration()}
        />
      </div>
      <div className="offcanvas-body">
        <div className="d-grid gap-3">
          <h3 className="m-0">Profiles</h3>
          {availableOptions.map((profileName) => (
            <div key={profileName}>
              <label className="form-label mb-1" htmlFor={profileName}>
                {profileName}
              </label>
              <select
                className="form-select"
                id={profileName}
                name={profileName}
                key={profileName}
                value={configuration?.[profileName] ?? 'null'}
                onChange={(e) => handleProfileSelected(profileName, e.target.value)}
              >
                <option value="null">None, use real values</option>
                <hr />
                {getProfileOptions(profileName).map((profileOption) => (
                  <option value={profileOption} key={profileOption}>
                    {profileOption}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <hr className="my-4" />

        <h3 className="m-0 mb-3">Selected profiles</h3>
        <pre className="pre-scrollable m-0">
          <code>{JSON.stringify(configuration, null, 2)}</code>
        </pre>

        <hr className="my-4" />

        <h3 className="m-0 mb-3">Backend full mocked responses</h3>
        <pre className="pre-scrollable m-0">
          <code>{JSON.stringify(configurationWithExpandedProfileValue, null, 2)}</code>
        </pre>
      </div>
    </aside>
  );
};
