import { html } from 'htm/preact';
import { useService } from 'bpmn-js-properties-panel';

export default function(element) {
  return [
    {
      id: 'percentageIntervention',
      element,
      component: percentageInterventionFunction,
      isEdited: element => isStringEntryEdited(element, 'percentageIntervention')
    }
  ];
}

function percentageInterventionFunction(props) {
  return timeInterventionEditor(props, 'percentageIntervention', 'Set percentage intervention');
}

function timeInterventionEditor(props, attribute, buttonLabel) {
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
    const moddleType = 'sequenceFlow:KeyValuePairPercentageIntervention';

    const newEntry = moddle.create(moddleType, {
      key: '',
      value: ''
    });
    setUserList([ ...current, newEntry ]);
  };

  const updateKey = (index, newKey) => {
    const current = getUserList();
    const updated = [ ...current ];
    const moddleType = 'sequenceFlow:KeyValuePairPercentageIntervention';

    updated[index] = moddle.create(moddleType, {
      key: newKey,
      value: updated[index].value
    });
    setUserList(updated);
  };

  const updateValue = (index, newValue) => {
    const current = getUserList();
    const updated = [ ...current ];
    const moddleType = 'sequenceFlow:KeyValuePairPercentageIntervention';

    updated[index] = moddle.create(moddleType, {
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
          placeholder="Moment"
          style="margin-right: 10px;"
        />
        <input 
          type="text" 
          value=${pair.value || ''} 
          onInput=${e => updateValue(index, e.target.value)} 
          placeholder="Percentage"
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
