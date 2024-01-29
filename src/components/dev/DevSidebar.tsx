import React, { useEffect, useState } from 'react';
import { connect, ConnectedProps, useDispatch } from 'react-redux';
import { User, UserConversion } from '../common/apiModels';
import styles from './DevSidebar.module.scss';
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
        <div key={path}>
          <label onClick={() => toggleCollapse(path)} style={{ cursor: 'pointer' }}>
            {isCollapsed ? '[+]' : '[-]'} {key}
          </label>
          {!isCollapsed && <div style={{ marginLeft: '20px' }}>{renderPaths(value, path)}</div>}
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
    <div key={path} className={styles.fieldContainer}>
      <div className={styles.label}>
        <label>{path}:</label>
      </div>
      <div className={styles.radioGroup}>
        <label>
          <input
            type="radio"
            name={path}
            checked={value}
            onChange={() => handleFieldChange(path, true)}
            data-testid={`${path}-true`}
          />
          True
        </label>
        <label>
          <input
            type="radio"
            name={path}
            checked={!value}
            onChange={() => handleFieldChange(path, false)}
            data-testid={`${path}-false`}
          />
          False
        </label>
      </div>
    </div>
  );

  const renderTextField = (path: string, value: string) => (
    <div key={path} className={styles.fieldContainer}>
      <label className={styles.label}>{path}:</label>
      <input
        type="text"
        className={styles.textField}
        value={value}
        onChange={(e) => handleFieldChange(path, e.target.value)}
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
    <aside className={styles.devSidebar}>
      <h2>User Conversion Data</h2>
      {renderPaths(editableConversion as unknown as NestedStateField, 'userConversion')}
      <button
        type="button"
        className={styles.button}
        onClick={() =>
          dispatch({ type: GET_USER_CONVERSION_SUCCESS, userConversion: editableConversion })
        }
      >
        Update Conversion
      </button>
      <h2>User Data</h2>
      {renderPaths(editableUser as unknown as NestedStateField, 'user')}
      <button
        type="button"
        className={styles.button}
        onClick={() => dispatch({ type: GET_USER_SUCCESS, user: editableUser })}
      >
        Update User
      </button>

      <div>
        <button className={styles.button} type="button" onClick={exportState}>
          Export State
        </button>
        <input
          type="file"
          onChange={importState}
          style={{ display: 'none' }}
          id="fileInput"
          accept=".json"
        />
        <label htmlFor="fileInput" className={`${styles.button} ${styles.buttonLabel}`}>
          Import State
        </label>
      </div>
    </aside>
  );
};

type StateProperties = ConnectedProps<typeof connector>;

const connector = connect(mapStateToProps);
export default connector(DevSidebar);
