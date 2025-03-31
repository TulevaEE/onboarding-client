/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useState } from 'react';
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
  };

  const configurationWithExpandedProfileValue = Object.entries(configuration ?? {}).map(
    ([key, value]) => [
      key,
      value ? mockModeProfiles[key as keyof MockModeConfiguration][value] : null,
    ],
  );

  return (
    <aside className="offcanvas offcanvas-end show bg-gray-2">
      <div className="offcanvas-body">
        <h2 className="m-0 mb-3">Mock mode profiles</h2>

        {availableOptions.map((profileName) => (
          <div key={profileName} className="pt-2">
            <div>
              <label htmlFor={profileName}>
                <b>{profileName}</b>
              </label>
            </div>
            <select
              name={profileName}
              key={profileName}
              value={configuration?.[profileName] ?? 'null'}
              onChange={(e) => handleProfileSelected(profileName, e.target.value)}
            >
              <option value="null">None – use real values</option>
              {getProfileOptions(profileName).map((profileOption) => (
                <option value={profileOption} key={profileOption}>
                  {profileOption}
                </option>
              ))}
            </select>
          </div>
        ))}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn btn-primary btn-large mt-3"
        >
          Apply & reload
        </button>

        <h3 className="m-0 mt-3">Selected profiles</h3>
        <pre className="pre-scrollable mt-4">
          <code>{JSON.stringify(configuration, null, 2)}</code>
        </pre>

        <h3 className="m-0 mt-3">Backend responses</h3>
        <pre className="pre-scrollable mt-4">
          <code>{JSON.stringify(configurationWithExpandedProfileValue, null, 2)}</code>
        </pre>
      </div>
    </aside>
  );
};
