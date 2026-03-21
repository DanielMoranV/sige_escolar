<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Configuración</h1>
        <p class="text-gray-500 mt-1">Año académico, régimen de evaluación y gestión de aulas.</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200">
      <nav class="flex gap-8">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="pb-4 text-sm font-medium transition-colors relative"
          :class="activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'"
        >
          {{ tab.label }}
          <div v-if="activeTab === tab.id" class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
        </button>
      </nav>
    </div>

    <!-- Tab: General -->
    <template v-if="activeTab === 'general'">
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="i in 2" :key="i" class="h-64 bg-gray-100 animate-pulse rounded-xl"></div>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Año Escolar -->
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div class="flex items-center gap-3 text-blue-600">
            <CalendarIcon class="w-5 h-5" />
            <h2 class="font-semibold text-gray-900">Año Académico</h2>
          </div>
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Año</span>
              <span class="font-medium text-gray-900">{{ anioEscolar?.anio }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Inicio de clases</span>
              <span class="font-medium text-gray-900">{{ formatDate(anioEscolar?.fecha_inicio) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Fin de clases</span>
              <span class="font-medium text-gray-900">{{ formatDate(anioEscolar?.fecha_fin) }}</span>
            </div>
            <div class="flex justify-between text-sm pt-2 border-t">
              <span class="text-gray-500">Estado</span>
              <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Activo</span>
            </div>
          </div>
        </div>

        <!-- Régimen -->
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div class="flex items-center gap-3 text-purple-600">
            <LayoutGridIcon class="w-5 h-5" />
            <h2 class="font-semibold text-gray-900">Régimen de Evaluación</h2>
          </div>
          <div class="space-y-4">
            <div v-for="r in regimen" :key="r.nivel" class="flex justify-between items-center text-sm">
              <span class="text-gray-600">{{ r.nivel }}</span>
              <span class="px-3 py-1 bg-gray-100 rounded-lg font-medium text-gray-800">{{ r.tipo_regimen }}</span>
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div class="flex items-center gap-3 text-amber-600">
            <InfoIcon class="w-5 h-5" />
            <h2 class="font-semibold text-gray-900">Información del Sistema</h2>
          </div>
          <p class="text-xs text-gray-500 leading-relaxed">
            La configuración del año escolar y el régimen de evaluación es establecida por el administrador del sistema al momento de la creación del colegio.
            Si necesita modificar estos datos, por favor contacte con soporte técnico.
          </p>
        </div>

        <!-- Periodos -->
        <div class="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
            <ClockIcon class="w-5 h-5 text-indigo-600" />
            <h2 class="font-semibold text-gray-900">Cronograma de Periodos</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th class="px-6 py-3">Nivel</th>
                  <th class="px-6 py-3">Periodo</th>
                  <th class="px-6 py-3">Inicio</th>
                  <th class="px-6 py-3">Fin</th>
                  <th class="px-6 py-3">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="p in periodos" :key="p.id" class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4">
                    <span class="text-xs font-medium px-2 py-0.5 rounded-full" :class="nivelClass(p.nivel)">{{ p.nivel }}</span>
                  </td>
                  <td class="px-6 py-4 font-medium text-gray-900">{{ p.nombre }}</td>
                  <td class="px-6 py-4 text-gray-600">{{ formatDate(p.fecha_inicio) }}</td>
                  <td class="px-6 py-4 text-gray-600">{{ formatDate(p.fecha_fin) }}</td>
                  <td class="px-6 py-4">
                    <span class="flex items-center gap-1.5" :class="estadoClass(p.estado)">
                      <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {{ p.estado }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <!-- Tab: Aulas -->
    <template v-if="activeTab === 'aulas'">
      <div class="flex justify-end">
        <BaseButton @click="openCreate">
          <PlusIcon class="w-4 h-4" />
          Nueva Sección
        </BaseButton>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div v-if="aulasLoading" class="p-12 text-center">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
        </div>

        <table v-else class="w-full text-sm text-left">
          <thead class="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th class="px-6 py-3">Grado / Sección</th>
              <th class="px-6 py-3 hidden sm:table-cell">Nivel</th>
              <th class="px-6 py-3 hidden md:table-cell">Turno</th>
              <th class="px-6 py-3 hidden lg:table-cell">Tutor</th>
              <th class="px-6 py-3 hidden md:table-cell text-center">Matric.</th>
              <th class="px-6 py-3 hidden md:table-cell text-center">Aforo</th>
              <th class="px-6 py-3 text-center">Estado</th>
              <th class="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="!seccionesFiltradas.length">
              <td colspan="8" class="px-6 py-10 text-center text-gray-500">No hay secciones registradas.</td>
            </tr>
            <tr v-for="sec in seccionesFiltradas" :key="sec.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    {{ sec.grado_nombre?.[0] }}{{ sec.nombre }}
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ sec.grado_nombre }}</p>
                    <p class="text-xs text-gray-500">Sección {{ sec.nombre }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 hidden sm:table-cell">
                <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="nivelClass(sec.nivel)">{{ sec.nivel }}</span>
              </td>
              <td class="px-6 py-4 hidden md:table-cell text-gray-600">{{ sec.turno }}</td>
              <td class="px-6 py-4 hidden lg:table-cell text-gray-600">{{ sec.tutor_nombre || '—' }}</td>
              <td class="px-6 py-4 hidden md:table-cell text-center font-medium text-gray-900">{{ sec.total_matriculados ?? 0 }}</td>
              <td class="px-6 py-4 hidden md:table-cell text-center text-gray-600">{{ sec.aforo_maximo || '—' }}</td>
              <td class="px-6 py-4 text-center">
                <BaseBadge :variant="sec.activa ? 'success' : 'neutral'">{{ sec.activa ? 'Activa' : 'Inactiva' }}</BaseBadge>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button @click="openEdit(sec)" class="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar">
                    <EditIcon class="w-4 h-4" />
                  </button>
                  <button @click="toggleActiva(sec)" class="p-1.5 rounded-lg transition-colors"
                    :class="sec.activa ? 'text-gray-500 hover:text-red-600 hover:bg-red-50' : 'text-gray-500 hover:text-green-600 hover:bg-green-50'"
                    :title="sec.activa ? 'Desactivar' : 'Activar'">
                    <EyeOffIcon v-if="sec.activa" class="w-4 h-4" />
                    <EyeIcon v-else class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal Aulas -->
      <BaseModal :show="showAulaModal" :title="editingId ? 'Editar Sección' : 'Nueva Sección'" @close="closeAulaModal">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Grado <span class="text-red-500">*</span></label>
            <select v-model="aulaForm.gradoId" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" :disabled="!!editingId">
              <option value="">Seleccione un grado...</option>
              <option v-for="g in grados" :key="g.id" :value="g.id">{{ g.nombre }}</option>
            </select>
            <p v-if="aulaErrors.gradoId" class="mt-1 text-xs text-red-500">{{ aulaErrors.gradoId }}</p>
          </div>
          <BaseInput v-model="aulaForm.nombre" label="Nombre de la sección" placeholder="Ej: A, B, C..." required :error="aulaErrors.nombre" />
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Turno</label>
            <select v-model="aulaForm.turno" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="MAÑANA">Mañana</option>
              <option value="TARDE">Tarde</option>
              <option value="NOCHE">Noche</option>
            </select>
          </div>
          <BaseInput v-model.number="aulaForm.aforoMaximo" label="Aforo máximo" type="number" placeholder="Ej: 30 (opcional)" />
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <BaseButton variant="secondary" @click="closeAulaModal">Cancelar</BaseButton>
            <BaseButton :loading="isSavingAula" @click="saveSeccion">{{ editingId ? 'Guardar Cambios' : 'Crear Sección' }}</BaseButton>
          </div>
        </template>
      </BaseModal>
    </template>

    <!-- Tab: Currículo -->
    <template v-if="activeTab === 'curriculo'">
      <div v-if="curriculoLoading" class="p-12 text-center">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
      </div>

      <div v-else class="space-y-4">
        <!-- Sub-tabs nivel (solo si hay más de uno) -->
        <div v-if="niveles.length > 1" class="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            v-for="n in niveles"
            :key="n"
            @click="nivelActivo = n"
            class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            :class="nivelActivo === n ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'"
          >{{ n }}</button>
        </div>

        <div class="flex justify-end">
          <BaseButton size="sm" @click="abrirCrearArea">
            <PlusIcon class="w-4 h-4" />
            Nueva Área
          </BaseButton>
        </div>

        <!-- Lista de áreas -->
        <div class="space-y-3">
          <div
            v-for="area in areasFiltradas"
            :key="area.id"
            class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <!-- Cabecera área -->
            <div class="flex items-center gap-3 px-5 py-3">
              <button
                @click="toggleAreaExpand(area.id)"
                class="p-1 rounded text-gray-400 hover:text-gray-700 transition-colors"
              >
                <ChevronDownIcon class="w-4 h-4 transition-transform" :class="areaExpandida === area.id ? 'rotate-180' : ''" />
              </button>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-900">{{ area.nombre_display }}</span>
                  <span v-if="area.codigo_display" class="text-xs text-gray-400 font-mono">{{ area.codigo_display }}</span>
                  <span v-if="!area.es_area_cneb" class="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Personalizada</span>
                  <span v-if="!area.activa" class="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">Inactiva</span>
                </div>
                <div class="flex gap-3 text-xs text-gray-400 mt-0.5">
                  <span v-if="!area.es_calificable" class="text-purple-500">Sin calificación</span>
                  <span v-if="area.permite_exoneracion" class="text-blue-500">Exonerable</span>
                  <span>Peso: {{ area.peso_area }}</span>
                </div>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button @click.stop="abrirCrearCompetencia(area)" class="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Agregar competencia">
                  <PlusIcon class="w-4 h-4" />
                </button>
                <button @click.stop="abrirEditarArea(area)" class="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar área">
                  <EditIcon class="w-4 h-4" />
                </button>
                <button @click.stop="toggleActivaArea(area)" class="p-1.5 rounded-lg transition-colors"
                  :class="area.activa ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'"
                  :title="area.activa ? 'Desactivar' : 'Activar'">
                  <EyeOffIcon v-if="area.activa" class="w-4 h-4" />
                  <EyeIcon v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Competencias (expandido) -->
            <div v-if="areaExpandida === area.id" class="border-t border-gray-100 divide-y divide-gray-50">
              <div v-if="competenciasCache[area.id]?.length === 0" class="px-12 py-4 text-sm text-gray-400 italic">
                Sin competencias registradas.
              </div>
              <div
                v-for="comp in competenciasCache[area.id]"
                :key="comp.id"
                class="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50"
              >
                <span class="w-5 h-5 rounded bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {{ comp.orden }}
                </span>
                <span class="flex-1 text-sm text-gray-700" :class="!comp.activa ? 'line-through text-gray-400' : ''">
                  {{ comp.nombre_display }}
                </span>
                <span class="text-xs text-gray-400">
                  Grados: {{ formatAplicaGrados(comp.aplica_grados) }}
                </span>
                <div class="flex items-center gap-1 shrink-0">
                  <button @click="abrirEditarCompetencia(area, comp)" class="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar">
                    <EditIcon class="w-3.5 h-3.5" />
                  </button>
                  <button @click="toggleActivaCompetencia(comp)" class="p-1.5 rounded-lg transition-colors"
                    :class="comp.activa ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'"
                    :title="comp.activa ? 'Desactivar' : 'Activar'">
                    <EyeOffIcon v-if="comp.activa" class="w-3.5 h-3.5" />
                    <EyeIcon v-else class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Área -->
      <BaseModal :show="showAreaModal" :title="editingAreaId ? 'Editar Área' : 'Nueva Área Curricular'" @close="showAreaModal = false">
        <div class="space-y-4">
          <BaseInput v-model="areaForm.nombreDisplay" label="Nombre del área" placeholder="Ej: Comunicación, Inglés..." required :error="areaErrors.nombreDisplay" />
          <BaseInput v-model="areaForm.codigoDisplay" label="Código (opcional)" placeholder="Ej: COM_P, MAT_S..." />
          <div v-if="!editingAreaId">
            <label class="block text-sm font-medium text-gray-700 mb-1">Nivel <span class="text-red-500">*</span></label>
            <select v-model="areaForm.nivel" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option v-for="n in niveles" :key="n" :value="n">{{ n.charAt(0) + n.slice(1).toLowerCase() }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <BaseInput v-model.number="areaForm.pesoArea" label="Peso del área" type="number" placeholder="1.00" />
            <BaseInput v-model.number="areaForm.orden" label="Orden" type="number" placeholder="Auto" />
          </div>
          <div class="flex gap-6">
            <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input v-model="areaForm.esCalificable" type="checkbox" class="rounded border-gray-300 text-blue-600" />
              Calificable
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input v-model="areaForm.permiteExoneracion" type="checkbox" class="rounded border-gray-300 text-blue-600" />
              Permite exoneración
            </label>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <BaseButton variant="secondary" @click="showAreaModal = false">Cancelar</BaseButton>
            <BaseButton :loading="isSavingArea" @click="guardarArea">{{ editingAreaId ? 'Guardar Cambios' : 'Crear Área' }}</BaseButton>
          </div>
        </template>
      </BaseModal>

      <!-- Modal Competencia -->
      <BaseModal :show="showCompModal" :title="editingCompId ? 'Editar Competencia' : 'Nueva Competencia'" @close="showCompModal = false">
        <div class="space-y-4">
          <p class="text-sm text-gray-500">Área: <strong class="text-gray-800">{{ compAreaNombre }}</strong></p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción <span class="text-red-500">*</span></label>
            <textarea
              v-model="compForm.nombreDisplay"
              rows="3"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Se comunica oralmente en su lengua materna..."
            ></textarea>
            <p v-if="compErrors.nombreDisplay" class="mt-1 text-xs text-red-500">{{ compErrors.nombreDisplay }}</p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <BaseInput v-model.number="compForm.pesoCompetencia" label="Peso" type="number" placeholder="1.00" />
            <BaseInput v-model.number="compForm.orden" label="Orden" type="number" placeholder="Auto" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Aplica a grados</label>
            <div class="flex gap-2 flex-wrap">
              <label v-for="g in [1,2,3,4,5,6]" :key="g" class="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  :value="g"
                  v-model="compForm.aplicaGrados"
                  class="rounded border-gray-300 text-blue-600"
                />
                {{ g }}°
              </label>
            </div>
            <p class="text-xs text-gray-400 mt-1">Deja todos marcados si aplica a todos los grados del nivel.</p>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <BaseButton variant="secondary" @click="showCompModal = false">Cancelar</BaseButton>
            <BaseButton :loading="isSavingComp" @click="guardarCompetencia">{{ editingCompId ? 'Guardar Cambios' : 'Crear Competencia' }}</BaseButton>
          </div>
        </template>
      </BaseModal>
    </template>

    <!-- Tab: Asistencia -->
    <template v-if="activeTab === 'asistencia'">
      <div v-if="asistenciaLoading" class="p-12 text-center">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
      </div>

      <div v-else class="space-y-6">
        <!-- Referencia legal -->
        <div class="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
          <InfoIcon class="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
          <span>
            Valores por defecto según <strong>RM 281-2016-MINEDU</strong>: el 30% de inasistencias injustificadas conlleva
            repitencia. Las tardanzas se acumulan y 3 tardanzas equivalen a 1 falta injustificada.
          </span>
        </div>

        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6 max-w-lg">
          <h3 class="font-semibold text-gray-900">Umbrales de alerta</h3>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-amber-700 mb-1">Alerta Amarilla (%)</label>
              <input
                v-model.number="asistenciaForm.umbralAmarillo"
                type="number" min="1" max="100" step="1"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p class="text-xs text-gray-400 mt-1">Riesgo bajo</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-orange-700 mb-1">Alerta Naranja (%)</label>
              <input
                v-model.number="asistenciaForm.umbralNaranja"
                type="number" min="1" max="100" step="1"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p class="text-xs text-gray-400 mt-1">Riesgo medio</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-red-700 mb-1">Alerta Roja (%)</label>
              <input
                v-model.number="asistenciaForm.umbralRojo"
                type="number" min="1" max="100" step="1"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p class="text-xs text-gray-400 mt-1">Riesgo alto / repitencia</p>
            </div>
          </div>

          <div class="border-t pt-4 space-y-4">
            <h3 class="font-semibold text-gray-900">Equivalencia de tardanzas</h3>

            <div class="flex items-center gap-3">
              <input
                id="contar-tardanzas"
                v-model="asistenciaForm.contarTardanzas"
                type="checkbox"
                class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label for="contar-tardanzas" class="text-sm text-gray-700">Convertir tardanzas acumuladas en faltas</label>
            </div>

            <div v-if="asistenciaForm.contarTardanzas">
              <label class="block text-sm font-medium text-gray-700 mb-1">Tardanzas equivalentes a 1 falta</label>
              <input
                v-model.number="asistenciaForm.tardanzasPorFalta"
                type="number" min="1" max="10" step="1"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p class="text-xs text-gray-400 mt-1">Por defecto: 3 tardanzas = 1 falta injustificada</p>
            </div>
          </div>

          <div class="flex justify-end">
            <BaseButton :loading="isSavingAsistencia" @click="saveConfigAsistencia">
              Guardar Configuración
            </BaseButton>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { CalendarIcon, ClockIcon, LayoutGridIcon, InfoIcon, PlusIcon, EditIcon, EyeIcon, EyeOffIcon, ChevronDownIcon } from 'lucide-vue-next';
import { schoolConfigService } from '../../api/services/school-config.service';
import { useNivelStore } from '../../stores/nivel.store';
import { useToast } from '../../composables/useToast';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseBadge from '../../components/ui/BaseBadge.vue';
import BaseModal from '../../components/ui/BaseModal.vue';
import BaseInput from '../../components/ui/BaseInput.vue';

const toast = useToast();
const nivelStore = useNivelStore();

const activeTab = ref('general');
const tabs = [
  { id: 'general', label: 'General' },
  { id: 'aulas', label: 'Aulas' },
  { id: 'curriculo', label: 'Currículo' },
  { id: 'asistencia', label: 'Asistencia' },
];

// --- General ---
const loading = ref(true);
const anioEscolar = ref<any>(null);
const periodos = ref<any[]>([]);
const regimen = ref<any[]>([]);

async function loadGeneral() {
  loading.value = true;
  try {
    const [anio, per, reg] = await Promise.all([
      schoolConfigService.getAnioEscolar(),
      schoolConfigService.getPeriodos(),
      schoolConfigService.getRegimen(),
    ]);
    anioEscolar.value = anio;
    periodos.value = per;
    regimen.value = reg;
  } catch {
    toast.error('Error al cargar configuración');
  } finally {
    loading.value = false;
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
}

function nivelClass(nivel: string) {
  if (nivel === 'PRIMARIA') return 'bg-blue-100 text-blue-700';
  if (nivel === 'SECUNDARIA') return 'bg-purple-100 text-purple-700';
  if (nivel === 'INICIAL') return 'bg-emerald-100 text-emerald-700';
  return 'bg-gray-100 text-gray-700';
}

function estadoClass(estado: string) {
  if (estado === 'ACTIVO') return 'text-green-600 font-medium';
  if (estado === 'CERRADO') return 'text-gray-400';
  return 'text-blue-500';
}

// --- Aulas ---
const aulasLoading = ref(false);
const secciones = ref<any[]>([]);
const seccionesFiltradas = computed(() =>
  nivelStore.nivelActivo === 'TODOS'
    ? secciones.value
    : secciones.value.filter(s => s.nivel === nivelStore.nivelActivo)
);
const grados = ref<any[]>([]);
const showAulaModal = ref(false);
const isSavingAula = ref(false);
const editingId = ref<string | null>(null);
const aulaErrors = ref<Record<string, string>>({});

const aulaForm = ref({ gradoId: '', nombre: '', turno: 'MAÑANA', aforoMaximo: undefined as number | undefined });

async function loadAulas() {
  aulasLoading.value = true;
  try {
    const [secs, grads] = await Promise.all([schoolConfigService.getAllSecciones(), schoolConfigService.getGrados()]);
    secciones.value = secs || [];
    grados.value = grads || [];
  } catch {
    toast.error('Error al cargar las secciones');
  } finally {
    aulasLoading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  aulaErrors.value = {};
  aulaForm.value = { gradoId: '', nombre: '', turno: 'MAÑANA', aforoMaximo: undefined };
  showAulaModal.value = true;
}

function openEdit(sec: any) {
  editingId.value = sec.id;
  aulaErrors.value = {};
  aulaForm.value = { gradoId: sec.grado_id, nombre: sec.nombre, turno: sec.turno || 'MAÑANA', aforoMaximo: sec.aforo_maximo || undefined };
  showAulaModal.value = true;
}

function closeAulaModal() { showAulaModal.value = false; }

async function saveSeccion() {
  aulaErrors.value = {};
  if (!editingId.value && !aulaForm.value.gradoId) { aulaErrors.value.gradoId = 'Seleccione un grado'; return; }
  if (!aulaForm.value.nombre.trim()) { aulaErrors.value.nombre = 'El nombre es obligatorio'; return; }

  isSavingAula.value = true;
  try {
    if (editingId.value) {
      await schoolConfigService.updateSeccion(editingId.value, { nombre: aulaForm.value.nombre, turno: aulaForm.value.turno, aforoMaximo: aulaForm.value.aforoMaximo || undefined });
      toast.success('Sección actualizada correctamente');
    } else {
      await schoolConfigService.createSeccion({ gradoId: aulaForm.value.gradoId, nombre: aulaForm.value.nombre, turno: aulaForm.value.turno, aforoMaximo: aulaForm.value.aforoMaximo || undefined });
      toast.success('Sección creada correctamente');
    }
    closeAulaModal();
    await loadAulas();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error al guardar la sección');
  } finally {
    isSavingAula.value = false;
  }
}

async function toggleActiva(sec: any) {
  try {
    await schoolConfigService.updateSeccion(sec.id, { activa: !sec.activa });
    toast.success(sec.activa ? 'Sección desactivada' : 'Sección activada');
    await loadAulas();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error al cambiar estado');
  }
}

// --- Currículo ---
const curriculoLoading = ref(false);
const todasLasAreas = ref<any[]>([]);
const nivelActivo = ref('');
const niveles = computed(() => regimen.value.map(r => r.nivel as string));
const areaExpandida = ref<string | null>(null);
const competenciasCache = ref<Record<string, any[]>>({});

const areasFiltradas = computed(() =>
  todasLasAreas.value.filter(a => a.nivel === nivelActivo.value)
);

async function loadCurriculo() {
  curriculoLoading.value = true;
  try {
    todasLasAreas.value = await schoolConfigService.getAllAreas();
    if (!nivelActivo.value && niveles.value.length > 0) {
      nivelActivo.value = niveles.value[0];
    }
  } catch {
    toast.error('Error al cargar el currículo');
  } finally {
    curriculoLoading.value = false;
  }
}

async function toggleAreaExpand(areaId: string) {
  if (areaExpandida.value === areaId) {
    areaExpandida.value = null;
    return;
  }
  areaExpandida.value = areaId;
  if (!competenciasCache.value[areaId]) {
    try {
      competenciasCache.value[areaId] = await schoolConfigService.getCompetencias(areaId);
    } catch {
      toast.error('Error al cargar competencias');
    }
  }
}

async function toggleActivaArea(area: any) {
  try {
    await schoolConfigService.updateArea(area.id, { activa: !area.activa });
    area.activa = !area.activa;
    toast.success(area.activa ? 'Área activada' : 'Área desactivada');
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Error al cambiar estado');
  }
}

async function toggleActivaCompetencia(comp: any) {
  try {
    await schoolConfigService.updateCompetencia(comp.id, { activa: !comp.activa });
    comp.activa = !comp.activa;
    toast.success(comp.activa ? 'Competencia activada' : 'Competencia desactivada');
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Error al cambiar estado');
  }
}

function formatAplicaGrados(grados: number[]) {
  if (!grados || grados.length === 0) return 'Todos';
  if (grados.length === 6) return 'Todos';
  return grados.map(g => `${g}°`).join(', ');
}

// Modal área
const showAreaModal = ref(false);
const isSavingArea = ref(false);
const editingAreaId = ref<string | null>(null);
const areaErrors = ref<Record<string, string>>({});
const areaForm = ref({
  nombreDisplay: '',
  codigoDisplay: '',
  nivel: '',
  pesoArea: 1,
  orden: undefined as number | undefined,
  esCalificable: true,
  permiteExoneracion: false,
});

function abrirCrearArea() {
  editingAreaId.value = null;
  areaErrors.value = {};
  areaForm.value = { nombreDisplay: '', codigoDisplay: '', nivel: nivelActivo.value, pesoArea: 1, orden: undefined, esCalificable: true, permiteExoneracion: false };
  showAreaModal.value = true;
}

function abrirEditarArea(area: any) {
  editingAreaId.value = area.id;
  areaErrors.value = {};
  areaForm.value = {
    nombreDisplay: area.nombre_display,
    codigoDisplay: area.codigo_display ?? '',
    nivel: area.nivel,
    pesoArea: parseFloat(area.peso_area),
    orden: area.orden,
    esCalificable: area.es_calificable,
    permiteExoneracion: area.permite_exoneracion,
  };
  showAreaModal.value = true;
}

async function guardarArea() {
  areaErrors.value = {};
  if (!areaForm.value.nombreDisplay.trim()) { areaErrors.value.nombreDisplay = 'El nombre es obligatorio'; return; }
  isSavingArea.value = true;
  try {
    const payload = {
      nombreDisplay: areaForm.value.nombreDisplay,
      codigoDisplay: areaForm.value.codigoDisplay || undefined,
      nivel: areaForm.value.nivel,
      pesoArea: areaForm.value.pesoArea,
      orden: areaForm.value.orden || undefined,
      esCalificable: areaForm.value.esCalificable,
      permiteExoneracion: areaForm.value.permiteExoneracion,
    };
    if (editingAreaId.value) {
      const updated = await schoolConfigService.updateArea(editingAreaId.value, payload);
      const idx = todasLasAreas.value.findIndex(a => a.id === editingAreaId.value);
      if (idx !== -1) todasLasAreas.value[idx] = updated;
      toast.success('Área actualizada');
    } else {
      const created = await schoolConfigService.createArea(payload);
      todasLasAreas.value.push(created);
      toast.success('Área creada');
    }
    showAreaModal.value = false;
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Error al guardar el área');
  } finally {
    isSavingArea.value = false;
  }
}

// Modal competencia
const showCompModal = ref(false);
const isSavingComp = ref(false);
const editingCompId = ref<string | null>(null);
const compAreaId = ref('');
const compAreaNombre = ref('');
const compErrors = ref<Record<string, string>>({});
const compForm = ref({
  nombreDisplay: '',
  pesoCompetencia: 1,
  orden: undefined as number | undefined,
  aplicaGrados: [1, 2, 3, 4, 5, 6],
});

function abrirCrearCompetencia(area: any) {
  editingCompId.value = null;
  compAreaId.value = area.id;
  compAreaNombre.value = area.nombre_display;
  compErrors.value = {};
  compForm.value = { nombreDisplay: '', pesoCompetencia: 1, orden: undefined, aplicaGrados: [1, 2, 3, 4, 5, 6] };
  showCompModal.value = true;
}

function abrirEditarCompetencia(area: any, comp: any) {
  editingCompId.value = comp.id;
  compAreaId.value = area.id;
  compAreaNombre.value = area.nombre_display;
  compErrors.value = {};
  compForm.value = {
    nombreDisplay: comp.nombre_display,
    pesoCompetencia: parseFloat(comp.peso_competencia),
    orden: comp.orden,
    aplicaGrados: comp.aplica_grados ? [...comp.aplica_grados] : [1, 2, 3, 4, 5, 6],
  };
  showCompModal.value = true;
}

async function guardarCompetencia() {
  compErrors.value = {};
  if (!compForm.value.nombreDisplay.trim()) { compErrors.value.nombreDisplay = 'La descripción es obligatoria'; return; }
  isSavingComp.value = true;
  try {
    const payload = {
      areaIeId: compAreaId.value,
      nombreDisplay: compForm.value.nombreDisplay,
      pesoCompetencia: compForm.value.pesoCompetencia,
      orden: compForm.value.orden || undefined,
      aplicaGrados: compForm.value.aplicaGrados,
    };
    if (editingCompId.value) {
      const updated = await schoolConfigService.updateCompetencia(editingCompId.value, payload);
      if (competenciasCache.value[compAreaId.value]) {
        const idx = competenciasCache.value[compAreaId.value].findIndex(c => c.id === editingCompId.value);
        if (idx !== -1) competenciasCache.value[compAreaId.value][idx] = updated;
      }
      toast.success('Competencia actualizada');
    } else {
      const created = await schoolConfigService.createCompetencia(payload);
      if (!competenciasCache.value[compAreaId.value]) competenciasCache.value[compAreaId.value] = [];
      competenciasCache.value[compAreaId.value].push(created);
      toast.success('Competencia creada');
    }
    showCompModal.value = false;
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Error al guardar la competencia');
  } finally {
    isSavingComp.value = false;
  }
}

// --- Asistencia ---
const asistenciaLoading = ref(false);
const isSavingAsistencia = ref(false);
const asistenciaForm = ref({
  umbralAmarillo: 10,
  umbralNaranja: 20,
  umbralRojo: 30,
  tardanzasPorFalta: 3,
  contarTardanzas: true,
});

async function loadConfigAsistencia() {
  asistenciaLoading.value = true;
  try {
    const config = await schoolConfigService.getConfigAsistencia();
    asistenciaForm.value = {
      umbralAmarillo: parseFloat(config.umbral_amarillo),
      umbralNaranja: parseFloat(config.umbral_naranja),
      umbralRojo: parseFloat(config.umbral_rojo),
      tardanzasPorFalta: parseInt(config.tardanzas_por_falta, 10),
      contarTardanzas: config.contar_tardanzas,
    };
  } catch {
    // defaults already set
  } finally {
    asistenciaLoading.value = false;
  }
}

async function saveConfigAsistencia() {
  const { umbralAmarillo, umbralNaranja, umbralRojo } = asistenciaForm.value;
  if (umbralAmarillo >= umbralNaranja || umbralNaranja >= umbralRojo) {
    toast.warning('Los umbrales deben estar en orden creciente: Amarillo < Naranja < Rojo');
    return;
  }
  isSavingAsistencia.value = true;
  try {
    await schoolConfigService.updateConfigAsistencia({
      umbralAmarillo: asistenciaForm.value.umbralAmarillo,
      umbralNaranja: asistenciaForm.value.umbralNaranja,
      umbralRojo: asistenciaForm.value.umbralRojo,
      tardanzasPorFalta: asistenciaForm.value.tardanzasPorFalta,
      contarTardanzas: asistenciaForm.value.contarTardanzas,
    });
    toast.success('Configuración de asistencia guardada');
  } catch {
    toast.error('Error al guardar la configuración');
  } finally {
    isSavingAsistencia.value = false;
  }
}

onMounted(async () => {
  await Promise.all([loadGeneral(), loadAulas(), loadCurriculo(), loadConfigAsistencia()]);
});
</script>
