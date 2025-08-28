import { html } from 'htm/preact';
import { useService } from 'bpmn-js-properties-panel';
import { TextFieldEntry } from '@bpmn-io/properties-panel';

export default function(element) {
  return [
    {
      id: 'url',
      element,
      component: urlFunction,
      isEdited: el => isStringEntryEdited(el, 'url')
    }
  ];
}

function urlFunction(props) {
  const { element, id } = props;
  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = () => {
    if (!element || !element.businessObject) return '';
    const bo = element.businessObject;
    return (bo.url ?? bo.get?.('custom:url') ?? '') || '';
  };

  const setValue = (value) => {
    if (!element || !element.businessObject) return;
    modeling.updateProperties(element, {
      'custom:url': (value ?? '').trim()
    });
  };

  // --- Validación de URL ---
  const validate = (value) => {
    if (!value || value.trim() === '') {
      return; 
    }
    try {
      new URL(value); 
      return;
    } catch (err) {
      return translate('Please enter a valid URL (e.g. https://example.com)');
    }
  };

  return html`<${TextFieldEntry}
    id=${id}
    element=${element}
    label=${translate('Url')}
    getValue=${getValue}
    setValue=${setValue}
    debounce=${debounce}
    validate=${validate}
    tooltip=${translate('Enter a valid URL')}
  />`;
}

function isStringEntryEdited(element, attributeName) {
  if (!element || !element.businessObject) return false;
  const bo = element.businessObject;
  const value = bo[attributeName] ?? bo.get?.(`custom:${attributeName}`);
  return typeof value === 'string' && value.trim() !== '';
}
