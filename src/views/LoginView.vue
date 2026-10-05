<template>
  <div class="login-wrapper d-flex align-center justify-center pa-4">
    <v-card elevation="16" max-width="480" width="100%" class="login-card rounded-xl overflow-hidden">
      <!-- CABECERA INSTITUCIONAL Y DE SEGURIDAD -->
      <div class="brand-header pa-6 text-center text-white">
        <div class="d-flex justify-center mb-3">
          <div class="brand-badge elevation-4">
            <v-icon icon="mdi-shield-check" size="34" color="white" />
          </div>
        </div>
        <h1 class="text-h5 font-weight-black tracking-tight mb-1">NEGOTOCK</h1>
        <div class="text-caption text-blue-grey-lighten-3 font-weight-medium">
          Sistema Integral de Gestión & Punto de Venta
        </div>

        <!-- IDENTIDAD DEL LOCAL -->
        <div class="d-inline-flex align-center bg-white-transparent px-3 py-1 rounded-pill mt-3">
          <v-icon icon="mdi-storefront-outline" size="16" class="mr-1 text-amber-accent-2" />
          <span class="text-caption font-weight-bold text-white">
            {{ businessStore.comercio.nombre || 'Ferretería Central' }}
          </span>
        </div>
      </div>

      <!-- PESTAÑAS DE ACCESO PROFESIONAL -->
      <v-tabs
        v-model="tab"
        grow
        bg-color="blue-grey-lighten-5"
        color="primary"
        density="comfortable"
        class="border-b"
      >
        <v-tab value="pin" class="font-weight-bold text-none">
          <v-icon icon="mdi-dialpad" class="mr-2" size="18" />
          Terminal Mostrador (PIN)
        </v-tab>
        <v-tab value="email" class="font-weight-bold text-none">
          <v-icon icon="mdi-shield-account-outline" class="mr-2" size="18" />
          Administración (Email)
        </v-tab>
      </v-tabs>

      <v-card-text class="pa-6">
        <!-- MENSAJE DE ERROR SOBRIO -->
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          density="comfortable"
          closable
          class="mb-4 text-caption font-weight-medium"
          @click:close="errorMessage = ''"
        >
          {{ errorMessage }}
        </v-alert>

        <v-window v-model="tab">
          <!-- ======================================================== -->
          <!-- PESTAÑA 1: INGRESO POR PIN DE MOSTRADOR                  -->
          <!-- ======================================================== -->
          <v-window-item value="pin">
            <!-- SELECTOR OPCIONAL DE OPERADOR -->
            <div class="mb-3">
              <label class="text-caption font-weight-bold text-blue-grey-darken-2 mb-1 d-block">
                Operador en Turno:
              </label>
              <v-select
                v-model="selectedOperatorId"
                :items="activeOperators"
                item-title="fullName"
                item-value="id"
                variant="outlined"
                density="compact"
                hide-details
                placeholder="Identificarse como operador (o tipear PIN directo)"
                clearable
                prepend-inner-icon="mdi-account-outline"
                class="operator-select"
              >
                <template #selection="{ item }">
                  <div class="d-flex align-center">
                    <span class="font-weight-bold text-body-2 mr-2">{{ item.raw.fullName }}</span>
                    <v-chip size="x-small" :color="getRoleBadgeColor(item.raw.role)" variant="tonal" class="font-weight-bold">
                      {{ getRoleBadgeLabel(item.raw.role) }}
                    </v-chip>
                  </div>
                </template>
                <template #item="{ props, item }">
                  <v-list-item v-bind="props" :subtitle="getRoleBadgeLabel(item.raw.role)">
                    <template #prepend>
                      <v-avatar size="28" :color="getRoleBadgeColor(item.raw.role)" class="text-white text-caption font-weight-bold mr-2">
                        {{ item.raw.fullName.charAt(0) }}
                      </v-avatar>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </div>

            <!-- VISOR DE DÍGITOS DEL PIN -->
            <div class="pin-display-wrapper mb-4">
              <div class="text-caption text-center text-blue-grey-darken-1 mb-2 font-weight-medium">
                Ingrese clave de seguridad de 4 dígitos
              </div>
              <div class="d-flex justify-center align-center gap-3">
                <div
                  v-for="i in 4"
                  :key="i"
                  class="pin-circle d-flex align-center justify-center"
                  :class="{
                    'filled': pinInput.length >= i,
                    'current': pinInput.length === i - 1
                  }"
                >
                  <span v-if="pinInput.length >= i" class="pin-dot"></span>
                </div>
              </div>
            </div>

            <!-- TECLADO NUMÉRICO TÁCTIL Y DE MOSTRADOR -->
            <div class="keypad-container mb-3">
              <div class="keypad-grid">
                <v-btn
                  v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
                  :key="num"
                  variant="outlined"
                  class="keypad-key text-h6 font-weight-bold"
                  @click="appendPin(num)"
                >
                  {{ num }}
                </v-btn>
                <v-btn
                  variant="tonal"
                  color="blue-grey-lighten-3"
                  class="keypad-key"
                  title="Borrar dígito (Backspace)"
                  @click="backspacePin"
                >
                  <v-icon icon="mdi-backspace-outline" color="blue-grey-darken-2" />
                </v-btn>
                <v-btn
                  variant="outlined"
                  class="keypad-key text-h6 font-weight-bold"
                  @click="appendPin(0)"
                >
                  0
                </v-btn>
                <v-btn
                  variant="flat"
                  color="primary"
                  class="keypad-key"
                  :disabled="pinInput.length < 4 || isLoggingIn"
                  :loading="isLoggingIn"
                  title="Ingresar (Enter)"
                  @click="submitPin"
                >
                  <v-icon icon="mdi-arrow-right-bold" />
                </v-btn>
              </div>
            </div>

            <div class="text-caption text-center text-blue-grey-lighten-1">
              <v-icon icon="mdi-keyboard-outline" size="14" class="mr-1" />
              Podés usar el teclado físico o numérico de tu computadora
            </div>
          </v-window-item>

          <!-- ======================================================== -->
          <!-- PESTAÑA 2: CREDENCIALES ADMINISTRATIVAS (EMAIL)         -->
          <!-- ======================================================== -->
          <v-window-item value="email">
            <v-form @submit.prevent="submitEmailLogin">
              <div class="text-caption text-blue-grey-darken-1 font-weight-medium mb-3">
                Acceso exclusivo para titulares y administración corporativa
              </div>

              <v-text-field
                v-model="email"
                label="Correo Electrónico Corporativo"
                placeholder="usuario@empresa.com"
                type="email"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-email-outline"
                class="mb-3"
                required
              />

              <v-text-field
                v-model="password"
                label="Contraseña de Acceso"
                placeholder="••••••••"
                :type="showPassword ? 'text' : 'password'"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-lock-outline"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                class="mb-4"
                required
              />

              <v-btn
                type="submit"
                color="primary"
                variant="flat"
                block
                size="large"
                class="font-weight-bold text-none py-3"
                :loading="authStore.loading"
              >
                <v-icon icon="mdi-login" class="mr-2" />
                Ingresar al Sistema
              </v-btn>
            </v-form>
          </v-window-item>
        </v-window>
      </v-card-text>

      <!-- ACCESO RÁPIDO PARA TESTING / DEMO -->
      <div class="px-6 py-3 bg-amber-lighten-5 border-t border-amber-lighten-3">
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="d-flex align-center text-amber-darken-4 font-weight-bold text-caption">
            <v-icon icon="mdi-test-tube" size="18" class="mr-1 text-amber-darken-3" />
            Modo Demo / Pruebas de Publicación:
          </div>
          <v-btn
            size="x-small"
            variant="text"
            color="amber-darken-4"
            class="text-caption font-weight-bold text-none px-1"
            @click="showDemoCredentials = !showDemoCredentials"
          >
            {{ showDemoCredentials ? 'Ocultar claves' : 'Ver claves' }}
          </v-btn>
        </div>

        <!-- Botones de 1 clic para testing -->
        <div class="d-flex ga-2 flex-wrap mb-1">
          <v-btn
            color="amber-darken-4"
            variant="flat"
            size="small"
            class="flex-grow-1 font-weight-bold text-none"
            :loading="isLoggingIn"
            @click="handleQuickLogin('ADMIN')"
          >
            <v-icon icon="mdi-account-tie" start size="small" />
            Probar como Dueño (Demo)
          </v-btn>
          <v-btn
            color="teal-darken-3"
            variant="flat"
            size="small"
            class="flex-grow-1 font-weight-bold text-none"
            :loading="isLoggingIn"
            @click="handleQuickLogin('CASHIER')"
          >
            <v-icon icon="mdi-cash-register" start size="small" />
            Probar como Cajera
          </v-btn>
        </div>

        <!-- Desplegable con detalle de credenciales -->
        <v-expand-transition>
          <div v-if="showDemoCredentials" class="text-caption text-grey-darken-3 pt-2 border-t border-amber-lighten-3 mt-2">
            <div class="d-flex justify-space-between py-1 border-b border-amber-lighten-4">
              <span><strong>Dueño / Admin:</strong> demo@negostock.com (pass: demo123)</span>
              <span class="font-mono text-amber-darken-4 font-weight-bold">PIN: 0000 / 1234</span>
            </div>
            <div class="d-flex justify-space-between py-1 border-b border-amber-lighten-4">
              <span><strong>Cajera Mostrador:</strong> Ana López</span>
              <span class="font-mono text-teal-darken-4 font-weight-bold">PIN: 3333</span>
            </div>
            <div class="d-flex justify-space-between py-1 border-b border-amber-lighten-4">
              <span><strong>Vendedor Mostrador:</strong> Carlos Ruiz</span>
              <span class="font-mono text-blue-grey-darken-3 font-weight-bold">PIN: 4444</span>
            </div>
            <div class="d-flex justify-space-between py-1">
              <span><strong>Superusuario SaaS:</strong> superadmin@negostock.com</span>
              <span class="font-mono text-deep-purple-darken-2 font-weight-bold">PIN: 9999</span>
            </div>

            <div class="mt-2 pt-2 border-t border-amber-lighten-4 d-flex justify-center">
              <v-btn
                href="/MANUAL_TESTER.pdf"
                target="_blank"
                download="Manual_Tester_NegoStock.pdf"
                size="small"
                variant="outlined"
                color="amber-darken-4"
                class="font-weight-bold text-none w-100"
              >
                <v-icon icon="mdi-file-pdf-box" start />
                Descargar Manual para el Tester (PDF)
              </v-btn>
            </div>
          </div>
        </v-expand-transition>
      </div>

      <v-divider />

      <!-- PIE DE SEGURIDAD Y ESTADO DE CONEXIÓN -->
      <div class="bg-blue-grey-lighten-5 px-6 py-3 d-flex align-center justify-space-between flex-wrap gap-2">
        <div class="d-flex align-center">
          <span
            class="status-dot mr-2"
            :class="isSupabaseConfigured ? 'status-online' : 'status-offline'"
          ></span>
          <span class="text-caption font-weight-bold text-blue-grey-darken-3">
            {{ isSupabaseConfigured ? 'Nube Conectada' : 'Modo Autónomo Local' }}
          </span>
        </div>

        <div class="text-caption text-blue-grey-darken-1 d-flex align-center">
          <v-icon icon="mdi-shield-lock-outline" size="14" class="mr-1 text-primary" />
          <span>Auditoría de Operador Activa</span>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useBusinessStore } from '@/stores/businessStore';
