import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import '@bpmn-io/properties-panel/assets/properties-panel.css';
import '../style.less';

import svgPanZoom from 'svg-pan-zoom';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import download from 'downloadjs';
import $ from 'jquery';
import resizeAllModule from '../../lib/resize-all-rules';
import propertiesProviderModule from '../../provider/properties';

import collaborationExtension from '../../descriptors/collaboration.json';
import customExtension from '../../descriptors/custom-moddle.json';
import sequenceFlowExtension from '../../descriptors/sequenceFlow.json';
import AddExporter from '@bpmn-io/add-exporter';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import CustomModeler from '../../custom-modeler';
import { exportToEsper } from './taskHandlers';

import userModdleDescriptor from '../../descriptorsResource/userResource.json';
import modelExtension from '../../descriptorsResource/modelResource.json';
import laneExtension from '../../descriptorsResource/laneResource.json';
import participantWithoutLaneExtension from '../../descriptorsResource/participantWithoutLaneResource.json';

$(function () {
  // ----------------------------
  // Modeler setup
  // ----------------------------
  const bpmnModeler = new CustomModeler({
    container: '#canvas',
    propertiesPanel: { parent: '#properties-panel' },
    additionalModules: [
      BpmnPropertiesPanelModule,
      BpmnPropertiesProviderModule,
      propertiesProviderModule,
      resizeAllModule,
      AddExporter
    ],
    exporter: { name: 'my-bpmn-exporter', version: '1.0.0' },
    moddleExtensions: {
      user: userModdleDescriptor,
      sequenceFlow: sequenceFlowExtension,
      model: modelExtension,
      collaboration: collaborationExtension,
      lane: laneExtension,
      participantWithoutLane: participantWithoutLaneExtension,
      custom: customExtension
    }
  });

  // ----------------------------
  // Helpers
  // ----------------------------
  const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

  function appendMessage(sender, text) {
    const container = document.getElementById('modal-content-tab3');
    const msgEl = document.createElement('div');
    msgEl.classList.add('message', sender);
    const cleanHtml = DOMPurify.sanitize(md.render(text));
    msgEl.innerHTML = cleanHtml;
    container.appendChild(msgEl);
    msgEl.scrollIntoView({ block: 'start' });
  }

  async function openDiagram(xml) {
    try {
      await bpmnModeler.importXML(xml);
      $('#canvas').removeClass('with-error').addClass('with-diagram');
    } catch (err) {
      console.error('Error during importXML:', err);
      $('#canvas').removeClass('with-diagram').addClass('with-error');
      $('#canvas .error pre').text(err.message);
    }
  }

  function registerFileDrop($container, callback) {
    function handleFileSelect(e) {
      e.stopPropagation();
      e.preventDefault();
      const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
      if (!files || files.length === 0) return console.error('No se encontró un archivo para procesar.');
      const file = files[0];
      if (!(file instanceof File)) return console.error('El archivo no es válido.');

      const reader = new FileReader();
      reader.onload = ev => callback(ev.target.result);
      reader.onerror = ev => console.error('Error al leer el archivo:', ev);
      reader.readAsText(file);
    }

    function handleDragOver(e) {
      e.stopPropagation();
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }

    const container = $container.get(0);
    container.addEventListener('dragover', handleDragOver, false);
    container.addEventListener('drop', handleFileSelect, false);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.bpmn, .xml';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', handleFileSelect, false);
    container.appendChild(fileInput);
  }

  async function exportDefinitionsXML(modeler) {
    const moddle = modeler.get('moddle');
    const defs = modeler.get('canvas').getRootElement().businessObject.$parent;
    hardCleanDefinitions(modeler); // limpieza fuerte antes de serializar
    const { xml } = await moddle.toXML(defs);
    return xml;
  }

  async function downloadDiagram() {
    try {
      await sanitizeModel(bpmnModeler);
      hardCleanDefinitions(bpmnModeler);
      const xml = await exportDefinitionsXML(bpmnModeler);
      download(xml, 'diagram.bpmn', 'application/xml');
    } catch (err) {
      console.error('Error al guardar BPMN:', err);
    }
  }

  function prepareXmlForServer(xml) {
    let out = xml;
    out = out.replace(/<custom:Scheduler\b/g, '<bpmn:ServiceTask');
    out = out.replace(/<\/custom:Scheduler>/g, '</bpmn:ServiceTask>');
    out = out.replace(/\scustom:[\w:-]+="[^"]*"/g, '');
    out = out.replace(/<custom:fileContent>[\s\S]*?<\/custom:fileContent>/g, '');
    out = out.replace(/\sxmlns:custom="[^"]*"/, '');
    return out;
  }

  // ----------------------------
  // Bootstrap inicial
  // ----------------------------
  (async () => {
    const storedXml = sessionStorage.getItem('importedDiagram');
    if (storedXml) {
      await openDiagram(storedXml).catch(err => console.error('No se pudo cargar el diagrama:', err));
      sessionStorage.removeItem('importedDiagram');
    } else {
      try {
        await bpmnModeler.createDiagram();
      } catch (err) {
        console.error('No se pudo cargar el diagrama inicial:', err);
      }
    }
  })();

  registerFileDrop($('#canvas'), openDiagram);

  // ----------------------------
  // Acciones UI
  // ----------------------------
  document.body.addEventListener('keydown', (event) => {
    if (event.code === 'KeyS' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      downloadDiagram();
    }
  });

  if (!window.FileList || !window.FileReader) {
    window.alert('Tu navegador no soporta arrastrar y soltar. Usa Chrome, Firefox o Edge.');
  }

  $('#js-simulate').off('click').on('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    try {
      await sanitizeModel(bpmnModeler);
      hardCleanDefinitions(bpmnModeler);

      const rawXML = await exportDefinitionsXML(bpmnModeler); // XML con custom
      const diagramXML = prepareXmlForServer(rawXML);          // XML limpio para backend
      const content = await exportToEsper(bpmnModeler);

      const response = await fetch('http://localhost:3000/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          diagramXML,
          filename: 'esperTasks.txt',
          diagramfilename: 'diagram.bpmn'
        })
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`There has been an error in the simulation: ${response.statusText}${text ? ' - ' + text : ''}`);
      }

      const data = await response.json();

      await bpmnModeler.importXML(data.heatMap);
      const { svg } = await bpmnModeler.saveSVG();
      await bpmnModeler.importXML(rawXML); // volver a XML original

      document.querySelector('#modal-content-tab1').textContent = data.simulation;
      document.querySelector('#heatmap-container').innerHTML = svg;
      document.querySelector('#modal-content-tab3').innerHTML = '';
      appendMessage('bot', data.reply);
      document.querySelector('.modal-overlay').style.display = 'block';
    } catch (err) {
      console.error('Error during the simulation:', err);
    }
  });

  $('#js-continue').off('click').on('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    document.querySelector('.modal-overlay').style.display = 'block';
  });

  document.getElementById('close-modal')?.addEventListener('click', () => {
    document.querySelector('.modal-overlay').style.display = 'none';
  });

  document.querySelectorAll('.tab-button').forEach((button) => {
    button.addEventListener('click', function () {
      const tab = this.dataset.tab;
      document.querySelectorAll('.tab-button').forEach((btn) => btn.classList.remove('active'));
      this.classList.add('active');
      document.querySelectorAll('.tab-content').forEach((content) => content.classList.remove('active'));
      document.getElementById(`${tab}-content`).classList.add('active');
    });
  });

  document.getElementById('send-chatbot')?.addEventListener('click', async () => {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();
    if (!message) return;

    const llm = document.getElementById('chatbot-selector').value;
    appendMessage('user', message);
    input.value = '';

    try {
      const response = await fetch('http://localhost:3000/continueChat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, llm })
      });
      if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
      const data = await response.json();
      appendMessage('bot', data.reply || 'No reply.');
    } catch (err) {
      console.error('Error sending chat message:', err);
      appendMessage('bot', 'Error processing your message.');
    }
  });

  let heatmapPanZoom;
  document.querySelector('[data-tab="tab2"]')?.addEventListener('click', () => {
    const svgEl = document.querySelector('#heatmap-container svg');
    if (!svgEl) return;
    if (!heatmapPanZoom) {
      heatmapPanZoom = svgPanZoom(svgEl, {
        zoomEnabled: true,
        controlIconsEnabled: true,
        fit: true,
        center: true
      });
    } else {
      heatmapPanZoom.resize();
      heatmapPanZoom.fit();
      heatmapPanZoom.center();
    }
  });

  // ----------------------------
  // Limpieza de modelo
  // ----------------------------
  async function sanitizeModel(modeler) {
    const modeling = modeler.get('modeling');
    const moddle = modeler.get('moddle');
    const commandStack = modeler.get('commandStack');
    const elementRegistry = modeler.get('elementRegistry');

    const canvasRoot = modeler.get('canvas').getRootElement();
    const definitions = canvasRoot.businessObject.$parent;

    // Reparar userWithRole
    elementRegistry.filter(e => e.type === 'bpmn:Process').forEach(procShape => {
      const bo = procShape.businessObject;

      if (bo.userWithRole && !Array.isArray(bo.userWithRole)) {
        const arr = Object.entries(bo.userWithRole).map(([key, val]) =>
          moddle.create('model:KeyValuePair', {
            key,
            value: Array.isArray(val) ? val.join(',') : String(val ?? '')
          })
        );
        modeling.updateModdleProperties(procShape, bo, { userWithRole: arr });
      }

      if (Array.isArray(bo.userWithRole)) {
        const needsFix = bo.userWithRole.some(x => !x || !x.$descriptor);
        if (needsFix) {
          const arr = bo.userWithRole
            .filter(Boolean)
            .map(x => {
              if (x && x.$descriptor) return x;
              const key = String(x?.key ?? x?.role ?? '');
              const value = x?.value != null ? String(x.value) : Array.isArray(x?.users) ? x.users.join(',') : '';
              return moddle.create('model:KeyValuePair', { key, value });
            });
          modeling.updateModdleProperties(procShape, bo, { userWithRole: arr });
        }
      }
    });

    // Filtrar rootElements inválidos
    if (definitions && Array.isArray(definitions.rootElements)) {
      const filtered = definitions.rootElements.filter(re => re && re.$descriptor);
      if (filtered.length !== definitions.rootElements.length) {
        commandStack.execute('element.updateModdleProperties', {
          element: canvasRoot,
          moddleElement: definitions,
          properties: { rootElements: filtered }
        });
      }
    }

    // Limpiar extensionElements.values
    elementRegistry.forEach(shape => {
      const bo = shape.businessObject;
      const ext = bo && bo.extensionElements;
      if (ext && Array.isArray(ext.values)) {
        const filtered = ext.values.filter(v => v && v.$descriptor);
        if (filtered.length !== ext.values.length) {
          modeling.updateModdleProperties(shape, ext, { values: filtered });
        }
      }
    });

    // Limpieza recursiva
    const deepClean = (ownerEl, me) => {
      if (!me || !me.$descriptor) return;
      const props = me.$descriptor.properties || [];
      const toUpdate = {};

      for (const p of props) {
        if (p.type !== 'Element' || p.isReference) continue;
        const val = me.get ? me.get(p.name) : me[p.name];
        const isWaypointList = /BPMNEdge/.test(me.$type) && p.name === 'waypoint' && p.isMany;

        if (p.isMany) {
          if (Array.isArray(val)) {
            let arr = val.filter(v => v && v.$descriptor);
            if (isWaypointList) {
              // recreación de dc:Point se hace en hardCleanDefinitions
            }
            if (arr.length !== val.length) toUpdate[p.name] = arr;
            arr.forEach(child => deepClean(ownerEl, child));
          } else if (val != null) {
            toUpdate[p.name] = [];
          }
        } else {
          if (val && !val.$descriptor) toUpdate[p.name] = null;
          else if (val && val.$descriptor) deepClean(ownerEl, val);
        }
      }

      if (Object.keys(toUpdate).length) {
        commandStack.execute('element.updateModdleProperties', {
          element: canvasRoot,
          moddleElement: me,
          properties: toUpdate
        });
      }
    };

    deepClean(canvasRoot, definitions);
  }

  function hardCleanDefinitions(modeler) {
    const moddle = modeler.get('moddle');
    const canvasRoot = modeler.get('canvas').getRootElement();
    const definitions = canvasRoot.businessObject.$parent;

    const asDcPoint = (p) => {
      if (p && p.$descriptor) return p;
      const x = Number(p?.x ?? p?.X ?? 0);
      const y = Number(p?.y ?? p?.Y ?? 0);
      return moddle.create('dc:Point', { x, y });
    };

    const visit = (me) => {
      if (!me || !me.$descriptor) return;
      const props = me.$descriptor.properties || [];

      for (const prop of props) {
        if (prop.type !== 'Element' || prop.isReference) continue;
        let val = me.get ? me.get(prop.name) : me[prop.name];
        const isWaypointList = /BPMNEdge/.test(me.$type) && prop.name === 'waypoint' && prop.isMany;

        if (prop.isMany) {
          if (Array.isArray(val)) {
            let arr = val.filter(v => v && v.$descriptor);
            if (isWaypointList) arr = val.map(v => asDcPoint(v)).filter(Boolean);
            if (me.set) me.set(prop.name, arr);
            else me[prop.name] = arr;
            arr.forEach(visit);
          } else if (val != null) {
            if (me.set) me.set(prop.name, []);
            else me[prop.name] = [];
          }
        } else {
          if (val && !val.$descriptor) {
            if (me.set) me.set(prop.name, null);
            else me[prop.name] = null;
          } else if (val && val.$descriptor) {
            visit(val);
          }
        }
      }
    };

    if (Array.isArray(definitions.rootElements)) {
      definitions.rootElements = definitions.rootElements.filter(re => re && re.$descriptor);
    }
    if (Array.isArray(definitions.diagrams)) {
      definitions.diagrams = definitions.diagrams.filter(d => d && d.$descriptor);
    }

    visit(definitions);
  }
});
