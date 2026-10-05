<template>
  <v-container fluid class="pa-4">
    <!-- ENCABEZADO -->
    <v-card elevation="2" class="mb-4">
      <v-card-item class="bg-primary text-white py-3">
        <div class="d-flex align-center justify-space-between flex-wrap">
          <div class="d-flex align-center">
            <v-icon icon="mdi-account-group" size="32" class="mr-3 text-secondary" />
            <div>
              <div class="text-h6 font-weight-black">Gestión de Personal y Permisos (RBAC)</div>
              <div class="text-caption text-grey-lighten-2">
                Definí quién puede cobrar, quién solo vende en mostrador y ocultá los costos a los empleados.
              </div>
            </div>
          </div>
          <div class="d-flex align-center flex-wrap mt-2 mt-sm-0">
            <v-btn
              color="white"
              variant="outlined"
              class="font-weight-bold mr-2"
              :loading="isSyncing"
              @click="handleSync"
            >
              <v-icon icon="mdi-cloud-sync" class="mr-1" />
              Sincronizar Nube
            </v-btn>
            <v-btn
              color="secondary"
              variant="flat"
              class="font-weight-black"
              @click="openAddDialog"
            >
              <v-icon icon="mdi-account-plus" class="mr-1" />
              Nuevo Empleado
            </v-btn>
          </div>
        </div>
      </v-card-item>

      <v-divider />

      <!-- MATRIZ DE PERMISOS RESUMIDA -->
      <v-card-text class="pa-4 bg-grey-lighten-5">
        <div class="text-subtitle-2 font-weight-bold text-grey-darken-3 mb-2">
          Matriz de Acceso y Privilegios en la Ferretería:
        </div>
        <v-row dense>
          <v-col cols="12" sm="6" md="4">
            <v-card variant="outlined" class="pa-2 h-100 bg-white border-l-4" style="border-left-color: #6200EA !important;">
              <div class="d-flex align-center justify-space-between mb-1">
                <span class="font-weight-bold text-caption text-deep-purple-accent-4">SUPERUSUARIO (MASTER)</span>
                <v-icon icon="mdi-crown" color="deep-purple-accent-4" size="small" />
              </div>
              <div class="text-caption text-grey-darken-1">
                SaaS Master. Control absoluto, configuración global, escalabilidad y diagnóstico integral.
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="4">
            <v-card variant="outlined" class="pa-2 h-100 bg-white border-l-4" style="border-left-color: #6B21A8 !important;">
              <div class="d-flex align-center justify-space-between mb-1">
                <span class="font-weight-bold text-caption text-purple-darken-3">ADMINISTRADOR</span>
                <v-icon icon="mdi-shield-crown" color="purple-darken-3" size="small" />
              </div>
              <div class="text-caption text-grey-darken-1">
                Dueño del local. Ve márgenes y costos, aplica aumentos masivos de inflación y crea usuarios.
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="4">
            <v-card variant="outlined" class="pa-2 h-100 bg-white border-l-4" style="border-left-color: #3730A3 !important;">
              <div class="d-flex align-center justify-space-between mb-1">
                <span class="font-weight-bold text-caption text-indigo-darken-3">ENCARGADO</span>
                <v-icon icon="mdi-shield-account" color="indigo-darken-3" size="small" />
              </div>
              <div class="text-caption text-grey-darken-1">
                Control de inventario, ajustes de stock y recepción de compras. Ve costos de reposición.
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="6">
            <v-card variant="outlined" class="pa-2 h-100 bg-white border-l-4" style="border-left-color: #0F766E !important;">
              <div class="d-flex align-center justify-space-between mb-1">
                <span class="font-weight-bold text-caption text-teal-darken-3">CAJERO</span>
                <v-icon icon="mdi-cash-register" color="teal-darken-3" size="small" />
              </div>
              <div class="text-caption text-grey-darken-1">
                Abre y cierra turnos de caja, cobra preventas y emite tickets. <strong>No ve costos de compra</strong>.
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="6">
            <v-card variant="outlined" class="pa-2 h-100 bg-white border-l-4" style="border-left-color: #475569 !important;">
              <div class="d-flex align-center justify-space-between mb-1">
                <span class="font-weight-bold text-caption text-blue-grey-darken-3">VENDEDOR MOSTRADOR</span>
                <v-icon icon="mdi-storefront" color="blue-grey-darken-3" size="small" />
              </div>
              <div class="text-caption text-grey-darken-1">
                Busca artículos y arma pedidos de preventa con [F6]. <strong>No cobra ni ve costos</strong>.
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- LISTA DE USUARIOS -->
    <v-card elevation="2">
      <v-card-title class="pa-4 d-flex justify-space-between align-center">
        <span class="text-h6 font-weight-bold">Personal Registrado</span>
        <v-chip color="primary" variant="tonal" class="font-weight-bold">
          {{ authStore.staffUsers.length }} Empleados
        </v-chip>
      </v-card-title>

      <v-divider />

      <div class="responsive-table-wrapper">
        <v-table density="compact" hover class="compact-users-table">
          <thead>
            <tr class="bg-grey-lighten-4">
              <th class="font-weight-bold">Nombre Completo</th>
              <th class="font-weight-bold">Email</th>
              <th class="font-weight-bold">Rol / Cargo</th>
              <th class="font-weight-bold text-center">PIN</th>
              <th class="font-weight-bold text-center">Estado</th>
              <th class="font-weight-bold text-center sticky-action-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in authStore.staffUsers" :key="user.id">
              <td class="font-weight-bold d-flex align-center py-1">
                <v-avatar size="26" :color="getRoleColor(user.role)" class="mr-2 text-white font-weight-bold text-2xs">
                  {{ user.fullName.charAt(0) }}
                </v-avatar>
                <span class="text-caption font-weight-bold text-truncate" style="max-width: 160px;" :title="user.fullName">
                  {{ user.fullName }}
                </span>
                <v-chip v-if="authStore.currentUser?.id === user.id" size="x-small" color="primary" class="ml-1.5 text-2xs">
                  Tú
                </v-chip>
              </td>
              <td class="text-caption text-truncate" style="max-width: 170px;" :title="user.email">{{ user.email }}</td>
              <td>
                <v-chip size="x-small" :color="getRoleColor(user.role)" variant="flat" class="font-weight-bold text-2xs">
                  {{ getRoleLabel(user.role) }}
                </v-chip>
              </td>
              <td class="text-center font-mono">
                <code
                  class="px-1.5 py-0.5 rounded font-weight-black text-2xs"
                  :class="user.role === 'SUPERADMIN' ? 'bg-deep-purple-lighten-5 text-deep-purple-accent-4' : 'bg-grey-lighten-3'"
                >
                  {{ user.role === 'SUPERADMIN' ? '•••••••• [PROTEGIDO]' : (showPins ? user.pin : '••••') }}
                </code>
              </td>
              <td class="text-center">
                <v-chip size="x-small" :color="user.isActive ? 'success' : 'grey'" variant="tonal" class="text-2xs">
                  {{ user.isActive ? 'Activo' : 'Inactivo' }}
                </v-chip>
              </td>
              <td class="text-center text-no-wrap sticky-action-col">
                <v-btn
                  v-if="user.role !== 'SUPERADMIN' || authStore.isSuperAdmin"
                  icon="mdi-pencil-outline"
                  size="x-small"
                  variant="tonal"
                  color="primary"
                  title="Editar"
                  class="mr-1"
                  @click="openEditDialog(user)"
                />
                <v-btn
                  v-if="user.id !== authStore.currentUser?.id && user.role !== 'SUPERADMIN'"
                  icon="mdi-delete-outline"
                  size="x-small"
                  variant="tonal"
                  color="error"
                  title="Eliminar"
                  @click="deleteUser(user.id)"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <v-card-actions class="pa-3 bg-grey-lighten-5">
        <v-switch
          v-model="showPins"
          label="Mostrar Códigos PIN"
          density="compact"
          color="primary"
          hide-details
        />
        <v-spacer />
      </v-card-actions>
    </v-card>

    <!-- DIÁLOGO DE AGREGAR / EDITAR EMPLEADO -->
    <v-dialog v-model="userDialog" max-width="500">
      <v-card>
        <v-card-title class="bg-primary text-white d-flex align-center">
          <v-icon icon="mdi-account-edit" class="mr-2" />
          {{ isEditing ? 'Editar Empleado' : 'Registrar Nuevo Empleado' }}
        </v-card-title>
        <v-card-text class="pa-4">
          <v-text-field
            v-model="form.fullName"
            label="Nombre y Apellido"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />

          <v-text-field
            v-model="form.email"
            label="Correo Electrónico (para inicio de sesión)"
            type="email"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />

          <v-select
            v-model="form.role"
            :items="roleOptions"
            item-title="title"
            item-value="value"
            label="Rol / Nivel de Permisos"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />

          <v-text-field
            v-model="form.pin"
            label="PIN de Mostrador (4 dígitos)"
            type="password"
            maxlength="4"
            variant="outlined"
            density="comfortable"
            hint="Permite cambiar de cajero/vendedor rápido en la misma computadora"
            persistent-hint
          />
        </v-card-text>
        <v-card-actions class="pa-4 bg-grey-lighten-4">
          <v-spacer />
          <v-btn variant="text" color="grey" @click="userDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" class="px-5 font-weight-bold" @click="saveUser">
            Guardar Empleado
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- NOTIFICACIONES -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarMsg }}
      <template #actions>
        <v-btn variant="text" color="white" @click="snackbar = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();

