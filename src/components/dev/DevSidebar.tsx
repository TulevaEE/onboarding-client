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
          {availableOptions.map((profileName) => {
            const options = ['null', ...getProfileOptions(profileName)];
            const currentValue = configuration?.[profileName] ?? 'null';
            const currentIndex = options.indexOf(currentValue);

            const selectAdjacentOption = (direction: 'up' | 'down') => {
              if (currentIndex === -1) {
                return;
              }

              const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

              if (nextIndex < 0 || nextIndex >= options.length) {
                return;
              }

              handleProfileSelected(profileName, options[nextIndex]);
            };

            return (
              <div key={profileName}>
                <label className="form-label mb-1" htmlFor={profileName}>
                  {profileName}
                </label>
                <div className="d-flex gap-1 align-items-center">
                  <select
                    className="form-select"
                    id={profileName}
                    name={profileName}
                    key={profileName}
                    value={currentValue}
                    onChange={(e) => handleProfileSelected(profileName, e.target.value)}
                  >
                    <option value="null">None, use real values</option>
                    <hr />
                    {options.slice(1).map((profileOption) => (
                      <option value={profileOption} key={profileOption}>
                        {profileOption}
                      </option>
                    ))}
                  </select>
                  <div className="d-flex align-items-center">
                    <button
                      type="button"
                      className="btn border-0 px-0"
                      onClick={() => selectAdjacentOption('up')}
                      disabled={currentIndex <= 0}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                        className="d-block"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="btn border-0 px-0"
                      onClick={() => selectAdjacentOption('down')}
                      disabled={currentIndex === -1 || currentIndex >= options.length - 1}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                        className="d-block"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