import { isSupabaseConfigured } from '@/services/supabase';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const businessStore = useBusinessStore();

const tab = ref('pin');
const pinInput = ref('');
const selectedOperatorId = ref(null);
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const errorMessage = ref('');
const isLoggingIn = ref(false);
const showDemoCredentials = ref(false);

const activeOperators = computed(() => {
  // El Superusuario (SaaS Master) nunca se lista como cajero/vendedor de mostrador
  return authStore.users.filter(u => u.isActive !== false && u.role !== 'SUPERADMIN');
});

onMounted(async () => {
  await Promise.all([
    authStore.initAuth(),
    businessStore.initBusiness()
  ]);

  if (authStore.isAuthenticated && route.query.redirect) {
    router.replace(String(route.query.redirect));
  }

  // Escuchar teclado físico para mostrador
  window.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});

function handleGlobalKeydown(e) {
  // Solo capturar teclas si estamos en la pestaña PIN
  if (tab.value !== 'pin') return;

  // Si el usuario está escribiendo en un input, ignorar
  if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) {
    // Si presiona Enter en un input
    if (e.key === 'Enter') {
      submitPin();
    }
    return;
  }

  if (e.key >= '0' && e.key <= '9') {
    appendPin(Number(e.key));
  } else if (e.key === 'Backspace') {
    backspacePin();
  } else if (e.key === 'Enter') {
    submitPin();
  } else if (e.key === 'Escape') {
    clearPin();
  }
}

