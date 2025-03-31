/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useState } from 'react';
import { readMockModeConfiguration, writeMockModeConfiguration } from '../common/requestMocker';
import { getAllProfileNames, getProfileOptions } from '../common/requestMocker/profiles';
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

    setConfiguration({
      ...configuration,
      // @ts-ignore
      [profileName]: profileOptionToWrite,
    });
  };

  return (
    <aside className="offcanvas offcanvas-end show bg-gray-2">
      <div className="offcanvas-body">
        <h2 className="m-0 mb-3">Mock mode profiles</h2>

        <code>{JSON.stringify(configuration)}</code>

        {availableOptions.map((profileName) => (
          <div key={profileName}>
            <label htmlFor={profileName}>
              <b>{profileName}</b>
            </label>
            <select
              name={profileName}
              key={profileName}
              value={configuration?.[profileName] ?? 'null'}
              onChange={(e) => handleProfileSelected(profileName, e.target.value)}
            >
              <option value="null">None</option>
              {getProfileOptions(profileName).map((profileOption) => (
                <option value={profileOption} key={profileOption}>
                  {profileOption}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </aside>
  );
};
