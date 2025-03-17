import React, { useEffect, useState } from 'react';
import { connect, ConnectedProps, useDispatch } from 'react-redux';
import _ from 'lodash';
import { User, UserConversion } from '../common/apiModels';
import { GET_USER_CONVERSION_SUCCESS, GET_USER_SUCCESS } from '../login/constants';

interface RootState {
  login: {
    userConversion: UserConversion;
    user: User;
  };
}

interface EditableStateField {
  [key: string]: string | boolean | number | EditableStateField;
}

interface NestedStateField {
  [key: string]: string | boolean | number | NestedStateField;
}
const mapStateToProps = (state: RootState) => ({
  conversion: state.login.userConversion,
  userData: state.login.user,
});

interface CollapsedSections {
  [key: string]: boolean;
}

const DevSidebar: React.FC<StateProperties> = ({ conversion, userData }) => {
  const [editableConversion, setEditableConversion] = useState<UserConversion>(conversion);
  const [editableUser, setEditableUser] = useState<User>(userData);
  const [collapsedSections, setCollapsedSections] = useState<CollapsedSections>({});
  const dispatch = useDispatch();

  useEffect(() => {
    setEditableConversion(conversion);
    setEditableUser(userData);
  }, [conversion, userData]);

  const toggleCollapse = (path: string) => {
    setCollapsedSections((prevState) => ({
      ...prevState,
      [path]: !(prevState[path] ?? true),
    }));
  };

  const isSectionCollapsed = (path: string) => collapsedSections[path] !== false;

  function renderSectionAndField(
    value: string | number | NestedStateField | boolean,
    path: string,
    isCollapsed: boolean,
    key: string,
  ) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return (
        <div key={path} className="mb-3">
          <label
            onClick={() => toggleCollapse(path)}
            style={{ cursor: 'pointer' }}
            className="d-inline-block fs-6 fw-semibold"
          >
            <span className="ff-system fw-normal">{isCollapsed ? '[+]' : '[−]'}</span> {key}
          </label>
          {!isCollapsed && <div className="ms-3 mt-3">{renderPaths(value, path)}</div>}
        </div>
      );
    }
    if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') {
      return renderField(path, value);
    }
    return null;
  }

  const renderPaths = (data: NestedStateField, parentPath = '') => {
    if (data) {
      return Object.entries(data).map(([key, value]) => {
        const path = `${parentPath}.${key}`;
        const isCollapsed = isSectionCollapsed(path);
        return renderSectionAndField(value, path, isCollapsed, key);
      });
    }
    return <div />;
  };

  const renderField = (path: string, value: string | boolean | number) => {
    if (typeof value === 'boolean') {
      return renderBooleanField(path, value);
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return renderTextField(path, value.toString());
    }
    return null;
  };

  const renderBooleanField = (path: string, value: boolean) => (
    <div key={path} className="mb-3">
      <label className="form-label fw-normal">{path}</label>
      <div>
        <div className="form-check form-check-inline">
          <input
            type="radio"
            name={path}
            className="form-check-input"
            checked={value}
            onChange={() => handleFieldChange(path, true)}
            id={`${path}-true`}
            data-testid={`${path}-true`}
          />
          <label className="form-check-label" htmlFor={`${path}-true`}>
            True
          </label>
        </div>
        <div className="form-check form-check-inline">
          <input
            type="radio"
            name={path}
            className="form-check-input"
            checked={!value}
            onChange={() => handleFieldChange(path, false)}
            id={`${path}-false`}
            data-testid={`${path}-false`}
          />
          <label className="form-check-label" htmlFor={`${path}-false`}>
            False
          </label>
        </div>
      </div>
    </div>
  );

  const renderTextField = (path: string, value: string) => (
    <div key={path} className="mb-3">
      <label htmlFor={`${path}-input`} className="form-label fw-normal">
        {path}
      </label>
      <input
        type="text"
        className="form-control"
        value={value}
        onChange={(e) => handleFieldChange(path, e.target.value)}
        id={`${path}-input`}
        data-testid={`${path}-input`}
      />
    </div>
  );

  const handleFieldChange = (path: string, value: string | boolean) => {
    const keys = path.split('.');
    const section = keys.shift();
    const lastKey = keys.pop();

    let sectionData: EditableStateField | undefined;
    if (section === 'userConversion') {
      sectionData = editableConversion as unknown as EditableStateField;
    } else {
      sectionData = editableUser as unknown as EditableStateField;
    }

    keys.forEach((key) => {
      if (!sectionData || !sectionData[key] || typeof sectionData[key] !== 'object') {
        // eslint-disable-next-line no-console
        console.error(`Invalid path: ${path}`);
        return;
      }
      sectionData = sectionData[key] as EditableStateField;
    });

    if (lastKey && sectionData) {
      if (typeof sectionData === 'object' && !Array.isArray(sectionData)) {
        sectionData[lastKey] = value;
        if (section === 'userConversion') {
          setEditableConversion({ ...editableConversion });
        } else {
          setEditableUser({ ...editableUser });
        }
      }
    } else {
      // eslint-disable-next-line no-console
      console.error(`Invalid key encountered: ${lastKey}`);
    }
  };

  const exportState = (): void => {
    const state = JSON.stringify({ userConversion: editableConversion, user: editableUser });
    const blob = new Blob([state], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'applicationState.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  function processStateFile(e: ProgressEvent<FileReader>) {
    try {
      const result = e.target?.result;
      const importedState = JSON.parse(result as string) as {
        userConversion: UserConversion;
        user: User;
      };
      if (importedState.userConversion && importedState.user) {
        setEditableConversion(importedState.userConversion);
        setEditableUser(importedState.user);
        dispatch({
          type: GET_USER_CONVERSION_SUCCESS,
          userConversion: importedState.userConversion,
        });
        dispatch({ type: GET_USER_SUCCESS, user: importedState.user });
      } else {
        // eslint-disable-next-line no-console
        console.error('Invalid state file');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to parse state file', err);
    }
  }

  const importState = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        processStateFile(e);
      };
      reader.readAsText(file);
    }
  };

  return (
    <aside className="offcanvas offcanvas-end show bg-gray-2">
      <div className="offcanvas-body">
        <h2 className="m-0 mb-3">User conversion data</h2>
        {renderPaths(editableConversion as unknown as NestedStateField, 'userConversion')}
        <div className="d-grid">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              dispatch({
                type: GET_USER_CONVERSION_SUCCESS,
                userConversion: _.cloneDeep(editableConversion),
              })
            }
          >
            Update conversion
          </button>
        </div>
        <hr className="my-3" />
        <h2 className="mb-3">User data</h2>
        {renderPaths(editableUser as unknown as NestedStateField, 'user')}
        <div className="d-flex flex-column gap-3">
          <div className="d-grid">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => dispatch({ type: GET_USER_SUCCESS, user: _.cloneDeep(editableUser) })}
            >
              Update user
            </button>
          </div>
          <hr />
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-primary flex-fill"
              type="button"
              onClick={exportState}
            >
              Export state
            </button>
            <input
              type="file"
              onChange={importState}
              style={{ display: 'none' }}
              id="fileInput"
              accept=".json"
            />
            <label htmlFor="fileInput" className="btn btn-sm btn-outline-primary flex-fill">
              Import state
            </label>
          </div>
        </div>
      </div>
    </aside>
  );
};

type StateProperties = ConnectedProps<typeof connector>;

const connector = connect(mapStateToProps);
export default connector(DevSidebar);
