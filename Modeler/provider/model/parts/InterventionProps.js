import { html } from 'htm/preact';
import { useService } from 'bpmn-js-properties-panel';

export default function(element) {
  return [
    {
      id: 'addUser',
      element,
      component: addUserFunction,
      isEdited: element => isStringEntryEdited(element, 'addUser')
    },
    {
      id: 'deleteUser',
      element,
      component: deleteUserFunction,
      isEdited: element => isStringEntryEdited(element, 'deleteUser')
    }
  ];
}

function addUserFunction(props) {
  return addUserEditor(props, 'addUser', 'Add new user');
}

function deleteUserFunction(props) {
  return deleteUserEditor(props, 'deleteUser', 'Delete user');
}

function addUserEditor(props, attribute, buttonLabel) {
  const { element } = props;
  const modeling = useService('modeling');
  const translate = useService('translate');
  const moddle = useService('moddle');

  const getUserList = () => {
    if (!element || !element.businessObject) return [];

    return Array.isArray(element.businessObject[attribute])
      ? element.businessObject[attribute]
      : [];
  };

  const setUserList = (updatedArray) => {
    modeling.updateProperties(element, {
      [attribute]: updatedArray
    });
  };


  const addRole = () => {
    const current = getUserList();
    const newEntry = moddle.create('model:KeyValuePairAddUser', {
      key: '',
      value: ''
    });
    setUserList([ ...current, newEntry ]);
  };

  const updateKey = (index, newKey) => {
    const current = getUserList();
    const updated = [ ...current ];
    updated[index] = moddle.create('model:KeyValuePairAddUser', {
      key: newKey,
      value: updated[index].value
    });
    setUserList(updated);
  };

  const updateValue = (index, newValue) => {
    const current = getUserList();
    const updated = [ ...current ];
    updated[index] = moddle.create('model:KeyValuePairAddUser', {
      key: updated[index].key,
      value: newValue
    });
    setUserList(updated);
  };

  const remove = (index) => {
    const current = getUserList();
    const updated = [ ...current ];
    updated.splice(index, 1);
    setUserList(updated);
  };

  const renderEntries = () => {
    return getUserList().map((pair, index) => html`
      <div class="user-pool-item">
        <input 
          type="text" 
          value=${pair.key || ''} 
          onInput=${e => updateKey(index, e.target.value)} 
          placeholder="Intervention"
          style="margin-right: 10px;"
        />
        <input 
          type="text" 
          value=${pair.value || ''} 
          onInput=${e => updateValue(index, e.target.value)} 
          placeholder="User name"
        />
        <button 
          class="remove-role-button"
          onClick=${() => remove(index)}
          style="margin-left: 10px; background-color: red; color: white;">
          ${translate('X')}
        </button>
      </div>
    `);
  };

  return html`
    <div class="user-pool-container">
      ${renderEntries()}
      <button class="add-role-button" onClick=${addRole}>
        ${translate(buttonLabel)}
      </button>
    </div>
  `;
}

function deleteUserEditor(props, attribute, buttonLabel) {
  const { element } = props;
  const modeling = useService('modeling');
  const translate = useService('translate');
  const moddle = useService('moddle');

  const getUserList = () => {
    if (!element || !element.businessObject) return [];

    return Array.isArray(element.businessObject[attribute])
      ? element.businessObject[attribute]
      : [];
  };

  const setUserList = (updatedArray) => {
    modeling.updateProperties(element, {
      [attribute]: updatedArray
    });
  };


  const addRole = () => {
    const current = getUserList();
    const newEntry = moddle.create('model:KeyValuePairDeleteUser', {
      key: '',
      value: ''
    });
    setUserList([ ...current, newEntry ]);
  };

  const updateKey = (index, newKey) => {
    const current = getUserList();
    const updated = [ ...current ];
    updated[index] = moddle.create('model:KeyValuePairDeleteUser', {
      key: newKey,
      value: updated[index].value
    });
    setUserList(updated);
  };

  const updateValue = (index, newValue) => {
    const current = getUserList();
    const updated = [ ...current ];
    updated[index] = moddle.create('model:KeyValuePairDeleteUser', {
      key: updated[index].key,
      value: newValue
    });
    setUserList(updated);
  };

  const remove = (index) => {
    const current = getUserList();
    const updated = [ ...current ];
    updated.splice(index, 1);
    setUserList(updated);
  };

  const renderEntries = () => {
    return getUserList().map((pair, index) => html`
      <div class="user-pool-item">
        <input 
          type="text" 
          value=${pair.key || ''} 
          onInput=${e => updateKey(index, e.target.value)} 
          placeholder="Intervention"
          style="margin-right: 10px;"
        />
        <input 
          type="text" 
          value=${pair.value || ''} 
          onInput=${e => updateValue(index, e.target.value)} 
          placeholder="User name"
        />
        <button 
          class="remove-role-button"
          onClick=${() => remove(index)}
          style="margin-left: 10px; background-color: red; color: white;">
          ${translate('X')}
        </button>
      </div>
    `);
  };

  return html`
    <div class="user-pool-container">
      ${renderEntries()}
      <button class="add-role-button" onClick=${addRole}>
        ${translate(buttonLabel)}
      </button>
    </div>
  `;
}

function isStringEntryEdited(element, attributeName) {
  if (!element || !element.businessObject) {
    return false;
  }

  const value = element.businessObject[attributeName];
  return typeof value === 'string' && value.trim() !== '';
}
