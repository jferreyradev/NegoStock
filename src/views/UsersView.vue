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
          <v-btn
            color="secondary"
            variant="flat"
            class="font-weight-black mt-2 mt-sm-0"
            @click="openAddDialog"
          >
            <v-icon icon="mdi-account-plus" class="mr-1" />
            Nuevo Empleado
          </v-btn>
        </div>
      </v-card-item>

      <v-divider />

      <!-- MATRIZ DE PERMISOS RESUMIDA -->
      <v-card-text class="pa-4 bg-grey-lighten-5">
        <div class="text-subtitle-2 font-weight-bold text-grey-darken-3 mb-2">
          Matriz de Acceso y Privilegios en la Ferretería:
        </div>
        <v-row dense>
          <v-col cols="12" sm="6" md="3">
            <v-card variant="outlined" class="pa-2 h-100 bg-white border-l-4" style="border-left-color: #6B21A8 !important;">
              <div class="d-flex align-center justify-space-between mb-1">
                <span class="font-weight-bold text-caption text-purple-darken-3">ADMINISTRADOR</span>
                <v-icon icon="mdi-shield-crown" color="purple-darken-3" size="small" />
              </div>
              <div class="text-caption text-grey-darken-1">
                Acceso total. Ve márgenes y costos, aplica aumentos masivos de inflación y crea usuarios.
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
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

          <v-col cols="12" sm="6" md="3">
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

          <v-col cols="12" sm="6" md="3">
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
          {{ authStore.users.length }} Empleados
        </v-chip>
      </v-card-title>

      <v-divider />

      <v-table density="comfortable" hover>
        <thead>
          <tr class="bg-grey-lighten-4">
            <th class="font-weight-bold">Nombre Completo</th>
            <th class="font-weight-bold">Email</th>
            <th class="font-weight-bold">Rol / Cargo</th>
            <th class="font-weight-bold text-center">PIN de Mostrador</th>
            <th class="font-weight-bold text-center">Estado</th>
            <th class="font-weight-bold text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in authStore.users" :key="user.id">
            <td class="font-weight-bold d-flex align-center">
              <v-avatar size="32" :color="getRoleColor(user.role)" class="mr-2 text-white font-weight-bold">
                {{ user.fullName.charAt(0) }}
              </v-avatar>
              {{ user.fullName }}
              <v-chip v-if="authStore.currentUser?.id === user.id" size="x-small" color="primary" class="ml-2">
                Sesión Actual
              </v-chip>
            </td>
            <td class="text-caption">{{ user.email }}</td>
            <td>
              <v-chip size="small" :color="getRoleColor(user.role)" variant="flat" class="font-weight-bold">
                {{ getRoleLabel(user.role) }}
              </v-chip>
            </td>
            <td class="text-center">
              <code class="px-2 py-1 bg-grey-lighten-3 rounded font-weight-black">
                {{ showPins ? user.pin : '••••' }}
              </code>
            </td>
            <td class="text-center">
              <v-chip size="x-small" :color="user.isActive ? 'success' : 'grey'" variant="tonal">
                {{ user.isActive ? 'Activo' : 'Inactivo' }}
              </v-chip>
            </td>
            <td class="text-center">
              <v-btn
                icon="mdi-pencil-outline"
                size="small"
                variant="text"
                color="primary"
                title="Editar"
                @click="openEditDialog(user)"
              />
              <v-btn
                v-if="user.id !== authStore.currentUser?.id"
                icon="mdi-delete-outline"
                size="small"
                variant="text"
                color="error"
                title="Eliminar"
                @click="deleteUser(user.id)"
              />
            </td>
          </tr>
        </tbody>
      </v-table>

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
  </v-container>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();

const showPins = ref(false);
const userDialog = ref(false);
const isEditing = ref(false);
const editingUserId = ref(null);

const form = reactive({
  fullName: '',
  email: '',
  role: 'SELLER',
  pin: '1111'
});

const roleOptions = [
  { title: 'Administrador (Dueño / Control Total)', value: 'ADMIN' },
  { title: 'Encargado (Stock, Compras, Ve Costos)', value: 'MANAGER' },
  { title: 'Cajero (Caja y Cobro, Sin ver costos)', value: 'CASHIER' },
  { title: 'Vendedor (Preventa en Mostrador, Sin cobro ni costos)', value: 'SELLER' }
];

function getRoleLabel(role) {
  const map = {
    ADMIN: 'Administrador',
    MANAGER: 'Encargado',
    CASHIER: 'Cajero',
    SELLER: 'Vendedor'
  };
  return map[role] || role;
}

function getRoleColor(role) {
  const map = {
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
  isEditing.value = true;
  editingUserId.value = user.id;
  form.fullName = user.fullName;
  form.email = user.email;
  form.role = user.role;
  form.pin = user.pin;
  userDialog.value = true;
}

function saveUser() {
  if (!form.fullName.trim()) return;

  if (isEditing.value && editingUserId.value) {
    authStore.updateUser(editingUserId.value, { ...form });
  } else {
    authStore.addUser({ ...form });
  }
  userDialog.value = false;
}

function deleteUser(id) {
  if (confirm('¿Estás seguro de eliminar este usuario?')) {
    authStore.deleteUser(id);
  }
}
</script>
