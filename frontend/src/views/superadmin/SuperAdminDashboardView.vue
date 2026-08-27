<template>
  <SuperAdminLayout title="Tableau de bord">
    <div v-if="loading" class="sa-loading">
      <div class="spinner"></div>
      <span>Chargement des métriques...</span>
    </div>

    <div v-else-if="dashboard" class="dashboard-container">
      <!-- Cartes de statistiques -->
      <div class="stat-grid">
        <div class="stat-card" v-for="(stat, index) in stats" :key="index" :style="{ animationDelay: `${index * 0.1}s` }">
          <div class="stat-icon" :class="stat.cssClass">
            <component :is="stat.icon" />
          </div>
          <div class="stat-info">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-sub" v-if="stat.sub">{{ stat.sub }}</div>
          </div>
        </div>
      </div>

      <!-- Ligne Graphiques principaux -->
      <div class="chart-row">
        <!-- Courbe des inscriptions -->
        <div class="panel chart-panel large">
          <div class="panel-head">
            <h3>Évolution des inscriptions</h3>
            <span class="panel-tag">12 derniers mois</span>
          </div>
          <div class="area-chart-container">
            <svg class="area-chart" viewBox="0 0 600 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:var(--accent, #e8523f); stop-opacity:0.3" />
                  <stop offset="100%" style="stop-color:var(--accent, #e8523f); stop-opacity:0" />
                </linearGradient>
              </defs>
              <path :d="areaPath" fill="url(#grad)" stroke="none" />
              <path :d="linePath" fill="none" stroke="var(--accent, #e8523f)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <div class="chart-points">
              <div v-for="(row, index) in dashboard.signupsByMonth" :key="row.month" class="chart-point" :style="{ left: `${(index / Math.max(dashboard.signupsByMonth.length - 1, 1)) * 100}%` }">
                <div class="point-dot"></div>
                <span class="point-label">{{ formatMonth(row.month) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Donut Chart des Tâches -->
        <div class="panel chart-panel">
          <div class="panel-head">
            <h3>Répartition des Tâches</h3>
          </div>
          <div class="donut-container">
            <svg viewBox="0 0 120 120" class="donut-chart">
              <circle cx="60" cy="60" r="50" class="donut-bg"></circle>
              <circle v-for="(seg, i) in taskDonutSegments" :key="i"
                cx="60" cy="60" r="50"
                :stroke="seg.color"
                stroke-width="12"
                fill="transparent"
                :stroke-dasharray="`${seg.length} ${circumference - seg.length}`"
                :stroke-dashoffset="-seg.offset"
                class="donut-segment"
              />
            </svg>
            <div class="donut-center">
              <div class="donut-total">{{ dashboard.totals.tasks }}</div>
              <div class="donut-label">Total</div>
            </div>
          </div>
          <div class="chart-legend">
            <div v-for="row in dashboard.tasksByStatus" :key="row.status" class="legend-item">
              <span class="legend-dot" :style="{ background: statusColor(row.status) }"></span>
              <span class="legend-text">{{ statusLabel(row.status) }}</span>
              <span class="legend-val">{{ row.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Ligne Graphiques secondaires -->
      <div class="chart-row">
        <!-- Pie Chart des Projets -->
        <div class="panel chart-panel">
          <div class="panel-head">
            <h3>Statut des Projets</h3>
          </div>
          <div class="pie-container" v-if="dashboard.projectsByStatus.length > 0">
            <!-- Utilisation d'un vrai Pie Chart en SVG avec stroke-width -->
            <svg viewBox="0 0 36 36" class="pie-chart">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--hover, #f3f1ee)" stroke-width="32" />
              <circle v-for="(seg, i) in projectPieSegments" :key="i"
                cx="18" cy="18" r="15.915"
                fill="none"
                :stroke="seg.color"
                stroke-width="32"
                :stroke-dasharray="`${seg.percentage} ${100 - seg.percentage}`"
                :stroke-dashoffset="-seg.offset"
                class="pie-segment"
              />
            </svg>
            <div class="pie-legend">
              <div v-for="row in dashboard.projectsByStatus" :key="row.derived_status" class="legend-item">
                <span class="legend-dot" :style="{ background: statusColor(row.derived_status) }"></span>
                <span class="legend-text">{{ row.derived_status === 'en_cours' ? 'En cours' : 'Terminé' }}</span>
                <span class="legend-val">{{ row.count }}</span>
              </div>
            </div>
          </div>
          <div v-else class="sa-empty" style="padding: 40px 0;">Aucun projet</div>
        </div>

        <!-- Santé de la plateforme -->
        <div class="panel chart-panel large">
          <div class="panel-head">
            <h3>Santé de la plateforme</h3>
          </div>
          <div class="health-bars">
            <div class="health-row">
              <span class="health-label">Taux d'activité</span>
              <div class="health-track">
                <div class="health-fill" :style="{ width: healthStats.activityRate + '%', background: '#2fa85a' }"></div>
              </div>
              <span class="health-val">{{ healthStats.activityRate }}%</span>
            </div>
            <div class="health-row">
              <span class="health-label">Tâches terminées</span>
              <div class="health-track">
                <div class="health-fill" :style="{ width: healthStats.taskCompletionRate + '%', background: '#3f6fe8' }"></div>
              </div>
              <span class="health-val">{{ healthStats.taskCompletionRate }}%</span>
            </div>
            <div class="health-row">
              <span class="health-label">Projets actifs</span>
              <div class="health-track">
                <div class="health-fill" :style="{ width: healthStats.activeProjectRate + '%', background: 'var(--accent, #e8523f)' }"></div>
              </div>
              <span class="health-val">{{ healthStats.activeProjectRate }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </SuperAdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue';
import { useSuperAdminStore } from '../../stores/superAdmin';
import SuperAdminLayout from '../../components/templates/SuperAdminLayout.vue';

const store = useSuperAdminStore();
const loading = ref(true);
const dashboard = ref(null);

// Formatage des données pour les cartes
const stats = computed(() => {
  if (!dashboard.value) return [];
  return [
    {
      label: 'Entreprises',
      value: dashboard.value.totals.organizations,
      sub: `${dashboard.value.totals.activeOrganizations} actives`,
      cssClass: 'orgs',
      icon: () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
        h('path', { d: 'M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1' })
      ])
    },
    {
      label: 'Projets',
      value: dashboard.value.totals.projects,
      cssClass: 'projects',
      icon: () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
        h('rect', { x: 3, y: 3, width: 7, height: 9, rx: 1 }),
        h('rect', { x: 14, y: 3, width: 7, height: 5, rx: 1 }),
        h('rect', { x: 14, y: 12, width: 7, height: 9, rx: 1 }),
        h('rect', { x: 3, y: 16, width: 7, height: 5, rx: 1 })
      ])
    },
    {
      label: 'Tâches',
      value: dashboard.value.totals.tasks,
      cssClass: 'tasks',
      icon: () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
        h('path', { d: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11' })
      ])
    },
    {
      label: 'Utilisateurs',
      value: dashboard.value.totals.users,
      cssClass: 'users',
      icon: () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
        h('path', { d: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' })
      ])
    }
  ];
});

// Calculs pour la Courbe (Area Chart)
const maxSignupCount = computed(() => Math.max(...(dashboard.value?.signupsByMonth.map((r) => r.count) || [1]), 1));

const linePath = computed(() => {
  if (!dashboard.value || dashboard.value.signupsByMonth.length === 0) return '';
  const points = dashboard.value.signupsByMonth.map((row, i) => {
    const x = (i / Math.max(dashboard.value.signupsByMonth.length - 1, 1)) * 600;
    const y = 200 - (row.count / maxSignupCount.value) * 180 - 10;
    return { x, y };
  });
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const x_mid = (points[i].x + points[i + 1].x) / 2;
    const y_mid = (points[i].y + points[i + 1].y) / 2;
    const cp_x1 = (x_mid + points[i].x) / 2;
    const cp_x2 = (x_mid + points[i + 1].x) / 2;
    d += ` Q ${cp_x1},${points[i].y} ${x_mid},${y_mid}`;
    d += ` Q ${cp_x2},${points[i + 1].y} ${points[i + 1].x},${points[i + 1].y}`;
  }
  return d;
});

