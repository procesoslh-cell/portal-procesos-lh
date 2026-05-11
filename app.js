let currentCompany = "TODAS";
let currentArea = "TODAS";
let currentFolder = "TODAS";
let activeProcess = null;
let processes = [];

async function loadAllData(){

const files = [
  "./data/lh.json",
  "./data/gram.json",
  "./data/rodamax.json"
];

  processes = [];

  for(const file of files){

    try{

      const response = await fetch(file);

      if(!response.ok){
        console.warn("No se pudo abrir:", file);
        continue;
      }

      const companyData = await response.json();

      if(!Array.isArray(companyData)){
        console.warn("El archivo no es un array:", file);
        continue;
      }

      companyData.forEach(areaBlock => {

        if(!areaBlock) return;

        const empresa = areaBlock.empresa || "Sin empresa";
        const area = areaBlock.area || "Sin área";

        if(Array.isArray(areaBlock.procesos)){

          areaBlock.procesos.forEach(p => {
            processes.push({
              ...p,
              empresa,
              area,
              carpeta: p.carpeta || "General",
              areaCompleta: `${area} > ${p.carpeta || "General"}`
            });
          });
        }

        if(Array.isArray(areaBlock.carpetas)){

          areaBlock.carpetas.forEach(folder => {

            const folderName = folder.nombre || "General";

            if(Array.isArray(folder.procesos)){

              folder.procesos.forEach(p => {
                processes.push({
                  ...p,
                  empresa,
                  area,
                  carpeta: folderName,
                  areaCompleta: `${area} > ${folderName}`
                });
              });
            }
          });
        }
      });

    }catch(error){
      console.error("Error leyendo archivo:", file, error);
    }
  }

  renderAreaTree();
  render();
}

/* =========================
   FILTROS
========================= */

function setCompany(company){

  currentCompany = company;
  currentArea = "TODAS";
  currentFolder = "TODAS";

  render();
}

function setArea(company, area){

  currentCompany = company;
  currentArea = area;
  currentFolder = "TODAS";

  render();
}

function setFolder(company, area, folder){

  currentCompany = company;
  currentArea = area;
  currentFolder = folder;

  render();
}

/* =========================
   LISTAS
========================= */

function getCompanies(){
  return [...new Set(processes.map(p => p.empresa))];
}

function getAreasByCompany(company){

  return [
    ...new Set(
      processes
        .filter(p => p.empresa === company)
        .map(p => p.area)
    )
  ];
}

function getFoldersByArea(company, area){

  return [
    ...new Set(
      processes
        .filter(p => p.empresa === company && p.area === area)
        .map(p => p.carpeta || "General")
    )
  ];
}

/* =========================
   SIDEBAR
========================= */

function renderAreaTree(){

  const container = document.getElementById("areaTree");
  const companies = getCompanies();

  container.innerHTML = companies.map(company => {

    const areas = getAreasByCompany(company);

    const companyOpen =
      currentCompany === company;

    return `
      <div class="area-group">

        <button
          class="area-company"
          onclick="toggleCompany('${escapeAttr(company)}')"
        >
          <span>${getCompanyIcon(company)} ${company}</span>
          <span>▾</span>
        </button>

        <div
          id="area-list-company-${safeId(company)}"
          class="area-list ${companyOpen ? "open" : ""}"
        >

          <button
            class="area-item ${
              currentCompany === company &&
              currentArea === "TODAS"
              ? "active"
              : ""
            }"
            onclick="setCompany('${escapeAttr(company)}')"
          >
            Todas las áreas
          </button>

          ${areas.map(area => renderAreaNode(company, area)).join("")}

        </div>

      </div>
    `;
  }).join("");
}

function renderAreaNode(company, area){

  const folders = getFoldersByArea(company, area);
  const areaId = `area-${safeId(company)}-${safeId(area)}`;

  const areaOpen =
    currentCompany === company &&
    currentArea === area;

  return `
    <div class="area-subgroup">

      <button
        class="area-item area-parent ${
          areaOpen && currentFolder === "TODAS" ? "active" : ""
        }"
        onclick="setArea('${escapeAttr(company)}','${escapeAttr(area)}')"
      >
        📁 ${area}
      </button>

      <button
        class="folder-toggle"
        onclick="toggleFolderList('${areaId}')"
        title="Abrir carpetas"
      >
        ▾
      </button>

      <div
        id="area-list-${areaId}"
        class="folder-list ${areaOpen ? "open" : ""}"
      >

        ${folders.map(folder => `
          <button
            class="folder-item ${
              currentCompany === company &&
              currentArea === area &&
              currentFolder === folder
              ? "active"
              : ""
            }"
            onclick="setFolder('${escapeAttr(company)}','${escapeAttr(area)}','${escapeAttr(folder)}')"
          >
            └ ${folder}
          </button>
        `).join("")}

      </div>

    </div>
  `;
}