const showPins = ref(false);
const userDialog = ref(false);
const isEditing = ref(false);
const editingUserId = ref(null);
const isSyncing = ref(false);
const snackbar = ref(false);
const snackbarMsg = ref('');
const snackbarColor = ref('success');

const form = reactive({
  fullName: '',
  email: '',
  role: 'SELLER',
  pin: '1111'
});

onMounted(async () => {
  await authStore.fetchEmployeesFromSupabase();
});

async function handleSync() {
  isSyncing.value = true;
  try {
    const res = await authStore.syncWithSupabase();
    if (res.success) {
      snackbarMsg.value = `¡Sincronizado! ${res.count} empleados en Supabase.`;
      snackbarColor.value = 'success';
    } else {
      snackbarMsg.value = res.error || 'No se pudo sincronizar con Supabase.';
      snackbarColor.value = 'warning';
    }
  } catch (err) {
    snackbarMsg.value = 'Error al sincronizar con la nube.';
    snackbarColor.value = 'error';
  } finally {
    isSyncing.value = false;
    snackbar.value = true;
  }
}

const roleOptions = computed(() => {
  const list = [
    { title: 'Administrador (Dueño / Control Total)', value: 'ADMIN' },
    { title: 'Encargado (Stock, Compras, Ve Costos)', value: 'MANAGER' },
    { title: 'Cajero (Caja y Cobro, Sin ver costos)', value: 'CASHIER' },
    { title: 'Vendedor (Preventa en Mostrador, Sin cobro ni costos)', value: 'SELLER' }
  ];
  if (authStore.isSuperAdmin) {
    list.unshift({ title: 'Superusuario (SaaS Master / Escalabilidad)', value: 'SUPERADMIN' });
  }
  return list;
});

