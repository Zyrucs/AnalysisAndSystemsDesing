// ── Login / Register Page ────────────────────────────────────────────────────
import { api, setAuth } from '../api.js';
import { showToast } from '../toast.js';

export function renderLogin(container) {
  let isRegister = false;

  function render() {
    container.innerHTML = `
      <div class="login-page">
        <div class="login-left">
          <div class="login-branding">
            <img class="brand-logo" src="/img/escudo-ud.png" alt="Universidad Distrital" />
            <h1 class="brand-title">SmartCampus UD</h1>
            <p class="brand-subtitle">Gestión de Equipos y Conectividad para estudiantes de la Universidad Distrital</p>
            <p class="brand-uni">Universidad Distrital Francisco José de Caldas</p>
          </div>
        </div>
        <div class="login-right">
          <div class="login-form">
            <h2 class="login-title">${isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
            <p class="login-subtitle">${isRegister ? 'Registra tus datos para acceder' : 'Ingresa a la plataforma ECM'}</p>
            <div id="login-error" class="login-error hidden"></div>
            <form id="auth-form">
              ${isRegister ? `
                <div class="form-group">
                  <label class="form-label">Nombre Completo</label>
                  <input class="form-input" id="reg-name" type="text" placeholder="Juan Ramírez" required minlength="2" />
                </div>` : ''}
              <div class="form-group">
                <label class="form-label">Correo Electrónico</label>
                <input class="form-input" id="auth-email" type="email" placeholder="correo@udistrital.edu.co" required />
              </div>
              <div class="form-group">
                <label class="form-label">Contraseña</label>
                <input class="form-input" id="auth-pass" type="password" placeholder="••••••••" required minlength="6" />
              </div>
              ${isRegister ? `
                <div class="form-group">
                  <label class="form-label">Rol</label>
                  <select class="form-select" id="reg-role">
                    <option value="student">Estudiante</option>
                    <option value="admin">Administrador</option>
                    <option value="donor">Donante</option>
                  </select>
                </div>
                <div id="student-fields" class="student-fields">
                  <div class="form-group">
                    <label class="form-label">Índice de Vulnerabilidad</label>
                    <div class="slider-inline">
                      <input type="range" class="range-slider" id="reg-vi" min="0" max="1" step="0.01" value="0.5" />
                      <span class="slider-val" id="val-vi">0.50</span>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Carga Académica</label>
                    <div class="slider-inline">
                      <input type="range" class="range-slider" id="reg-al" min="0" max="1" step="0.01" value="0.5" />
                      <span class="slider-val" id="val-al">0.50</span>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Historial de Cumplimiento</label>
                    <div class="slider-inline">
                      <input type="range" class="range-slider" id="reg-ch" min="0" max="1" step="0.01" value="1.0" />
                      <span class="slider-val" id="val-ch">1.00</span>
                    </div>
                  </div>
                </div>` : ''}
              <button type="submit" class="btn btn-primary w-full mt-2" id="auth-submit">
                ${isRegister ? 'Registrarse' : 'Ingresar'}
              </button>
            </form>
            <div class="login-toggle">
              ${isRegister
                ? '¿Ya tienes cuenta? <button id="toggle-mode">Inicia sesión</button>'
                : '¿No tienes cuenta? <button id="toggle-mode">Regístrate</button>'}
            </div>
          </div>
        </div>
      </div>`;

    // ── Events ──────────────────────────────────────────
    document.getElementById('toggle-mode').addEventListener('click', () => {
      isRegister = !isRegister;
      render();
    });

    // Slider live values (register only)
    if (isRegister) {
      const role = document.getElementById('reg-role');
      const studentFields = document.getElementById('student-fields');
      role.addEventListener('change', () => {
        studentFields.style.display = role.value === 'student' ? 'block' : 'none';
      });
      ['vi', 'al', 'ch'].forEach(k => {
        const slider = document.getElementById(`reg-${k}`);
        const display = document.getElementById(`val-${k}`);
        if (slider && display) {
          slider.addEventListener('input', () => { display.textContent = parseFloat(slider.value).toFixed(2); });
        }
      });
    }

    document.getElementById('auth-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('auth-submit');
      const errBox = document.getElementById('login-error');
      btn.disabled = true;
      btn.textContent = isRegister ? 'Registrando...' : 'Ingresando...';
      errBox.classList.add('hidden');

      try {
        if (isRegister) {
          const role = document.getElementById('reg-role').value;
          const data = {
            full_name: document.getElementById('reg-name').value,
            email: document.getElementById('auth-email').value,
            password: document.getElementById('auth-pass').value,
            role,
          };
          if (role === 'student') {
            data.vulnerability_index = parseFloat(document.getElementById('reg-vi').value);
            data.academic_load       = parseFloat(document.getElementById('reg-al').value);
            data.compliance_history  = parseFloat(document.getElementById('reg-ch').value);
          }
          await api.register(data);
          showToast('Cuenta creada exitosamente', 'success');
          isRegister = false;
          render();
        } else {
          const email = document.getElementById('auth-email').value;
          const pass  = document.getElementById('auth-pass').value;
          const result = await api.login(email, pass);
          setAuth(result.access_token, result.role);
          const me = await api.me();
          localStorage.setItem('ecm_user_name', me.full_name);
          localStorage.setItem('ecm_user_id', me.id);
          window.location.hash = '#' + (result.role === 'student' ? '/requests' : '/dashboard');
        }
      } catch (err) {
        errBox.textContent = err.message;
        errBox.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = isRegister ? 'Registrarse' : 'Ingresar';
      }
    });
  }

  render();
}
