import { reduce } from 'min-dash';
import inherits from 'inherits-browser';
import { is } from 'bpmn-js/lib/util/ModelUtil';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';

const HIGH_PRIORITY = 1500;

function isCustom(element) {
  return element && /^custom:/.test(element.type);
}

function isScheduler(element) {
  return element && element.type === 'custom:scheduler';
}

export default function CustomRules(eventBus) {
  RuleProvider.call(this, eventBus);
}

inherits(CustomRules, RuleProvider);

CustomRules.$inject = ['eventBus'];

CustomRules.prototype.init = function() {
  /**
   * Can shape be created on target container?
   */
  function canCreate(shape, target) {
    if (!isCustom(shape)) return;
    return is(target, 'bpmn:Process') || is(target, 'bpmn:Participant') || is(target, 'bpmn:Collaboration');
  }

  /**
   * Can source and target be connected?
   */
  function canConnect(source, target) {
  const isScheduler = el => el && el.type === 'custom:scheduler';

  if (
    (isScheduler(source) && is(target, 'bpmn:FlowNode')) ||
    (isScheduler(target) && is(source, 'bpmn:FlowNode')) ||
    (isScheduler(source) && isScheduler(target))
  ) {
    return { type: 'bpmn:SequenceFlow' };
  }

  return false;
}


  // Allow moving custom elements if destination is valid
  this.addRule('elements.move', HIGH_PRIORITY, function(context) {
    const target = context.target;
    const shapes = context.shapes;

    let type;

    const allowed = reduce(shapes, function(result, s) {
      if (type === undefined) type = isCustom(s);
      if (type !== isCustom(s) || result === false) return false;
      return canCreate(s, target);
    }, undefined);

    return allowed;
  });

  this.addRule('shape.create', HIGH_PRIORITY, function(context) {
    return canCreate(context.shape, context.target);
  });

  // ✅ permitir redimensionar solo el scheduler
  this.addRule('shape.resize', HIGH_PRIORITY, function(context) {
    const shape = context.shape;
    if (isScheduler(shape)) return true;
    if (isCustom(shape)) return false;
  });

  // ✅ conexión desde/hacia scheduler
  this.addRule('connection.create', HIGH_PRIORITY, function(context) {
    return canConnect(context.source, context.target);
  });

  this.addRule('connection.reconnectStart', HIGH_PRIORITY, function(context) {
    const { connection, hover, source } = context;
    return canConnect(hover || source, connection.target);
  });

  this.addRule('connection.reconnectEnd', HIGH_PRIORITY, function(context) {
    const { connection, hover, target } = context;
    return canConnect(connection.source, hover || target);
  });
};