const areaPath = computed(() => {
  if (!linePath.value) return '';
  return `${linePath.value} L 600,200 L 0,200 Z`;
});

// Calculs pour le Donut Chart (Tâches)
const circumference = 2 * Math.PI * 50; 

const taskDonutSegments = computed(() => {
  if (!dashboard.value) return [];
  const total = dashboard.value.tasksByStatus.reduce((sum, r) => sum + Number(r.count), 0) || 1;
  let offset = 0;
  return dashboard.value.tasksByStatus.map(r => {
    const percentage = Number(r.count) / total;
    const length = percentage * circumference;
    const segment = {
      length,
      offset: offset,
      color: statusColor(r.status)
    };
    offset += length;
    return segment;
  });
});

// Calculs pour le Pie Chart (Projets)
// On utilise r=15.915 car le périmètre est de 100, ce qui rend les pourcentages directs
const projectPieSegments = computed(() => {
  if (!dashboard.value) return [];
  const total = dashboard.value.projectsByStatus.reduce((sum, r) => sum + Number(r.count), 0) || 1;
  let offset = 0;
  return dashboard.value.projectsByStatus.map(r => {
    const percentage = (Number(r.count) / total) * 100;
    const segment = {
      percentage,
      offset: offset,
      color: statusColor(r.derived_status)
    };
    offset += percentage;
    return segment;
  });
});

