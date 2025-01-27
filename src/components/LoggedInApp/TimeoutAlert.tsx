import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { logOut } from '../login/actions';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000;
const LOGOUT_TIMEOUT = 2 * 1000;

const USER_ACTIVITY_EVENT_TYPES: (keyof DocumentEventMap)[] = [
  'mousemove',
  'keydown',
  'mousedown',
  'touchstart',
];

export const TimeoutAlert = () => {
  const [inactivityTimeout, setInactivityTimeout] = useState<number | null>(null);
  // TODO this has the problem of not being processed while in another tab, use react-idle-timer
  const [logoutTimeout, setLogoutTimeout] = useState<number | null>(null);

  const dispatch = useDispatch();

  useEffect(() => {
    setupInactivityTimeout();
  }, []);

  useEffect(() => {
    const listener = () => {
      if (inactivityTimeout) {
        clearInactivityTimeout();
      }

      setupInactivityTimeout();
    };

    USER_ACTIVITY_EVENT_TYPES.forEach((eventType) => {
      document.addEventListener(eventType, listener);
    });

    return () => {
      USER_ACTIVITY_EVENT_TYPES.forEach((eventType) => {
        document.removeEventListener(eventType, listener);
      });
    };
  }, [inactivityTimeout]);

  const clearInactivityTimeout = () => {
    if (inactivityTimeout) {
      clearTimeout(inactivityTimeout);
      setInactivityTimeout(null);
    }
  };

  const clearLogoutTimeout = () => {
    if (logoutTimeout) {
      clearTimeout(logoutTimeout);
      setLogoutTimeout(null);
    }
  };

  const setupInactivityTimeout = () => {
    setInactivityTimeout(
      setTimeout(() => {
        setupLogoutTimeout();
      }, INACTIVITY_TIMEOUT) as unknown as number,
    );
  };

  const setupLogoutTimeout = () => {
    setLogoutTimeout(
      setTimeout(() => {
        dispatch(logOut());
      }, LOGOUT_TIMEOUT) as unknown as number,
    );
  };

  const stopLogout = () => {
    if (logoutTimeout) {
      clearLogoutTimeout();
    }
    setupInactivityTimeout();
  };

  if (!logoutTimeout) {
    return null;
  }

  return (
    <div className="tv-modal">
      <div className="container">
        <div className="row mt-4 pt-4 justify-content-center">
          <div className="bg-white shadow-sm rounded-lg p-5 text-center">
            <p>
              <b>Sinu sessioon hakkab aeguma</b>
              <button type="button" className="btn btn-primary mt-4" onClick={stopLogout}>
                Jätkan
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
