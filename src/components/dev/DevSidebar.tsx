/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { readMockModeConfiguration, writeMockModeConfiguration } from '../common/requestMocker';
import {
  getAllProfileNames,
  getProfileOptions,
  mockModeProfiles,
} from '../common/requestMocker/profiles';
import { MockModeConfiguration } from '../common/requestMocker/types';
import './DevSidebar.scss';

const TOGGLE_BREAKPOINT = 992;
const DEV_SIDEBAR_WIDTH = 400;

export const DevSidebar = () => {
  const [configuration, setConfiguration] = useState(readMockModeConfiguration());
  const [isLgUp, setIsLgUp] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return window.innerWidth >= TOGGLE_BREAKPOINT;
  });
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return window.innerWidth >= TOGGLE_BREAKPOINT;
  });
  const manuallyHiddenRef = useRef(false);

  const openSidebar = () => {
    manuallyHiddenRef.current = false;
    setIsOpen(true);
  };

  const hideSidebar = () => {
    manuallyHiddenRef.current = true;
    setIsOpen(false);
  };

  const availableOptions = getAllProfileNames();

  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleResize = () => {
      const matches = window.innerWidth >= TOGGLE_BREAKPOINT;

      setIsLgUp(matches);
      setIsOpen(() => {
        if (!matches) {
          return false;
        }

        if (manuallyHiddenRef.current) {
          return false;
        }

        return true;
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    if (isOpen && isLgUp) {
      document.body.style.paddingRight = `${DEV_SIDEBAR_WIDTH}px`;
    } else {
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.paddingRight = '';
    };
  }, [isOpen, isLgUp]);

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
    <>
      {!isOpen && (
        <div
          className="position-fixed d-flex gap-1 bg-white"
          style={{
            top: '1rem',
            right: '1rem',
            zIndex: 1060,
          }}
        >
          <button
            type="button"
            className="btn p-1 border-0 dev-sidebar-toggle dev-sidebar-toggle--show"
            onClick={openSidebar}
            aria-expanded={isOpen}
            title="Show sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 16 16"
              className="d-block"
            >
              <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z" />
              <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0" />
            </svg>
          </button>
          <button
            type="button"
            className="btn p-1 border-0 dev-sidebar-toggle dev-sidebar-toggle--clear"
            data-bs-dismiss="offcanvas"
            aria-label="Clear and close"
            title="Clear and close"
            onClick={() => handleClearConfiguration()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              className="d-block"
              viewBox="0 0 16 16"
            >
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
            </svg>
          </button>
        </div>
      )}
      <aside
        id="dev-offcanvas"
        className={`offcanvas offcanvas-end bg-gray-2${isOpen ? ' show' : ''}`}
        data-bs-scroll="true"
        data-bs-backdrop="false"
        aria-hidden={!isOpen}
      >
        <div className="offcanvas-header">
          <h2 className="offcanvas-title flex-fill" id="offcanvasLabel">
            Mock mode
          </h2>
          <div className="d-flex gap-1">
            <button
              type="button"
              className="btn p-1 border-0 dev-sidebar-toggle dev-sidebar-toggle--hide"
              onClick={hideSidebar}
              title="Hide sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 16 16"
                className="d-block"
              >
                <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z" />
                <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829" />
                <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z" />
              </svg>
            </button>
            <button
              type="button"
              className="btn p-1 border-0 dev-sidebar-toggle dev-sidebar-toggle--clear"
              data-bs-dismiss="offcanvas"
              aria-label="Clear and close"
              title="Clear and close"
              onClick={() => handleClearConfiguration()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                className="d-block"
                viewBox="0 0 16 16"
              >
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="offcanvas-body pt-2">
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
    </>
  );
};
