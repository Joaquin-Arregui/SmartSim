import { html } from 'htm/preact';
import { useService } from 'bpmn-js-properties-panel';
import { TextFieldEntry } from '@bpmn-io/properties-panel';
import { is } from 'bpmn-js/lib/util/ModelUtil';

export default function(element) {
  return [
    {
      id: 'sequenceFlow',
      element,
      component: PercentageofBranchesFunction,
      isEdited: isNumberEntryEdited
    }
  ];
}

// PercentageofBranches
function PercentageofBranchesFunction(props) {
  const { element, id } = props;

  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = () => {
    if (!element || !element.businessObject) {
      return '';
    }
    const value = element.businessObject.percentageOfBranches;
    return (value !== undefined && value !== null && !isNaN(value)) ? value.toString() : '';
  };

  const setValue = value => {
    const safeValue = value || ''; 

    if (!element || !element.businessObject) {
      return;
    }

    let valueToSave;
    const newPercentage = parseInt(safeValue, 10);

    if (safeValue.trim() === '') {
      valueToSave = undefined; 
    } else if (isNaN(newPercentage)) {
      return; 
    } else {
      valueToSave = newPercentage;
    }

    modeling.updateProperties(element, {
      percentageOfBranches: valueToSave
    });
  };

  const validate = (value) => {
    const safeValue = value || '';
    const newPercentage = parseInt(safeValue, 10);

    if (safeValue.trim() !== '' && isNaN(newPercentage)) {
      return translate('Must be a valid number.');
    }
    
    if (newPercentage < 0) {
      return translate('Percentage cannot be negative.');
    }

    const sourceElement = element.businessObject.sourceRef;

    if (sourceElement && is(sourceElement, 'bpmn:Gateway')) {
      const outgoingFlows = sourceElement.outgoing || [];
      let totalPercentage = 0;
      let allBranchesHaveValue = true; 

      outgoingFlows.forEach(flow => {
        if (is(flow, 'bpmn:SequenceFlow')) {
          
          let branchPercentage;
          if (flow.id === element.businessObject.id) {
            branchPercentage = newPercentage;
          } else {
            branchPercentage = parseInt(flow.percentageOfBranches, 10);
          }

          if (isNaN(branchPercentage)) {
            allBranchesHaveValue = false;
            branchPercentage = 0;
          }
          
          totalPercentage += branchPercentage;
        }
      });

      if (allBranchesHaveValue) {
        if (totalPercentage > 100) {
          return translate('Total percentage exceeds 100%.'); 
        }

        if (totalPercentage !== 100) {
          return translate('Total must be 100% when all branches are filled.');
        }
      }
    }

    return null;
  };

  const validateOnBlur = () => {
    
    const currentPercentage = parseInt(element.businessObject.percentageOfBranches, 10);

    if (isNaN(currentPercentage)) {
      return;
    }

    const sourceElement = element.businessObject.sourceRef;

    if (sourceElement && is(sourceElement, 'bpmn:Gateway')) {
      const outgoingFlows = sourceElement.outgoing || [];
      let totalPercentage = 0;
      let allBranchesHaveValue = true; 

      outgoingFlows.forEach(flow => {
        if (is(flow, 'bpmn:SequenceFlow')) {
          
          let branchPercentage = parseInt(flow.percentageOfBranches, 10);

          if (isNaN(branchPercentage)) {
            allBranchesHaveValue = false;
            branchPercentage = 0;
          }
          
          totalPercentage += branchPercentage;
        }
      });

      if (allBranchesHaveValue) {
        
        if (totalPercentage > 100) {
          setTimeout(() => {
            alert('La suma de todas las ramas del Gateway excede el 100%. Ajusta los valores.');
          }, 0);
          return; 
        }

        if (totalPercentage !== 100) {
           setTimeout(() => {
            alert('Todas las ramas están completadas pero el valor total no es 100%. Ajusta los valores.');
          }, 0);
          return;
        }
      }
    }
  };


  return html`<${TextFieldEntry}
    id=${id}
    element=${element}
    label=${translate('Percentage of Branches')}
    getValue=${getValue}
    setValue=${setValue}           
    debounce=${debounce}
    validate=${validate}
    onBlur=${validateOnBlur}     
    tooltip=${translate('Enter the percentage for this branch.')} 
  />`;
}


function isNumberEntryEdited(element) {
  if (!element || !element.businessObject) {
    return false;
  }
  return element.businessObject.percentageOfBranches !== undefined;
}