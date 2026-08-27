<template>
  <router-link :to="`/projects/${project.id}`" class="enhanced-project-card">
    <div class="card-top">
      <div class="project-icon" :style="{ background: project.color || colorFor(project.id) }">
        {{ project.title.charAt(0).toUpperCase() }}
      </div>
      <div class="task-count-badge">
        {{ doneCount }} / {{ (project.tasks || []).length }} tâches
      </div>
    </div>
    
    <h3>{{ project.title }}</h3>
    
    <div class="card-desc">
      {{ project.description || 'Aucune description fournie pour ce projet.' }}
    </div>
    
    <div class="card-foot">
      <div class="avatar-stack">
        <Avatar 
          v-for="member in (project.members || []).slice(0,3)" 
          :key="member.id" 
          :user-id="member.id" 
          :nom="member.nom" 
          :avatar-url="member.avatar_url" 
          :size="28" 
        />
        <span v-if="(project.members || []).length > 3" class="more-members">
          +{{ (project.members || []).length - 3 }}
        </span>
      </div>
      
      <div class="progress-area">
        <span class="progress-text">{{ progressPercent }}%</span>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPercent + '%', background: project.color || colorFor(project.id) }"></div>
        </div>
      </div>
    </div>
  </router-link>
</template>

<script setup>
import Avatar from '../atoms/Avatar.vue';
import { colorFor } from '../../utils/colors';

const props = defineProps({ 
  project: { type: Object, required: true }, 
  progressPercent: { type: Number, default: 0 }, 
  doneCount: { type: Number, default: 0 } 
});
</script>

<style scoped>
.enhanced-project-card {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 20px;
  text-decoration: none;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
  height: 100%; /* Permet d'avoir des cartes de même taille */
}

.enhanced-project-card:hover {
  border-color: transparent;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  transform: translateY(-3px);
}

/* Liseré de couleur en haut de la carte */
.enhanced-project-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--project-color, var(--accent));
  opacity: 0;
  transition: opacity 0.2s;
}

.enhanced-project-card:hover::before {
  opacity: 1;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}

.project-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.task-count-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-2);
  background: var(--surface-2);
  padding: 5px 10px;
  border-radius: 20px;
  border: 1px solid var(--border);
}

h3 {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-1);
  margin-bottom: 8px;
  letter-spacing: -0.01em;
  line-height: 1.4;
}

/* La partie description : limitée à 2 lignes */
.card-desc {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.5;
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* Coupe après 2 lignes */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 40px; /* Garde une hauteur constante même sans description */
}

.card-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto; /* Colle le footer en bas de la carte */
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.avatar-stack {
  display: flex;
}

.avatar-stack .avatar {
  border: 2px solid var(--surface);
  margin-left: -8px;
}

.avatar-stack .avatar:first-child {
  margin-left: 0;
}

.more-members {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-2);
  background: var(--surface-2);
  border: 2px solid var(--surface);
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: -8px;
  display: flex;
  align-items: center;
}

.progress-area {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  width: 45%;
}

.progress-text {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-2);
}

.progress-track {
  width: 100%;
  height: 5px;
  background: var(--surface-2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>