import { reduce } from 'min-dash';
import inherits from 'inherits-browser';
import { is } from 'bpmn-js/lib/util/ModelUtil';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';

const HIGH_PRIORITY = 1500;
const TAG = '[RULES]';

function boOf(el) {
  return (el && (el.businessObject || el)) || {};
}
function idOf(el) {
  return el && (el.id || boOf(el).id) || '(no-id)';
}
function typeOf(el) {
  return (el && el.type) || boOf(el).$type || '(no-type)';
}

// 👇 helpers nuevos (puedes ponerlos junto a los que ya tienes)
function viewParentId(el) {
  return el && el.parent && el.parent.id;
}

// sube por el árbol de diagram-js (element.parent) hasta encontrar
// el contenedor "fuerte": bpmn:Participant o bpmn:Process
function rootContainer(el) {
  let cur = el;
  let hops = 0;
  while (cur && hops++ < 50) {
    if (cur.businessObject) {
      // importante: aquí usamos el DI (shape) con BO
      if (is(cur, 'bpmn:Participant') || is(cur, 'bpmn:Process')) return cur;
    }
    cur = cur.parent;
  }
  return null;
}

function sameProcessByDiagram(a, b) {
  const ra = rootContainer(a);
  const rb = rootContainer(b);
  const eq = !!ra && !!rb && ra.id === rb.id;

  return eq;
}

/**
 * Sube por la cadena $parent hasta encontrar el bpmn:Process (o null).
 */
function rootProcess(el) {
  let bo = boOf(el);
  let hop = 0;
  while (bo && bo.$type) {
    if (is(bo, 'bpmn:Process')) return bo;
    bo = bo.$parent;
    if (++hop > 50) break; // seguridad
  }
  return null;
}

function brief(el) {
  const bo = boOf(el);
  const proc = rootProcess(el);
  return {
    id: idOf(el),
    viewType: el && el.type,
    boType: bo.$type,
    isSched: isScheduler(el),
    parent: bo.$parent && bo.$parent.id,
    rootProcess: proc && proc.id,
    attrs: bo.$attrs || {}
  };
}

function isCustom(el) {
  return el && /^custom:/.test((el.type || ''));
}

/**
 * MUY IMPORTANTE: detecta scheduler aunque sea un bpmn:Task marcado por atributo o flag.
 */
function isScheduler(el) {
  if (!el) return false;

  const bo = boOf(el);

  const byType = /^custom:scheduler$/i.test((el.type || ''));
  const byAttr = !!bo.$attrs && (
    bo.$attrs['custom:type'] === 'scheduler' ||
    bo.$attrs['data-type'] === 'scheduler' ||     // por si se marcó así en otro sitio
    bo.$attrs['isScheduler'] === 'true'
  );
  const byFlag = (el.isScheduler === true) || (el.isSchedulerFlag === true);

  const res = !!(byType || byAttr || byFlag);

  return res;
}

export default function CustomRules(eventBus) {
  RuleProvider.call(this, eventBus);

  // ====== GANCHOS DE DEBUG EN EL EVENT BUS ======
  // Movimiento
  eventBus.on('shape.move.start', HIGH_PRIORITY, (e) => {
  });

  eventBus.on('shape.move.end', HIGH_PRIORITY, (e) => {
  });

  // Conexiones creadas / eliminadas / relayout
  eventBus.on('commandStack.connection.create.execute', HIGH_PRIORITY, (ctx) => {
    const { context } = ctx;
  });

  eventBus.on('commandStack.connection.delete.execute', HIGH_PRIORITY, (ctx) => {
    const { context } = ctx;
  });

  // Reconnect (puntas)
  eventBus.on('commandStack.connection.reconnect.execute', HIGH_PRIORITY, (ctx) => {
    const { context } = ctx;
  });
  eventBus.on('element.changed', HIGH_PRIORITY, (e) => {

  });
}

function rootContainerId(el) {
  const r = rootContainer(el);
  return r && r.id;
}

function keepsSameRootForConnections(shape, target) {
  const conns = (shape.incoming || []).concat(shape.outgoing || []);
  if (!conns.length) return true;

  const newRoot = rootContainerId(target) || rootContainerId(shape.parent);

  for (const c of conns) {
    const other = c.source === shape ? c.target : c.source;
    if (!other) continue;
    const otherRoot = rootContainerId(other);
    if (!newRoot || !otherRoot || newRoot !== otherRoot) {
      return false;
    }
  }
  return true;
}

inherits(CustomRules, RuleProvider);

CustomRules.$inject = ['eventBus'];

CustomRules.prototype.init = function() {

  const canCreate = (shape, target) => {
    if (!isCustom(shape)) return;

    const ok =
  is(target, 'bpmn:Process') ||
  is(target, 'bpmn:Participant') ||
  is(target, 'bpmn:Lane') ||
  is(target, 'bpmn:SubProcess');

    return ok;
  };

function canConnect(source, target) {
  const involvesScheduler = isScheduler(source) || isScheduler(target);
  if (!involvesScheduler) return;

  const otherEnd = isScheduler(source) ? target : source;

  if (!is(otherEnd, 'bpmn:FlowNode')) {
    return false;
  }

  if (!sameProcessByDiagram(source, target)) {
    return false;
  }

  return { type: 'bpmn:SequenceFlow' };
}

  // ====== REGLAS ======

  // Mover elementos (grupo)
  this.addRule('elements.move', HIGH_PRIORITY, function(context) {
    const { target, shapes } = context;
    const schedulerShape = shapes.find(isScheduler);
    const movingScheduler = !!schedulerShape

   // 1) nunca permitir soltar scheduler en Collaboration
   if (movingScheduler && is(target, 'bpmn:Collaboration')) {
     return false;
   }

   // 2) si ya está conectado, mantener mismo root (pool/proceso)
   if (movingScheduler && !keepsSameRootForConnections(schedulerShape, target)) {
     return false;
   }

    let type;
    const allowed = reduce(
      shapes,
      function(result, s) {
        if (type === undefined) type = isCustom(s);
        if (type !== isCustom(s) || result === false) return false;
        return canCreate(s, target);
      },
      undefined
    );
    return allowed;
  });

  // Crear shape
  this.addRule('shape.create', HIGH_PRIORITY, function(context) {
    const res = canCreate(context.shape, context.target);
    return res;
  });

  // Redimensionar
  this.addRule('shape.resize', HIGH_PRIORITY, function(context) {
    const { shape } = context;
    const res = isScheduler(shape) ? true : (isCustom(shape) ? false : undefined);
    return res;
  });

  // Crear conexión
  this.addRule('connection.create', HIGH_PRIORITY, function(context) {
    const res = canConnect(context.source, context.target);
    return res;
  });

  // Reconnect start
  this.addRule('connection.reconnectStart', HIGH_PRIORITY, function(context) {
    const { connection, hover, source } = context;
    const res = canConnect(hover || source, connection.target);
    return res;
  });

  // Reconnect end
  this.addRule('connection.reconnectEnd', HIGH_PRIORITY, function(context) {
    const { connection, hover, target } = context;
    const res = canConnect(connection.source, hover || target);
    return res;
  });
};