function appendPin(num) {
  if (pinInput.value.length < 4) {
    pinInput.value += String(num);
    errorMessage.value = '';
    if (pinInput.value.length === 4) {
      setTimeout(() => submitPin(), 120);
    }
  }
}

function backspacePin() {
  if (pinInput.value.length > 0) {
    pinInput.value = pinInput.value.slice(0, -1);
    errorMessage.value = '';
  }
}

function clearPin() {
  pinInput.value = '';
  errorMessage.value = '';
}

async function submitPin() {
  if (pinInput.value.length < 4 || isLoggingIn.value) return;

  isLoggingIn.value = true;
  errorMessage.value = '';

  try {
    let res;
    // Si seleccionó un operador específico, validar que el PIN corresponda a ese operador
    if (selectedOperatorId.value) {
      const targetUser = authStore.users.find(u => u.id === selectedOperatorId.value);
      if (targetUser && targetUser.pin === pinInput.value) {
        authStore.currentUser = targetUser;
        res = { success: true, user: targetUser };
      } else {
        res = { success: false, error: 'Código PIN no válido para el operador seleccionado.' };
      }
    } else {
      res = await authStore.loginWithPin(pinInput.value);
    }

    if (res.success) {
      redirectAfterLogin();
    } else {
      errorMessage.value = res.error || 'Código de seguridad incorrecto.';
      clearPin();
    }
  } catch (err) {
    errorMessage.value = 'Error al validar credenciales.';
    clearPin();
  } finally {
    isLoggingIn.value = false;
  }
}

