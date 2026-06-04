// ── Scoring Simulator Page ───────────────────────────────────────────────────
import { api } from '../api.js';
import { showToast } from '../toast.js';

export function renderScoring(container) {
  container.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">Simulador de Scoring</h1>
           <p class="page-subtitle">Calcula la prioridad de asignación de equipos</p></div>
    </div>
    <div class="scoring-layout">
      <div class="card">
        <div class="card-header"><span class="card-title">Parámetros</span></div>
        <div class="card-body">
          <div class="slider-group">
            <div class="slider-label"><span class="slider-name">Índice de Vulnerabilidad (V)</span><span class="slider-value" id="dv">0.50</span></div>
            <input type="range" class="range-slider" id="s-vi" min="0" max="1" step="0.01" value="0.5" />
            <div class="slider-weight">Peso: 50%</div>
          </div>
          <div class="slider-group">
            <div class="slider-label"><span class="slider-name">Carga Académica (A)</span><span class="slider-value" id="da">0.50</span></div>
            <input type="range" class="range-slider" id="s-al" min="0" max="1" step="0.01" value="0.5" />
            <div class="slider-weight">Peso: 30%</div>
          </div>
          <div class="slider-group">
            <div class="slider-label"><span class="slider-name">Historial de Cumplimiento (H)</span><span class="slider-value" id="dh">1.00</span></div>
            <input type="range" class="range-slider" id="s-ch" min="0" max="1" step="0.01" value="1.0" />
            <div class="slider-weight">Peso: 20%</div>
          </div>
          <button class="btn btn-primary w-full mt-2" id="btn-calc">Calcular Puntaje</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Resultado</span></div>
        <div id="score-result">
          <div class="score-display">
            <div class="score-big" id="score-num">—</div>
            <div class="score-band" id="score-band"></div>
          </div>
          <div class="breakdown-section" id="breakdown"></div>
          <div class="formula-display">S = (V × 0.5) + (A × 0.3) + (H × 0.2)</div>
        </div>
      </div>
    </div>`;

  // Live slider display
  const sliders = [
    { id: 's-vi', display: 'dv' },
    { id: 's-al', display: 'da' },
    { id: 's-ch', display: 'dh' },
  ];
  sliders.forEach(({ id, display }) => {
    const s = document.getElementById(id);
    const d = document.getElementById(display);
    s.addEventListener('input', () => { d.textContent = parseFloat(s.value).toFixed(2); });
  });

  document.getElementById('btn-calc').addEventListener('click', calculate);

  // Calculate on load with defaults
  calculate();

  async function calculate() {
    const vi = parseFloat(document.getElementById('s-vi').value);
    const al = parseFloat(document.getElementById('s-al').value);
    const ch = parseFloat(document.getElementById('s-ch').value);

    try {
      const r = await api.previewScore({ vulnerability_index: vi, academic_load: al, compliance_history: ch });

      const band = r.priority_band; // High / Medium / Low
      const bandClass = band === 'High' ? 'high' : band === 'Medium' ? 'medium' : 'low';
      const bandLabel = band === 'High' ? 'Alta Prioridad' : band === 'Medium' ? 'Media Prioridad' : 'Baja Prioridad';

      document.getElementById('score-num').className = `score-big ${bandClass}`;
      document.getElementById('score-num').textContent = r.score.toFixed(4);
      document.getElementById('score-band').className = `score-band ${bandClass}`;
      document.getElementById('score-band').textContent = bandLabel;

      const bd = r.breakdown;
      document.getElementById('breakdown').innerHTML = `
        <div class="breakdown-item">
          <span class="breakdown-label">Vulnerabilidad</span>
          <div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:${bd.vulnerability_contribution * 100}%;background:var(--accent-blue)"></div></div>
          <span class="breakdown-value">${bd.vulnerability_contribution.toFixed(4)}</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-label">Carga Académica</span>
          <div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:${bd.academic_contribution * 100}%;background:var(--accent-purple)"></div></div>
          <span class="breakdown-value">${bd.academic_contribution.toFixed(4)}</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-label">Cumplimiento</span>
          <div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:${bd.compliance_contribution * 100}%;background:var(--accent-emerald)"></div></div>
          <span class="breakdown-value">${bd.compliance_contribution.toFixed(4)}</span>
        </div>`;
    } catch (e) {
      // Fallback: calculate locally
      const score = vi * 0.5 + al * 0.3 + ch * 0.2;
      const band = score >= 0.7 ? 'high' : score >= 0.45 ? 'medium' : 'low';
      const label = band === 'high' ? 'Alta Prioridad' : band === 'medium' ? 'Media Prioridad' : 'Baja Prioridad';
      document.getElementById('score-num').className = `score-big ${band}`;
      document.getElementById('score-num').textContent = score.toFixed(4);
      document.getElementById('score-band').className = `score-band ${band}`;
      document.getElementById('score-band').textContent = label;
      document.getElementById('breakdown').innerHTML = `
        <div class="breakdown-item"><span class="breakdown-label">Vulnerabilidad</span><div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:${vi * 50}%;background:var(--accent-blue)"></div></div><span class="breakdown-value">${(vi * 0.5).toFixed(4)}</span></div>
        <div class="breakdown-item"><span class="breakdown-label">Carga Académica</span><div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:${al * 30}%;background:var(--accent-purple)"></div></div><span class="breakdown-value">${(al * 0.3).toFixed(4)}</span></div>
        <div class="breakdown-item"><span class="breakdown-label">Cumplimiento</span><div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:${ch * 20}%;background:var(--accent-emerald)"></div></div><span class="breakdown-value">${(ch * 0.2).toFixed(4)}</span></div>`;
    }
  }
}