// Calculs des taux de santé
const healthStats = computed(() => {
  if (!dashboard.value) return { activityRate: 0, taskCompletionRate: 0, activeProjectRate: 0 };
  const d = dashboard.value.totals;
  const activityRate = d.organizations ? Math.round((d.activeOrganizations / d.organizations) * 100) : 0;
  
  const doneTasks = Number(dashboard.value.tasksByStatus.find(t => t.status === 'done')?.count || 0);
  const taskCompletionRate = d.tasks ? Math.round((doneTasks / d.tasks) * 100) : 0;
  
  const activeProjects = Number(dashboard.value.projectsByStatus.find(p => p.derived_status === 'en_cours')?.count || 0);
  const activeProjectRate = d.projects ? Math.round((activeProjects / d.projects) * 100) : 0;

  return { activityRate, taskCompletionRate, activeProjectRate };
});

const statusLabel = (status) => ({ todo: 'À faire', doing: 'En cours', done: 'Terminé', en_cours: 'En cours', termine: 'Terminé' }[status] || status);

const statusColor = (status) => {
  const colors = {
    todo: '#9ca3af',      
    doing: '#3f6fe8',     
    en_cours: '#3f6fe8',  
    done: '#2fa85a',      
    termine: '#2fa85a'    
  };
  return colors[status] || '#e8523f';
};

const formatMonth = (monthStr) => {
  const [year, month] = monthStr.split('-');
  return new Date(year, month - 1).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
};

onMounted(async () => {
  try {
    dashboard.value = await store.fetchDashboard();
  } finally {
    setTimeout(() => { loading.value = false; }, 300);
  }
});
</script>

<style scoped>
/* Variables */
:root {
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
}

