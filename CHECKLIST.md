# ✅ Checklist Développement - Bët

Checklist à vérifier avant chaque commit, PR, et déploiement.

---

## 🚀 Avant chaque commit

### Code Quality
- [ ] Code formaté (Black pour Python, Prettier pour JS)
- [ ] Pas d'erreurs lint (`pylint`, `eslint`)
- [ ] Pas de TODO non documentés
- [ ] Pas de `console.log()` en production
- [ ] Pas de `print()` en debug (utiliser `logger`)

### Tests
- [ ] Tests unitaires réussis (`python test_*.py`)
- [ ] Tests d'intégration réussis
- [ ] Coverage > 80% si possible
- [ ] Aucun test ne dépend de l'ordre d'exécution

### Documentation
- [ ] Code commenté (si logique complexe)
- [ ] Docstrings complètes (fonctions publiques)
- [ ] Type hints en Python (@property, -> Type)
- [ ] JSDoc en JavaScript (/** ... */)

### Git
- [ ] Message de commit descriptif
- [ ] Pas de secrets (.env, clés API)
- [ ] Branche à jour avec main/develop
- [ ] Pas de fichiers temporaires (*.pyc, node_modules/)

---

## 🔍 Avant une Pull Request

### Changements
- [ ] Changements limités au scope du ticket
- [ ] Pas de reformatage de code non lié
- [ ] Pas de refactoring "au passage"
- [ ] Feature complète (pas partiellement prête)

### Tests
- [ ] Tous les tests passent localement
- [ ] Nouveaux tests ajoutés si nouvelles features
- [ ] Tests de régression vérifiés
- [ ] Manual testing effectué

### Documentation
- [ ] README mis à jour si changements API
- [ ] CHANGELOG.md mis à jour
- [ ] Code examples dans docstrings si applicable
- [ ] Liens vers issues/tickets pertinents

### Performance
- [ ] Aucune requête N+1 en BD
- [ ] Cache utilisé si approprié
- [ ] Pas de fuites mémoire détectées
- [ ] Temps de réponse acceptable (< 100ms pour alerte)

---

## 🧪 Tests - ML (Python)

### Avant commit
```bash
cd ml

# Vérifier syntax
python -m py_compile *.py

# Linter
pylint api/ services/ utils/

# Tests
python test_alertes_workflow.py
python test_interface_adapted.py

# Type checking
mypy api/ services/ utils/
```

### Checklist tests
- [ ] `test_alertes_workflow.py`: 4/4 PASS
- [ ] `test_interface_adapted.py`: PASS
- [ ] Diagnostic complet: PASS
- [ ] Pas d'erreurs dans les logs

---

## 🎨 Tests - Frontend (Vue/React)

### Avant commit
```bash
cd frontend

# Linter
npm run lint

# Format
npm run format

# Tests
npm test

# Build test
npm run build
```

### Checklist tests
- [ ] ESLint: 0 erreurs
- [ ] Prettier formaté
- [ ] Tous les tests passent
- [ ] Build réussit sans warnings

---

## 🔧 Tests - Backend (Laravel)

### Avant commit
```bash
cd backend

# Code style
php artisan code:style

# Tests
php artisan test

# Database
php artisan migrate:fresh --seed

# API
php artisan tinker
```

### Checklist tests
- [ ] Migrations appliquées
- [ ] PHPUnit: tous tests PASS
- [ ] Aucun deprecated warning
- [ ] Database intègre

---

## 🚢 Avant déploiement

### Infrastructure
- [ ] Docker image construit sans erreur
- [ ] Environment variables documentées
- [ ] Secrets sécurisés (HashiCorp Vault, AWS Secrets)
- [ ] Base de données backupée

### Validation
- [ ] Tous tests CI/CD passent
- [ ] Code review approuvée (2 minimum)
- [ ] Performance testée (load test si applicable)
- [ ] Sécurité vérifiée (OWASP top 10)

### Deployment
- [ ] Plan de rollback documenté
- [ ] Monitoring alertes configurées
- [ ] Logs centralisés et accessibles
- [ ] Notifications stakeholders prêtes

### Post-deployment
- [ ] [ ] Sanity checks effectués
- [ ] Alertes monitoring activées
- [ ] Logs surveillés pour erreurs
- [ ] Notification déploiement réussi

---

## 🔒 Sécurité - Checklist

### Code
- [ ] Pas d'injection SQL (utiliser ORM/parameterized queries)
- [ ] Pas d'XSS (escaper les inputs)
- [ ] Pas de CSRF (tokens CSRF en place)
- [ ] Validation stricte des inputs
- [ ] Authentification requise (où approprié)
- [ ] Autorisation vérifiée (permission checks)

### Credentials
- [ ] Pas de secrets en code
- [ ] .env dans .gitignore
- [ ] API keys en vault/secrets manager
- [ ] Secrets révo quées si exposés
- [ ] Audit log pour accès secrets