async function submitEmailLogin() {
  errorMessage.value = '';
  if (!email.value || !password.value) {
    errorMessage.value = 'Por favor complete su correo y contraseña institucional.';
    return;
  }

  isLoggingIn.value = true;
  try {
    const res = await authStore.loginWithEmail(email.value, password.value);
    if (res.success) {
      redirectAfterLogin();
    } else {
      errorMessage.value = res.error || 'Credenciales de acceso no válidas.';
    }
  } catch (err) {
    errorMessage.value = 'Error de conexión al autenticar.';
  } finally {
    isLoggingIn.value = false;
  }
}

async function handleQuickLogin(role) {
  isLoggingIn.value = true;
  errorMessage.value = '';
  try {
    const res = await authStore.quickLoginDemo(role);
    if (res.success) {
      redirectAfterLogin();
    } else {
      errorMessage.value = res.error || 'No se pudo iniciar sesión de prueba.';
    }
  } catch (err) {
    errorMessage.value = 'Error al ingresar en modo demo.';
  } finally {
    isLoggingIn.value = false;
  }
}

function redirectAfterLogin() {
  const target = route.query.redirect ? String(route.query.redirect) : '/';
  router.push(target);
}

function getRoleBadgeLabel(role) {
  const map = {
    SUPERADMIN: 'Superusuario',
    ADMIN: 'Propietario',
    MANAGER: 'Encargado',
    CASHIER: 'Cajero',
    SELLER: 'Ventas Mostrador'
  };
  return map[role] || role;
}

function getRoleBadgeColor(role) {
  const map = {
    SUPERADMIN: 'deep-purple-accent-4',
    ADMIN: 'purple-darken-2',
    MANAGER: 'indigo',
    CASHIER: 'teal-darken-2',
    SELLER: 'blue-grey'
  };
  return map[role] || 'grey';
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  background: radial-gradient(circle at 50% 10%, #1e293b 0%, #0f172a 100%);
}

.login-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #ffffff;
}

.brand-header {
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
}

.brand-badge {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(37, 99, 235, 0.3);
}

.bg-white-transparent {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(4px);
}

.pin-display-wrapper {
  background: #f8fafc;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.pin-circle {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  border: 2px solid #cbd5e1;
  background: #ffffff;
  transition: all 0.18s ease-in-out;
}

.pin-circle.current {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.pin-circle.filled {
  border-color: #1e3a8a;
  background: #eff6ff;
}

.pin-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: #1e3a8a;
}

.keypad-container {
  display: flex;
  justify-content: center;
}

.keypad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 100%;
  max-width: 310px;
}

.keypad-key {
  height: 52px !important;
  border-radius: 12px !important;
  border-color: #cbd5e1 !important;
  color: #1e293b !important;
  font-size: 1.25rem !important;
  transition: all 0.15s ease;
}

.keypad-key:active {
  transform: scale(0.96);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-online {
  background-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.status-offline {
  background-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
}
</style>