.dashboard-container {
  animation: fadeInUp 0.5s ease-out forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--surface, #fff);
  border: 1px solid var(--border, #eee);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  animation: fadeInUp 0.5s ease-out forwards;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1);
}

.stat-icon.orgs { background: linear-gradient(135deg, #fdece8, #fce4df); color: #e8523f; }
.stat-icon.projects { background: linear-gradient(135deg, #e8f0fd, #dfe7fb); color: #3f6fe8; }
.stat-icon.tasks { background: linear-gradient(135deg, #e8fdf0, #d8f5e4); color: #2fa85a; }
.stat-icon.users { background: linear-gradient(135deg, #f5e8fd, #efdff9); color: #9b3fe8; }

.stat-label { font-size: 13px; color: var(--text-3, #999); font-weight: 500; }
.stat-value { font-size: 28px; font-weight: 700; color: var(--text, #1a1a1a); line-height: 1.1; margin: 2px 0; }
.stat-sub { font-size: 12px; color: var(--text-3, #999); }

.chart-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-row:last-child { margin-bottom: 0; }

.panel {
  background: var(--surface, #fff);
  border: 1px solid var(--border, #eee);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.3s ease;
}

.panel:hover { box-shadow: var(--shadow-md); }

.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.panel h3 { font-size: 15px; font-weight: 600; margin: 0; color: var(--text, #1a1a1a); }
.panel-tag { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent, #e8523f); background: var(--accent-soft, #fdece8); padding: 4px 8px; border-radius: 6px; }

/* Area Chart */
.area-chart-container { position: relative; height: 220px; width: 100%; }
.area-chart { width: 100%; height: 200px; overflow: visible; }
.chart-points { position: absolute; top: 0; left: 0; width: 100%; height: 200px; display: flex; justify-content: space-between; pointer-events: none; }
.chart-point { position: absolute; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; height: 100%; }
.point-dot { position: absolute; top: 50%; width: 8px; height: 8px; background: #fff; border: 2px solid var(--accent, #e8523f); border-radius: 50%; opacity: 0; transition: opacity 0.2s; }
.chart-point:hover .point-dot { opacity: 1; }
.point-label { position: absolute; bottom: -24px; font-size: 11px; color: var(--text-3, #999); text-transform: capitalize; }

/* Donut Chart */
.donut-container { position: relative; width: 160px; height: 160px; margin: 0 auto 24px; }
.donut-chart { transform: rotate(-90deg); width: 100%; height: 100%; }
.donut-bg { fill: none; stroke: var(--hover, #f3f1ee); stroke-width: 12; }
.donut-segment { transition: stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease; }
.donut-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
.donut-total { font-size: 28px; font-weight: 700; color: var(--text, #1a1a1a); }
.donut-label { font-size: 12px; color: var(--text-3, #999); }

/* Legend */
.chart-legend, .pie-legend { display: flex; flex-direction: column; gap: 12px; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; }
.legend-text { flex: 1; color: var(--text-2, #555); }
.legend-val { font-weight: 600; color: var(--text, #1a1a1a); }

/* Pie Chart */
.pie-container { display: flex; align-items: center; gap: 24px; justify-content: center; }
.pie-chart { width: 120px; height: 120px; border-radius: 50%; transform: rotate(-90deg); flex-shrink: 0; }
.pie-segment { transition: stroke-dasharray 0.8s ease; }

/* Health Bars */
.health-bars { display: flex; flex-direction: column; gap: 20px; padding-top: 8px; }
.health-row { display: flex; align-items: center; gap: 16px; }
.health-label { width: 120px; font-size: 13px; color: var(--text-2, #555); flex-shrink: 0; }
.health-track { flex: 1; height: 10px; background: var(--hover, #f3f1ee); border-radius: 6px; overflow: hidden; }
.health-fill { height: 100%; border-radius: 6px; transition: width 1s cubic-bezier(0.22, 1, 0.36, 1); }
.health-val { width: 40px; text-align: right; font-size: 13px; font-weight: 600; color: var(--text, #1a1a1a); }

.sa-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; color: var(--text-2); font-size: 14px; gap: 16px; }
.spinner { width: 32px; height: 32px; border: 3px solid rgba(232, 82, 63, 0.2); border-radius: 50%; border-top-color: var(--accent, #e8523f); animation: spin 1s ease-in-out infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1100px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
  .chart-row { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .stat-grid { grid-template-columns: 1fr; }
  .stat-card { padding: 16px; }
  .pie-container { flex-direction: column; }
}
</style>