function toggleCompany(company){

  const companyId = "area-list-company-" + safeId(company);
  const target = document.getElementById(companyId);

  if(!target) return;

  const wasOpen = target.classList.contains("open");

  document
    .querySelectorAll(".area-list")
    .forEach(el => el.classList.remove("open"));

  document
    .querySelectorAll(".folder-list")
    .forEach(el => el.classList.remove("open"));

  if(!wasOpen){
    target.classList.add("open");
  }
}

function toggleFolderList(id){

  const target = document.getElementById("area-list-" + id);

  if(!target) return;

  const wasOpen = target.classList.contains("open");

  const parentCompanyList = target.closest(".area-list");

  if(parentCompanyList){
    parentCompanyList
      .querySelectorAll(".folder-list")
      .forEach(el => el.classList.remove("open"));
  }

  if(!wasOpen){
    target.classList.add("open");
  }
}

function getCompanyIcon(company){

  if(company === "LH") return "🚲";
  if(company === "GRAM") return "🛒";
  if(company === "RODAMAX") return "🇵🇾";

  return "🏢";
}

/* =========================
   RENDER CARDS
========================= */

function render(){

  const q = document
    .getElementById("search")
    .value
    .toLowerCase();

  const filtered = processes.filter(p => {

    const okCompany =
      currentCompany === "TODAS" ||
      p.empresa === currentCompany;

    const okArea =
      currentArea === "TODAS" ||
      p.area === currentArea;

    const okFolder =
      currentFolder === "TODAS" ||
      p.carpeta === currentFolder;

    const okSearch =
      JSON.stringify(p)
        .toLowerCase()
        .includes(q);

    return okCompany && okArea && okFolder && okSearch;
  });

  document.getElementById("processList").innerHTML =
    filtered.map(p => `

      <div class="process">

        <span class="badge">${p.empresa}</span>

        <h3>${p.nombre}</h3>

        <p><b>Área:</b> ${p.area}</p>

        <p><b>Carpeta:</b> ${p.carpeta || "General"}</p>

        <p><b>Sistema:</b> ${p.sistema || "Sin sistema definido"}</p>

        <p><b>Power BI:</b> ${p.bi || "Sin tablero BI asociado"}</p>

        ${
          p.tipo
          ? `<p><b>Tipo:</b> ${p.tipo}</p>`
          : ""
        }

        ${
          Array.isArray(p.kpis) && p.kpis.length > 0
          ? `<p><b>KPIs:</b> ${p.kpis.join(" · ")}</p>`
          : ""
        }

        <div class="actions">

          <a
            class="doc"
            target="_blank"
            href="${p.original || "#"}"
          >
            📄 Ver original
          </a>

          ${
            p.interactivo
            ? `
              <button
                class="interactive"
                onclick="openProcess('${p.id}')"
              >
                ⚡ Interactivo
              </button>
            `
            : `
              <button class="pending">
                Interactivo pendiente
              </button>
            `
          }

        </div>

      </div>

    `).join("");

  document.getElementById("statProcesses").innerText = filtered.length;

  document.getElementById("statInteractive").innerText =
    processes.filter(p => p.interactivo).length;

  document.getElementById("statCompany").innerText = currentCompany;

  const areaText =
    currentFolder !== "TODAS"
      ? `${currentArea} > ${currentFolder}`
      : currentArea;

  document.getElementById("statArea").innerText = areaText;

  document.getElementById("sectionTitle").innerText =
    currentCompany === "TODAS"
      ? "Procesos disponibles"
      : currentArea === "TODAS"
        ? "Procesos " + currentCompany
        : currentFolder === "TODAS"
          ? `${currentCompany} > ${currentArea}`
          : `${currentCompany} > ${currentArea} > ${currentFolder}`;

  renderAreaTree();
}

/* =========================
   MODAL
========================= */