### API
- [ ] Rate limiting activé
- [ ] CORS configuré (pas allow all)
- [ ] Headers sécurité définis
- [ ] HTTPS en production
- [ ] API versioning en place

---

## 📊 Performance - Checklist

### Database
- [ ] Requêtes optimisées (explain plan vérifié)
- [ ] Indexes en place (sur FK, search fields)
- [ ] N+1 queries éliminées
- [ ] Pagination implémentée (si datasets gros)

### API
- [ ] Response time < 100ms (hors IA)
- [ ] Caching en place (Redis)
- [ ] Compression activée (gzip)
- [ ] CDN utilisé pour assets statiques

### Frontend
- [ ] Bundle size acceptable (< 1MB gzipped)
- [ ] Lazy loading implémenté
- [ ] Images optimisées (WebP, responsive)
- [ ] Lighthouse score > 80

---

## 📝 Logging - Checklist

### Structure
- [ ] Logger utilisé au lieu de print()
- [ ] Niveaux LOG appropriés (DEBUG/INFO/WARN/ERROR)
- [ ] Contexte inclus (user_id, request_id)
- [ ] Timestamps présents
- [ ] Structured logging (JSON si possible)

### Essentiels
- [ ] Chaque créations d'alerte loggée
- [ ] Erreurs API loggées avec stacktrace
- [ ] Authentification attempts loggées
- [ ] Performance metrics loggées

### Pas à logger
- [ ] ❌ Passwords
- [ ] ❌ API keys
- [ ] ❌ PII (personal info)
- [ ] ❌ Credit card numbers
- [ ] ❌ Logs trop verbeux (< 100 chars si possible)

---

## 📚 Documentation - Checklist

### README
- [ ] Démarrage rapide (< 5 min)
- [ ] Dépendances listées
- [ ] Commandes de setup claires
- [ ] Examples d'utilisation
- [ ] Troubleshooting inclus

### Code
- [ ] Docstrings complètes (what, why, how)
- [ ] Type hints (Python) / JSDoc (JS)
- [ ] Comments pour logique complexe
- [ ] README.md dans chaque dossier major

### API
- [ ] Endpoints documentés (OpenAPI/Swagger)
- [ ] Request/Response examples
- [ ] Error codes documentés
- [ ] Rate limits expliqués

---

## 🚀 Git Workflow

### Branches
```
main          → Production
├─ develop    → Staging
├─ feature/*  → Nouvelles features
├─ bugfix/*   → Bug fixes
└─ hotfix/*   → Emergency fixes
```

### Commits
```
Format: <type>: <description>

Types:
- feat: Nouvelle feature
- fix: Bug fix
- refactor: Code reorganization
- perf: Performance improvement
- test: Test updates
- docs: Documentation
- chore: Maintenance

Example:
feat: add audio transcription for alerte creation
```

### Pull Requests
```markdown
## Description
<!-- Brève description du changement -->

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle feature
- [ ] Breaking change
- [ ] Documentation

## Testing
- [ ] Tests unitaires passent
- [ ] Tests d'intégration passent
- [ ] Tested locally

## Checklist
- [ ] Code formaté
- [ ] Tests passent
- [ ] Documentation mise à jour
- [ ] Pas de secrets exposed
```

---

## 📊 Métriques à tracker

### ML/API
- [ ] Response time (avg, p95, p99)
- [ ] Error rate (%)
- [ ] Model accuracy
- [ ] IA processing time
- [ ] Duplicate detection rate

### Backend
- [ ] Request latency
- [ ] Database query time
- [ ] Error rate
- [ ] Uptime %
- [ ] Cache hit rate

### Frontend
- [ ] Page load time
- [ ] Time to Interactive (TTI)
- [ ] User interactions latency
- [ ] Error rate (JS errors)
- [ ] Lighthouse score

---

## 🔄 Maintenance régulière

### Hebdomadaire
- [ ] Logs audités pour erreurs
- [ ] Performance métriques vérifiées
- [ ] Dependencies mises à jour si patches
- [ ] Backups testés

### Mensuel
- [ ] Security patches appliqués
- [ ] Dépendances mises à jour (minor/major)
- [ ] Performance review
- [ ] Coût infrastructure optimisé

### Trimestriel
- [ ] Audit de sécurité complet
- [ ] Code review (refactor opportunities)
- [ ] Architecture review
- [ ] Disaster recovery drill

---

## 📞 Support & Escalation

**Questions:**
- Technique: Consultez README + documensation interne
- Architecture: Contactez tech lead (@tech-lead)
- Déploiement: Contactez DevOps (@devops)
- Sécurité: Contactez security team (@security)

---

**Dernière mise à jour**: 26 Avril 2026
