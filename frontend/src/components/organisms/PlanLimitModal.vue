<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div v-if="store.visible" class="plm-backdrop" @click.self="store.close()">
        <Transition name="modal" appear>
          <div v-if="store.visible" class="plm-modal">
            
            <div class="plm-header">
              <div class="plm-icon-alert">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <button class="plm-close" @click="store.close()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <h2>Limite du forfait atteinte</h2>
            <p class="plm-message">{{ store.message }}</p>

            <div class="plm-plans">
              <!-- Free -->
              <div class="plm-plan-card">
                <div class="plm-plan-header">
                  <span class="plm-plan-name">Free</span>
                </div>
                <ul>
                  <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> 3 projets</li>
                  <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> 10 membres</li>
                  <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> 15 tâches / projet</li>
                </ul>
              </div>

              <!-- Pro (Highlighted) -->
              <div class="plm-plan-card highlighted">
                <span class="plm-badge">Recommandé</span>
                <div class="plm-plan-header">
                  <span class="plm-plan-name">Pro</span>
                </div>
                <ul>
                  <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> 10 projets</li>
                  <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> 20 membres</li>
                  <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Tâches illimitées</li>
                </ul>
              </div>

              <!-- Enterprise -->
              <div class="plm-plan-card">
                <div class="plm-plan-header">
                  <span class="plm-plan-name">Enterprise</span>
                </div>
                <ul>
                  <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Projets illimités</li>
                  <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Membres illimités</li>
                  <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Tâches illimitées</li>
                </ul>
              </div>
            </div>

            <div class="plm-note">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span>Seul votre administrateur système peut changer votre forfait. Contactez-le pour passer à un forfait supérieur.</span>
            </div>

            <div class="plm-actions">
              <button class="btn-primary" @click="store.close()">Fermer</button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { usePlanLimitStore } from '../../stores/planLimit';

const store = usePlanLimitStore();
</script>

<style scoped>
/* Animations d'entrée */
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.3s ease;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.modal-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-leave-active {
  transition: all 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.95);
}

/* Backdrop avec flou */
.plm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

/* Modale principale */
.plm-modal {
  background: var(--surface, #fff);
  border-radius: 20px;
  padding: 32px;
  max-width: 680px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  position: relative;
  text-align: center;
}

/* En-tête (Icône + Croix) */
.plm-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.plm-icon-alert {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--accent-soft, #fdece8);
  color: var(--accent, #e8523f);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.plm-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-3, #999);
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.plm-close:hover {
  background: var(--hover, #f3f1ee);
}

/* Titres et texte */
.plm-modal h2 {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 8px;
  color: var(--text, #1a1a1a);
}

.plm-message {
  font-size: 14px;
  color: var(--text-2, #555);
  margin: 0 0 28px;
  line-height: 1.5;
}

/* Cartes des Plans */
.plm-plans {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

.plm-plan-card {
  border: 1px solid var(--border, #eee);
  border-radius: 14px;
  padding: 20px 16px;
  text-align: left;
  background: var(--surface, #fff);
  position: relative;
  transition: transform 0.2s;
}

.plm-plan-card:hover {
  transform: translateY(-2px);
}

.plm-plan-card.highlighted {
  border: 2px solid var(--accent, #e8523f);
  background: #fffdfc;
}

.plm-badge {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--accent, #e8523f);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 10px;
  border-radius: 20px;
}

.plm-plan-header {
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border, #f0eee9);
}

.plm-plan-name {
  font-weight: 700;
  font-size: 15px;
  color: var(--text, #1a1a1a);
}

.plm-plan-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plm-plan-card li {
  font-size: 12.5px;
  color: var(--text-2, #555);
  display: flex;
  align-items: center;
  gap: 8px;
}

.plm-plan-card li svg {
  color: var(--accent, #e8523f);
  flex-shrink: 0;
}

.plm-plan-card.highlighted li svg {
  color: #2fa85a; /* Vert pour montrer que c'est mieux */
}

/* Note d'information */
.plm-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--hover, #f8f9fa);
  border: 1px solid var(--border, #eee);
  border-radius: 10px;
  padding: 12px 16px;
  margin: 0 0 24px;
}

.plm-note svg {
  color: var(--text-3, #999);
  flex-shrink: 0;
}

.plm-note span {
  font-size: 12.5px;
  color: var(--text-2, #555);
  line-height: 1.4;
  text-align: left;
}

/* Bouton d'action */
.plm-actions {
  display: flex;
  justify-content: center;
}

.btn-primary {
  background: var(--accent, #e8523f);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  box-shadow: 0 4px 12px rgba(232, 82, 63, 0.2);
}

.btn-primary:hover {
  background: #d9463a;
}

.btn-primary:active {
  transform: scale(0.98);
}

/* Responsive */
@media (max-width: 600px) {
  .plm-plans {
    grid-template-columns: 1fr;
  }
  .plm-modal {
    padding: 24px 20px;
  }
}
</style>