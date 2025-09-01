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
    },
    {
      id: 'fileSelector',
      element,
      component: fileSelectorFunction,
      isEdited: el => isStringEntryEdited(el, 'fileName')
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

function fileSelectorFunction(props) {
  const { element, id } = props;
  const modeling = useService('modeling');
  const translate = useService('translate');
  const bo = element?.businessObject;

  const fileName = (bo?.fileName ?? bo?.get?.('custom:fileName')) || '';
  const hasFile = !!fileName;

  const onFileChange = async (evt) => {
    const file = evt?.target?.files?.[0];
    if (!file) return;
    const dataUrl = await readAsDataURL(file);

    modeling.updateProperties(element, {
      'custom:fileName': file.name,
      'custom:fileContent': dataUrl
    });
  };

  const clearFile = () => {
    modeling.updateProperties(element, {
      'custom:fileName': '',
      'custom:fileContent': ''
    });
  };

  return html`
    <div class="bio-properties-panel-entry" data-entry-id=${id}>
      <label class="bio-properties-panel-label" for=${id}>
        ${translate('File')}
      </label>
      <div class="bio-properties-panel-input">
        <input
          id=${id}
          type="file"
          onChange=${onFileChange}
        />
        ${hasFile && html`
          <div class="bio-properties-panel-helper">
            <span>${translate('Selected file')}: <strong>${fileName}</strong></span>
            <button
              type="button"
              class="bio-properties-panel-button"
              onClick=${clearFile}
            >${translate('Clear')}</button>
          </div>
        `}
      </div>
    </div>
  `;
}

function readAsDataURL(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function isStringEntryEdited(element, attributeName) {
  if (!element || !element.businessObject) return false;
  const bo = element.businessObject;
  const value = bo[attributeName] ?? bo.get?.(`custom:${attributeName}`);
  return typeof value === 'string' && value.trim() !== '';
}