function openProcess(id){

  activeProcess = processes.find(p => p.id === id);

  if(!activeProcess) return;

  document.getElementById("modal").style.display = "block";

  document.getElementById("modalTitle").innerText = activeProcess.nombre;

  document.getElementById("docLink").href = activeProcess.original || "#";

  document.getElementById("biText").innerHTML =
    renderSimpleList(activeProcess.bi);

  document.getElementById("systemText").innerText =
    activeProcess.sistema || "Sin sistema definido";

  const pasos = activeProcess.pasos || [];

  document.getElementById("steps").innerHTML = `
    ${renderProcessHeader(activeProcess)}

    ${
      pasos.length > 0
      ? pasos.map((s,i) => `
          <div
            class="step"
            id="step-${i}"
            onclick="showStep(${i})"
          >
            ${i + 1}. ${s.titulo}
          </div>
        `).join("")
      : `
        <div class="step active">
          Sin pasos cargados
        </div>
      `
    }
  `;

  if(pasos.length > 0){
    showStep(0);
  }else{
    document.getElementById("detail").innerHTML = `
      <h3>Proceso sin detalle interactivo</h3>
      <div class="block">
        Este proceso todavía no tiene pasos cargados.
      </div>
    `;
  }
}

function renderProcessHeader(p){

  return `
    <div class="resource" style="margin-bottom:14px">

      <strong>Resumen del proceso</strong>

      <p><b>Empresa:</b> ${p.empresa}</p>

      <p><b>Área:</b> ${p.area}</p>

      <p><b>Carpeta:</b> ${p.carpeta || "General"}</p>

      ${
        p.tipo
        ? `<p><b>Tipo:</b> ${p.tipo}</p>`
        : ""
      }

      ${
        Array.isArray(p.kpis) && p.kpis.length > 0
        ? `
          <p><b>KPIs:</b></p>
          <ul>
            ${p.kpis.map(k => `<li>${k}</li>`).join("")}
          </ul>
        `
        : ""
      }

    </div>
  `;
}

function showStep(i){

  document
    .querySelectorAll(".step")
    .forEach(x => x.classList.remove("active"));

  const stepElement = document.getElementById("step-" + i);

  if(stepElement){
    stepElement.classList.add("active");
  }

  const s = activeProcess.pasos[i];

  document.getElementById("detail").innerHTML = `

    <h3>${s.titulo}</h3>

    <h4>Texto original / descripción</h4>
    <div class="block">
      ${s.texto || "Sin descripción cargada."}
    </div>

    <h4>Responsable</h4>
    <div class="block">
      ${s.responsable || "Sin responsable definido."}
    </div>

    <h4>Controles</h4>
    <div class="block">
      ${s.controles || "Sin controles cargados."}
    </div>

    <h4>Dato clave</h4>
    <div class="block">
      ${s.clave || "Sin dato clave cargado."}
    </div>

    ${
      Array.isArray(s.documentos) && s.documentos.length > 0
      ? `
        <h4>Documentos</h4>
        <div class="block">
          <ul>
            ${s.documentos.map(d => `<li>🧾 ${d}</li>`).join("")}
          </ul>
        </div>
      `
      : ""
    }

    ${
      Array.isArray(s.riesgos) && s.riesgos.length > 0
      ? `
        <h4>Riesgos / excepciones</h4>
        <div class="block">
          <ul>
            ${s.riesgos.map(r => `<li>⚠️ ${r}</li>`).join("")}
          </ul>
        </div>
      `
      : ""
    }

    ${
      Array.isArray(s.kpis) && s.kpis.length > 0
      ? `
        <h4>KPIs del paso</h4>
        <div class="block">
          <ul>
            ${s.kpis.map(k => `<li>📊 ${k}</li>`).join("")}
          </ul>
        </div>
      `
      : ""
    }

  `;
}

/* =========================
   HELPERS
========================= */

function renderSimpleList(value){

  if(Array.isArray(value)){
    return `
      <ul>
        ${value.map(v => `<li>${v}</li>`).join("")}
      </ul>
    `;
  }

  return value || "Sin información cargada";
}

function safeId(value){

  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-zA-Z0-9]/g,"-")
    .toLowerCase();
}

function escapeAttr(value){

  return String(value)
    .replace(/'/g,"\\'")
    .replace(/"/g,"&quot;");
}

function closeModal(){
  document.getElementById("modal").style.display = "none";
}

loadAllData();