function getRoleLabel(role) {
  const map = {
    SUPERADMIN: 'Superusuario (Master)',
    ADMIN: 'Administrador',
    MANAGER: 'Encargado',
    CASHIER: 'Cajero',
    SELLER: 'Vendedor'
  };
  return map[role] || role;
}

function getRoleColor(role) {
  const map = {
    SUPERADMIN: 'deep-purple-accent-4',
    ADMIN: 'purple-darken-2',
    MANAGER: 'indigo',
    CASHIER: 'teal-darken-2',
    SELLER: 'blue-grey'
  };
  return map[role] || 'grey';
}

function openAddDialog() {
  isEditing.value = false;
  editingUserId.value = null;
  form.fullName = '';
  form.email = '';
  form.role = 'SELLER';
  form.pin = '1111';
  userDialog.value = true;
}

function openEditDialog(user) {
  if (user.role === 'SUPERADMIN' && !authStore.isSuperAdmin) {
    snackbarMsg.value = 'Acceso Denegado: No tenés permisos para modificar al Superusuario.';
    snackbarColor.value = 'error';
    snackbar.value = true;
    return;
  }
  isEditing.value = true;
  editingUserId.value = user.id;
  form.fullName = user.fullName;
  form.email = user.email;
  form.role = user.role;
  // El PIN del Superusuario NUNCA se expone en el formulario
  form.pin = user.role === 'SUPERADMIN' ? '' : user.pin;
  userDialog.value = true;
}

async function saveUser() {
  if (!form.fullName.trim()) return;

  const payload = { ...form };
  // Si es Superusuario y el pin se dejó en blanco, preservar el actual
  if (isEditing.value && payload.role === 'SUPERADMIN' && !payload.pin) {
    delete payload.pin;
  }

  if (isEditing.value && editingUserId.value) {
    await authStore.updateUser(editingUserId.value, payload);
    snackbarMsg.value = 'Empleado actualizado correctamente';
  } else {
    await authStore.addUser(payload);
    snackbarMsg.value = 'Empleado registrado correctamente';
  }
  snackbarColor.value = 'success';
  snackbar.value = true;
  userDialog.value = false;
}

async function deleteUser(id) {
  if (confirm('¿Estás seguro de eliminar este usuario?')) {
    await authStore.deleteUser(id);
    snackbarMsg.value = 'Empleado eliminado';
    snackbarColor.value = 'info';
    snackbar.value = true;
  }
}
</script>

<style scoped>
.responsive-table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.compact-users-table th,
.compact-users-table td {
  padding: 4px 8px !important;
  height: 38px !important;
  font-size: 12.5px;
}
.sticky-action-col {
  position: sticky;
  right: 0;
  background: white;
  z-index: 2;
  box-shadow: -4px 0 8px rgba(0, 0, 0, 0.05);
}
th.sticky-action-col {
  background: #F1F5F9 !important;
  z-index: 3;
}
.text-2xs {
  font-size: 9.5px !important;
  line-height: 12px !important;
}
</style>
